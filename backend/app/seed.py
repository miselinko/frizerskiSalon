"""Seed script: creates default admin, barbers, services, and schedules."""
import asyncio
from datetime import time
from sqlalchemy import select

from app.database import AsyncSessionLocal, engine, Base
from app.models import User, Barber, Service, Schedule, SiteContent
from app.core.security import hash_password
from app.core.config import settings

WEEKDAYS = list(range(5))  # Mon–Fri


async def seed():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Admin user
        admin_result = await db.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
        if not admin_result.scalar_one_or_none():
            admin = User(
                name="Admin",
                email=settings.ADMIN_EMAIL,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                is_admin=True,
            )
            db.add(admin)
            print(f"Created admin: {settings.ADMIN_EMAIL} / {settings.ADMIN_PASSWORD}")

        # Barbers
        barber_result = await db.execute(select(Barber))
        existing_barbers = barber_result.scalars().all()

        if not existing_barbers:
            barbers = [
                Barber(
                    full_name="Marko Nikolić",
                    description="Specijalizovan za fade i moderne muške frizure. 8 godina iskustva.",
                    auto_accept=False,
                ),
                Barber(
                    full_name="Stefan Jovanović",
                    description="Majstor klasičnog šišanja i nege brade. Posvećen svakom detalju.",
                    auto_accept=False,
                ),
            ]
            for b in barbers:
                db.add(b)
            await db.flush()
            print("Created 2 barbers")

            # Services (global)
            services = [
                Service(name="Fade", duration_minutes=45, price=1200, description="Fade + linije"),
                Service(name="Klasično šišanje", duration_minutes=30, price=800, description="Šišanje makazama i mašinicom"),
                Service(name="Brada", duration_minutes=20, price=500, description="Oblikovanje i trimovanje brade"),
                Service(name="Fade + Brada", duration_minutes=60, price=1600, description="Kompletna usluga"),
                Service(name="Dečije šišanje", duration_minutes=30, price=600, description="Do 12 godina"),
            ]
            for s in services:
                db.add(s)
            print("Created services")

            # Schedules (Mon–Sat, 09:00–18:00, break 13:00–14:00)
            for barber in barbers:
                for day in range(6):  # Mon–Sat
                    schedule = Schedule(
                        barber_id=barber.id,
                        weekday=day,
                        is_working=True,
                        start_time=time(9, 0),
                        end_time=time(18, 0),
                        slot_duration_minutes=15,
                        break_start=time(13, 0),
                        break_end=time(14, 0),
                    )
                    db.add(schedule)
                # Sunday — not working
                db.add(Schedule(
                    barber_id=barber.id,
                    weekday=6,
                    is_working=False,
                    start_time=time(9, 0),
                    end_time=time(18, 0),
                    slot_duration_minutes=15,
                ))
            print("Created schedules")

        # Site content
        sc_result = await db.execute(select(SiteContent))
        if not sc_result.scalar_one_or_none():
            sc = SiteContent(
                hero_title="Frizerski Salon Premium",
                hero_text="Profesionalni frizerski salon u srcu grada. Zakaži termin online brzo i lako.",
                about_text="Mi smo tim iskusnih frizera koji se bavi modernim muškim frizurama od 2015. godine. Koristimo samo premium proizvode i garantujemo vaše zadovoljstvo.",
                contact_phone="+381 11 123 4567",
                contact_email="salon@example.rs",
                address="Ulica Primer 15, Beograd",
            )
            db.add(sc)
            print("Created site content")

        await db.commit()
        print("Seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
