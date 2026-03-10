from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.barber import Barber
from app.models.schedule import Schedule, BlockedDay
from app.models.booking import Booking
from app.utils.availability import get_slots_for_day

router = APIRouter(prefix="/availability", tags=["availability"])


@router.get("")
async def get_availability(
    barber_id: str = Query(...),
    date: date = Query(...),
    db: AsyncSession = Depends(get_db),
):
    # Verify barber exists
    result = await db.execute(select(Barber).where(Barber.id == barber_id, Barber.active == True))
    barber = result.scalar_one_or_none()
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")

    weekday = date.weekday()

    # Get schedule for this weekday
    sched_result = await db.execute(
        select(Schedule).where(Schedule.barber_id == barber_id, Schedule.weekday == weekday)
    )
    schedule = sched_result.scalar_one_or_none()

    # Get blocked days
    bd_result = await db.execute(
        select(BlockedDay).where(BlockedDay.barber_id == barber_id, BlockedDay.date == date)
    )
    blocked = bd_result.scalars().all()

    # Get bookings for that day
    b_result = await db.execute(
        select(Booking).where(Booking.barber_id == barber_id, Booking.date == date)
    )
    bookings = b_result.scalars().all()

    slots = get_slots_for_day(date, schedule, list(blocked), list(bookings))

    return {"date": date.isoformat(), "barber_id": barber_id, "slots": slots}
