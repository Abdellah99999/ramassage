from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.models.driver import Driver
from app.schemas.driver import DriverRead, DriverCreate, DriverUpdate
from app.api.deps import RoleChecker, get_user_agency_filter
from app.models.user import User

router = APIRouter(prefix="/drivers-crud", tags=["Chauffeurs CRUD"])

@router.get("", response_model=List[DriverRead])
async def list_drivers_crud(
    current_user: User = Depends(RoleChecker(["super_admin", "manager"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    query = select(Driver).options(selectinload(Driver.agency))
    if agence_id_filter is not None:
        query = query.where(Driver.agence_id == agence_id_filter)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=DriverRead, status_code=status.HTTP_201_CREATED)
async def create_driver(
    payload: DriverCreate,
    current_user: User = Depends(RoleChecker(["super_admin", "manager"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    if agence_id_filter is not None and payload.agence_id != agence_id_filter:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez créer des chauffeurs que pour votre propre agence."
        )
        
    db_driver = Driver(
        nom=payload.nom,
        telephone=payload.telephone,
        agence_id=payload.agence_id,
        actif=payload.actif if payload.actif is not None else True
    )
    db.add(db_driver)
    await db.commit()
    await db.refresh(db_driver)
    
    # Reload with agency
    res = await db.execute(
        select(Driver).options(selectinload(Driver.agency)).where(Driver.id == db_driver.id)
    )
    return res.scalar_one()

@router.put("/{driver_id}", response_model=DriverRead)
async def update_driver(
    driver_id: int,
    payload: DriverUpdate,
    current_user: User = Depends(RoleChecker(["super_admin", "manager"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Driver).options(selectinload(Driver.agency)).where(Driver.id == driver_id)
    )
    db_driver = result.scalar_one_or_none()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Chauffeur non trouvé.")
        
    if agence_id_filter is not None:
        if db_driver.agence_id != agence_id_filter:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez modifier que les chauffeurs de votre agence."
            )
        if payload.agence_id and payload.agence_id != agence_id_filter:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez pas réassigner ce chauffeur à une autre agence."
            )
            
    if payload.nom is not None:
        db_driver.nom = payload.nom
    if payload.telephone is not None:
        db_driver.telephone = payload.telephone
    if payload.agence_id is not None:
        db_driver.agence_id = payload.agence_id
    if payload.actif is not None:
        db_driver.actif = payload.actif
        if not payload.actif:
            db_driver.date_desactivation = datetime.utcnow()
        else:
            db_driver.date_desactivation = None
            
    await db.commit()
    
    # Reload with agency to prevent lazy loading during serialization
    res = await db.execute(
        select(Driver).options(selectinload(Driver.agency)).where(Driver.id == db_driver.id)
    )
    return res.scalar_one()

@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_driver(
    driver_id: int,
    current_user: User = Depends(RoleChecker(["super_admin", "manager"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Driver).where(Driver.id == driver_id)
    )
    db_driver = result.scalar_one_or_none()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Chauffeur non trouvé.")
        
    if agence_id_filter is not None and db_driver.agence_id != agence_id_filter:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez supprimer que les chauffeurs de votre agence."
        )
        
    await db.delete(db_driver)
    await db.commit()
    return None
