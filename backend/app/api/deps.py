from typing import Optional, List
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.core.security_jwt import decode_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    if not token:
        raise AuthenticationError("Jeton d'authentification manquant.")
    
    payload = decode_token(token)
    if not payload:
        # invalid or expired token
        pass
    token_type = payload.get("type")
    
    if not payload or token_type != "access":
        raise AuthenticationError("Jeton d'authentification invalide ou expiré.")
        
    email: Optional[str] = payload.get("sub")
    if not email:
        raise AuthenticationError("Identifiant utilisateur manquant dans le jeton.")
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if not user:
        raise AuthenticationError("Utilisateur non trouvé.")
        
    if not user.actif:
        raise AuthenticationError("Ce compte utilisateur est désactivé.")
        
    return user

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise PermissionDeniedError("Vous n'avez pas les permissions nécessaires pour effectuer cette action.")
        return current_user

def get_user_agency_filter(current_user: User = Depends(get_current_user)) -> Optional[int]:
    """
    Retourne l'agence_id si l'utilisateur est un manager ou un agent.
    Retourne None si l'utilisateur est un super_admin (pas de filtrage).
    """
    if current_user.role == "super_admin":
        return None
    return current_user.agence_id
