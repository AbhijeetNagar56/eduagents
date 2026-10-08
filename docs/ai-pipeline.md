# EduAgents AI Evaluation Pipeline

This specification outlines the two-step sequential AI pipeline implemented in EduAgents, utilizing **Google Gemini** models to deliver structured, consistent, and rubric-aligned grading.

---

## Why a Two-Step Pipeline?

Single-prompt LLM grading suffers from:
1. **Formatting fragility:** The LLM may fail to adhere strictly to numeric score bounds and criteria definitions.
2. **Context overloading:** Simultaneously parsing raw multi-page student documents and generating pedagogical reasoning degrades grading consistency.

EduAgents separates the pipeline into two decoupled stages:
- **Stage 1 (Gemini Flash-Lite):** Text and structural extraction into validated JSON.
- **Stage 2 (Gemini Flash):** Deep pedagogical evaluation and rubric scoring based solely on the structured extraction.

```
Raw Submission (PDF / Markdown)
         │
         ▼
┌─────────────────────────────────┐
│ Stage 1: Gemini Flash-Lite     │  Fast, low-latency document layout
│ (Extraction & Normalization)    │  normalization into structured schema
└─────────────────────────────────┘
         │  Structured Document JSON
         ▼
┌─────────────────────────────────┐
│ Stage 2: Gemini Flash           │  Pedagogical evaluation against
│ (Reasoning & Rubric Scoring)    │  faculty criteria + point computation
└─────────────────────────────────┘
         │  Evaluated Grades & Feedback JSON
         ▼
Postgres DB (`evaluations` & `criterion_evaluations`)
         │
         ▼
Supabase Realtime Broadcast ──> Student & Faculty Portals
```

---

## Stage 1: Extraction & Layout Normalization

### Model
`gemini-2.5-flash-lite`

### System Instruction
```
You are an academic document parser. Parse the provided student assignment text/document into a clean JSON schema.
Extract all declared author information, sections, problem statements, student code blocks, and theoretical mathematical proofs.
Do NOT evaluate quality or assign grades in this stage. Output strictly valid JSON matching the requested schema.
```

### JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "documentTitle": { "type": "string" },
    "authorDeclared": { "type": "string" },
    "sections": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "sectionTitle": { "type": "string" },
          "content": { "type": "string" },
          "codeBlocks": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "language": { "type": "string" },
                "code": { "type": "string" }
              },
              "required": ["language", "code"]
            }
          }
        },
        "required": ["sectionTitle", "content"]
      }
    },
    "formatValidation": {
      "type": "object",
      "properties": {
        "hasExecutableCode": { "type": "boolean" },
        "hasTheoreticalAnalysis": { "type": "boolean" },
        "pageCountEstimate": { "type": "integer" }
      },
      "required": ["hasExecutableCode", "hasTheoreticalAnalysis"]
    }
  },
  "required": ["sections", "formatValidation"]
}
```

---

## Stage 2: Rubric Evaluation & Pedagogical Reasoning

### Model
`gemini-2.5-flash`

### Input Context
The prompt combines:
1. The **Rubric Specification** (criteria list, descriptions, maximum point values).
2. The **Structured Document JSON** produced by Stage 1.

### System Instruction
```
You are a university computer science grader. Evaluate the student work objectively against each rubric criterion.
Rules:
1. Award numerical scores strictly within [0, maxPoints] for each criterion.
2. Provide actionable, constructive feedback tailored to the student's submission.
3. List 2-3 specific strengths demonstrating solid mastery.
4. List 1-2 concrete, actionable improvements for future iterations.
5. If an implementation is partially correct, explain specifically where deductions occurred.
Output strictly valid JSON matching the requested schema.
```

### Output JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "totalScore": { "type": "number" },
    "maxScore": { "type": "number" },
    "summaryFeedback": { "type": "string" },
    "strengths": {
      "type": "array",
      "items": { "type": "string" }
    },
    "improvements": {
      "type": "array",
      "items": { "type": "string" }
    },
    "criteriaEvaluations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "criterionId": { "type": "string" },
          "title": { "type": "string" },
          "scoreAwarded": { "type": "number" },
          "maxPoints": { "type": "number" },
          "feedback": { "type": "string" },
          "strengths": { "type": "string" },
          "improvements": { "type": "string" }
        },
        "required": ["criterionId", "title", "scoreAwarded", "maxPoints", "feedback"]
      }
    }
  },
  "required": ["totalScore", "maxScore", "summaryFeedback", "strengths", "improvements", "criteriaEvaluations"]
}
```

---

## Error Handling & Rate Limit Strategy

1. **Transient 429 Rate Limits:**
   If the Gemini API returns a rate limit response, the backend job runner:
   - Does NOT mark the job as failed.
   - Increments the `retry_count` in the `grading_jobs` table.
   - Reverts job status back to `pending`.
   - The job is re-attempted in the next 2-minute cron window.

2. **Parsing Failures:**
   If a document cannot be parsed (e.g., corrupted PDF), the job status is set to `flagged`, with the error log stored in `grading_jobs.error_log`. The submission is highlighted on the Faculty Dashboard for instructor review.

---

## Human-in-the-Loop Override

Instructors retain complete authority over all AI-evaluated grades:
- Instructors can adjust points either per-criterion or overall.
- Every override requires a justification string and logs the instructor's ID and timestamp.
- The original AI evaluation is never overwritten, maintaining a tamper-evident audit trail.
