# 📖 Documentation de la Plateforme & Workflows H.E.S. Ramassage

Ce document présente l'architecture complète, les workflows utilisateurs, l'ensemble des routes API et les spécifications techniques de la plateforme **H.E.S. Ramassage**.

---

## 🏗️ 1. Architecture Générale

La plateforme repose sur une architecture moderne découplée :

```
┌─────────────────────────────────────────┐
│     Frontend (Next.js 15 App Router)     │
│   - UI React + TailwindCSS + TanStack   │
│   - Proxy API: /api/v1/[...path]/route.ts│
└────────────────────┬────────────────────┘
                     │ HTTP Proxy (127.0.0.1:8000)
┌────────────────────▼────────────────────┐
│      Backend (FastAPI Async Python)     │
│   - SQLAlchemy 2.0 Async Session        │
│   - ReportLab (Génération PDF)          │
└────────────────────┬────────────────────┘
                     │ PostgreSQL Async (AsyncPG)
┌────────────────────▼────────────────────┐
│    Base de Données PostgreSQL (Neon)    │
│   - Index de performance sur filtres   │
└─────────────────────────────────────────┘
```

---

## 🔐 2. Rôles & Sécurité (RBAC)

La plateforme gère 3 niveaux d'accès grâce au système `RoleChecker` et `get_user_agency_filter` :

| Rôle | Périmètre d'accès | Droits Agences | Droits Chauffeurs | Droits Utilisateurs | Droits Bordereaux |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`super_admin`** | Accès Global | CRUD Complet | CRUD Complet | CRUD Complet | Création, Lecture, Modification, Suppression |
| **`manager`** | Agence Assignée | Lecture Seule | Gestion (Agence) | Gestion (Agence) | Création, Lecture, Modification, Suppression |
| **`agent`** | Agence Assignée | Lecture Seule | Lecture (Agence) | Aucun | Création, Lecture, Modification (Agence) |

---

## 🔄 3. Workflows Opérationnels

### 3.1. Workflow d'Authentification
1. L'utilisateur saisit son **Email** et **Mot de passe** sur `/login`.
2. L'API vérifie les identifiants (`POST /api/v1/auth/login`) et génère un jeton **JWT**.
3. Le jeton est stocké de manière sécurisée dans un cookie HTTP (`token`).
4. Le contexte utilisateur (`UserContext`) récupère le profil (`GET /api/v1/auth/me`).

### 3.2. Workflow de Création d'un Bordereau (En 1 Clic)
1. Cliquez sur **"+ Nouveau bordereau"** pour ouvrir la modale.
2. Remplissez les informations principales (Chauffeur, Agence, Date tournée).
3. Remplissez les informations du colis/déclaration (N° Déclaration BL, Nom du client, Adresse, Nombre de colis, Observations).
4. Cliquez sur **`+ Créer manifeste`** :
   * Une requête unique `POST /api/v1/pickup-slips` est envoyée au backend avec le tableau imbriqué `pickups`.
   * Le backend insère le bordereau et son colis dans une **seule transaction atomique SQL**.
   * Le tableau des bordereaux se rafraîchit automatiquement.

### 3.3. Workflow de Consultation (Pop-up & Impression)
1. **Consultation Rapide** : Cliquez sur l'**icône Œil (Bleue)** d'une ligne du tableau.
   * Un pop-up s'ouvre sans quitter la page pour afficher le détail complet du bordereau et la liste de ses colis/déclarations.
2. **Page d'Impression** : Un lien dans le pop-up (ou l'accès direct `/bordereaux/[id]`) permet d'accéder à la page de détails imprimable.
3. **Export PDF** : Le bouton **"Imprimer PDF"** fait appel à l'endpoint `GET /api/v1/pickup-slips/{id}/pdf` qui génère à la volée un document ReportLab haute définition.

### 3.4. Workflow de Modification & Suppression
1. **Modification** : Cliquez sur l'**icône Modifier (Orange)**.
   * Un pop-up vous permet de modifier le chauffeur, l'agence ou la date du bordereau (`PUT /api/v1/pickup-slips/{id}`).
2. **Suppression** : Cliquez sur l'**icône Supprimer (Rouge)**.
   * Après confirmation, le bordereau et ses colis associés sont supprimés (`DELETE /api/v1/pickup-slips/{id}`).

---

## 📡 4. Répertoire Complet des Routes API

### 🔑 4.1. Authentification (`/api/v1/auth`)
* `POST /api/v1/auth/login` : Connexion et génération de jeton JWT.
* `GET /api/v1/auth/me` : Récupération du profil de l'utilisateur connecté.

### 📦 4.2. Bordereaux & Ramassages (`/api/v1/pickup-slips`)
* `GET /api/v1/pickup-slips?skip=0&limit=10` : Liste filtrée et paginée des bordereaux avec comptage des colis et ramassages.
* `POST /api/v1/pickup-slips` : Création d'un bordereau avec insertion imbriquée des colis.
* `GET /api/v1/pickup-slips/{slip_id}` : Détails d'un bordereau et liste de ses colis.
* `PUT /api/v1/pickup-slips/{slip_id}` : Modification d'un bordereau.
* `DELETE /api/v1/pickup-slips/{slip_id}` : Suppression d'un bordereau et de ses colis.
* `GET /api/v1/pickup-slips/{slip_id}/pdf` : Téléchargement du PDF d'un bordereau.
* `POST /api/v1/pickup-slips/{slip_id}/close` : Clôture d'un bordereau.
* `GET /api/v1/pickup-slips/drivers` : Liste des chauffeurs disponibles.
* `GET /api/v1/pickup-slips/agences` : Liste des agences disponibles.
* `GET /api/v1/pickup-slips/pickups/search` : Recherche multicritère de colis.

### 📊 4.3. Tableau de Bord (`/api/v1/dashboard`)
* `GET /api/v1/dashboard/stats` : Statistiques agrégées (volumétrie colis, nombre de ramassages par chauffeur et par agence, top chauffeurs du mois).

### 🏢 4.4. Agences CRUD (`/api/v1/agences-crud`)
* `GET /api/v1/agences-crud` : Liste des agences.
* `POST /api/v1/agences-crud` : Créer une agence (Super Admin).
* `PUT /api/v1/agences-crud/{id}` : Modifier une agence (Super Admin).
* `DELETE /api/v1/agences-crud/{id}` : Supprimer une agence (Super Admin).

### 🚚 4.5. Chauffeurs CRUD (`/api/v1/drivers-crud`)
* `GET /api/v1/drivers-crud` : Liste des chauffeurs.
* `POST /api/v1/drivers-crud` : Créer un chauffeur.
* `PUT /api/v1/drivers-crud/{id}` : Modifier un chauffeur.
* `DELETE /api/v1/drivers-crud/{id}` : Supprimer un chauffeur.

### 👤 4.6. Utilisateurs CRUD (`/api/v1/users`)
* `GET /api/v1/users` : Liste des utilisateurs.
* `POST /api/v1/users` : Créer un utilisateur (Super Admin).
* `PUT /api/v1/users/{id}` : Modifier un utilisateur (Super Admin).
* `DELETE /api/v1/users/{id}` : Supprimer un utilisateur (Super Admin).

---

## ⚡ 5. Optimisations & Performances Clés

1. **Réseau Local (Latency Fix)** : Remplacement de `localhost` par `127.0.0.1` sur Windows, réduisant la latence des appels de **~2200ms à ~10ms**.
2. **Indexation Base de Données** : Index SQL créés sur `driver_id`, `agency_id`, `date_tournee` dans `pickup_slips` et `pickup_slip_id`, `date` dans `pickups`.
3. **Génération PDF Asynchrone** : Isolation du rendu ReportLab dans `anyio.to_thread.run_sync` afin de ne jamais bloquer la boucle d'événements async.
4. **Mise en Cache Frontend** : Configuration du `staleTime` TanStack Query (30s par défaut, 5m pour les listes statiques).
