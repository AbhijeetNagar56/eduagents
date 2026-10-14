import json
import re
from typing import Optional
from app.core.config import settings
from app.core.logging import logger
from app.ai.schemas import StructuredDocument, ExtractedSection, CodeBlock, FormatValidation
from app.ai.prompts.extraction import STAGE_1_SYSTEM_INSTRUCTION, build_stage_1_prompt


class RateLimitException(Exception):
    pass


class ExtractionError(Exception):
    pass


async def extract_document_structure(raw_text: str, filename: str = "submission") -> StructuredDocument:
    """
    Stage 1: Document Ingestion & Extraction using Gemini Flash-Lite.
    Normalizes raw student submission text into structured JSON.
    """
    if not raw_text or not raw_text.strip():
        raise ExtractionError("Empty submission document provided.")

    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = build_stage_1_prompt(raw_text)

            response = client.models.generate_content(
                model=settings.GEMINI_MODEL_LITE,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=STAGE_1_SYSTEM_INSTRUCTION,
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )

            response_text = response.text.strip()
            # Clean possible markdown fences
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]

            parsed_json = json.loads(response_text.strip())
            return StructuredDocument.model_validate(parsed_json)
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower() or "resource exhausted" in error_str.lower():
                logger.warning(f"Gemini API rate limit encountered during extraction: {e}")
                raise RateLimitException("Gemini Flash-Lite rate limit exceeded.")
            logger.warning(f"Gemini Flash-Lite API call failed, falling back to local extractor: {e}")

    # Fallback heuristic parser for local / offline mode
    return _heuristic_document_extractor(raw_text, filename)


def _heuristic_document_extractor(raw_text: str, filename: str) -> StructuredDocument:
    """
    Rule-based extractor used when Gemini API key is unset or in local demo/test mode.
    """
    lines = raw_text.splitlines()
    doc_title = lines[0].strip("# \t-") if lines and len(lines[0].strip()) > 3 else f"Report: {filename}"
    sections = []

    # Find code blocks
    code_pattern = re.compile(r"```(\w*)\n([\s\S]*?)```")
    has_code = bool(code_pattern.search(raw_text)) or "def " in raw_text or "class " in raw_text or "import " in raw_text

    has_theory = any(
        term in raw_text.lower()
        for term in ["big-o", "o(n", "o(1", "recurrence", "theorem", "complexity", "proof", "asymptotic"]
    )

    current_section_title = "Overview & Approach"
    current_content = []
    current_code_blocks = []

    for line in lines:
        if line.startswith("# ") or line.startswith("## ") or line.startswith("### "):
            if current_content:
                sections.append(
                    ExtractedSection(
                        sectionTitle=current_section_title,
                        content="\n".join(current_content).strip(),
                        codeBlocks=current_code_blocks,
                    )
                )
                current_content = []
                current_code_blocks = []
            current_section_title = line.strip("# \t")
        else:
            current_content.append(line)

    if current_content or not sections:
        sections.append(
            ExtractedSection(
                sectionTitle=current_section_title,
                content="\n".join(current_content).strip() or raw_text[:500],
                codeBlocks=current_code_blocks,
            )
        )

    # Estimate page count
    word_count = len(raw_text.split())
    page_estimate = max(1, word_count // 300)

    return StructuredDocument(
        documentTitle=doc_title,
        authorDeclared="Student",
        sections=sections,
        formatValidation=FormatValidation(
            hasExecutableCode=has_code,
            hasTheoreticalAnalysis=has_theory,
            pageCountEstimate=page_estimate,
        ),
    )
