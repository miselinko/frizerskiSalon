from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date, time
from app.models.booking import BookingStatus


class BookingCreate(BaseModel):
    barber_id: str
    service_id: str
    client_name: str
    client_email: EmailStr
    client_phone: str
    note: str = ""
    date: date
    start_time: time


class BookingOut(BaseModel):
    id: str
    barber_id: str
    service_id: Optional[str]
    client_name: str
    client_email: str
    client_phone: str
    note: str
    date: date
    start_time: time
    end_time: time
    status: BookingStatus
    admin_note: str
    created_at: datetime

    model_config = {"from_attributes": True}


class BookingUpdateStatus(BaseModel):
    status: BookingStatus
    admin_note: Optional[str] = None
