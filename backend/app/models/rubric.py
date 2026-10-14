from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class RubricCriterionBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str
    description: str
    maxPoints: float = Field(..., alias="maxPoints")
    weightPercent: Optional[float] = Field(None, alias="weightPercent")


class RubricCriterionCreate(RubricCriterionBase):
    pass


class RubricCriterion(RubricCriterionBase):
    id: str


class RubricBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    courseCode: str = Field(..., alias="courseCode")
    assignmentTitle: str = Field(..., alias="assignmentTitle")
    description: str
    criteria: List[RubricCriterion]


class RubricCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    courseCode: str = Field(..., alias="courseCode")
    assignmentTitle: str = Field(..., alias="assignmentTitle")
    description: str
    totalPoints: Optional[float] = Field(None, alias="totalPoints")
    criteria: List[RubricCriterionCreate]


class RubricUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    courseCode: Optional[str] = Field(None, alias="courseCode")
    assignmentTitle: Optional[str] = Field(None, alias="assignmentTitle")
    description: Optional[str] = None
    totalPoints: Optional[float] = Field(None, alias="totalPoints")
    criteria: Optional[List[RubricCriterion]] = None


class Rubric(RubricBase):
    id: str
    totalPoints: float = Field(..., alias="totalPoints")
    createdAt: str = Field(..., alias="createdAt")
