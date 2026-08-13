from datetime import date, time, datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class PickupBase(BaseModel):
    pickup_slip_id: int
    numero_declaration: Optional[str] = Field(None, max_length=100)
    client_nom: str = Field(..., max_length=100)
    client_telephone: Optional[str] = Field(None, max_length=50)
    adresse: str = Field(..., max_length=255)
    ville: str = Field(..., max_length=100)
    nombre_colis: int = Field(0, ge=0)
    date: date
    heure: time
    observations: Optional[str] = Field(None, max_length=255)

class PickupCreate(PickupBase):
    pass

class PickupUpdate(BaseModel):
    pickup_slip_id: Optional[int] = None
    numero_declaration: Optional[str] = Field(None, max_length=100)
    client_nom: Optional[str] = Field(None, max_length=100)
    client_telephone: Optional[str] = Field(None, max_length=50)
    adresse: Optional[str] = Field(None, max_length=255)
    ville: Optional[str] = Field(None, max_length=100)
    nombre_colis: Optional[int] = Field(None, ge=0)
    date: Optional[date] = None
    heure: Optional[time] = None
    observations: Optional[str] = Field(None, max_length=255)

class PickupRead(PickupBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
