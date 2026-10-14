'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Sparkles,
  Users,
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  Activity,
  Server,
  Radio,
  Download
} from 'lucide-react';
import { Course, Rubric, Submission } from '@/lib/types';
import { getCourses, getRubrics, getSubmissions, subscribeToSubmissions } from '@/lib/storage';
import { getScoreColor } from '@/lib/utils';
import { StatusBadge } from '@/components/Badge';
import { StatCard } from '@/components/StatCard';
import { GradeDetailModal } from '@/components/GradeDetailModal';
import { ArchitectureDiagram } from '@/components/ArchitectureDiagram';

export default function HomePage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSubmissions(getSubmissions());
    setRubrics(getRubrics());
    setCourses(getCourses());
    setMounted(true);

    const unsubscribe = subscribeToSubmissions((updated) => {
      setSubmissions(updated);
      setSelectedSub((prev) => (prev ? updated.find((s) => s.id === prev.id) || prev : null));
    });

    return () => unsubscribe();
  }, []);

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Clock className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading EduAgents Platform...</span>
        </div>
      </div>
    );
  }

  const totalSubs = submissions.length;
  const doneCount = submissions.filter((s) => s.status === 'done').length;
  const pendingCount = submissions.filter((s) => s.status === 'pending' || s.status === 'processing').length;
  const overrideCount = submissions.filter((s) => s.override?.isOverridden).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xs">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Agentic Grading Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Human-AI Co-Learning & Assessment Agent
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Students submit assignments (PDF/Markdown); a two-stage Gemini AI pipeline extracts structured proofs and grades against faculty rubrics; instructors review and override with complete pedagogical transparency.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/student"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Launch Student Portal</span>
            </Link>

            <Link
              href="/faculty"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition"
            >
              <Users className="w-4 h-4" />
              <span>Faculty Dashboard</span>
            </Link>

            <Link
              href="/architecture"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition"
            >
              <span>View Architecture</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Submissions"
          value={totalSubs}
          subtext="Processed submissions"
          icon={FileText}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
        />
        <StatCard
          title="Evaluated by AI"
          value={doneCount}
          subtext="Graded against rubrics"
          icon={CheckCircle2}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
        />
        <StatCard
          title="Queue / In-Flight"
          value={pendingCount}
          subtext="2-minute cron drainage"
          icon={Clock}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-950/40"
        />
        <StatCard
          title="Faculty Overrides"
          value={overrideCount}
          subtext="Human review in loop"
          icon={ShieldCheck}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-50 dark:bg-purple-950/40"
        />
      </section>

      {/* Workflow Navigation Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Student Submission */}
        <Link
          href="/student"
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 transition">
              Student Assignment Portal
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Drag-and-drop document upload (PDF/Markdown), instant rubric review, live progress tracking, and detailed score breakdowns.
            </p>
          </div>
          <div className="flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 gap-1 pt-2">
            <span>Enter Student View</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        {/* Card 2: Faculty Dashboard */}
        <Link
          href="/faculty"
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-emerald-600 transition">
              Faculty Instructor Dashboard
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Full class roster oversight, criterion-level grading overrides, audit justification logs, and automated CSV export for gradebooks.
            </p>
          </div>
          <div className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 gap-1 pt-2">
            <span>Enter Faculty View</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        {/* Card 3: Rubrics Management */}
        <Link
          href="/faculty/rubrics"
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 transition">
              Rubric Criteria Management
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Create and adjust pedagogical rubrics, set criteria point weights, and preview guidelines before releasing assignments.
            </p>
          </div>
          <div className="flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 gap-1 pt-2">
            <span>Manage Rubrics</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      </section>

      {/* Interactive Architecture Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Architecture & Agentic Data Pipeline
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive 5-stage lifecycle powering decoupled ingestion, cron draining, and Gemini AI reasoning.
            </p>
          </div>
          <Link
            href="/architecture"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Full Specs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ArchitectureDiagram />
      </section>

      {/* Recent Submissions Ticker */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">
              Live Submissions Feed
            </h2>
          </div>
          <Link
            href="/faculty"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
          >
            View All ({submissions.length})
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <th className="px-6 py-3">Student</th>
                <th className="px-4 py-3">Course / Assignment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-6 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {submissions.slice(0, 5).map((sub) => {
                const isOverridden = Boolean(sub.override?.isOverridden);
                const score = isOverridden ? sub.override!.overriddenScore : sub.evaluation?.score;
                const max = sub.evaluation?.maxScore ?? 100;
                const percentage = score !== undefined ? Math.round((score / max) * 100) : null;
                const colors = percentage !== null ? getScoreColor(percentage) : null;

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">{sub.studentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{sub.studentId}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{sub.assignmentTitle}</div>
                      <div className="text-[11px] text-slate-400">{sub.courseCode}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={sub.status} isOverridden={isOverridden} size="sm" />
                    </td>
                    <td className="px-4 py-3.5">
                      {score !== undefined && colors ? (
                        <span className={`font-mono font-bold ${colors.text}`}>
                          {score}/{max} ({percentage}%)
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">--</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedSub(sub)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Grade Detail Modal */}
      <GradeDetailModal
        isOpen={Boolean(selectedSub)}
        onClose={() => setSelectedSub(null)}
        submission={selectedSub}
        isFacultyView={true}
      />
    </div>
  );
}
