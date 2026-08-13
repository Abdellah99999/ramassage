import pytest
from app.db.session import engine

@pytest.fixture(scope="session", autouse=True)
def cleanup_db_engine():
    yield
    # We do a sync dispose since pytest-asyncio runs the session on the loop
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(engine.dispose())
        else:
            loop.run_until_complete(engine.dispose())
    except Exception:
        pass
