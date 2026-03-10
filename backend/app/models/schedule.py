import uuid
from datetime import time, date
from sqlalchemy import String, Boolean, Time, Integer, ForeignKey, Date, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Schedule(Base):
    """Weekly schedule for a barber (one row per weekday)."""
    __tablename__ = "schedules"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    barber_id: Mapped[str] = mapped_column(String, ForeignKey("barbers.id", ondelete="CASCADE"))
    weekday: Mapped[int] = mapped_column(Integer)  # 0=Monday, 6=Sunday
    is_working: Mapped[bool] = mapped_column(Boolean, default=True)
    start_time: Mapped[time] = mapped_column(Time, default=time(9, 0))
    end_time: Mapped[time] = mapped_column(Time, default=time(18, 0))
    slot_duration_minutes: Mapped[int] = mapped_column(Integer, default=15)
    break_start: Mapped[time | None] = mapped_column(Time, nullable=True)
    break_end: Mapped[time | None] = mapped_column(Time, nullable=True)

    barber: Mapped["Barber"] = relationship("Barber", back_populates="schedules")


class BlockedDay(Base):
    """Specific dates when a barber is unavailable (vacation, holiday, etc.)."""
    __tablename__ = "blocked_days"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    barber_id: Mapped[str] = mapped_column(String, ForeignKey("barbers.id", ondelete="CASCADE"))
    date: Mapped[date] = mapped_column(Date)
    reason: Mapped[str] = mapped_column(Text, default="")

    barber: Mapped["Barber"] = relationship("Barber", back_populates="blocked_days")
