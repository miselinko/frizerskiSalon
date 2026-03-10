import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Barber(Base):
    __tablename__ = "barbers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(String(500), default="")
    photo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_accept: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    services: Mapped[list["Service"]] = relationship("Service", back_populates="barber", lazy="select")
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="barber", lazy="select")
    schedules: Mapped[list["Schedule"]] = relationship("Schedule", back_populates="barber", lazy="select")
    blocked_days: Mapped[list["BlockedDay"]] = relationship("BlockedDay", back_populates="barber", lazy="select")
