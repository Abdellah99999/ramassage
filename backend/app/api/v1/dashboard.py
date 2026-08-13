# Dashboard endpoints
from datetime import date, datetime
import calendar
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, desc
from app.db.session import get_db
from app.api.deps import get_current_user, get_user_agency_filter, RoleChecker
from app.models.user import User
from app.models.pickup import Pickup
from app.models.pickup_slip import PickupSlip
from app.models.driver import Driver
from app.models.agency import Agency
from app.schemas.stats import DashboardStats, DriverColis, AgencyColis

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get(
    "/stats",
    response_model=DashboardStats,
    status_code=status.HTTP_200_OK,
    summary="Statistiques du tableau de bord",
    description="Retourne les indicateurs clés et les graphiques du tableau de bord filtrés par agence si l'utilisateur n'est pas super_admin."
)
async def get_dashboard_stats(
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    start_of_month = date(today.year, today.month, 1)
    _, last_day = calendar.monthrange(today.year, today.month)
    end_of_month = date(today.year, today.month, last_day)

    # 1. Colis par chauffeur (Période courante = mois en cours)
    driver_query = (
        select(
            Driver.nom,
            func.coalesce(func.sum(Pickup.nombre_colis), 0).label("total_colis"),
            func.count(Pickup.id).label("total_ramassages")
        )
        .select_from(Driver)
        .outerjoin(PickupSlip, Driver.id == PickupSlip.driver_id)
        .outerjoin(
            Pickup, 
            (PickupSlip.id == Pickup.pickup_slip_id) & 
            (Pickup.date >= start_of_month) & 
            (Pickup.date <= end_of_month)
        )
    )
    if agence_id_filter is not None:
        driver_query = driver_query.where(Driver.agence_id == agence_id_filter)
    driver_query = driver_query.group_by(Driver.nom).order_by(desc("total_colis"))
    
    driver_result = await db.execute(driver_query)
    colis_par_chauffeur = [
        DriverColis(driver_name=row[0], colis=int(row[1]), ramassages=int(row[2]))
        for row in driver_result.all()
    ]

    # 2. Colis par agence (Période courante = mois en cours)
    agency_query = (
        select(Agency.nom, func.coalesce(func.sum(Pickup.nombre_colis), 0).label("total_colis"))
        .select_from(Agency)
        .outerjoin(PickupSlip, Agency.id == PickupSlip.agency_id)
        .outerjoin(
            Pickup,
            (PickupSlip.id == Pickup.pickup_slip_id) &
            (Pickup.date >= start_of_month) &
            (Pickup.date <= end_of_month)
        )
    )
    if agence_id_filter is not None:
        agency_query = agency_query.where(Agency.id == agence_id_filter)
    agency_query = agency_query.group_by(Agency.nom).order_by(desc("total_colis"))
    
    agency_result = await db.execute(agency_query)
    colis_par_agence = [
        AgencyColis(agency_name=row[0], colis=int(row[1]))
        for row in agency_result.all()
    ]

    # 3. Ramassages du jour (nombre de colis total aujourd'hui)
    day_query = select(func.coalesce(func.sum(Pickup.nombre_colis), 0))
    if agence_id_filter is not None:
        day_query = day_query.join(PickupSlip, Pickup.pickup_slip_id == PickupSlip.id).where(
            PickupSlip.agency_id == agence_id_filter
        )
    day_query = day_query.where(Pickup.date == today)
    
    day_result = await db.execute(day_query)
    ramassages_jour = int(day_result.scalar_one())

    # 4. Ramassages du mois (nombre de colis total ce mois)
    month_query = select(func.coalesce(func.sum(Pickup.nombre_colis), 0))
    if agence_id_filter is not None:
        month_query = month_query.join(PickupSlip, Pickup.pickup_slip_id == PickupSlip.id).where(
            PickupSlip.agency_id == agence_id_filter
        )
    month_query = month_query.where((Pickup.date >= start_of_month) & (Pickup.date <= end_of_month))
    
    month_result = await db.execute(month_query)
    ramassages_mois = int(month_result.scalar_one())

    # 5. Top 5 Chauffeurs (ceux qui ont ramassé le plus de colis ce mois)
    # Filtre les chauffeurs n'ayant aucun colis du classement si possible, ou prend les 5 premiers
    top_chauffeurs = colis_par_chauffeur[:5]

    return DashboardStats(
        colis_par_chauffeur=colis_par_chauffeur,
        colis_par_agence=colis_par_agence,
        ramassages_jour=ramassages_jour,
        ramassages_mois=ramassages_mois,
        top_chauffeurs=top_chauffeurs
    )
