'use client';

import React from 'react';
import {
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Calendar
} from 'lucide-react';
import { Submission } from '../lib/types';
import { StatusBadge } from './Badge';
import { getScoreColor } from '../lib/utils';

interface SubmissionCardProps {
  submission: Submission;
  onViewDetails: (sub: Submission) => void;
}

export function SubmissionCard({ submission, onViewDetails }: SubmissionCardProps) {
  const isDone = submission.status === 'done';
  const isProcessing = submission.status === 'processing';
  const isOverridden = Boolean(submission.override?.isOverridden);

  const displayScore = isOverridden
    ? submission.override!.overriddenScore
    : (submission.evaluation?.score ?? 0);
  const maxScore = submission.evaluation?.maxScore ?? 100;
  const percentage = Math.round((displayScore / maxScore) * 100);
  const scoreColors = getScoreColor(percentage);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-400 dark:hover:border-blue-700 transition space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              {submission.courseCode}
            </span>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              {submission.assignmentTitle}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <FileText className="w-3.5 h-3.5" />
              {submission.fileName} ({submission.fileSize})
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {submission.submittedAt}
            </span>
          </div>
        </div>

        <StatusBadge status={submission.status} isOverridden={isOverridden} />
      </div>

      {/* Real-time Processing Indicator */}
      {isProcessing && (
        <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              {submission.processingStep === 'extracting'
                ? 'Step 1: Gemini Flash-Lite parsing document...'
                : 'Step 2: Gemini Flash evaluating against rubric...'}
            </span>
            <span className="font-mono text-[10px] text-blue-700 dark:text-blue-300">
              {submission.processingStep === 'extracting' ? 'Extraction' : 'Reasoning'}
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-900 h-1.5 rounded-full overflow-hidden">
            <div
              className={`bg-blue-600 h-full rounded-full transition-all duration-700 ${
                submission.processingStep === 'extracting' ? 'w-1/2' : 'w-4/5'
              }`}
            ></div>
          </div>
        </div>
      )}

      {/* Done State: Score & Feedback snippet */}
      {isDone && submission.evaluation && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-xl border ${scoreColors.bg} ${scoreColors.border} flex items-baseline gap-1`}>
              <span className={`text-lg font-bold ${scoreColors.text}`}>
                {displayScore}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ {maxScore}</span>
              <span className={`text-xs font-semibold ml-1.5 ${scoreColors.text}`}>
                ({percentage}%)
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {isOverridden ? (
                <span className="text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Overridden by {submission.override?.overriddenBy}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-500">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Graded by Gemini AI
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => onViewDetails(submission)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-900 transition"
          >
            <span>View Full Rubric & Feedback</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Flagged State */}
      {submission.status === 'flagged' && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>AI detected potential formatting or omission issue. Awaiting faculty review.</span>
          </div>
          <button
            onClick={() => onViewDetails(submission)}
            className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 shrink-0 ml-2"
          >
            Inspect
          </button>
        </div>
      )}
    </div>
  );
}
