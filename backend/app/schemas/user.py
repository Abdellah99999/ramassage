from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.schemas.agency import AgencyRead

class UserBase(BaseModel):
    nom: str = Field(..., max_length=100)
    email: EmailStr = Field(..., max_length=100)
    role: str = Field("agent", description="super_admin, manager or agent")
    agence_id: Optional[int] = None
    actif: Optional[bool] = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)

class UserUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = Field(None, max_length=100)
    password: Optional[str] = Field(None, min_length=6, max_length=100)
    role: Optional[str] = None
    agence_id: Optional[int] = None
    actif: Optional[bool] = None

class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    agency: Optional[AgencyRead] = None

    model_config = ConfigDict(from_attributes=True)
