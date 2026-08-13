from typing import List
from pydantic import BaseModel

class DriverColis(BaseModel):
    driver_name: str
    colis: int
    ramassages: int

class AgencyColis(BaseModel):
    agency_name: str
    colis: int

class DashboardStats(BaseModel):
    colis_par_chauffeur: List[DriverColis]
    colis_par_agence: List[AgencyColis]
    ramassages_jour: int
    ramassages_mois: int
    top_chauffeurs: List[DriverColis]
