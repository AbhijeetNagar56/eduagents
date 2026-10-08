import { Course, Rubric, Submission } from './types';

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-1',
    code: 'CS101',
    name: 'Introduction to Algorithms',
    instructor: 'Dr. Sarah Lin',
    assignments: [
      {
        id: 'assign-1',
        title: 'Assignment 1: Sorting Algorithms & Complexity',
        dueDate: '2026-10-15',
        rubricId: 'rubric-1'
      },
      {
        id: 'assign-2',
        title: 'Assignment 2: Graph Traversal & Dijkstra',
        dueDate: '2026-10-28',
        rubricId: 'rubric-2'
      }
    ]
  },
  {
    id: 'course-2',
    code: 'AI301',
    name: 'Machine Learning Foundations',
    instructor: 'Prof. Marcus Vance',
    assignments: [
      {
        id: 'assign-3',
        title: 'Lab 3: Gradient Descent Optimization Report',
        dueDate: '2026-10-20',
        rubricId: 'rubric-3'
      }
    ]
  }
];

export const INITIAL_RUBRICS: Rubric[] = [
  {
    id: 'rubric-1',
    courseCode: 'CS101',
    assignmentTitle: 'Assignment 1: Sorting Algorithms & Complexity',
    description: 'Evaluation criteria for empirical sorting analysis and time complexity justifications.',
    totalPoints: 100,
    createdAt: '2026-10-01',
    criteria: [
      {
        id: 'crit-1',
        title: 'Algorithm Correctness & Implementation',
        description: 'Implements QuickSort, MergeSort, and HeapSort correctly with optimal boundary handling.',
        maxPoints: 35
      },
      {
        id: 'crit-2',
        title: 'Theoretical Time & Space Complexity',
        description: 'Rigorous Big-O derivation for best, average, and worst-case scenarios.',
        maxPoints: 25
      },
      {
        id: 'crit-3',
        title: 'Empirical Benchmark Analysis',
        description: 'Plots runtime against input array sizes (N=10^3 to 10^6) with standard deviations.',
        maxPoints: 25
      },
      {
        id: 'crit-4',
        title: 'Code Clarity & Documentation',
        description: 'Clean coding style, meaningful identifiers, and markdown formatting.',
        maxPoints: 15
      }
    ]
  },
  {
    id: 'rubric-2',
    courseCode: 'CS101',
    assignmentTitle: 'Assignment 2: Graph Traversal & Dijkstra',
    description: 'Assessment of shortest-path algorithm correctness and priority queue usage.',
    totalPoints: 100,
    createdAt: '2026-10-02',
    criteria: [
      {
        id: 'crit-2-1',
        title: 'Graph Representation & Min-Heap Heapify',
        description: 'Adjacency list representation and binary heap priority queue usage.',
        maxPoints: 40
      },
      {
        id: 'crit-2-2',
        title: 'Dijkstra Implementation & Edge-case Handling',
        description: 'Properly ignores negative cycles and disconnect components.',
        maxPoints: 35
      },
      {
        id: 'crit-2-3',
        title: 'Complexity Discussion & Code Style',
        description: 'O((V+E)log V) proof and modular code organization.',
        maxPoints: 25
      }
    ]
  },
  {
    id: 'rubric-3',
    courseCode: 'AI301',
    assignmentTitle: 'Lab 3: Gradient Descent Optimization Report',
    description: 'Analysis of SGD, Momentum, and Adam optimizers on non-convex surfaces.',
    totalPoints: 100,
    createdAt: '2026-10-03',
    criteria: [
      {
        id: 'crit-3-1',
        title: 'Mathematical Derivation of Gradients',
        description: 'Accurate analytical gradients and partial derivative chains.',
        maxPoints: 30
      },
      {
        id: 'crit-3-2',
        title: 'Comparative Convergence Experiments',
        description: 'Loss curve comparisons and hyperparameter sensitivity grids.',
        maxPoints: 40
      },
      {
        id: 'crit-3-3',
        title: 'Pedagogical Synthesis & Conclusions',
        description: 'Insightful discussion of saddle points and local minima traps.',
        maxPoints: 30
      }
    ]
  }
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-101',
    studentId: 'STU-2024-089',
    studentName: 'Alex Rivera',
    studentEmail: 'alex.rivera@university.edu',
    assignmentId: 'assign-1',
    assignmentTitle: 'Assignment 1: Sorting Algorithms & Complexity',
    courseCode: 'CS101',
    fileName: 'alex_rivera_sorting_analysis.pdf',
    fileSize: '1.4 MB',
    fileType: 'pdf',
    status: 'done',
    submittedAt: '2026-10-07 14:22',
    rubricId: 'rubric-1',
    contentPreview: 'Comparative Analysis of Quicksort (Dual-Pivot) and Mergesort on Random vs Nearly Sorted Datasets. Includes Big-O proofs, empirical runtime tables, and memory profiling.',
    evaluation: {
      score: 92,
      maxScore: 100,
      percentage: 92,
      criteriaScores: [
        {
          criterionId: 'crit-1',
          title: 'Algorithm Correctness & Implementation',
          scoreAwarded: 33,
          maxPoints: 35,
          feedback: 'Dual-pivot partition algorithm implemented with high fidelity. QuickSort recursion depth limit guard correctly implemented.',
          strengths: 'Excellent edge-case defense against adversarial quadratic inputs.',
          improvements: 'MergeSort buffer allocation could be reused between recursive calls to reduce GC churn.'
        },
        {
          criterionId: 'crit-2',
          title: 'Theoretical Time & Space Complexity',
          scoreAwarded: 24,
          maxPoints: 25,
          feedback: 'Rigorous master theorem application for mergesort. Clear explanation of random pivot expectation.',
          strengths: 'Clear recurrences with step-by-step substitution method.',
          improvements: 'Minor omission in space complexity analysis of auxiliary stack frames for worst-case quicksort.'
        },
        {
          criterionId: 'crit-3',
          title: 'Empirical Benchmark Analysis',
          scoreAwarded: 22,
          maxPoints: 25,
          feedback: 'Runtime plots clearly distinguish O(N log N) from O(N^2) behavior on sorted arrays.',
          strengths: 'Clean matplotlib visualizations with error bars across 10 trials.',
          improvements: 'Include cache miss telemetry or perf counters for deeper hardware-level analysis.'
        },
        {
          criterionId: 'crit-4',
          title: 'Code Clarity & Documentation',
          scoreAwarded: 13,
          maxPoints: 15,
          feedback: 'Extremely clean code formatting, well-commented helper functions.',
          strengths: 'Follows PEP 8 / Google Style guide conventions.',
          improvements: 'Docstrings could clarify type constraints on generic sorting comparator.'
        }
      ],
      summaryFeedback: 'Exceptional submission demonstrating deep comprehension of algorithmic trade-offs. The empirical benchmarking confirms theoretical predictions with high experimental precision.',
      strengths: [
        'Robust dual-pivot quicksort implementation with recursion depth guard',
        'High-quality statistical plots with confidence intervals across multiple trials',
        'Master theorem and recurrence relations clearly articulated'
      ],
      improvements: [
        'Optimize memory reuse for auxiliary mergesort buffer',
        'Add memory profiling graphs alongside CPU execution times'
      ],
      aiModelExtraction: 'Gemini Flash-Lite',
      aiModelGrading: 'Gemini Flash',
      evaluatedAt: '2026-10-07 14:24'
    }
  },
  {
    id: 'sub-102',
    studentId: 'STU-2024-114',
    studentName: 'Samantha Chen',
    studentEmail: 's.chen@university.edu',
    assignmentId: 'assign-1',
    assignmentTitle: 'Assignment 1: Sorting Algorithms & Complexity',
    courseCode: 'CS101',
    fileName: 'chen_samantha_report.md',
    fileSize: '420 KB',
    fileType: 'markdown',
    status: 'done',
    submittedAt: '2026-10-07 16:05',
    rubricId: 'rubric-1',
    contentPreview: 'Sorting Benchmarking Report in Markdown format. Explores QuickSort, MergeSort, and TimSort behavior on sorted, reverse sorted, and uniformly distributed integer arrays.',
    evaluation: {
      score: 84,
      maxScore: 100,
      percentage: 84,
      criteriaScores: [
        {
          criterionId: 'crit-1',
          title: 'Algorithm Correctness & Implementation',
          scoreAwarded: 30,
          maxPoints: 35,
          feedback: 'Standard Lomuto partitioning used. Works as expected for average case.',
          strengths: 'Accurate base cases and clean recursion.',
          improvements: 'Lomuto partition degenerates to O(N^2) on identical element arrays; Hoare partition would be more resilient.'
        },
        {
          criterionId: 'crit-2',
          title: 'Theoretical Time & Space Complexity',
          scoreAwarded: 20,
          maxPoints: 25,
          feedback: 'Good overview of Big-O notations, but lacks formal mathematical proof for average case.',
          strengths: 'Accurate asymptotic notation descriptions.',
          improvements: 'Provide formal expectation derivation using indicator random variables.'
        },
        {
          criterionId: 'crit-3',
          title: 'Empirical Benchmark Analysis',
          scoreAwarded: 22,
          maxPoints: 25,
          feedback: 'Tabular data provided for N up to 500,000.',
          strengths: 'Accurate timing measurements in milliseconds.',
          improvements: 'Visual graphs would make the crossover points between QuickSort and MergeSort much clearer.'
        },
        {
          criterionId: 'crit-4',
          title: 'Code Clarity & Documentation',
          scoreAwarded: 12,
          maxPoints: 15,
          feedback: 'Clean Markdown formatting with syntax-highlighted code fences.',
          strengths: 'Easy to read and navigate.',
          improvements: 'Add inline commentary for the merge loop indices.'
        }
      ],
      summaryFeedback: 'Good solid work covering all essential requirements. To achieve full marks, provide mathematical proofs rather than only stating asymptotic bounds.',
      strengths: [
        'Clean markdown layout with formatted tables',
        'Well-tested sorting routines with verified outputs'
      ],
      improvements: [
        'Add visual benchmark plots',
        'Strengthen average-case proof using indicator random variables'
      ],
      aiModelExtraction: 'Gemini Flash-Lite',
      aiModelGrading: 'Gemini Flash',
      evaluatedAt: '2026-10-07 16:07'
    },
    override: {
      isOverridden: true,
      originalScore: 84,
      overriddenScore: 89,
      overriddenBy: 'Dr. Sarah Lin',
      overrideReason: 'Student included an insightful handwritten proof in the appendix that the extraction stage partially omitted. Adjusted Theoretical Complexity from 20 to 25.',
      overriddenAt: '2026-10-07 18:30',
      criterionAdjustments: {
        'crit-2': 25
      }
    }
  },
  {
    id: 'sub-103',
    studentId: 'STU-2024-042',
    studentName: 'Marcus Brody',
    studentEmail: 'm.brody@university.edu',
    assignmentId: 'assign-3',
    assignmentTitle: 'Lab 3: Gradient Descent Optimization Report',
    courseCode: 'AI301',
    fileName: 'brody_sgd_optimization.pdf',
    fileSize: '3.1 MB',
    fileType: 'pdf',
    status: 'processing',
    processingStep: 'grading',
    submittedAt: '2026-10-08 21:10',
    rubricId: 'rubric-3',
    contentPreview: 'Experimental study comparing Mini-batch SGD with Adam and RMSprop on Rosenbrock and Rastrigin test functions.',
  },
  {
    id: 'sub-104',
    studentId: 'STU-2024-198',
    studentName: 'Elena Rostova',
    studentEmail: 'elena.r@university.edu',
    assignmentId: 'assign-1',
    assignmentTitle: 'Assignment 1: Sorting Algorithms & Complexity',
    courseCode: 'CS101',
    fileName: 'elena_sorting_report.pdf',
    fileSize: '2.0 MB',
    fileType: 'pdf',
    status: 'pending',
    processingStep: 'queued',
    submittedAt: '2026-10-08 22:25',
    rubricId: 'rubric-1',
    contentPreview: 'Sorting analysis submission with C++ benchmark driver and python plotting scripts.',
  },
  {
    id: 'sub-105',
    studentId: 'STU-2024-077',
    studentName: 'Devon Patel',
    studentEmail: 'd.patel@university.edu',
    assignmentId: 'assign-1',
    assignmentTitle: 'Assignment 1: Sorting Algorithms & Complexity',
    courseCode: 'CS101',
    fileName: 'patel_sorting_hw.md',
    fileSize: '150 KB',
    fileType: 'markdown',
    status: 'flagged',
    submittedAt: '2026-10-08 19:40',
    rubricId: 'rubric-1',
    contentPreview: 'Sorting algorithm implementation report. AI pipeline detected incomplete complexity section or missing benchmark file.',
    evaluation: {
      score: 58,
      maxScore: 100,
      percentage: 58,
      criteriaScores: [
        {
          criterionId: 'crit-1',
          title: 'Algorithm Correctness & Implementation',
          scoreAwarded: 28,
          maxPoints: 35,
          feedback: 'Code correctly sorts arrays, but MergeSort lacks base case check for empty slice.',
          strengths: 'Functional code.',
          improvements: 'Add defensive guards for edge case input arrays.'
        },
        {
          criterionId: 'crit-2',
          title: 'Theoretical Time & Space Complexity',
          scoreAwarded: 10,
          maxPoints: 25,
          feedback: 'Incomplete derivation; section appears truncated or unfinished.',
          strengths: 'Mentions O(N log N).',
          improvements: 'Section stops abruptly on line 45.'
        },
        {
          criterionId: 'crit-3',
          title: 'Empirical Benchmark Analysis',
          scoreAwarded: 10,
          maxPoints: 25,
          feedback: 'No benchmark charts found in submission text.',
          strengths: 'None noted.',
          improvements: 'Submit benchmark charts.'
        },
        {
          criterionId: 'crit-4',
          title: 'Code Clarity & Documentation',
          scoreAwarded: 10,
          maxPoints: 15,
          feedback: 'Basic comments provided.',
          strengths: 'Clear indentation.',
          improvements: 'Add explanations of functions.'
        }
      ],
      summaryFeedback: 'Flagged for Faculty Review: The submission appears to be missing benchmark graphs and has truncated mathematical derivations.',
      strengths: ['Basic sorting code passes elementary test cases'],
      improvements: ['Complete missing complexity proofs', 'Attach benchmark charts'],
      aiModelExtraction: 'Gemini Flash-Lite',
      aiModelGrading: 'Gemini Flash',
      evaluatedAt: '2026-10-08 19:42'
    }
  }
];
