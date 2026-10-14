STAGE_1_SYSTEM_INSTRUCTION = """
You are an academic document parser. Parse the provided student assignment text/document into a clean JSON schema.
Extract all declared author information, sections, problem statements, student code blocks, and theoretical mathematical proofs.
Do NOT evaluate quality or assign grades in this stage. Output strictly valid JSON matching the requested schema.
"""

def build_stage_1_prompt(raw_text: str) -> str:
    return f"""
Please parse the following student submission text into the structured JSON schema.

Document Text:
\"\"\"
{raw_text}
\"\"\"

Output format must be valid JSON:
{{
  "documentTitle": "string",
  "authorDeclared": "string",
  "sections": [
    {{
      "sectionTitle": "string",
      "content": "string",
      "codeBlocks": [
        {{ "language": "string", "code": "string" }}
      ]
    }}
  ],
  "formatValidation": {{
    "hasExecutableCode": true,
    "hasTheoreticalAnalysis": true,
    "pageCountEstimate": 1
  }}
}}
"""
