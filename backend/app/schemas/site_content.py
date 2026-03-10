from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SiteContentOut(BaseModel):
    id: str
    hero_title: str
    hero_text: str
    about_text: str
    logo_url: Optional[str]
    contact_phone: str
    contact_email: str
    address: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class SiteContentUpdate(BaseModel):
    hero_title: Optional[str] = None
    hero_text: Optional[str] = None
    about_text: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
