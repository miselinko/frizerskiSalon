from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database import get_db
from app.models.service import Service
from app.core.deps import get_current_admin
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceOut

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=list[ServiceOut])
async def list_services(barber_id: str | None = None, db: AsyncSession = Depends(get_db)):
    """Public: list active services. If barber_id given, returns barber-specific + global services."""
    q = select(Service).where(Service.active == True)
    if barber_id:
        q = q.where(or_(Service.barber_id == barber_id, Service.barber_id == None))
    else:
        q = q.where(Service.barber_id == None)
    result = await db.execute(q.order_by(Service.name))
    return result.scalars().all()


@router.get("/admin", response_model=list[ServiceOut])
async def list_all_services(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(Service).order_by(Service.name))
    return result.scalars().all()


@router.post("", response_model=ServiceOut)
async def create_service(
    data: ServiceCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    service = Service(**data.model_dump())
    db.add(service)
    await db.flush()
    await db.refresh(service)
    return service


@router.patch("/{service_id}", response_model=ServiceOut)
async def update_service(
    service_id: str,
    data: ServiceUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    svc = result.scalar_one_or_none()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(svc, k, v)
    await db.flush()
    await db.refresh(svc)
    return svc


@router.delete("/{service_id}", status_code=204)
async def delete_service(
    service_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    svc = result.scalar_one_or_none()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    await db.delete(svc)
