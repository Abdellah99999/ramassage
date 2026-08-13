from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.core.exceptions import AuthenticationError
from app.core.security import verify_password
from app.core.security_jwt import (
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse
from app.schemas.user import UserRead
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentification"])

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authentifier un utilisateur",
    description="Vérifie l'adresse e-mail et le mot de passe, puis retourne un jeton d'accès (Access Token) et un jeton de rafraîchissement (Refresh Token)."
)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalars().first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise AuthenticationError("Identifiants de connexion invalides.")
        
    if not user.actif:
        raise AuthenticationError("Ce compte utilisateur est désactivé.")
        
    access_token = create_access_token(subject=user.email)
    refresh_token = create_refresh_token(subject=user.email)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Rafraîchir le jeton d'accès",
    description="Génère un nouveau jeton d'accès à partir d'un jeton de rafraîchissement valide."
)
async def refresh_token(
    refresh_data: RefreshRequest,
    db: AsyncSession = Depends(get_db)
):
    payload = decode_token(refresh_data.refresh_token)
    token_type = payload.get("type")
    
    if not payload or token_type != "refresh":
        raise AuthenticationError("Jeton de rafraîchissement invalide ou expiré.")
        
    email = payload.get("sub")
    if not email:
        raise AuthenticationError("Identifiant utilisateur manquant dans le jeton.")
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if not user:
        raise AuthenticationError("Utilisateur non trouvé.")
        
    if not user.actif:
        raise AuthenticationError("Ce compte utilisateur est désactivé.")
        
    new_access_token = create_access_token(subject=user.email)
    
    return {
        "access_token": new_access_token,
        "refresh_token": refresh_data.refresh_token,
        "token_type": "bearer"
    }

@router.get(
    "/me",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
    summary="Obtenir le profil utilisateur actuel",
    description="Retourne les informations de l'utilisateur connecté à partir de son jeton d'accès."
)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
