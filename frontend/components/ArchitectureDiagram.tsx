'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  Server,
  Clock,
  Sparkles,
  Radio,
  Database,
  ArrowRight,
  Shield,
  Layers,
  FileCode,
  CheckCircle2
} from 'lucide-react';

interface StepInfo {
  id: string;
  stepNumber: number;
  title: string;
  badge: string;
  tech: string;
  icon: any;
  color: string;
  borderColor: string;
  bgLight: string;
  description: string;
  keyResponsibilities: string[];
  flowType: 'Upload Flow' | 'Processing Flow' | 'Real-time Sync';
}

const ARCHITECTURE_STEPS: StepInfo[] = [
  {
    id: 'student',
    stepNumber: 1,
    title: 'Student Portal',
    badge: 'Upload Initiator',
    tech: 'Next.js Frontend',
    icon: GraduationCap,
    color: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    description: 'Students submit assignment solutions via PDF or Markdown. The client provides drag-and-drop ingestion, immediate feedback, and listens for live grade notifications.',
    keyResponsibilities: [
      'Drag-and-drop submission of assignment documents',
      'Preview rubric requirements before submission',
      'Subscribes to Supabase Realtime for instant grade push updates',
      'Protected by Row-Level Security (students see only their own work)'
    ],
    flowType: 'Upload Flow'
  },
  {
    id: 'backend',
    stepNumber: 2,
    title: 'Backend API Layer',
    badge: 'API & Ingestion',
    tech: 'FastAPI Microservice',
    icon: Server,
    color: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/40',
    description: 'Decoupled Python API validates file payloads, writes raw documents to Supabase Storage, and queues grading jobs into the database.',
    keyResponsibilities: [
      'Validates file MIME types, page limits, and sizes',
      'Persists raw submission artifacts into storage buckets',
      'Inserts grading jobs in "pending" status to eliminate request timeouts',
      'Exposes authenticated /internal/process-jobs runner endpoint'
    ],
    flowType: 'Upload Flow'
  },
  {
    id: 'cron',
    stepNumber: 3,
    title: 'Scheduled Job Runner',
    badge: 'Queue Draining',
    tech: 'GitHub Actions Cron (2-min)',
    icon: Clock,
    color: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-orange-200 dark:border-orange-800',
    bgLight: 'bg-orange-50 dark:bg-orange-950/40',
    description: 'Automated runner executes every 2 minutes to drain pending jobs from the queue without incurring dedicated worker VM costs.',
    keyResponsibilities: [
      'Triggers POST /internal/process-jobs on automated 2-min schedule',
      'Prevents server idle costs while ensuring low latency queue drainage',
      'Gracefully handles LLM rate limits by preserving pending status for retry'
    ],
    flowType: 'Processing Flow'
  },
  {
    id: 'ai',
    stepNumber: 4,
    title: 'Two-Step Gemini Pipeline',
    badge: 'AI Evaluation Core',
    tech: 'Gemini Flash-Lite + Gemini Flash',
    icon: Sparkles,
    color: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-200 dark:border-purple-800',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    description: 'Sequentially applies Gemini models: Flash-Lite normalizes content and extracts clean JSON schema; Flash analyzes mathematical proofs and grades against rubric criteria.',
    keyResponsibilities: [
      'Step 1 (Gemini Flash-Lite): Fast text extraction & structured JSON layout',
      'Step 2 (Gemini Flash): Deep reasoning, score computation, constructive feedback',
      'Enforces schema validation and objective rubric adherence',
      'Writes final score breakdowns directly back to Supabase Postgres'
    ],
    flowType: 'Processing Flow'
  },
  {
    id: 'realtime',
    stepNumber: 5,
    title: 'Real-Time Sync & Faculty Review',
    badge: 'Live Sync & Override',
    tech: 'Supabase WebSockets & Next.js',
    icon: Radio,
    color: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    description: 'Database state change emits instant WebSocket broadcasts to both student and faculty dashboards. Faculty can inspect, override AI scores, and export grades.',
    keyResponsibilities: [
      'Pushes live updates to browser sessions without page refresh',
      'Faculty Dashboard provides full class roster monitoring & flagged submissions',
      'Full Score Override with pedagogical justification & audit trail',
      'One-click CSV/JSON export for university grading systems'
    ],
    flowType: 'Real-time Sync'
  }
];

export function ArchitectureDiagram() {
  const [activeStepId, setActiveStepId] = useState<string>('student');
  const activeStep = ARCHITECTURE_STEPS.find(s => s.id === activeStepId) || ARCHITECTURE_STEPS[0];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              System Architecture & Agentic Flow
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              5-Step Lifecycle
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Click any node below to inspect data flows, security guarantees, and execution contracts.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Upload Flow
          </span>
          <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Processing Flow
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Real-time Sync
          </span>
        </div>
      </div>

      {/* Step Progress Chain */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {ARCHITECTURE_STEPS.map((step) => {
          const Icon = step.icon;
          const isSelected = activeStepId === step.id;

          return (
            <button
              key={step.id}
              onClick={() => setActiveStepId(step.id)}
              className={`text-left p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                isSelected
                  ? `${step.bgLight} ${step.borderColor} ring-2 ring-blue-500/50 shadow-xs`
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    0{step.stepNumber}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${step.bgLight} ${step.color}`}>
                    {step.badge}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${step.color}`} />
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                    {step.title}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {step.tech}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-medium">{step.flowType}</span>
                <ArrowRight className={`w-3 h-3 ${isSelected ? step.color : 'text-slate-300'}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Deep Dive Card */}
      <div className={`p-6 rounded-2xl border ${activeStep.bgLight} ${activeStep.borderColor} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 ${activeStep.color} shadow-xs`}>
              <activeStep.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Step {activeStep.stepNumber}: {activeStep.title} ({activeStep.tech})
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Data Path: {activeStep.flowType}
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            {activeStep.badge}
          </span>
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
          {activeStep.description}
        </p>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Key Execution Responsibilities
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
            {activeStep.keyResponsibilities.map((item, i) => (
              <li key={i} className="flex items-start gap-2 bg-white/70 dark:bg-slate-800/70 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
