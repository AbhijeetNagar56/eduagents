from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.common import JobStatus, ProcessingStep
from app.models.evaluation import EvaluationResult, FacultyOverride


class Submission(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    studentId: str = Field(..., alias="studentId")
    studentName: str = Field(..., alias="studentName")
    studentEmail: str = Field(..., alias="studentEmail")
    assignmentId: str = Field(..., alias="assignmentId")
    assignmentTitle: str = Field(..., alias="assignmentTitle")
    courseCode: str = Field(..., alias="courseCode")
    fileName: str = Field(..., alias="fileName")
    fileSize: str = Field(..., alias="fileSize")
    fileType: str = Field(..., alias="fileType")
    fileUrl: Optional[str] = Field(None, alias="fileUrl")
    contentPreview: Optional[str] = Field(None, alias="contentPreview")
    status: JobStatus = JobStatus.PENDING
    processingStep: Optional[ProcessingStep] = Field(None, alias="processingStep")
    rubricId: str = Field(..., alias="rubricId")
    submittedAt: str = Field(..., alias="submittedAt")
    evaluation: Optional[EvaluationResult] = None
    override: Optional[FacultyOverride] = None


class SubmissionCreateForm(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    studentId: str = Field(..., alias="student_id")
    studentName: str = Field(..., alias="student_name")
    studentEmail: str = Field(..., alias="student_email")
    assignmentId: str = Field(..., alias="assignment_id")
    assignmentTitle: str = Field(..., alias="assignment_title")
    courseCode: str = Field(..., alias="course_code")
    rubricId: str = Field(..., alias="rubric_id")
    textContent: Optional[str] = Field(None, alias="text_content")
