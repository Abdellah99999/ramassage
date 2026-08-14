from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.db.session import get_db
from app.models.agency import Agency
from app.schemas.agency import AgencyRead, AgencyCreate, AgencyUpdate
from app.api.deps import RoleChecker
from app.models.user import User

router = APIRouter(prefix="/agences-crud", tags=["Agences CRUD"])

@router.get("", response_model=List[AgencyRead])
async def list_agencies_crud(
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    db: AsyncSession = Depends(get_db)
):
    query = select(Agency)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=AgencyRead, status_code=status.HTTP_201_CREATED)
async def create_agency(
    payload: AgencyCreate,
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    db: AsyncSession = Depends(get_db)
):
    db_agency = Agency(
        nom=payload.nom,
        adresse=payload.adresse,
        telephone=payload.telephone,
        responsable=payload.responsable,
        actif=payload.actif if payload.actif is not None else True
    )
    db.add(db_agency)
    await db.commit()
    await db.refresh(db_agency)
    return db_agency

@router.put("/{agency_id}", response_model=AgencyRead)
async def update_agency(
    agency_id: int,
    payload: AgencyUpdate,
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Agency).where(Agency.id == agency_id))
    db_agency = result.scalar_one_or_none()
    if not db_agency:
        raise HTTPException(status_code=404, detail="Agence non trouvée.")
        
    if payload.nom is not None:
        db_agency.nom = payload.nom
    if payload.adresse is not None:
        db_agency.adresse = payload.adresse
    if payload.telephone is not None:
        db_agency.telephone = payload.telephone
    if payload.responsable is not None:
        db_agency.responsable = payload.responsable
    if payload.actif is not None:
        db_agency.actif = payload.actif
        
    await db.commit()
    await db.refresh(db_agency)
    return db_agency

@router.delete("/{agency_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agency(
    agency_id: int,
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Agency).where(Agency.id == agency_id))
    db_agency = result.scalar_one_or_none()
    if not db_agency:
        raise HTTPException(status_code=404, detail="Agence non trouvée.")
        
    await db.delete(db_agency)
    await db.commit()
    return None
