from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserRead, UserCreate, UserUpdate
from app.core.security import get_password_hash
from app.api.deps import RoleChecker

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserRead])
async def list_users(
    current_user: User = Depends(RoleChecker(["super_admin", "manager"])),
    db: AsyncSession = Depends(get_db)
):
    query = select(User).options(selectinload(User.agency))
    
    if current_user.role == "manager":
        # Managers can only see users in their own agency
        query = query.where(User.agence_id == current_user.agence_id)
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    current_user: User = Depends(RoleChecker(["super_admin", "manager"])),
    db: AsyncSession = Depends(get_db)
):
    # Validate manager restrictions
    if current_user.role == "manager":
        if payload.role != "agent":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Les managers ne peuvent créer que des comptes agents."
            )
        if payload.agence_id != current_user.agence_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez créer des agents que pour votre propre agence."
            )
            
    # Check if email already exists
    email_check = await db.execute(select(User).where(User.email == payload.email))
    if email_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette adresse email est déjà enregistrée."
        )
        
    db_user = User(
        nom=payload.nom,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        agence_id=payload.agence_id,
        actif=payload.actif
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    # Reload with agency relationship
    res = await db.execute(select(User).options(selectinload(User.agency)).where(User.id == db_user.id))
    return res.scalar_one()

@router.get("/{user_id}", response_model=UserRead)
async def get_user_detail(
    user_id: int,
    current_user: User = Depends(RoleChecker(["super_admin", "manager"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).options(selectinload(User.agency)).where(User.id == user_id))
    db_user = result.scalar_one_or_none()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")
        
    if current_user.role == "manager" and db_user.agence_id != current_user.agence_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès aux utilisateurs d'une autre agence."
        )
        
    return db_user

@router.put("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    current_user: User = Depends(RoleChecker(["super_admin", "manager"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).options(selectinload(User.agency)).where(User.id == user_id))
    db_user = result.scalar_one_or_none()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")
        
    # Manager restrictions
    if current_user.role == "manager":
        if db_user.agence_id != current_user.agence_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez modifier que les utilisateurs de votre propre agence."
            )
        if payload.role and payload.role != "agent":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez pas modifier le rôle d'un utilisateur vers un autre que agent."
            )
        if payload.agence_id and payload.agence_id != current_user.agence_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez pas réassigner un agent à une autre agence."
            )

    # Email check if changing
    if payload.email and payload.email != db_user.email:
        email_check = await db.execute(select(User).where(User.email == payload.email))
        if email_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cette adresse email est déjà enregistrée."
            )
            
    # Update fields
    if payload.nom is not None:
        db_user.nom = payload.nom
    if payload.email is not None:
        db_user.email = payload.email
    if payload.role is not None:
        db_user.role = payload.role
    if payload.agence_id is not None:
        db_user.agence_id = payload.agence_id
    if payload.actif is not None:
        db_user.actif = payload.actif
    if payload.password is not None:
        db_user.hashed_password = get_password_hash(payload.password)
        
    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_user: User = Depends(RoleChecker(["super_admin", "manager"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    db_user = result.scalar_one_or_none()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")
        
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte.")
        
    if current_user.role == "manager":
        if db_user.agence_id != current_user.agence_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez supprimer que les utilisateurs de votre agence."
            )
        if db_user.role == "super_admin" or db_user.role == "manager":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Les managers ne peuvent supprimer que des agents."
            )
            
    await db.delete(db_user)
    await db.commit()
    return None
