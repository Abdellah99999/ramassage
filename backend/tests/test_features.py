import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_dashboard_stats_success():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login first to get token
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"email": "admin@hes.com", "password": "admin123"}
        )
        token = login_res.json()["access_token"]
        
        # Request dashboard stats
        response = await ac.get(
            "/api/v1/dashboard/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "colis_par_chauffeur" in data
        assert "colis_par_agence" in data
        assert "ramassages_jour" in data
        assert "ramassages_mois" in data
        assert "top_chauffeurs" in data

@pytest.mark.asyncio
async def test_print_pickup_slips_success():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login first to get token
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"email": "admin@hes.com", "password": "admin123"}
        )
        token = login_res.json()["access_token"]
        
        # Trigger print PDF (driver_id=1, date_debut=2026-08-01, date_fin=2026-08-07)
        response = await ac.get(
            "/api/v1/pickup-slips/print",
            params={
                "driver_id": 1,
                "date_debut": "2026-08-01",
                "date_fin": "2026-08-31"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert "attachment; filename=bordereau_" in response.headers["content-disposition"]
        assert len(response.content) > 0

@pytest.mark.asyncio
async def test_print_pickup_slips_driver_not_found():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login first to get token
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"email": "admin@hes.com", "password": "admin123"}
        )
        token = login_res.json()["access_token"]
        
        # Trigger print PDF with fake driver_id
        response = await ac.get(
            "/api/v1/pickup-slips/print",
            params={
                "driver_id": 9999,
                "date_debut": "2026-08-01",
                "date_fin": "2026-08-31"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 404
        assert response.json()["error_code"] == "NOT_FOUND"
