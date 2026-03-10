from datetime import datetime, timezone, date as date_type
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.database import get_db
from app.models.barber import Barber
from app.models.service import Service
from app.models.booking import Booking, BookingStatus
from app.models.schedule import Schedule, BlockedDay
from app.core.deps import get_current_admin
from app.schemas.booking import BookingCreate, BookingOut, BookingUpdateStatus
from app.utils.availability import check_slot_available, minutes_to_time, time_to_minutes
from app.utils.email import send_email, build_approved_email, build_rejected_email

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingOut)
async def create_booking(data: BookingCreate, db: AsyncSession = Depends(get_db)):
    # Verify barber
    barber_result = await db.execute(select(Barber).where(Barber.id == data.barber_id, Barber.active == True))
    barber = barber_result.scalar_one_or_none()
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")

    # Verify service
    svc_result = await db.execute(select(Service).where(Service.id == data.service_id, Service.active == True))
    service = svc_result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Get schedule
    weekday = data.date.weekday()
    sched_result = await db.execute(
        select(Schedule).where(Schedule.barber_id == data.barber_id, Schedule.weekday == weekday)
    )
    schedule = sched_result.scalar_one_or_none()

    # Get blocked days
    bd_result = await db.execute(
        select(BlockedDay).where(BlockedDay.barber_id == data.barber_id, BlockedDay.date == data.date)
    )
    blocked = bd_result.scalars().all()

    # Get existing bookings
    b_result = await db.execute(
        select(Booking).where(Booking.barber_id == data.barber_id, Booking.date == data.date)
    )
    existing_bookings = b_result.scalars().all()

    if not check_slot_available(
        data.date,
        data.start_time,
        service.duration_minutes,
        schedule,
        list(blocked),
        list(existing_bookings),
    ):
        raise HTTPException(status_code=409, detail="Slot not available")

    start_m = time_to_minutes(data.start_time)
    end_time = minutes_to_time(start_m + service.duration_minutes)

    status = BookingStatus.AUTO_APPROVED if barber.auto_accept else BookingStatus.PENDING

    booking = Booking(
        barber_id=data.barber_id,
        service_id=data.service_id,
        client_name=data.client_name,
        client_email=data.client_email,
        client_phone=data.client_phone,
        note=data.note,
        date=data.date,
        start_time=data.start_time,
        end_time=end_time,
        status=status,
    )
    db.add(booking)
    await db.flush()
    await db.refresh(booking)
    return booking


@router.get("/admin", response_model=list[BookingOut])
async def list_bookings(
    barber_id: Optional[str] = None,
    status: Optional[BookingStatus] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    q = select(Booking)
    if barber_id:
        q = q.where(Booking.barber_id == barber_id)
    if status:
        q = q.where(Booking.status == status)
    if date_from:
        try:
            q = q.where(Booking.date >= date_type.fromisoformat(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            q = q.where(Booking.date <= date_type.fromisoformat(date_to))
        except ValueError:
            pass
    q = q.order_by(Booking.date, Booking.start_time)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/admin/today", response_model=list[BookingOut])
async def today_bookings(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    today = datetime.now(timezone.utc).date()
    result = await db.execute(
        select(Booking).where(Booking.date == today).order_by(Booking.start_time)
    )
    return result.scalars().all()


@router.get("/admin/stats")
async def booking_stats(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    from sqlalchemy import func
    today = datetime.now(timezone.utc).date()

    result = await db.execute(select(Booking))
    all_bookings = result.scalars().all()

    today_count = sum(1 for b in all_bookings if b.date == today)
    pending_count = sum(1 for b in all_bookings if b.status == BookingStatus.PENDING)
    approved_count = sum(1 for b in all_bookings if b.status in (BookingStatus.APPROVED, BookingStatus.AUTO_APPROVED))
    rejected_count = sum(1 for b in all_bookings if b.status == BookingStatus.REJECTED)

    return {
        "today": today_count,
        "pending": pending_count,
        "approved": approved_count,
        "rejected": rejected_count,
        "total": len(all_bookings),
    }


@router.get("/admin/{booking_id}", response_model=BookingOut)
async def get_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.patch("/admin/{booking_id}", response_model=BookingOut)
async def update_booking_status(
    booking_id: str,
    data: BookingUpdateStatus,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    old_status = booking.status
    booking.status = data.status
    if data.admin_note is not None:
        booking.admin_note = data.admin_note
    await db.flush()
    await db.refresh(booking)

    # Load related barber and service for email
    barber_result = await db.execute(select(Barber).where(Barber.id == booking.barber_id))
    barber = barber_result.scalar_one_or_none()

    service_result = await db.execute(select(Service).where(Service.id == booking.service_id))
    service = service_result.scalar_one_or_none()

    barber_name = barber.full_name if barber else "Frizer"
    service_name = service.name if service else "Usluga"
    date_str = booking.date.strftime("%d.%m.%Y")
    time_str = booking.start_time.strftime("%H:%M")
    admin_note = booking.admin_note or ""

    # Send email only on status transitions to approved/rejected
    if data.status == BookingStatus.APPROVED and old_status != BookingStatus.APPROVED:
        html = build_approved_email(
            client_name=booking.client_name,
            barber_name=barber_name,
            service_name=service_name,
            date=date_str,
            start_time=time_str,
            admin_note=admin_note,
        )
        await send_email(
            to=booking.client_email,
            subject=f"✅ Termin potvrđen — {date_str} u {time_str}",
            html=html,
        )

    elif data.status == BookingStatus.REJECTED and old_status != BookingStatus.REJECTED:
        html = build_rejected_email(
            client_name=booking.client_name,
            barber_name=barber_name,
            service_name=service_name,
            date=date_str,
            start_time=time_str,
            admin_note=admin_note,
        )
        await send_email(
            to=booking.client_email,
            subject=f"❌ Termin odbijen — {date_str} u {time_str}",
            html=html,
        )

    return booking
