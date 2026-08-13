from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.agency import AgencyRead

class DriverBase(BaseModel):
    nom: str = Field(..., max_length=100)
    telephone: Optional[str] = Field(None, max_length=50)
    agence_id: int
    actif: Optional[bool] = True

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    telephone: Optional[str] = Field(None, max_length=50)
    agence_id: Optional[int] = None
    actif: Optional[bool] = None
    date_desactivation: Optional[datetime] = None

class DriverRead(DriverBase):
    id: int
    date_desactivation: Optional[datetime] = None
    agency: Optional[AgencyRead] = None

    model_config = ConfigDict(from_attributes=True)
