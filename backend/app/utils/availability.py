from datetime import date, time, datetime, timedelta
from typing import Literal
from app.models.schedule import Schedule, BlockedDay
from app.models.booking import Booking, BookingStatus


SlotStatus = Literal["free", "booked", "unavailable"]


def time_to_minutes(t: time) -> int:
    return t.hour * 60 + t.minute


def minutes_to_time(m: int) -> time:
    return time(m // 60, m % 60)


def get_slots_for_day(
    target_date: date,
    schedule: Schedule | None,
    blocked_days: list[BlockedDay],
    bookings: list[Booking],
) -> list[dict]:
    """
    Returns a list of time slots for the given date.
    Each slot: {"time": "09:00", "status": "free"|"booked"|"unavailable"}
    """
    # Check if day is blocked
    for bd in blocked_days:
        if bd.date == target_date:
            return []

    if not schedule or not schedule.is_working:
        return []

    weekday = target_date.weekday()
    if schedule.weekday != weekday:
        # Mismatch — shouldn't happen if caller filters correctly
        return []

    slot_dur = schedule.slot_duration_minutes
    start_m = time_to_minutes(schedule.start_time)
    end_m = time_to_minutes(schedule.end_time)
    break_start_m = time_to_minutes(schedule.break_start) if schedule.break_start else None
    break_end_m = time_to_minutes(schedule.break_end) if schedule.break_end else None

    # Build set of booked minute ranges from active bookings
    booked_ranges: list[tuple[int, int]] = []
    active_statuses = {BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.AUTO_APPROVED}
    for b in bookings:
        if b.date == target_date and b.status in active_statuses:
            booked_ranges.append((
                time_to_minutes(b.start_time),
                time_to_minutes(b.end_time),
            ))

    now = datetime.now()
    is_today = target_date == now.date()
    current_minutes = now.hour * 60 + now.minute if is_today else -1

    slots = []
    cursor = start_m
    while cursor + slot_dur <= end_m:
        slot_time = minutes_to_time(cursor)
        slot_end = cursor + slot_dur

        status: SlotStatus = "free"

        # Past slots
        if is_today and cursor <= current_minutes:
            status = "unavailable"
        # Break time
        elif break_start_m is not None and break_end_m is not None:
            if cursor < break_end_m and slot_end > break_start_m:
                status = "unavailable"

        # Booked overlap check
        if status == "free":
            for bstart, bend in booked_ranges:
                if cursor < bend and slot_end > bstart:
                    status = "booked"
                    break

        slots.append({
            "time": slot_time.strftime("%H:%M"),
            "status": status,
        })
        cursor += slot_dur

    return slots


def check_slot_available(
    target_date: date,
    start: time,
    duration_minutes: int,
    schedule: Schedule | None,
    blocked_days: list[BlockedDay],
    bookings: list[Booking],
) -> bool:
    """Returns True if the given start time + duration fits in the schedule without conflicts."""
    for bd in blocked_days:
        if bd.date == target_date:
            return False

    if not schedule or not schedule.is_working:
        return False

    start_m = time_to_minutes(start)
    end_m = start_m + duration_minutes
    sched_start = time_to_minutes(schedule.start_time)
    sched_end = time_to_minutes(schedule.end_time)

    if start_m < sched_start or end_m > sched_end:
        return False

    if schedule.break_start and schedule.break_end:
        brk_start = time_to_minutes(schedule.break_start)
        brk_end = time_to_minutes(schedule.break_end)
        if start_m < brk_end and end_m > brk_start:
            return False

    active_statuses = {BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.AUTO_APPROVED}
    for b in bookings:
        if b.date == target_date and b.status in active_statuses:
            b_start = time_to_minutes(b.start_time)
            b_end = time_to_minutes(b.end_time)
            if start_m < b_end and end_m > b_start:
                return False

    return True
