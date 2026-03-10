from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BarberBase(BaseModel):
    full_name: str
    description: str = ""
    active: bool = True
    auto_accept: bool = False


class BarberCreate(BarberBase):
    pass


class BarberUpdate(BaseModel):
    full_name: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None
    auto_accept: Optional[bool] = None


class BarberOut(BarberBase):
    id: str
    photo_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
