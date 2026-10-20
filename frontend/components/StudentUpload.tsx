'use client';

import React, { useEffect, useState } from 'react';
import {
  UploadCloud,
  FileCode,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  Info
} from 'lucide-react';
import { Course, Rubric, Submission } from '../lib/types';
import { createSubmission } from '../lib/storage';
import { getSessionUser } from '../lib/api';

interface StudentUploadProps {
  courses: Course[];
  rubrics: Rubric[];
  onSubmissionCreated: (newSub: Submission) => void;
  onViewRubric?: (rubric: Rubric) => void;
}

export function StudentUpload({
  courses,
  rubrics,
  onSubmissionCreated,
  onViewRubric
}: StudentUploadProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  const [selectedAssignId, setSelectedAssignId] = useState<string>(
    selectedCourse?.assignments[0]?.id || ''
  );

  const selectedAssign = selectedCourse?.assignments.find(a => a.id === selectedAssignId) || selectedCourse?.assignments[0];
  const activeRubric = rubrics.find(r => r.id === selectedAssign?.rubricId) || rubrics[0];

  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentEmail, setStudentEmail] = useState('');

  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void getSessionUser().then((user) => {
      if (!user) return;
      const metadata = user.user_metadata || {};
      setStudentEmail(user.email || '');
      setStudentName(metadata.full_name || metadata.name || '');
      setStudentId(metadata.student_id || user.id);
    }).catch(console.error);
  }, []);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (uploadMode === 'file' && !file) {
      setError('Please select or drag-and-drop an assignment file (PDF or Markdown).');
      return;
    }

    if (uploadMode === 'text' && !textContent.trim()) {
      setError('Please paste or type your assignment report / markdown content.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newSub = await createSubmission({
        file: uploadMode === 'file' ? file ?? undefined : undefined,
        textContent: uploadMode === 'text' ? textContent : undefined,
        studentId: studentId.trim(), studentName: studentName.trim(), studentEmail: studentEmail.trim(),
        assignmentId: selectedAssign?.id || '', assignmentTitle: selectedAssign?.title || '',
        courseCode: selectedCourse?.code || '', rubricId: activeRubric?.id || '',
      });
      onSubmissionCreated(newSub);
      setFile(null);
      setTextContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base">
            Submit New Assignment
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upload your solution in PDF or Markdown format for automated AI rubric evaluation.
          </p>
        </div>

        {activeRubric && onViewRubric && (
          <button
            type="button"
            onClick={() => onViewRubric(activeRubric)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 transition border border-blue-200 dark:border-blue-900"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Rubric ({activeRubric.criteria.length} criteria)</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Course & Assignment Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                const course = courses.find(c => c.id === e.target.value);
                if (course && course.assignments.length > 0) {
                  setSelectedAssignId(course.assignments[0].id);
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} – {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Assignment
            </label>
            <select
              value={selectedAssignId}
              onChange={(e) => setSelectedAssignId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {selectedCourse?.assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Student Metadata Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Student Full Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Student ID
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Submission Mode Tabs */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                uploadMode === 'file'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Upload Document (PDF / MD)
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('text')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                uploadMode === 'text'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Paste Markdown Text
            </button>
          </div>

          {uploadMode === 'file' ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-8 text-center transition cursor-pointer bg-slate-50/50 dark:bg-slate-900/50"
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <input
                id="file-upload-input"
                type="file"
                accept=".pdf,.md,.txt"
                className="hidden"
                onChange={handleFileInput}
              />
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>

              {file ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{file.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {(file.size / 1024).toFixed(1)} KB • Ready to submit
                  </p>
                  <p className="text-[10px] text-blue-600 underline mt-1">
                    Click to choose another file
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Click to browse or drag and drop your assignment
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Supports PDF, Markdown (.md), or Plain Text (.txt) up to 25 MB
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <textarea
                rows={6}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="# Assignment Title&#10;&#10;## 1. Algorithmic Approach&#10;My implementation utilizes a min-heap priority queue...&#10;&#10;```python&#10;def dijkstra(graph, start):&#10;    ...&#10;```"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Graded by Gemini Flash-Lite & Flash via 2-stage pipeline</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Assignment'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
