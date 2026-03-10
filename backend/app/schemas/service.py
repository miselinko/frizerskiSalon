from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime


class ServiceBase(BaseModel):
    name: str
    duration_minutes: int
    price: Optional[Decimal] = None
    description: str = ""
    active: bool = True
    barber_id: Optional[str] = None


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[Decimal] = None
    description: Optional[str] = None
    active: Optional[bool] = None
    barber_id: Optional[str] = None


class ServiceOut(ServiceBase):
    id: str
    created_at: datetime

    model_config = {"from_attributes": True}
