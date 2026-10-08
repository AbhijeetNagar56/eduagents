export type JobStatus = 'pending' | 'processing' | 'done' | 'failed' | 'flagged';

export interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  maxPoints: number;
  weightPercent?: number;
}

export interface Rubric {
  id: string;
  courseCode: string;
  assignmentTitle: string;
  description: string;
  criteria: RubricCriterion[];
  totalPoints: number;
  createdAt: string;
}

export interface CriterionEvaluation {
  criterionId: string;
  title: string;
  scoreAwarded: number;
  maxPoints: number;
  feedback: string;
  strengths?: string;
  improvements?: string;
}

export interface EvaluationResult {
  score: number;
  maxScore: number;
  percentage: number;
  criteriaScores: CriterionEvaluation[];
  summaryFeedback: string;
  strengths: string[];
  improvements: string[];
  aiModelExtraction: string; // e.g. "Gemini Flash-Lite"
  aiModelGrading: string;    // e.g. "Gemini Flash"
  evaluatedAt: string;
}

export interface FacultyOverride {
  isOverridden: boolean;
  originalScore: number;
  overriddenScore: number;
  overriddenBy: string;
  overrideReason: string;
  overriddenAt: string;
  criterionAdjustments?: Record<string, number>;
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  assignmentId: string;
  assignmentTitle: string;
  courseCode: string;
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'markdown' | 'text';
  contentPreview?: string;
  status: JobStatus;
  submittedAt: string;
  rubricId: string;
  evaluation?: EvaluationResult;
  override?: FacultyOverride;
  processingStep?: 'queued' | 'extracting' | 'grading' | 'synced';
}

export interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  assignments: {
    id: string;
    title: string;
    dueDate: string;
    rubricId: string;
  }[];
}
