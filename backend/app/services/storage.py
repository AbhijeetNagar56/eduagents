import io
import os
from typing import Optional, Tuple
from fastapi import UploadFile
import pypdf

from app.core.config import settings
from app.core.errors import APIException
from app.core.logging import logger
from app.services.supabase_client import get_supabase_client
from app.services.repository import db


class StorageService:
    @staticmethod
    def format_file_size(size_bytes: int) -> str:
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{(size_bytes / 1024):.1f} KB"
        else:
            return f"{(size_bytes / (1024 * 1024)):.1f} MB"

    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            text_parts = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                text_parts.append(f"--- Page {i+1} ---\n{page_text}")
            return "\n\n".join(text_parts).strip()
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            return ""

    @staticmethod
    async def process_and_store_file(
        submission_id: str,
        file: Optional[UploadFile] = None,
        text_content: Optional[str] = None,
    ) -> Tuple[str, str, str, str, str]:
        """
        Processes upload file or raw text.
        Returns: (fileName, fileSize, fileType, fileUrl, rawContent)
        """
        if file is not None:
            filename = file.filename or f"{submission_id}.pdf"
            ext = os.path.splitext(filename)[1].lower()

            if ext not in settings.ALLOWED_EXTENSIONS:
                raise APIException(
                    status_code=400,
                    code="VALIDATION_ERROR",
                    message="Invalid file type. Only PDF and Markdown (.md, .txt) files are accepted.",
                    details={
                        "fileName": filename,
                        "allowedTypes": list(settings.ALLOWED_EXTENSIONS),
                    },
                )

            contents = await file.read()
            size_bytes = len(contents)

            if size_bytes > settings.MAX_FILE_SIZE_BYTES:
                raise APIException(
                    status_code=413,
                    code="PAYLOAD_TOO_LARGE",
                    message=f"File exceeds maximum size limit of {settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB.",
                )

            file_size_str = StorageService.format_file_size(size_bytes)
            file_type = "pdf" if ext == ".pdf" else "markdown"

            # Extract raw text
            if ext == ".pdf":
                raw_text = StorageService.extract_text_from_pdf(contents)
                if not raw_text:
                    raw_text = f"Document: {filename}\n[Binary PDF Content - {file_size_str}]"
            else:
                try:
                    raw_text = contents.decode("utf-8")
                except UnicodeDecodeError:
                    raw_text = contents.decode("latin-1", errors="ignore")

            # Store in memory storage
            storage_key = f"{submission_id}/{filename}"
            db.file_storage[storage_key] = contents

            # Upload to Supabase Storage if configured
            client = get_supabase_client()
            file_url = ""
            if client:
                try:
                    client.storage.from_(settings.STORAGE_BUCKET_NAME).upload(
                        path=storage_key,
                        file=contents,
                        file_options={"content-type": file.content_type or "application/octet-stream"}
                    )
                    signed = client.storage.from_(settings.STORAGE_BUCKET_NAME).create_signed_url(storage_key, 3600)
                    file_url = signed.get("signedURL") or signed.get("signedUrl") or ""
                except Exception as e:
                    logger.warning(f"Supabase storage upload failed: {e}")

            return filename, file_size_str, file_type, file_url, raw_text

        elif text_content is not None and text_content.strip():
            filename = f"{submission_id}_submission.md"
            encoded = text_content.encode("utf-8")
            size_bytes = len(encoded)
            file_size_str = StorageService.format_file_size(size_bytes)
            file_type = "markdown"

            storage_key = f"{submission_id}/{filename}"
            db.file_storage[storage_key] = encoded

            client = get_supabase_client()
            file_url = ""
            if client:
                try:
                    client.storage.from_(settings.STORAGE_BUCKET_NAME).upload(
                        path=storage_key,
                        file=encoded,
                        file_options={"content-type": "text/markdown"}
                    )
                    signed = client.storage.from_(settings.STORAGE_BUCKET_NAME).create_signed_url(storage_key, 3600)
                    file_url = signed.get("signedURL") or signed.get("signedUrl") or ""
                except Exception as e:
                    logger.warning(f"Supabase storage upload text failed: {e}")

            return filename, file_size_str, file_type, file_url, text_content

        else:
            raise APIException(
                status_code=400,
                code="VALIDATION_ERROR",
                message="Either file or text_content must be provided.",
            )

    @staticmethod
    def get_submission_text(submission_id: str, filename: str, preview: Optional[str] = None) -> str:
        storage_key = f"{submission_id}/{filename}"
        contents = db.file_storage.get(storage_key)
        if contents is None:
            client = get_supabase_client()
            if client:
                try:
                    contents = client.storage.from_(settings.STORAGE_BUCKET_NAME).download(storage_key)
                except Exception as e:
                    logger.warning(f"Supabase submission download failed: {e}")
        if contents is None:
            return preview or f"Student submission: {filename}"
        if filename.lower().endswith(".pdf"):
            return StorageService.extract_text_from_pdf(contents) or preview or f"Student submission: {filename}"
        return contents.decode("utf-8", errors="replace")
