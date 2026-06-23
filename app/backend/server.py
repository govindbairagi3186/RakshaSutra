from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from pymongo import ReturnDocument


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.getenv('MONGO_URL')
if not mongo_url:
    raise RuntimeError('MONGO_URL is not set in the environment')

DB_NAME = os.getenv('DB_NAME', 'rakshasutra')

client = AsyncIOMotorClient(mongo_url)
db = client[DB_NAME]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------------- Models ----------------
class Contact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    relation: Optional[str] = "Friend"


class Profile(BaseModel):
    user_id: str
    name: str
    phone: str
    contacts: List[Contact] = Field(default_factory=list)
    ai_risk_detection: bool = True
    battery_alert: bool = True
    voice_sos: bool = True
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProfileUpsert(BaseModel):
    user_id: str
    name: str
    phone: str
    contacts: Optional[List[Contact]] = None
    ai_risk_detection: Optional[bool] = None
    battery_alert: Optional[bool] = None
    voice_sos: Optional[bool] = None


class SOSEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    trigger_type: str  # 'manual', 'voice', 'battery', 'ai_risk'
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    notified_contacts: List[str] = Field(default_factory=list)
    status: str = "active"  # active, resolved
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SOSCreate(BaseModel):
    user_id: str
    trigger_type: str = "manual"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    notified_contacts: List[str] = Field(default_factory=list)


class Trip(BaseModel):
    share_id: str = Field(default_factory=lambda: uuid.uuid4().hex[:10])
    user_id: str
    user_name: str
    destination: Optional[str] = None
    duration_minutes: int = 60
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str = "active"  # active, completed, stopped
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TripCreate(BaseModel):
    user_id: str
    user_name: str
    destination: Optional[str] = None
    duration_minutes: int = 60
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class LocationUpdate(BaseModel):
    latitude: float
    longitude: float


# ---------------- Helpers ----------------
def clean(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc.pop("_id")
    return doc


# ---------------- Routes ----------------
@api_router.get("/")
async def root():
    return {"message": "RakshaSutra API", "status": "ok"}


# Profile
@api_router.post("/profile", response_model=Profile)
async def upsert_profile(payload: ProfileUpsert):
    existing = await db.profiles.find_one({"user_id": payload.user_id}, {"_id": 0})
    data = payload.model_dump(exclude_none=True)
    if existing:
        existing.update(data)
        existing["updated_at"] = datetime.now(timezone.utc)
        await db.profiles.update_one({"user_id": payload.user_id}, {"$set": existing})
        return Profile(**existing)
    profile = Profile(**data)
    await db.profiles.insert_one(profile.model_dump())
    return profile


@api_router.get("/profile/{user_id}", response_model=Profile)
async def get_profile(user_id: str):
    doc = await db.profiles.find_one({"user_id": user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    return Profile(**doc)


# SOS
@api_router.post("/sos", response_model=SOSEvent)
async def create_sos(payload: SOSCreate):
    event = SOSEvent(**payload.model_dump())
    await db.sos_events.insert_one(event.model_dump())
    return event


@api_router.get("/sos/recent/{user_id}", response_model=List[SOSEvent])
async def recent_sos(user_id: str):
    docs = await db.sos_events.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    return [SOSEvent(**d) for d in docs]


@api_router.post("/sos/{sos_id}/resolve")
async def resolve_sos(sos_id: str):
    res = await db.sos_events.update_one(
        {"id": sos_id}, {"$set": {"status": "resolved"}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# Trips
@api_router.post("/trips", response_model=Trip)
async def start_trip(payload: TripCreate):
    trip = Trip(**payload.model_dump())
    await db.trips.insert_one(trip.model_dump())
    return trip


@api_router.get("/trips/{share_id}", response_model=Trip)
async def get_trip(share_id: str):
    doc = await db.trips.find_one({"share_id": share_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Trip not found")
    return Trip(**doc)


@api_router.put("/trips/{share_id}/location", response_model=Trip)
async def update_trip_location(share_id: str, payload: LocationUpdate):
    res = await db.trips.find_one_and_update(
        {"share_id": share_id},
        {"$set": {
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "updated_at": datetime.now(timezone.utc),
        }},
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0},
    )
    if not res:
        raise HTTPException(status_code=404, detail="Trip not found")
    return Trip(**res)


@api_router.put("/trips/{share_id}/stop", response_model=Trip)
async def stop_trip(share_id: str):
    res = await db.trips.find_one_and_update(
        {"share_id": share_id},
        {"$set": {"status": "stopped", "updated_at": datetime.now(timezone.utc)}},
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0},
    )
    if not res:
        raise HTTPException(status_code=404, detail="Trip not found")
    return Trip(**res)


# Nearby help centers (mocked)
@api_router.get("/places/nearby")
async def nearby_places(lat: float = 0.0, lng: float = 0.0):
    return {
        "police": [
            {"id": "p1", "name": "Central Police Station", "distance_km": 0.8, "phone": "100",
             "lat": lat + 0.005, "lng": lng + 0.004},
            {"id": "p2", "name": "Women Safety Cell", "distance_km": 1.6, "phone": "1091",
             "lat": lat - 0.006, "lng": lng + 0.003},
            {"id": "p3", "name": "City Police HQ", "distance_km": 2.9, "phone": "100",
             "lat": lat + 0.012, "lng": lng - 0.008},
        ],
        "hospitals": [
            {"id": "h1", "name": "City General Hospital", "distance_km": 1.1, "phone": "102",
             "lat": lat + 0.004, "lng": lng - 0.005},
            {"id": "h2", "name": "Apollo 24/7 Clinic", "distance_km": 2.3, "phone": "1066",
             "lat": lat - 0.009, "lng": lng - 0.002},
        ],
        "women_centers": [
            {"id": "w1", "name": "Sakhi One-Stop Center", "distance_km": 1.9, "phone": "181",
             "lat": lat + 0.007, "lng": lng + 0.009},
            {"id": "w2", "name": "Women Helpline Center", "distance_km": 3.4, "phone": "1091",
             "lat": lat - 0.011, "lng": lng + 0.006},
        ],
    }


# Safe routes (mocked)
@api_router.get("/safe-routes")
async def safe_routes(origin: str = "Current Location", destination: str = "Destination"):
    return {
        "origin": origin,
        "destination": destination,
        "routes": [
            {
                "id": "r1",
                "name": "Main Road via MG Road",
                "duration_min": 18,
                "distance_km": 4.2,
                "safety_score": 92,
                "well_lit": True,
                "police_nearby": 3,
                "hospitals_nearby": 2,
                "description": "Well-lit main road with multiple police checkpoints",
            },
            {
                "id": "r2",
                "name": "Market Street Route",
                "duration_min": 22,
                "distance_km": 4.8,
                "safety_score": 85,
                "well_lit": True,
                "police_nearby": 2,
                "hospitals_nearby": 1,
                "description": "Crowded route through commercial area",
            },
            {
                "id": "r3",
                "name": "Shortcut via Lake Side",
                "duration_min": 14,
                "distance_km": 3.1,
                "safety_score": 48,
                "well_lit": False,
                "police_nearby": 0,
                "hospitals_nearby": 0,
                "description": "Faster but isolated, avoid at night",
            },
        ],
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
