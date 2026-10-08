'use client';

import React from 'react';
import { Rubric } from '../lib/types';
import { Modal } from './Modal';
import { Layers, CheckCircle2 } from 'lucide-react';

interface RubricViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  rubric: Rubric | null;
}

export function RubricViewerModal({ isOpen, onClose, rubric }: RubricViewerModalProps) {
  if (!rubric) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={rubric.assignmentTitle}
      subtitle={`Course: ${rubric.courseCode} • Total: ${rubric.totalPoints} points`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          {rubric.description}
        </p>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Grading Criteria ({rubric.criteria.length})
          </h4>

          <div className="space-y-2.5">
            {rubric.criteria.map((c, idx) => (
              <div
                key={c.id || idx}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <h5 className="font-semibold text-slate-900 dark:text-white text-xs">
                      {c.title}
                    </h5>
                  </div>
                  <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                    {c.maxPoints} pts
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 pl-7">
                  {c.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
