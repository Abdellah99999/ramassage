from datetime import date, time
from typing import List, Optional
from sqlalchemy import String, ForeignKey, Date, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class PickupSlip(Base, TimestampMixin):
    __tablename__ = "pickup_slips"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    numero_bordereau: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), index=True, nullable=False)
    agency_id: Mapped[int] = mapped_column(ForeignKey("agencies.id"), index=True, nullable=False)
    date_tournee: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    heure_debut: Mapped[time] = mapped_column(Time, nullable=False)
    heure_fin: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    statut: Mapped[str] = mapped_column(String(20), default="ouvert", server_default="ouvert", index=True)  # ouvert, cloture
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Relationships
    driver: Mapped["Driver"] = relationship(back_populates="pickup_slips")
    agency: Mapped["Agency"] = relationship(back_populates="pickup_slips")
    creator: Mapped["User"] = relationship(back_populates="created_pickup_slips")
    pickups: Mapped[List["Pickup"]] = relationship(back_populates="pickup_slip", cascade="all, delete-orphan")
