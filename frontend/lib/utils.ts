import { Submission } from './types';

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export function getScoreColor(percentage: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (percentage >= 90) {
    return { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' };
  }
  if (percentage >= 80) {
    return { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' };
  }
  if (percentage >= 70) {
    return { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' };
  }
  return { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' };
}

export function exportSubmissionsToCSV(submissions: Submission[], courseCode?: string): void {
  const filtered = courseCode
    ? submissions.filter(s => s.courseCode === courseCode)
    : submissions;

  const headers = [
    'Submission ID',
    'Student Name',
    'Student ID',
    'Student Email',
    'Course',
    'Assignment',
    'Status',
    'AI Score',
    'Faculty Overridden Score',
    'Final Score',
    'Overridden By',
    'Override Reason',
    'Submitted At'
  ];

  const rows = filtered.map(s => {
    const aiScore = s.evaluation ? s.evaluation.score : 'N/A';
    const overrideScore = s.override?.isOverridden ? s.override.overriddenScore : 'N/A';
    const finalScore = s.override?.isOverridden
      ? s.override.overriddenScore
      : (s.evaluation ? s.evaluation.score : 'Pending');

    return [
      `"${s.id}"`,
      `"${s.studentName}"`,
      `"${s.studentId}"`,
      `"${s.studentEmail}"`,
      `"${s.courseCode}"`,
      `"${s.assignmentTitle.replace(/"/g, '""')}"`,
      `"${s.status}"`,
      aiScore,
      overrideScore,
      finalScore,
      `"${s.override?.overriddenBy || ''}"`,
      `"${(s.override?.overrideReason || '').replace(/"/g, '""')}"`,
      `"${s.submittedAt}"`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `EduAgents_Grades_${courseCode || 'All'}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadJSON(data: unknown, filename: string): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
