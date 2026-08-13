# H.E.S. Pickup Management System (Ramassage)

Ce projet est un système de gestion des ramassages de colis pour **Horizon Express Services (H.E.S.)**.
Il permet de suivre les colis ramassés par les chauffeurs chez les clients, de calculer la rémunération des chauffeurs et de générer/imprimer les bordereaux de ramassage signés.

---

## 🏗️ Structure du Projet

Le projet est organisé sous forme de monorepo :
*   `/backend` : API REST construite avec **FastAPI**, **SQLAlchemy 2.0 (async)**, **Pydantic v2** et **PostgreSQL**.
*   `/frontend` : Interface utilisateur construite avec **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS** et **shadcn/ui**.

---

## 💻 Instructions de Développement Local

### Backend (FastAPI)

1. Naviguer dans le dossier backend :
   ```bash
   cd backend
   ```
2. Créer et activer un environnement virtuel Python :
   ```bash
   python -m venv venv
   # Sur Windows:
   venv\Scripts\activate
   # Sur macOS/Linux:
   source venv/bin/activate
   ```
3. Installer les dépendances :
   ```bash
   pip install -r requirements.txt
   ```
4. Configurer les variables d'environnement :
   Copier le fichier `.env.example` vers `.env` et l'ajuster :
   ```bash
   cp .env.example .env
   ```
5. Appliquer les migrations de base de données :
   ```bash
   alembic upgrade head
   ```
6. Lancer l'application en mode développement :
   ```bash
   uvicorn app.main:app --reload
   ```
   L'API sera disponible sur `http://localhost:8000` et la documentation Swagger sur `http://localhost:8000/docs`.

### Frontend (Next.js)

1. Naviguer dans le dossier frontend :
   ```bash
   cd frontend
   ```
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Configurer les variables d'environnement :
   Copier le fichier `.env.example` vers `.env.local` :
   ```bash
   cp .env.example .env.local
   ```
4. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```
   L'application sera disponible sur `http://localhost:3000`.

---

## 🚀 Guide de Déploiement en Production (Offres Gratuites)

> ℹ️ **Remarque importante concernant les offres gratuites (Render & Neon)**  
> Les hébergements gratuits sur **Render** (Web Service) et **Neon** (PostgreSQL) se mettent automatiquement en veille après une période d'inactivité. Lors du premier appel après une période sans trafic, le démarrage du serveur et la reconnexion à la base de données peuvent prendre entre **30 et 60 secondes**. Il s'agit d'un comportement normal des offres gratuites et non d'un bug.

---

### Étape 1 : Créer la Base de Données sur Neon PostgreSQL

1. Rendez-vous sur [Neon.tech](https://neon.tech) et créez un projet.
2. Récupérez la chaîne de connexion sous l'onglet **Dashboard** ou **Connection Details**.
3. Assurez-vous de sélectionner l'option **Pooled connection** (l'URL doit contenir le sous-domaine `-pooler` et le paramètre `?sslmode=require`).
   * *Exemple d'URL Neon Pooled* :  
     `postgresql://alex:MonMotDePasse@ep-xyz-pooler.eastus2.azure.neon.tech/neondb?sslmode=require`

---

### Étape 2 : Déployer le Backend sur Render

1. Rendez-vous sur [Render.com](https://render.com) et connectez votre compte GitHub.
2. Créez un nouveau **Web Service** et sélectionnez le dépôt du projet.
3. Configurez les paramètres du service :
   * **Name** : `hes-pickup-backend` (ou le nom de votre choix)
   * **Root Directory** : `backend`
   * **Environment** : `Python 3`
   * **Build Command** : `pip install -r requirements.txt`
   * **Start Command** : `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Ajoutez les **Variables d'Environnement** suivantes dans la section *Environment* :
   * `DATABASE_URL` : *URL Neon Pooled récupérée à l'étape 1*
   * `JWT_SECRET` : *Une clé secrète complexe (ex: générée via `openssl rand -hex 32`)*
   * `JWT_ALGORITHM` : `HS256`
   * `ACCESS_TOKEN_EXPIRE_MINUTES` : `480`
   * `CORS_ORIGINS` : `["https://votre-app.vercel.app"]` *(sera mis à jour après la création du projet Vercel)*
   * `DEBUG` : `false`
5. Lancez le déploiement. Une fois terminé, notez l'URL attribuée par Render (ex: `https://hes-pickup-backend.onrender.com`).
6. Vérifiez le bon fonctionnement via l'endpoint de santé : `https://hes-pickup-backend.onrender.com/health` (doit retourner `{"status":"ok",...}`).

---

### Étape 3 : Appliquer les Migrations Alembic sur Neon

Depuis votre machine locale, vous pouvez appliquer les migrations directement sur la base Neon de production :

```bash
# Dans le dossier backend/
cd backend

# Remplacez DATABASE_URL par la chaîne Neon de production et lancez la migration
DATABASE_URL="postgresql://alex:MonMotDePasse@ep-xyz-pooler.eastus2.azure.neon.tech/neondb?sslmode=require" alembic upgrade head
```

---

### Étape 4 : Déployer le Frontend sur Vercel

1. Rendez-vous sur [Vercel.com](https://vercel.com) et importez votre dépôt GitHub.
2. Configurez le projet :
   * **Framework Preset** : `Next.js`
   * **Root Directory** : `frontend`
3. Ajoutez la variable d'environnement dans Vercel (**Environment Variables**) :
   * `NEXT_PUBLIC_API_URL` : `https://hes-pickup-backend.onrender.com` *(remplacez par votre URL Render exacte)*
4. Cliquez sur **Deploy**.
5. Une fois le déploiement Vercel réussi, copiez l'URL de votre application Vercel (ex: `https://hes-ramassage.vercel.app`).
6. Retournez dans la console **Render**, mettez à jour la variable d'environnement `CORS_ORIGINS` avec le domaine Vercel exact :
   ```json
   ["https://hes-ramassage.vercel.app"]
   ```
7. Redéployez le service Render pour appliquer les nouvelles règles CORS.
