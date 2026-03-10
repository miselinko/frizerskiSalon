from pydantic import BaseModel
from typing import Optional
from datetime import time, date


class ScheduleBase(BaseModel):
    weekday: int  # 0=Monday, 6=Sunday
    is_working: bool = True
    start_time: time = time(9, 0)
    end_time: time = time(18, 0)
    slot_duration_minutes: int = 15
    break_start: Optional[time] = None
    break_end: Optional[time] = None


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    is_working: Optional[bool] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    slot_duration_minutes: Optional[int] = None
    break_start: Optional[time] = None
    break_end: Optional[time] = None


class ScheduleOut(ScheduleBase):
    id: str
    barber_id: str

    model_config = {"from_attributes": True}


class BlockedDayCreate(BaseModel):
    date: date
    reason: str = ""


class BlockedDayOut(BaseModel):
    id: str
    barber_id: str
    date: date
    reason: str

    model_config = {"from_attributes": True}
