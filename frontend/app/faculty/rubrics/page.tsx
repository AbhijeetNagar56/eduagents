'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  Clock
} from 'lucide-react';
import { Course, Rubric } from '@/lib/types';
import { getCourses, getRubrics, refreshRubrics, deleteRubric } from '@/lib/storage';
import { RubricEditorModal } from '@/components/RubricEditorModal';
import { RubricViewerModal } from '@/components/RubricViewerModal';

export default function FacultyRubricsPage() {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingRubric, setEditingRubric] = useState<Rubric | null>(null);
  const [viewingRubric, setViewingRubric] = useState<Rubric | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    void refreshRubrics().then(() => { setRubrics(getRubrics()); setCourses(getCourses()); }).catch(console.error).finally(() => setMounted(true));
  }, []);

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Clock className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading Rubrics...</span>
        </div>
      </div>
    );
  }

  const filteredRubrics = rubrics.filter((r) => {
    if (selectedCourseFilter !== 'ALL' && r.courseCode !== selectedCourseFilter) return false;
    return true;
  });

  const handleOpenCreate = () => {
    setEditingRubric(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (rubric: Rubric) => {
    setEditingRubric(rubric);
    setIsEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this rubric? Existing submissions using it will keep their evaluation snapshot.')) {
      try { await deleteRubric(id); setRubrics(getRubrics()); }
      catch (error) { alert(error instanceof Error ? error.message : 'Could not delete rubric.'); }
    }
  };

  const handleSave = async (saved: Rubric) => {
    setRubrics(getRubrics());
    setCourses(getCourses());
    setIsEditorOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/faculty"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Faculty Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Assignment Grading Rubrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Configure the criteria and point distributions used by Gemini AI to evaluate student submissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Course Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Course:</span>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Rubric</span>
          </button>
        </div>
      </div>

      {/* Rubrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRubrics.map((rubric) => (
          <div
            key={rubric.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-700 transition space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {rubric.courseCode}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white pt-1">
                    {rubric.assignmentTitle}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                    {rubric.totalPoints}
                  </span>
                  <span className="text-xs text-slate-400 block font-medium">total pts</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                {rubric.description}
              </p>

              {/* Criteria List */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Grading Criteria ({rubric.criteria.length})
                </span>
                <div className="space-y-1.5">
                  {rubric.criteria.map((c, i) => (
                    <div
                      key={c.id || i}
                      className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                        {c.title}
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">
                        {c.maxPoints} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 font-mono">
                Created {rubric.createdAt}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingRubric(rubric)}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Preview Rubric Modal"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(rubric)}
                  className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition"
                  title="Edit Rubric"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(rubric.id)}
                  className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
                  title="Delete Rubric"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <RubricEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        initialRubric={editingRubric}
        onRubricSaved={handleSave}
      />

      <RubricViewerModal
        isOpen={Boolean(viewingRubric)}
        onClose={() => setViewingRubric(null)}
        rubric={viewingRubric}
      />
    </div>
  );
}
