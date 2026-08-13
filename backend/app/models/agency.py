from typing import List
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Agency(Base):
    __tablename__ = "agencies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nom: Mapped[str] = mapped_column(String(100), nullable=False)
    adresse: Mapped[str] = mapped_column(String(255), nullable=True)
    telephone: Mapped[str] = mapped_column(String(50), nullable=True)
    responsable: Mapped[str] = mapped_column(String(100), nullable=True)
    ville: Mapped[str] = mapped_column(String(100), nullable=True)
    actif: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    # Relationships
    users: Mapped[List["User"]] = relationship(back_populates="agency")
    drivers: Mapped[List["Driver"]] = relationship(back_populates="agency")
    pickup_slips: Mapped[List["PickupSlip"]] = relationship(back_populates="agency")
