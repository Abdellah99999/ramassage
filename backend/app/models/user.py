from typing import List, Optional
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nom: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)  # super_admin, manager, agent
    agence_id: Mapped[Optional[int]] = mapped_column(ForeignKey("agencies.id"), nullable=True)
    actif: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    # Relationships
    agency: Mapped[Optional["Agency"]] = relationship(back_populates="users")
    created_pickup_slips: Mapped[List["PickupSlip"]] = relationship(back_populates="creator")
