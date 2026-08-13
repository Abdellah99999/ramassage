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
    print("Début du seeding complet des bordereaux...")
    async with SessionLocal() as session:
        async with session.begin():
            # 1. Nettoyer les anciennes données
            await session.execute(delete(Pickup))
            await session.execute(delete(PickupSlip))
            await session.execute(delete(Driver))
            await session.execute(delete(User))
            await session.execute(delete(Agency))
            
            print("Anciennes données nettoyées.")

            # 2. Créer des Agences
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
            admin_user = users_data[0]

            # 4. Créer des Chauffeurs
            drivers_list = [
                ("Kamel Mansour", agadir_agency.id),
                ("Med Ait Bouchgour", kech_agency.id),
                ("Fares Ben Salah", casa_agency.id),
                ("Youssef Naciri", kech_agency.id),
                ("Rachid Alaoui", rabat_agency.id),
                ("Tariq Zaidi", created_agencies[3].id),
                ("Amine Chraibi", agadir_agency.id),
            ]
            created_drivers = []
            for i, (nom, ag_id) in enumerate(drivers_list, 1):
                d = Driver(nom=nom, telephone=f"+212 661 {i:02d}0 {i:02d}9", agence_id=ag_id, actif=True)
                session.add(d)
                created_drivers.append(d)
            await session.flush()

            # 5. Liste de clients et N° BL réalistes
            clients_pool = [
                ("Ahmed Jaremi", "Marrakech", "+212 661 663 322", "Quartier Gueliz, Rue de la Liberté"),
                ("Karim Alami", "Agadir", "+212 662 445 566", "Avenue Hassan II, Immeuble B"),
                ("Fatima Zahra Mansouri", "Casablanca", "+212 663 551 122", "15 Boulevard d'Anfa"),
                ("Société Maroc Distribution", "Rabat", "+212 664 778 899", "Avenue Agdal, Lot 4"),
                ("Boutique Oasis", "Marrakech", "+212 665 112 233", "Zone Industrielle Sidi Ghanem"),
                ("Atlas Freight Services", "Tanger", "+212 666 994 455", "Zone Franche Tanger Med"),
                ("Electro Casa", "Casablanca", "+212 667 334 455", "Rue Benjdia, Derb Omar"),
            ]

            slip_counter = 40
            bl_counter = 663300

            today = date.today()

            # Générer des bordereaux sur les 10 derniers jours et aujourd'hui
            for day_offset in range(10, -1, -1):
                current_date = today - timedelta(days=day_offset)
                num_slips = 3 if day_offset == 0 else random.randint(1, 3)
                
                for _ in range(num_slips):
                    driver = random.choice(created_drivers)
                    ag_id = driver.agence_id
                    
                    status_choice = "ouvert" if day_offset == 0 else random.choice(["ouvert", "clôturé"])
                    
                    date_str = current_date.strftime("%Y%m%d")
                    code = f"BS-{date_str}-{slip_counter:03d}"
                    slip_counter += 1

                    h_start = time(random.randint(7, 9), random.choice([0, 15, 30, 45]))
                    h_end = time(random.randint(16, 19), random.choice([0, 15, 30])) if status_choice == "clôturé" else None

                    slip = PickupSlip(
                        numero_bordereau=code,
                        driver_id=driver.id,
                        agency_id=ag_id,
                        date_tournee=current_date,
                        heure_debut=h_start,
                        heure_fin=h_end,
                        statut=status_choice,
                        created_by=admin_user.id
                    )
                    session.add(slip)
                    await session.flush()

                    # 1 à 3 ramassages par bordereau avec N° BL numérique propre
                    num_pickups = random.randint(1, 3)
                    for _ in range(num_pickups):
                        client_info = random.choice(clients_pool)
                        nb_colis = random.randint(5, 25)
                        bl_num = str(bl_counter)
                        bl_counter += 7

                        pk = Pickup(
                            pickup_slip_id=slip.id,
                            numero_declaration=bl_num,
                            client_nom=client_info[0],
                            client_telephone=client_info[2],
                            adresse=client_info[3],
                            ville=client_info[1],
                            nombre_colis=nb_colis,
                            date=current_date,
                            heure=time(random.randint(9, 17), random.choice([10, 21, 35, 50])),
                            observations="Ramassage conforme"
                        )
                        session.add(pk)

            print("Données de bordereaux générées avec succès !")

    print("Seeding terminé avec succès !")

async def main():
    try:
        await seed_data()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
