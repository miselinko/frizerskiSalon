# Frizerski Salon — Web Aplikacija

Veb aplikacija za online zakazivanje termina u frizerskom salonu sa 2 frizera i admin panelom.

## Tehnologije

| | Tehnologija |
|---|---|
| **Backend** | FastAPI + SQLAlchemy (async) + PostgreSQL |
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS |
| **Auth** | JWT tokeni |
| **Deploy** | Docker Compose |

---

## Pokretanje (Docker)

```bash
# 1. Kloniraj projekat i uđi u folder
cd projekat

# 2. Pokreni sve servise
docker compose up --build

# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

---

## Pokretanje lokalno (bez Dockera)

### Backend

```bash
cd backend

# Instaliraj Python dependencies
pip install -r requirements.txt

# Kopiraj env fajl
cp .env.example .env
# Edituj .env sa tvojim PostgreSQL parametrima

# Pokreni
uvicorn app.main:app --reload
# → http://localhost:8000
```

### Frontend

```bash
cd frontend

# Instaliraj dependencies
npm install

# Pokreni dev server
npm run dev
# → http://localhost:5173
```

---

## Default login

| Polje | Vrednost |
|---|---|
| Email | `admin@salon.rs` |
| Lozinka | `Admin123!` |

> Promeni ovo u `backend/.env` pre produkcije!

---

## Struktura projekta

```
projekat/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app, startup
│   │   ├── database.py       # SQLAlchemy setup
│   │   ├── seed.py           # Default podaci
│   │   ├── core/             # Config, JWT, deps
│   │   ├── models/           # SQLAlchemy modeli
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── routers/          # API endpoints
│   │   └── utils/            # Availability algoritam
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/            # Sve stranice
│       │   ├── Home.tsx
│       │   ├── Booking.tsx   # Korak-po-korak zakazivanje
│       │   ├── Services.tsx
│       │   ├── Contact.tsx
│       │   └── admin/        # Admin panel
│       ├── components/       # Navbar, Footer, AdminLayout
│       ├── api/              # Axios instance
│       ├── store/            # Zustand auth store
│       └── types/            # TypeScript tipovi
└── docker-compose.yml
```

---

## API Endpoints

### Javni
| Method | Endpoint | Opis |
|---|---|---|
| GET | `/api/barbers` | Lista aktivnih frizera |
| GET | `/api/services?barber_id=` | Lista usluga |
| GET | `/api/availability?barber_id=&date=` | Slobodni termini |
| POST | `/api/bookings` | Kreiranje rezervacije |
| GET | `/api/site-content` | Sadržaj sajta |

### Admin (JWT required)
| Method | Endpoint | Opis |
|---|---|---|
| POST | `/api/auth/login` | Prijava |
| GET | `/api/bookings/admin` | Sve rezervacije (sa filterima) |
| PATCH | `/api/bookings/admin/{id}` | Promena statusa |
| GET | `/api/bookings/admin/stats` | Statistika |
| POST | `/api/barbers` | Dodaj frizera |
| PATCH | `/api/barbers/{id}` | Izmeni frizera |
| PUT | `/api/schedules/{barber_id}/{weekday}` | Postavi raspored |
| POST | `/api/services` | Dodaj uslugu |
| PATCH | `/api/site-content` | Ažuriraj sadržaj sajta |

---

## Funkcionalnosti

### Javni deo
- ✅ Početna stranica (hero, frizeri, usluge preview, CTA)
- ✅ Korak-po-korak zakazivanje (5 koraka)
- ✅ Vizualni prikaz slobodnih/zauzetih termina (zeleno/crveno/sivo)
- ✅ Cenovnik sa svim uslugama
- ✅ Kontakt stranica

### Admin panel
- ✅ Zaštićeni login (JWT)
- ✅ Dashboard sa statistikama i današnjim terminima
- ✅ Pregled rezervacija sa filterima (frizer, status, datum)
- ✅ Prihvatanje / odbijanje / otkazivanje rezervacija
- ✅ Interne napomene admina
- ✅ Upravljanje frizerima (foto upload, opis)
- ✅ Nedeljni raspored po frizeru (radno vreme, pauze)
- ✅ Auto-prihvatanje rezervacija (po frizeru)
- ✅ Upravljanje uslugama (CRUD)
- ✅ Podešavanja sajta (logo, tekstovi, kontakt)

---

## Poslovne logike
- **Duplo zakazivanje** — sistem proverava overlapping i blokira konfliktne termine
- **Trajanje usluge** — slot mora da stane u radno vreme (kraj usluge ≤ kraj smene)
- **Pauze** — termini u periodu pauze su nedostupni
- **Auto-accept** — uključuje se posebno za svakog frizera
- **Status flow**: `pending` → `approved` / `rejected` / `cancelled`

---

## Produkcija

Pre deploy-a:
1. Promeni `SECRET_KEY` u `backend/.env`
2. Postavi jake lozinke za DB i admin
3. Isključi `echo=True` u `database.py`
4. Dodaj HTTPS (nginx + certbot)
