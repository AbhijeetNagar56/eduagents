'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Layers, Check, AlertCircle } from 'lucide-react';
import { Rubric, RubricCriterion } from '../lib/types';
import { Modal } from './Modal';
import { saveRubric } from '../lib/storage';

interface RubricEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRubric: Rubric | null;
  onRubricSaved: (saved: Rubric) => void;
}

export function RubricEditorModal({
  isOpen,
  onClose,
  initialRubric,
  onRubricSaved
}: RubricEditorModalProps) {
  const [courseCode, setCourseCode] = useState('CS101');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<RubricCriterion[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialRubric) {
      setCourseCode(initialRubric.courseCode);
      setAssignmentTitle(initialRubric.assignmentTitle);
      setDescription(initialRubric.description);
      setCriteria(initialRubric.criteria);
    } else {
      setCourseCode('CS101');
      setAssignmentTitle('');
      setDescription('');
      setCriteria([
        {
          id: `crit-${Date.now()}-1`,
          title: 'Algorithmic Correctness',
          description: 'Accurate implementation of logic and edge cases.',
          maxPoints: 40
        },
        {
          id: `crit-${Date.now()}-2`,
          title: 'Complexity & Analytical Proofs',
          description: 'Formal Big-O time and space justifications.',
          maxPoints: 30
        },
        {
          id: `crit-${Date.now()}-3`,
          title: 'Code Quality & Documentation',
          description: 'Modular architecture, comments, and readability.',
          maxPoints: 30
        }
      ]);
    }
    setError('');
  }, [initialRubric, isOpen]);

  const totalPoints = criteria.reduce((sum, c) => sum + (Number(c.maxPoints) || 0), 0);

  const handleAddCriterion = () => {
    setCriteria([
      ...criteria,
      {
        id: `crit-${Date.now()}-${criteria.length + 1}`,
        title: 'New Evaluation Criterion',
        description: 'Describe grading standards and expectations for AI evaluation...',
        maxPoints: 10
      }
    ]);
  };

  const handleRemoveCriterion = (index: number) => {
    if (criteria.length <= 1) {
      setError('A rubric must contain at least one criterion.');
      return;
    }
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleCriterionChange = (index: number, field: keyof RubricCriterion, val: string | number) => {
    const updated = [...criteria];
    updated[index] = {
      ...updated[index],
      [field]: field === 'maxPoints' ? Number(val) : val
    };
    setCriteria(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentTitle.trim()) {
      setError('Please provide an assignment title.');
      return;
    }
    if (criteria.some(c => !c.title.trim())) {
      setError('All criteria must have a title.');
      return;
    }

    const saved: Rubric = {
      id: initialRubric?.id || `rubric-${Date.now()}`,
      courseCode: courseCode.trim().toUpperCase(),
      assignmentTitle: assignmentTitle.trim(),
      description: description.trim() || 'Rubric criteria for assignment evaluation.',
      criteria,
      totalPoints,
      createdAt: initialRubric?.createdAt || new Date().toISOString().slice(0, 10)
    };

    saveRubric(saved);
    onRubricSaved(saved);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialRubric ? 'Edit Grading Rubric' : 'Create New Grading Rubric'}
      subtitle="Define explicit criteria and point allocations for Gemini AI evaluation"
      maxWidth="2xl"
    >
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Course Code
            </label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assignment Title
            </label>
            <input
              type="text"
              value={assignmentTitle}
              onChange={(e) => setAssignmentTitle(e.target.value)}
              placeholder="e.g. Assignment 3: Dynamic Programming"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Rubric Overview / Instructions
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="High-level rubric scope and guidance..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        {/* Criteria List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Evaluation Criteria ({criteria.length})
              </h4>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Total: {totalPoints} pts
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddCriterion}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Criterion</span>
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {criteria.map((c, index) => (
              <div
                key={c.id || index}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-[10px] font-bold">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={c.title}
                    onChange={(e) => handleCriterionChange(index, 'title', e.target.value)}
                    placeholder="Criterion Title"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-hidden"
                    required
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={c.maxPoints}
                      onChange={(e) => handleCriterionChange(index, 'maxPoints', e.target.value)}
                      className="w-16 px-2 py-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-emerald-600 focus:outline-hidden"
                      required
                    />
                    <span className="text-xs text-slate-400 font-mono">pts</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCriterion(index)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Remove Criterion"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={c.description}
                  onChange={(e) => handleCriterionChange(index, 'description', e.target.value)}
                  placeholder="Grading standards and instructions for AI evaluation of this criterion..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden"
                />
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
          >
            <Check className="w-4 h-4" />
            <span>Save Rubric</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
