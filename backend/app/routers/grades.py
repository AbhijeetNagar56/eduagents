from datetime import datetime, timezone
import time
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.auth import AuthUser, get_current_user, require_role
from app.core.errors import APIException
from app.models.common import PaginatedResponse, StandardResponse
from app.models.evaluation import FacultyOverride, FacultyOverrideRequest
from app.models.rubric import Rubric, RubricCreate, RubricCriterion, RubricUpdate
from app.models.submission import Submission
from app.services.repository import Repository

router = APIRouter(prefix="/api/v1/faculty", tags=["Faculty Operations"])


@router.get("/submissions", response_model=PaginatedResponse[Submission])
async def list_faculty_submissions(
    course_code: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: AuthUser = Depends(require_role(["faculty", "student"])),
):
    """
    Retrieves submissions across the roster with filtering by course, status, and search query.
    Includes aggregated class roster metrics.
    """
    subs, meta = Repository.get_submissions(
        course_code=course_code,
        status=status,
        search=search,
        limit=limit,
        offset=offset,
    )

    return PaginatedResponse[Submission](
        success=True,
        data=subs,
        meta=meta,
    )


@router.post("/submissions/{id}/override", response_model=StandardResponse[Dict[str, Any]])
async def override_submission_grade(
    id: str,
    override_req: FacultyOverrideRequest,
    user: AuthUser = Depends(require_role(["faculty", "student"])),
):
    """
    Allows an instructor to override an AI evaluation score with an audit rationale.
    """
    sub = Repository.get_submission_by_id(id)
    if not sub:
        raise APIException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            message=f"Submission with ID '{id}' was not found.",
        )

    original_score = sub.evaluation.score if sub.evaluation else 0.0

    override = FacultyOverride(
        isOverridden=True,
        originalScore=original_score,
        overriddenScore=override_req.overriddenScore,
        overriddenBy=override_req.overriddenBy or user.email,
        overrideReason=override_req.overrideReason,
        overriddenAt=datetime.now(timezone.utc).isoformat(),
        criterionAdjustments=override_req.criterionAdjustments,
    )

    updated_sub = Repository.override_submission_grade(id, override)

    return StandardResponse[Dict[str, Any]](
        success=True,
        data={
            "submissionId": id,
            "finalScore": override.overriddenScore,
            "isOverridden": True,
            "override": override.model_dump(by_alias=True),
        },
        message="Grade successfully overridden with faculty audit justification.",
    )


@router.get("/rubrics", response_model=StandardResponse[List[Rubric]])
async def list_rubrics(
    course_code: Optional[str] = Query(None),
    user: AuthUser = Depends(get_current_user),
):
    """
    Lists all available assignment grading rubrics and criteria.
    """
    rubrics = Repository.get_rubrics(course_code=course_code)
    return StandardResponse[List[Rubric]](
        success=True,
        data=rubrics,
        message="Rubrics retrieved successfully",
    )


@router.post("/rubrics", status_code=status.HTTP_201_CREATED, response_model=StandardResponse[Rubric])
async def create_rubric(
    rubric_in: RubricCreate,
    user: AuthUser = Depends(require_role(["faculty", "student"])),
):
    """
    Creates a new grading rubric with associated weighted criteria.
    """
    rubric_id = f"rubric-{int(time.time() * 1000) % 10000}"

    criteria = [
        RubricCriterion(
            id=f"crit-{i+1}",
            title=c.title,
            description=c.description,
            maxPoints=c.maxPoints,
            weightPercent=c.weightPercent,
        )
        for i, c in enumerate(rubric_in.criteria)
    ]

    total_pts = rubric_in.totalPoints or sum(c.maxPoints for c in criteria) or 100.0

    new_rubric = Rubric(
        id=rubric_id,
        courseCode=rubric_in.courseCode,
        assignmentTitle=rubric_in.assignmentTitle,
        description=rubric_in.description,
        totalPoints=total_pts,
        createdAt=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        criteria=criteria,
    )

    saved = Repository.create_rubric(new_rubric)

    return StandardResponse[Rubric](
        success=True,
        data=saved,
        message="Rubric created successfully.",
    )


@router.put("/rubrics/{id}", response_model=StandardResponse[Rubric])
async def update_rubric(
    id: str,
    rubric_update: RubricUpdate,
    user: AuthUser = Depends(require_role(["faculty", "student"])),
):
    """
    Updates rubric metadata or criteria distributions.
    """
    updated = Repository.update_rubric(id, rubric_update)
    if not updated:
        raise APIException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            message=f"Rubric with ID '{id}' was not found.",
        )

    return StandardResponse[Rubric](
        success=True,
        data=updated,
        message="Rubric updated successfully.",
    )


@router.delete("/rubrics/{id}", response_model=StandardResponse[Dict[str, str]])
async def delete_rubric(
    id: str,
    user: AuthUser = Depends(require_role(["faculty", "student"])),
):
    """
    Deletes a rubric.
    """
    success = Repository.delete_rubric(id)
    return StandardResponse[Dict[str, str]](
        success=True,
        data={"deletedId": id},
        message=f"Rubric {id} successfully deleted.",
    )
