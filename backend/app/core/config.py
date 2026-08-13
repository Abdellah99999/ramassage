import json
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore"
    )

    PORT: int = 8000
    HOST: str = "0.0.0.0"
    DEBUG: bool = True

    # Security
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Database
    DATABASE_URL: str

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
                v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = []
    BACKEND_CORS_ORIGINS: Union[str, List[str]] = []

    @field_validator("BACKEND_CORS_ORIGINS", "CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            try:
                if isinstance(v, str):
                    return json.loads(v)
                return v
            except Exception:
                return []
        return v

    def get_cors_origins(self) -> List[str]:
        origins = []
        if isinstance(self.CORS_ORIGINS, list):
            origins.extend(self.CORS_ORIGINS)
        elif isinstance(self.CORS_ORIGINS, str) and self.CORS_ORIGINS:
            origins.append(self.CORS_ORIGINS)
            
        if isinstance(self.BACKEND_CORS_ORIGINS, list):
            origins.extend(self.BACKEND_CORS_ORIGINS)
        elif isinstance(self.BACKEND_CORS_ORIGINS, str) and self.BACKEND_CORS_ORIGINS:
            origins.append(self.BACKEND_CORS_ORIGINS)
            
        # Return unique list
        return list(set(origins))

settings = Settings()
