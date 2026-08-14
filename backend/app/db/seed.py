import asyncio
from datetime import datetime, date, time, timedelta
import random
from sqlalchemy import delete
from app.db.session import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.agency import Agency
from app.models.user import User
from app.models.driver import Driver
from app.models.pickup_slip import PickupSlip
from app.models.pickup import Pickup

async def seed_data():
    print("Début de la création des données de démonstration complètes (Agences, Utilisateurs, Chauffeurs, Bordereaux, Colis)...")
    async with SessionLocal() as session:
        async with session.begin():
            # 1. Nettoyer les anciennes données
            await session.execute(delete(Pickup))
            await session.execute(delete(PickupSlip))
            await session.execute(delete(Driver))
            await session.execute(delete(User))
            await session.execute(delete(Agency))
            
            print("Anciennes données nettoyées.")

            # 2. Créer des Agences de base
            agencies_data = [
                {"nom": "Agence H.E.S. Casablanca", "adresse": "120 Boulevard d'Anfa, Casablanca", "telephone": "+212 522 123 456", "responsable": "Hamza Al-Amri"},
                {"nom": "Agence H.E.S. Marrakech", "adresse": "Zone Industrielle Sidi Ghanem, Marrakech", "telephone": "+212 524 654 321", "responsable": "Yassine Trabelsi"},
                {"nom": "Agence H.E.S. Rabat", "adresse": "Avenue Mohamed V, Agdal, Rabat", "telephone": "+212 537 778 899", "responsable": "Sarra Benali"},
                {"nom": "Agence H.E.S. Tanger", "adresse": "Zone Franche Tanger Med, Tanger", "telephone": "+212 539 334 455", "responsable": "Omar Kabbaj"},
                {"nom": "Agence H.E.S. Agadir", "adresse": "Boulevard Hassan II, Agadir", "telephone": "+212 528 889 900", "responsable": "Karim El Idrissi"},
            ]
            
            created_agencies = []
            for a in agencies_data:
                agency = Agency(nom=a["nom"], adresse=a["adresse"], telephone=a["telephone"], responsable=a["responsable"], actif=True)
                session.add(agency)
                created_agencies.append(agency)
            await session.flush()
            
            casa_agency = created_agencies[0]
            kech_agency = created_agencies[1]
            rabat_agency = created_agencies[2]
            tanger_agency = created_agencies[3]
            agadir_agency = created_agencies[4]

            # 3. Créer des Utilisateurs de test
            password_hash = get_password_hash("admin123")

            users_data = [
                User(nom="Super Admin", email="admin@hes.com", hashed_password=password_hash, role="super_admin", agence_id=None, actif=True),
                User(nom="Hamza Manager (Casa)", email="manager.casa@hes.com", hashed_password=password_hash, role="manager", agence_id=casa_agency.id, actif=True),
                User(nom="Yassine Manager (Kech)", email="manager.kech@hes.com", hashed_password=password_hash, role="manager", agence_id=kech_agency.id, actif=True),
                User(nom="Agent Casablanca", email="agent.casa@hes.com", hashed_password=password_hash, role="agent", agence_id=casa_agency.id, actif=True),
                User(nom="Agent Marrakech", email="agent.kech@hes.com", hashed_password=password_hash, role="agent", agence_id=kech_agency.id, actif=True),
            ]
            session.add_all(users_data)
            await session.flush()

            # 4. Créer des Chauffeurs de base
            drivers_list = [
                ("Kamel Mansour", agadir_agency.id),
                ("Med Ait Bouchgour", kech_agency.id),
                ("Fares Ben Salah", casa_agency.id),
                ("Youssef Naciri", kech_agency.id),
                ("Rachid Alaoui", rabat_agency.id),
                ("Tariq Zaidi", tanger_agency.id),
                ("Amine Chraibi", agadir_agency.id),
            ]
            created_drivers = []
            for i, (nom, ag_id) in enumerate(drivers_list, 1):
                d = Driver(nom=nom, telephone=f"+212 661 {i:02d}0 {i:02d}9", agence_id=ag_id, actif=True)
                session.add(d)
                created_drivers.append(d)
            await session.flush()

            # 5. Créer des Bordereaux et Colis fictifs
            clients_sample = [
                ("Maroc Telecom", "Avenue Annakhil, Rabat", "Rabat"),
                ("Electroplanet Anfa", "Bd d'Anfa, Casablanca", "Casablanca"),
                ("Marjane Menara", "Avenue Guemassa, Marrakech", "Marrakech"),
                ("Kitea City Tanger", "Route de Tétouan, Tanger", "Tanger"),
                ("BIM Stores Agadir", "Zone Industrielle Tassila, Agadir", "Agadir"),
                ("LabelVie Express", "Route d'El Jadida, Casablanca", "Casablanca"),
                ("Sothema Pharma", "Bouskoura Industrial Zone, Casablanca", "Casablanca"),
                ("Decathlon Gueliz", "Avenue Abdelkrim El Khattabi, Marrakech", "Marrakech"),
            ]

            today = date.today()
            slip_count = 1
            bl_counter = 1001

            for day_offset in range(10, -1, -1):
                tour_date = today - timedelta(days=day_offset)
                
                # Pick 2-3 drivers for this tour date
                active_drivers_for_day = random.sample(created_drivers, k=random.randint(2, 4))
                
                for driver in active_drivers_for_day:
                    num_slip = f"BS-{tour_date.strftime('%Y%m%d')}-{slip_count:03d}"
                    slip_count += 1
                    
                    is_closed = (day_offset > 1) # Close older slips
                    status_str = "clôturé" if is_closed else "en_cours"
                    start_t = time(hour=random.randint(7, 9), minute=random.choice([0, 15, 30, 45]))
                    end_t = time(hour=random.randint(16, 18), minute=random.choice([0, 15, 30])) if is_closed else None
                    
                    slip = PickupSlip(
                        numero_bordereau=num_slip,
                        driver_id=driver.id,
                        agency_id=driver.agence_id,
                        date_tournee=tour_date,
                        heure_debut=start_t,
                        heure_fin=end_t,
                        statut=status_str,
                        created_by=users_data[0].id
                    )
                    session.add(slip)
                    await session.flush()

                    # Add 2 to 5 pickups for each slip
                    num_pickups = random.randint(2, 5)
                    for _ in range(num_pickups):
                        client_nom, adresse, ville = random.choice(clients_sample)
                        pickup = Pickup(
                            pickup_slip_id=slip.id,
                            numero_declaration=str(bl_counter),
                            client_nom=client_nom,
                            client_telephone=f"+212 6{random.randint(10000000, 99999999)}",
                            adresse=adresse,
                            ville=ville,
                            nombre_colis=random.randint(1, 8),
                            date=tour_date,
                            heure=time(hour=random.randint(9, 16), minute=random.choice([0, 15, 30, 45])),
                            observations=random.choice(["Colis prioritaires", "Fragile - Manipuler avec soin", "Livraison express", None, None])
                        )
                        bl_counter += 1
                        session.add(pickup)

            print("Données de test complètes (Agences, Utilisateurs, Chauffeurs, Bordereaux, Colis) générées avec succès !")

    print("Initialisation des données de test terminée avec succès !")

async def main():
    try:
        await seed_data()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
