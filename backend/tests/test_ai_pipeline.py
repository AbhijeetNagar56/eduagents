import asyncio
from app.ai.extract import extract_document_structure
from app.ai.grade import evaluate_submission_against_rubric
from app.services.repository import Repository


def test_stage_1_document_extraction():
    sample_text = """# Lab 1: Sorting Analysis
Author: Jordan Taylor

## Implementation
```python
def mergesort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = mergesort(arr[:mid])
    right = mergesort(arr[mid:])
    return merge(left, right)
```

## Complexity Analysis
We establish that the recurrence relation is T(n) = 2T(n/2) + O(n).
By the Master Theorem case 2, this yields an optimal O(n log n) bound.
"""
    structured_doc = asyncio.run(extract_document_structure(sample_text, "lab1.md"))
    assert structured_doc.documentTitle is not None
    assert len(structured_doc.sections) >= 1
    assert structured_doc.formatValidation.hasExecutableCode is True
    assert structured_doc.formatValidation.hasTheoreticalAnalysis is True


def test_stage_2_rubric_evaluation():
    rubric = Repository.get_rubric_by_id("rubric-1")
    assert rubric is not None

    sample_text = """# Sorting Homework
```python
def quicksort(arr): return arr
```
Time complexity is O(N log N).
"""
    structured_doc = asyncio.run(extract_document_structure(sample_text, "hw.md"))
    grading_output = asyncio.run(evaluate_submission_against_rubric(structured_doc, rubric))

    assert grading_output.totalScore > 0
    assert grading_output.maxScore == rubric.totalPoints
    assert len(grading_output.criteriaEvaluations) == len(rubric.criteria)
    for crit in grading_output.criteriaEvaluations:
        assert 0 <= crit.scoreAwarded <= crit.maxPoints
