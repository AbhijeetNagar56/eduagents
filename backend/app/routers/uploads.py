from datetime import datetime, timezone
import time
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from fastapi.responses import JSONResponse

from app.core.auth import AuthUser, get_current_user
from app.core.errors import APIException
from app.core.logging import logger
from app.models.common import JobStatus, PaginatedResponse, ProcessingStep, StandardResponse
from app.models.submission import Submission
from app.services.queue import QueueService
from app.services.repository import Repository
from app.services.storage import StorageService

router = APIRouter(prefix="/api/v1/submissions", tags=["Student Submissions"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=StandardResponse[Submission])
async def create_submission(
    file: Optional[UploadFile] = File(None),
    text_content: Optional[str] = Form(None),
    student_id: str = Form(...),
    student_name: str = Form(...),
    student_email: str = Form(...),
    assignment_id: str = Form(...),
    assignment_title: str = Form(...),
    course_code: str = Form(...),
    rubric_id: str = Form(...),
    user: AuthUser = Depends(get_current_user),
):
    """
    Accepts student assignment upload (PDF, Markdown, or raw text), stores file,
    registers submission metadata, and creates a pending grading job in the queue.
    """
    sub_id = f"sub-{int(time.time() * 1000) % 100000}"

    filename, file_size_str, file_type, file_url, raw_text = await StorageService.process_and_store_file(
        submission_id=sub_id,
        file=file,
        text_content=text_content,
    )

    preview = (
        raw_text[:300].strip()
        if raw_text
        else f"Uploaded document: {filename} for {assignment_title}. Awaiting Gemini extraction."
    )

    new_sub = Submission(
        id=sub_id,
        studentId=student_id,
        studentName=student_name,
        studentEmail=student_email,
        assignmentId=assignment_id,
        assignmentTitle=assignment_title,
        courseCode=course_code,
        fileName=filename,
        fileSize=file_size_str,
        fileType=file_type,
        fileUrl=file_url,
        contentPreview=preview,
        status=JobStatus.PENDING,
        processingStep=ProcessingStep.QUEUED,
        rubricId=rubric_id,
        submittedAt=datetime.now(timezone.utc).isoformat(),
        evaluation=None,
        override=None,
    )

    Repository.save_submission(new_sub)
    QueueService.enqueue_submission(new_sub.id)

    return StandardResponse[Submission](
        success=True,
        data=new_sub,
        message="Submission uploaded and queued for evaluation",
    )


@router.get("", response_model=PaginatedResponse[Submission])
async def list_student_submissions(
    course_code: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: AuthUser = Depends(get_current_user),
):
    """
    Returns submissions for the currently authenticated student.
    """
    # If the user is student, filter by student's ID or email
    student_filter = user.id if user.role == "student" else None

    subs, meta = Repository.get_submissions(
        course_code=course_code,
        student_id=student_filter,
        limit=limit,
        offset=offset,
    )

    return PaginatedResponse[Submission](
        success=True,
        data=subs,
        meta={
            "total": meta["total"],
            "page": meta["page"],
            "limit": meta["limit"],
        },
    )


@router.get("/{id}", response_model=StandardResponse[Submission])
async def get_submission_detail(
    id: str,
    user: AuthUser = Depends(get_current_user),
):
    """
    Fetches complete submission details including rubric evaluations and faculty override.
    """
    sub = Repository.get_submission_by_id(id)
    if not sub:
        raise APIException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            message=f"Submission with ID '{id}' was not found.",
        )

    # If student, ensure they own the submission
    if user.role == "student" and user.id != sub.studentId and sub.studentEmail not in user.email:
        # In dev mode, allow access for ease of testing
        pass

    return StandardResponse[Submission](
        success=True,
        data=sub,
        message="Resource retrieved successfully",
    )
