-- seed.sql: Initial seed data for EduAgents platform

-- Rubrics
insert into rubrics (id, course_code, assignment_title, description, total_points, created_at)
values
  ('rubric-1', 'CS101', 'Assignment 1: Sorting Algorithms & Complexity', 'Evaluation criteria for empirical sorting analysis and time complexity justifications.', 100, '2026-10-01'),
  ('rubric-2', 'CS101', 'Assignment 2: Graph Traversal & Dijkstra', 'Assessment of shortest-path algorithm correctness and priority queue usage.', 100, '2026-10-02'),
  ('rubric-3', 'AI301', 'Lab 3: Gradient Descent Optimization Report', 'Analysis of SGD, Momentum, and Adam optimizers on non-convex surfaces.', 100, '2026-10-03')
on conflict (id) do nothing;

-- Rubric Criteria for rubric-1
insert into rubric_criteria (id, rubric_id, title, description, max_points, order_index)
values
  ('crit-1', 'rubric-1', 'Algorithm Correctness & Implementation', 'Implements QuickSort, MergeSort, and HeapSort correctly with optimal boundary handling.', 35, 1),
  ('crit-2', 'rubric-1', 'Theoretical Time & Space Complexity', 'Rigorous Big-O derivation for best, average, and worst-case scenarios.', 25, 2),
  ('crit-3', 'rubric-1', 'Empirical Benchmark Analysis', 'Plots runtime against input array sizes (N=10^3 to 10^6) with standard deviations.', 25, 3),
  ('crit-4', 'rubric-1', 'Code Clarity & Documentation', 'Clean coding style, meaningful identifiers, and markdown formatting.', 15, 4)
on conflict (id) do nothing;

-- Rubric Criteria for rubric-2
insert into rubric_criteria (id, rubric_id, title, description, max_points, order_index)
values
  ('crit-2-1', 'rubric-2', 'Graph Representation & Min-Heap Heapify', 'Adjacency list representation and binary heap priority queue usage.', 40, 1),
  ('crit-2-2', 'rubric-2', 'Dijkstra Implementation & Edge-case Handling', 'Properly ignores negative cycles and disconnect components.', 35, 2),
  ('crit-2-3', 'rubric-2', 'Complexity Discussion & Code Style', 'O((V+E)log V) proof and modular code organization.', 25, 3)
on conflict (id) do nothing;

-- Rubric Criteria for rubric-3
insert into rubric_criteria (id, rubric_id, title, description, max_points, order_index)
values
  ('crit-3-1', 'rubric-3', 'Mathematical Derivation of Gradients', 'Accurate analytical gradients and partial derivative chains.', 30, 1),
  ('crit-3-2', 'rubric-3', 'Comparative Convergence Experiments', 'Loss curve comparisons and hyperparameter sensitivity grids.', 40, 2),
  ('crit-3-3', 'rubric-3', 'Pedagogical Synthesis & Conclusions', 'Insightful discussion of saddle points and local minima traps.', 30, 3)
on conflict (id) do nothing;
