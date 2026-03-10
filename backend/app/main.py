import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import engine, Base
from app.core.config import settings
from app.routers import auth, barbers, services, bookings, availability, schedules, site_content


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables + seed on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    from app.seed import seed
    await seed()

    yield


app = FastAPI(
    title="Frizerski Salon API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Routers
prefix = "/api"
app.include_router(auth.router, prefix=prefix)
app.include_router(barbers.router, prefix=prefix)
app.include_router(services.router, prefix=prefix)
app.include_router(bookings.router, prefix=prefix)
app.include_router(availability.router, prefix=prefix)
app.include_router(schedules.router, prefix=prefix)
app.include_router(site_content.router, prefix=prefix)


@app.get("/health")
async def health():
    return {"status": "ok"}
