import uuid
from datetime import datetime, timezone, date, time
from sqlalchemy import String, DateTime, Date, Time, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    AUTO_APPROVED = "auto_approved"
    CANCELLED = "cancelled"


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    barber_id: Mapped[str] = mapped_column(String, ForeignKey("barbers.id", ondelete="CASCADE"))
    service_id: Mapped[str] = mapped_column(String, ForeignKey("services.id", ondelete="SET NULL"), nullable=True)
    client_name: Mapped[str] = mapped_column(String(100))
    client_email: Mapped[str] = mapped_column(String(255))
    client_phone: Mapped[str] = mapped_column(String(30))
    note: Mapped[str] = mapped_column(Text, default="")
    date: Mapped[date] = mapped_column(Date)
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    status: Mapped[BookingStatus] = mapped_column(
        SAEnum(BookingStatus), default=BookingStatus.PENDING
    )
    admin_note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    barber: Mapped["Barber"] = relationship("Barber", back_populates="bookings")
    service: Mapped["Service | None"] = relationship("Service")
