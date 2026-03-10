import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import aiofiles

from app.database import get_db
from app.models.site_content import SiteContent
from app.core.deps import get_current_admin
from app.core.config import settings
from app.schemas.site_content import SiteContentOut, SiteContentUpdate

router = APIRouter(prefix="/site-content", tags=["site-content"])


async def _get_or_create(db: AsyncSession) -> SiteContent:
    result = await db.execute(select(SiteContent))
    content = result.scalar_one_or_none()
    if not content:
        content = SiteContent()
        db.add(content)
        await db.flush()
        await db.refresh(content)
    return content


@router.get("", response_model=SiteContentOut)
async def get_site_content(db: AsyncSession = Depends(get_db)):
    return await _get_or_create(db)


@router.patch("", response_model=SiteContentOut)
async def update_site_content(
    data: SiteContentUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    content = await _get_or_create(db)
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(content, k, v)
    await db.flush()
    await db.refresh(content)
    return content


@router.post("/logo", response_model=SiteContentOut)
async def upload_logo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    from fastapi import HTTPException
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".svg"}:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    filename = f"logo_{uuid.uuid4()}{ext}"
    path = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    async with aiofiles.open(path, "wb") as f:
        content_bytes = await file.read()
        await f.write(content_bytes)

    content = await _get_or_create(db)
    content.logo_url = f"/uploads/{filename}"
    await db.flush()
    await db.refresh(content)
    return content
