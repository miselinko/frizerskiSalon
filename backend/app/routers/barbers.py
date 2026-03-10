import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import aiofiles

from app.database import get_db
from app.models.barber import Barber
from app.core.deps import get_current_admin
from app.core.config import settings
from app.schemas.barber import BarberCreate, BarberUpdate, BarberOut

router = APIRouter(prefix="/barbers", tags=["barbers"])


@router.get("", response_model=list[BarberOut])
async def list_barbers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Barber).where(Barber.active == True).order_by(Barber.created_at))
    return result.scalars().all()


@router.get("/all", response_model=list[BarberOut])
async def list_all_barbers(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(Barber).order_by(Barber.created_at))
    return result.scalars().all()


@router.post("", response_model=BarberOut)
async def create_barber(
    data: BarberCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    barber = Barber(**data.model_dump())
    db.add(barber)
    await db.flush()
    await db.refresh(barber)
    return barber


@router.patch("/{barber_id}", response_model=BarberOut)
async def update_barber(
    barber_id: str,
    data: BarberUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(Barber).where(Barber.id == barber_id))
    barber = result.scalar_one_or_none()
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(barber, k, v)
    await db.flush()
    await db.refresh(barber)
    return barber


@router.post("/{barber_id}/photo", response_model=BarberOut)
async def upload_photo(
    barber_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(Barber).where(Barber.id == barber_id))
    barber = result.scalar_one_or_none()
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    filename = f"{uuid.uuid4()}{ext}"
    path = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    async with aiofiles.open(path, "wb") as f:
        content = await file.read()
        await f.write(content)

    barber.photo_url = f"/uploads/{filename}"
    await db.flush()
    await db.refresh(barber)
    return barber


@router.delete("/{barber_id}", status_code=204)
async def delete_barber(
    barber_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(Barber).where(Barber.id == barber_id))
    barber = result.scalar_one_or_none()
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")
    await db.delete(barber)
