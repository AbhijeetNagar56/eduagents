'use client';

import { api } from './api';
import { supabase } from './supabase';
import { Course, FacultyOverride, Rubric, Submission } from './types';

type Envelope<T> = { success: boolean; data: T; meta?: Record<string, number> };
type Listener = (submissions: Submission[]) => void;
const listeners = new Set<Listener>();
let submissionsCache: Submission[] = [];
let rubricsCache: Rubric[] = [];
let coursesCache: Course[] = [];
let currentQuery: { faculty?: boolean } = {};
let realtimeStarted = false;

function publish(submissions: Submission[]) {
  submissionsCache = submissions;
  listeners.forEach((listener) => listener(submissions));
}

export function subscribeToSubmissions(listener: Listener) {
  listeners.add(listener);
  if (!realtimeStarted && supabase) {
    realtimeStarted = true;
    supabase.channel('eduagents-submissions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions_v2' }, () => {
        void refreshSubmissions(currentQuery).catch((error) => console.error('Realtime refresh failed:', error));
      }).subscribe();
  }
  return () => listeners.delete(listener);
}

export function getCourses() { return coursesCache; }
export function getRubrics() { return rubricsCache; }
export function getSubmissions() { return submissionsCache; }

export async function refreshRubrics(courseCode?: string) {
  const query = courseCode ? `?course_code=${encodeURIComponent(courseCode)}` : '';
  const result = await api<Envelope<Rubric[]>>(`/api/v1/faculty/rubrics${query}`);
  rubricsCache = result.data || [];
  const groups = new Map<string, Rubric[]>();
  for (const rubric of rubricsCache) groups.set(rubric.courseCode, [...(groups.get(rubric.courseCode) || []), rubric]);
  coursesCache = [...groups].map(([code, items]) => ({
    id: code,
    code,
    name: code,
    instructor: '',
    assignments: items.map((r) => ({ id: r.id, title: r.assignmentTitle, dueDate: '', rubricId: r.id })),
  }));
  return rubricsCache;
}

export async function refreshSubmissions(options: { faculty?: boolean; courseCode?: string; status?: string; search?: string } = {}) {
  currentQuery = options;
  const params = new URLSearchParams({ limit: '100' });
  if (options.courseCode && options.courseCode !== 'ALL') params.set('course_code', options.courseCode);
  if (options.status && options.status !== 'ALL') params.set('status', options.status);
  if (options.search) params.set('search', options.search);
  const path = options.faculty ? '/api/v1/faculty/submissions' : '/api/v1/submissions';
  const result = await api<Envelope<Submission[]>>(`${path}?${params}`);
  publish(result.data || []);
  return submissionsCache;
}

export async function createSubmission(input: { file?: File; textContent?: string; studentId: string; studentName: string; studentEmail: string; assignmentId: string; assignmentTitle: string; courseCode: string; rubricId: string }) {
  const body = new FormData();
  if (input.file) body.set('file', input.file);
  if (input.textContent) body.set('text_content', input.textContent);
  body.set('student_id', input.studentId);
  body.set('student_name', input.studentName);
  body.set('student_email', input.studentEmail);
  body.set('assignment_id', input.assignmentId);
  body.set('assignment_title', input.assignmentTitle);
  body.set('course_code', input.courseCode);
  body.set('rubric_id', input.rubricId);
  const result = await api<Envelope<Submission>>('/api/v1/submissions', { method: 'POST', body });
  publish([result.data, ...submissionsCache.filter((s) => s.id !== result.data.id)]);
  return result.data;
}

export async function saveRubric(rubric: Rubric) {
  const payload = {
    courseCode: rubric.courseCode,
    assignmentTitle: rubric.assignmentTitle,
    description: rubric.description,
    totalPoints: rubric.totalPoints,
    criteria: rubric.criteria.map(({ id, title, description, maxPoints, weightPercent }) => ({ id, title, description, maxPoints, weightPercent })),
  };
  const result = rubricCacheHas(rubric.id)
    ? await api<Envelope<Rubric>>(`/api/v1/faculty/rubrics/${encodeURIComponent(rubric.id)}`, { method: 'PUT', body: JSON.stringify(payload) })
    : await api<Envelope<Rubric>>('/api/v1/faculty/rubrics', { method: 'POST', body: JSON.stringify(payload) });
  await refreshRubrics();
  return result.data;
}

function rubricCacheHas(id: string) { return rubricsCache.some((item) => item.id === id); }

export async function deleteRubric(id: string) {
  await api(`/api/v1/faculty/rubrics/${encodeURIComponent(id)}`, { method: 'DELETE' });
  await refreshRubrics();
}

export async function overrideGrade(submissionId: string, override: FacultyOverride) {
  await api(`/api/v1/faculty/submissions/${encodeURIComponent(submissionId)}/override`, {
    method: 'POST',
    body: JSON.stringify({ overriddenScore: override.overriddenScore, overriddenBy: override.overriddenBy, overrideReason: override.overrideReason, criterionAdjustments: override.criterionAdjustments }),
  });
  const updated = (await api<Envelope<Submission>>(`/api/v1/submissions/${encodeURIComponent(submissionId)}`)).data;
  publish(submissionsCache.map((s) => s.id === updated.id ? updated : s));
  return updated;
}
