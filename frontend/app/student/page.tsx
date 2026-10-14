'use client';

import React, { useState, useEffect } from 'react';

import {
  GraduationCap,
  FileText,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Course, Rubric, Submission } from '@/lib/types';
import { getCourses, getRubrics, getSubmissions, subscribeToSubmissions } from '@/lib/storage';
import { StudentUpload } from '@/components/StudentUpload';
import { SubmissionCard } from '@/components/SubmissionCard';
import { GradeDetailModal } from '@/components/GradeDetailModal';
import { RubricViewerModal } from '@/components/RubricViewerModal';
import { StatCard } from '@/components/StatCard';

export default function StudentPortalPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCourses(getCourses());
    setRubrics(getRubrics());
    setSubmissions(getSubmissions());
    setMounted(true);

    const unsubscribe = subscribeToSubmissions((updatedSubs) => {
      setSubmissions(updatedSubs);
      // Keep active modal in sync if it's open
      setSelectedSub((prev) => (prev ? updatedSubs.find((s) => s.id === prev.id) || prev : null));
    });

    return () => unsubscribe();
  }, []);

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Clock className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading Student Portal...</span>
        </div>
      </div>
    );
  }

  // Filter submissions by current demo student
  const studentSubs = submissions.filter((s) => s.studentId === '24CSE032' || s.studentEmail.includes('abhinav'));
  // Or fallback to all submissions if none matched
  const activeSubs = studentSubs.length > 0 ? studentSubs : submissions;

  const evaluatedCount = activeSubs.filter((s) => s.status === 'done').length;
  const inProgressCount = activeSubs.filter((s) => s.status === 'pending' || s.status === 'processing').length;
  const averageScore = evaluatedCount > 0
    ? Math.round(
        activeSubs
          .filter((s) => s.evaluation)
          .reduce((sum, s) => sum + (s.override?.isOverridden ? s.override.overriddenScore : s.evaluation!.score), 0) / evaluatedCount
      )
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Smart Classroom</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back, abhinav
            </h1>
            <p className="max-w-xl text-xs text-slate-500 sm:text-sm">
              Submit your assignment files (PDF or Markdown)
            </p>
          </div>

          <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-4 text-xs">
            <div className="font-semibold text-slate-800">Student Profile</div>
            <div className="text-slate-500">ID: 24CSE032</div>
            <div className="text-slate-500">Email: abhinav.sharma@university.ac.in</div>
            <div className="flex items-center gap-1 pt-2 text-[10px] text-slate-500">
              <span className="size-2 rounded-full bg-emerald-500"></span>
              <span>Realtime grading listener active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Submissions"
          value={activeSubs.length}
          subtext="Total assignments submitted"
          icon={FileText}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
        />
        <StatCard
          title="Evaluated by AI"
          value={evaluatedCount}
          subtext="Graded against rubric"
          icon={CheckCircle2}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
        />
        <StatCard
          title="In Queue / Grading"
          value={inProgressCount}
          subtext="Processing via 2-min cron"
          icon={Clock}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-950/40"
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload Component (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <StudentUpload
            courses={courses}
            rubrics={rubrics}
            onSubmissionCreated={(newSub) => {
              setSubmissions((prev) => {
                const idx = prev.findIndex((s) => s.id === newSub.id);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = newSub;
                  return updated;
                }
                return [newSub, ...prev];
              });
            }}
            onViewRubric={(rubric) => setSelectedRubric(rubric)}
          />
        </div>

        {/* Right Column: Submissions Feed (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                My Submissions & Status
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live updates automatically stream in when evaluations complete.
              </p>
            </div>
            <button
              onClick={() => setSubmissions(getSubmissions())}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Refresh submissions list"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {activeSubs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No submissions yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Use the form on the left to submit your first assignment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSubs.map((sub) => (
                <SubmissionCard
                  key={sub.id}
                  submission={sub}
                  onViewDetails={(s) => setSelectedSub(s)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <GradeDetailModal
        isOpen={Boolean(selectedSub)}
        onClose={() => setSelectedSub(null)}
        submission={selectedSub}
        isFacultyView={false}
      />

      <RubricViewerModal
        isOpen={Boolean(selectedRubric)}
        onClose={() => setSelectedRubric(null)}
        rubric={selectedRubric}
      />
    </div>
  );
}
