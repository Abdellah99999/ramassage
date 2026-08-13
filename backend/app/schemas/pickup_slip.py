from datetime import date, time, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.agency import AgencyRead

class PickupSlipBase(BaseModel):
    driver_id: int
    agency_id: int
    date_tournee: date
    heure_debut: time
    heure_fin: Optional[time] = None
    statut: Optional[str] = "ouvert"

class PickupNestedCreate(BaseModel):
    numero_declaration: Optional[str] = None
    client_nom: str = "Client"
    client_telephone: Optional[str] = None
    adresse: Optional[str] = "N/A"
    ville: Optional[str] = ""
    nombre_colis: int = 1
    date: date
    heure: Optional[time] = None
    observations: Optional[str] = None

class PickupSlipCreate(BaseModel):
    driver_id: int
    agency_id: int
    date_tournee: date
    heure_debut: time
    pickups: Optional[List[PickupNestedCreate]] = None

class PickupSlipUpdate(BaseModel):
    driver_id: Optional[int] = None
    agency_id: Optional[int] = None
    date_tournee: Optional[date] = None
    heure_debut: Optional[time] = None
    heure_fin: Optional[time] = None
    statut: Optional[str] = None

class PickupSlipRead(PickupSlipBase):
    id: int
    numero_bordereau: str
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    # We can lazily import/bind relationships to avoid circular dependency
    # or just declare simple IDs
    model_config = ConfigDict(from_attributes=True)
