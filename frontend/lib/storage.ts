'use client';

import { INITIAL_COURSES, INITIAL_RUBRICS, INITIAL_SUBMISSIONS } from './mock-data';
import { Course, FacultyOverride, Rubric, Submission } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

const SUBMISSIONS_KEY = 'eduagents_submissions_v1';
const RUBRICS_KEY = 'eduagents_rubrics_v1';
const COURSES_KEY = 'eduagents_courses_v1';

// In-memory event listener for live state syncing across components
type Listener<T> = (data: T) => void;
const submissionListeners = new Set<Listener<Submission[]>>();

function notifySubmissionListeners(subs: Submission[]) {
  submissionListeners.forEach(listener => {
    try {
      listener(subs);
    } catch (e) {
      console.error('Error notifying listener:', e);
    }
  });
}

export function subscribeToSubmissions(listener: Listener<Submission[]>): () => void {
  submissionListeners.add(listener);
  return () => {
    submissionListeners.delete(listener);
  };
}

export function getCourses(): Course[] {
  if (typeof window === 'undefined') return INITIAL_COURSES;
  const stored = localStorage.getItem(COURSES_KEY);
  if (!stored) {
    localStorage.setItem(COURSES_KEY, JSON.stringify(INITIAL_COURSES));
    return INITIAL_COURSES;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_COURSES;
  }
}

export function getRubrics(): Rubric[] {
  if (typeof window === 'undefined') return INITIAL_RUBRICS;
  const stored = localStorage.getItem(RUBRICS_KEY);
  if (!stored) {
    localStorage.setItem(RUBRICS_KEY, JSON.stringify(INITIAL_RUBRICS));
    return INITIAL_RUBRICS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_RUBRICS;
  }
}

export function saveRubric(rubric: Rubric): Rubric {
  const rubrics = getRubrics();
  const index = rubrics.findIndex(r => r.id === rubric.id);
  if (index >= 0) {
    rubrics[index] = rubric;
  } else {
    rubrics.unshift(rubric);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(RUBRICS_KEY, JSON.stringify(rubrics));
  }
  return rubric;
}

export function deleteRubric(id: string): void {
  const rubrics = getRubrics().filter(r => r.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(RUBRICS_KEY, JSON.stringify(rubrics));
  }
}

export function getSubmissions(): Submission[] {
  if (typeof window === 'undefined') return INITIAL_SUBMISSIONS;
  const stored = localStorage.getItem(SUBMISSIONS_KEY);
  if (!stored) {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(INITIAL_SUBMISSIONS));
    return INITIAL_SUBMISSIONS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_SUBMISSIONS;
  }
}

export function getSubmissionById(id: string): Submission | undefined {
  return getSubmissions().find(s => s.id === id);
}

export function saveSubmission(submission: Submission): Submission {
  const subs = getSubmissions();
  const index = subs.findIndex(s => s.id === submission.id);
  if (index >= 0) {
    subs[index] = submission;
  } else {
    subs.unshift(submission);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(subs));
  }
  notifySubmissionListeners(subs);
  return submission;
}

export function overrideGrade(submissionId: string, override: FacultyOverride): Submission | undefined {
  const subs = getSubmissions();
  const sub = subs.find(s => s.id === submissionId);
  if (!sub) return undefined;

  sub.override = override;
  // If flagged, changing override clears flagged status to done
  if (sub.status === 'flagged') {
    sub.status = 'done';
  }

  saveSubmission(sub);
  return sub;
}

export function resetToDemoDefaults(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(INITIAL_SUBMISSIONS));
  localStorage.setItem(RUBRICS_KEY, JSON.stringify(INITIAL_RUBRICS));
  localStorage.setItem(COURSES_KEY, JSON.stringify(INITIAL_COURSES));
  notifySubmissionListeners(INITIAL_SUBMISSIONS);
}

/**
 * Simulates the two-stage Gemini AI Grading Pipeline:
 * Step 1: Gemini Flash-Lite parses submission & extracts structure
 * Step 2: Gemini Flash evaluates against rubric criteria, computes score & feedback
 * Step 3: Writes grades to DB and pushes update
 */
export function simulateAIGrading(submissionId: string, onUpdate?: (sub: Submission) => void): void {
  const sub = getSubmissionById(submissionId);
  if (!sub) return;

  const rubrics = getRubrics();
  const rubric = rubrics.find(r => r.id === sub.rubricId) || rubrics[0];

  // Stage 1: Ingestion & Extraction (Flash-Lite)
  sub.status = 'processing';
  sub.processingStep = 'extracting';
  saveSubmission(sub);
  if (onUpdate) onUpdate(sub);

  setTimeout(() => {
    // Stage 2: Deep Pedagogical Grading (Flash)
    const current = getSubmissionById(submissionId);
    if (!current) return;
    current.processingStep = 'grading';
    saveSubmission(current);
    if (onUpdate) onUpdate(current);

    setTimeout(() => {
      // Stage 3: Grading completed, generate realistic breakdown
      const finalSub = getSubmissionById(submissionId);
      if (!finalSub) return;

      const criteria = rubric?.criteria || [];
      const criteriaScores = criteria.map(c => {
        // High quality score with slight random variance
        const ratio = 0.8 + Math.random() * 0.18;
        const scoreAwarded = Math.round(c.maxPoints * ratio);
        return {
          criterionId: c.id,
          title: c.title,
          scoreAwarded: Math.min(scoreAwarded, c.maxPoints),
          maxPoints: c.maxPoints,
          feedback: `Strong demonstration of ${c.title.toLowerCase()}. Clearly aligned with assignment requirements with minor optimization opportunities.`,
          strengths: `Solid implementation of foundational concepts under ${c.title}.`,
          improvements: `Consider adding additional edge case guards and asymptotic complexity proofs.`
        };
      });

      const totalScore = criteriaScores.reduce((sum, c) => sum + c.scoreAwarded, 0);
      const maxScore = criteria.reduce((sum, c) => sum + c.maxPoints, 0) || 100;
      const percentage = Math.round((totalScore / maxScore) * 100);

      finalSub.status = 'done';
      finalSub.processingStep = 'synced';
      finalSub.evaluation = {
        score: totalScore,
        maxScore,
        percentage,
        criteriaScores,
        summaryFeedback: `Assignment evaluated successfully by Gemini 2-Step Agentic Pipeline. Demonstrates solid technical execution, comprehensive analysis, and adherence to rubric standards.`,
        strengths: [
          'Thorough coverage of primary algorithmic / analytical criteria',
          'Clean presentation with well-structured document hierarchy',
          'Accurate baseline implementations satisfying test constraints'
        ],
        improvements: [
          'Provide more rigorous theoretical bounds for worst-case conditions',
          'Expand on empirical performance visualizations under high data scale'
        ],
        aiModelExtraction: 'Gemini Flash-Lite',
        aiModelGrading: 'Gemini Flash',
        evaluatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      saveSubmission(finalSub);
      if (onUpdate) onUpdate(finalSub);
    }, 2800);
  }, 2200);
}
