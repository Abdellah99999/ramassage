from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nom: Mapped[str] = mapped_column(String(100), nullable=False)
    telephone: Mapped[str] = mapped_column(String(50), nullable=True)
    agence_id: Mapped[int] = mapped_column(ForeignKey("agencies.id"), nullable=False)
    actif: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    date_desactivation: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    agency: Mapped["Agency"] = relationship(back_populates="drivers")
    pickup_slips: Mapped[List["PickupSlip"]] = relationship(back_populates="driver")
