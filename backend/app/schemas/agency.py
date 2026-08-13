from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class AgencyBase(BaseModel):
    nom: str = Field(..., max_length=100)
    adresse: Optional[str] = Field(None, max_length=255)
    telephone: Optional[str] = Field(None, max_length=50)
    responsable: Optional[str] = Field(None, max_length=100)
    ville: Optional[str] = Field(None, max_length=100)
    actif: Optional[bool] = True

class AgencyCreate(AgencyBase):
    pass

class AgencyUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    adresse: Optional[str] = Field(None, max_length=255)
    telephone: Optional[str] = Field(None, max_length=50)
    responsable: Optional[str] = Field(None, max_length=100)
    ville: Optional[str] = Field(None, max_length=100)
    actif: Optional[bool] = None

class AgencyRead(AgencyBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
