import json
from typing import Any, Dict, List
from app.models.rubric import Rubric


STAGE_2_SYSTEM_INSTRUCTION = """
You are a university computer science grader. Evaluate the student work objectively against each rubric criterion.
Rules:
1. Award numerical scores strictly within [0, maxPoints] for each criterion.
2. Provide actionable, constructive feedback tailored to the student's submission.
3. List 2-3 specific strengths demonstrating solid mastery.
4. List 1-2 concrete, actionable improvements for future iterations.
5. If an implementation is partially correct, explain specifically where deductions occurred.
Output strictly valid JSON matching the requested schema.
"""


def build_stage_2_prompt(rubric: Rubric, extracted_doc: Dict[str, Any]) -> str:
    criteria_summary = [
        {
            "criterionId": c.id,
            "title": c.title,
            "description": c.description,
            "maxPoints": c.maxPoints,
        }
        for c in rubric.criteria
    ]

    return f"""
Assignment: {rubric.assignmentTitle}
Course: {rubric.courseCode}
Total Points: {rubric.totalPoints}

Rubric Criteria:
{json.dumps(criteria_summary, indent=2)}

Structured Student Document (Extracted from Stage 1):
{json.dumps(extracted_doc, indent=2)}

Evaluate the student's submission thoroughly and objectively against the criteria.
Output strictly valid JSON in the format:
{{
  "totalScore": 90,
  "maxScore": {rubric.totalPoints},
  "summaryFeedback": "Detailed feedback summary...",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1"],
  "criteriaEvaluations": [
    {{
      "criterionId": "criterion id matching rubric",
      "title": "title",
      "scoreAwarded": 30,
      "maxPoints": 35,
      "feedback": "Specific feedback",
      "strengths": "Observed strength",
      "improvements": "Observed improvement"
    }}
  ]
}}
"""
