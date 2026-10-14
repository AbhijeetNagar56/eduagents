from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CriterionEvaluation(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    criterionId: str = Field(..., alias="criterionId")
    title: str
    scoreAwarded: float = Field(..., alias="scoreAwarded")
    maxPoints: float = Field(..., alias="maxPoints")
    feedback: str
    strengths: Optional[str] = None
    improvements: Optional[str] = None


class EvaluationResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    score: float
    maxScore: float = Field(..., alias="maxScore")
    percentage: float
    criteriaScores: List[CriterionEvaluation] = Field(..., alias="criteriaScores")
    summaryFeedback: str = Field(..., alias="summaryFeedback")
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    aiModelExtraction: str = Field("Gemini Flash-Lite", alias="aiModelExtraction")
    aiModelGrading: str = Field("Gemini Flash", alias="aiModelGrading")
    evaluatedAt: str = Field(..., alias="evaluatedAt")


class FacultyOverrideRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    overriddenScore: float = Field(..., alias="overriddenScore")
    overriddenBy: str = Field(..., alias="overriddenBy")
    overrideReason: str = Field(..., alias="overrideReason")
    criterionAdjustments: Optional[Dict[str, float]] = Field(None, alias="criterionAdjustments")


class FacultyOverride(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    isOverridden: bool = Field(True, alias="isOverridden")
    originalScore: float = Field(..., alias="originalScore")
    overriddenScore: float = Field(..., alias="overriddenScore")
    overriddenBy: str = Field(..., alias="overriddenBy")
    overrideReason: str = Field(..., alias="overrideReason")
    overriddenAt: str = Field(..., alias="overriddenAt")
    criterionAdjustments: Optional[Dict[str, float]] = Field(None, alias="criterionAdjustments")
