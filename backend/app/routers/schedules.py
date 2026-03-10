from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.models.schedule import Schedule, BlockedDay
from app.core.deps import get_current_admin
from app.schemas.schedule import (
    ScheduleCreate, ScheduleUpdate, ScheduleOut,
    BlockedDayCreate, BlockedDayOut,
)

router = APIRouter(prefix="/schedules", tags=["schedules"])


@router.get("/{barber_id}", response_model=list[ScheduleOut])
async def get_schedule(
    barber_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Schedule).where(Schedule.barber_id == barber_id).order_by(Schedule.weekday)
    )
    return result.scalars().all()


@router.put("/{barber_id}/{weekday}", response_model=ScheduleOut)
async def upsert_schedule(
    barber_id: str,
    weekday: int,
    data: ScheduleCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    if weekday < 0 or weekday > 6:
        raise HTTPException(status_code=400, detail="Weekday must be 0-6")

    result = await db.execute(
        select(Schedule).where(Schedule.barber_id == barber_id, Schedule.weekday == weekday)
    )
    schedule = result.scalar_one_or_none()

    if schedule:
        for k, v in data.model_dump().items():
            setattr(schedule, k, v)
    else:
        schedule = Schedule(barber_id=barber_id, **data.model_dump())
        db.add(schedule)

    await db.flush()
    await db.refresh(schedule)
    return schedule


# Blocked days
@router.get("/{barber_id}/blocked", response_model=list[BlockedDayOut])
async def get_blocked_days(
    barber_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(
        select(BlockedDay).where(BlockedDay.barber_id == barber_id).order_by(BlockedDay.date)
    )
    return result.scalars().all()


@router.post("/{barber_id}/blocked", response_model=BlockedDayOut)
async def add_blocked_day(
    barber_id: str,
    data: BlockedDayCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    bd = BlockedDay(barber_id=barber_id, **data.model_dump())
    db.add(bd)
    await db.flush()
    await db.refresh(bd)
    return bd


@router.delete("/{barber_id}/blocked/{bd_id}", status_code=204)
async def delete_blocked_day(
    barber_id: str,
    bd_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(
        select(BlockedDay).where(BlockedDay.id == bd_id, BlockedDay.barber_id == barber_id)
    )
    bd = result.scalar_one_or_none()
    if not bd:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(bd)
