'use client';

import React from 'react';
import Link from 'next/link';
import {
  Network,
  Sparkles,
  Server,
  Database,
  Clock,
  ShieldCheck,
  Radio,
  FileCode,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { ArchitectureDiagram } from '@/components/ArchitectureDiagram';

export default function ArchitecturePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              System Engineering Spec
            </span>
            <span className="text-xs font-mono text-slate-400">v1.0 Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            EduAgents System Architecture
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            A decoupled, asynchronous human-in-the-loop co-learning architecture connecting Next.js, FastAPI, Supabase, and a two-stage Gemini AI pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/student"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 transition border border-blue-200 dark:border-blue-800"
          >
            <span>Student Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/faculty"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 transition border border-emerald-200 dark:border-emerald-800"
          >
            <span>Faculty Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Interactive Diagram Component */}
      <ArchitectureDiagram />

      {/* Architectural Deep-Dive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Asynchronous Decoupling */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            1. Asynchronous Queue Decoupling
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Directly invoking LLMs during student HTTP uploads causes timeouts during deadline peaks. EduAgents accepts the file, writes to blob storage, creates a <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">pending</code> job, and returns HTTP 201 immediately in under 200ms.
          </p>
        </div>

        {/* 2. Zero-Cost Cron Drain */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            2. Serverless 2-Minute Cron Queue Drain
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Instead of paying for always-on background worker VMs (Celery/Redis), GitHub Actions executes a scheduled workflow every 2 minutes calling <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">POST /internal/process-jobs</code> to drain pending batches.
          </p>
        </div>

        {/* 3. Two-Step Gemini Pipeline */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            3. Two-Step Gemini AI Pipeline
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-200">Step 1 (Gemini Flash-Lite):</strong> Normalizes student text/code and converts layout into validated JSON.<br />
            <strong className="text-slate-800 dark:text-slate-200">Step 2 (Gemini Flash):</strong> Evaluates criteria, performs analytical reasoning, computes point deductions, and generates constructive feedback.
          </p>
        </div>

        {/* 4. Supabase Realtime Sync */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            4. Real-time WebSocket Push
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            When grades are written to Postgres, Supabase Realtime emits WebSocket broadcasts. Students see their progress transition from queued to graded without reloading their browser session.
          </p>
        </div>

        {/* 5. Row-Level Security (RLS) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            5. Row-Level Security (RLS) Privacy
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Strict Supabase RLS policies guarantee data isolation. Students can only select and query their own submission records, while verified instructors have permission to query all course roster records.
          </p>
        </div>

        {/* 6. Human-in-the-Loop Override */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            6. Human-in-the-Loop Override & Audit
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            AI is an assistant, not the final authority. Instructors can override any AI-assigned point value, provide written rationale, and keep a clean audit trail showing original score vs overridden score.
          </p>
        </div>
      </div>
    </div>
  );
}
