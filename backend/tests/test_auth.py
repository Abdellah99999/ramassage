import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_login_success():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/login",
            json={"email": "admin@hes.com", "password": "admin123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_invalid_credentials():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/login",
            json={"email": "admin@hes.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        data = response.json()
        assert data["error_code"] == "UNAUTHENTICATED"

@pytest.mark.asyncio
async def test_get_me_success():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # First login to get token
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"email": "admin@hes.com", "password": "admin123"}
        )
        token = login_res.json()["access_token"]
        
        # Access protected route
        response = await ac.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        user_data = response.json()
        assert user_data["email"] == "admin@hes.com"
        assert user_data["role"] == "super_admin"

@pytest.mark.asyncio
async def test_get_me_unauthorized():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/auth/me")
        assert response.status_code == 401
        assert response.json()["error_code"] == "UNAUTHENTICATED"

@pytest.mark.asyncio
async def test_refresh_token_success():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # First login to get tokens
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"email": "admin@hes.com", "password": "admin123"}
        )
        refresh_token = login_res.json()["refresh_token"]
        
        # Call refresh
        response = await ac.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["refresh_token"] == refresh_token
