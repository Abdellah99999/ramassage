from datetime import date as date_type, time as time_type
from typing import Optional
from sqlalchemy import String, ForeignKey, Integer, Date, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class Pickup(Base, TimestampMixin):
    __tablename__ = "pickups"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    pickup_slip_id: Mapped[int] = mapped_column(ForeignKey("pickup_slips.id", ondelete="CASCADE"), index=True, nullable=False)
    numero_declaration: Mapped[str] = mapped_column(String(100), index=True, nullable=True)
    client_nom: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    client_telephone: Mapped[str] = mapped_column(String(50), nullable=True)
    adresse: Mapped[str] = mapped_column(String(255), nullable=False)
    ville: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    nombre_colis: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    date: Mapped[date_type] = mapped_column(Date, index=True, nullable=False)
    heure: Mapped[time_type] = mapped_column(Time, nullable=False)
    observations: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    pickup_slip: Mapped["PickupSlip"] = relationship(back_populates="pickups")
