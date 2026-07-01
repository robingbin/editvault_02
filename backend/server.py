"""EditVault backend — FastAPI + MongoDB.

Everything the frontend needs is exposed via /api/*. MongoDB is the single
source of truth. Uploaded files live on local disk; only their metadata is
persisted in Mongo.
"""

from __future__ import annotations

import logging
import mimetypes
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, File, Header, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, ConfigDict, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Config / Mongo
# ---------------------------------------------------------------------------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ.get("DB_NAME", "editvault")
JWT_SECRET = os.environ.get("JWT_SECRET", "editvault-dev-secret-change-me")
JWT_ALG = "HS256"
JWT_TTL_HOURS = 24 * 30  # tokens are validated against user.password_version so this is safe

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("editvault")

app = FastAPI(title="EditVault API", version="1.0.0")
api = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


def _strip_mongo(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc


def _strip_password_fields(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Never expose password hashes or version numbers."""
    for k in ("password_hash", "password_version"):
        doc.pop(k, None)
    return doc


def _hash_password(plain: str) -> str:
    return pwd_ctx.hash(plain)


def _verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_ctx.verify(plain, hashed)
    except Exception:
        return False


def _issue_token(user_id: str, username: str, role: str, pv: int) -> str:
    payload = {
        "sub": user_id,
        "u": username,
        "r": role,
        "pv": pv,
        "iat": int(_now().timestamp()),
        "exp": int((_now() + timedelta(hours=JWT_TTL_HOURS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def _find_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    uname = (username or "").strip().lower()
    return await db.users.find_one({"username": uname})


async def _bootstrap_default_admin() -> None:
    """Ensure at least one admin user exists so the app is usable on install."""
    existing = await db.users.find_one({"role": "admin"})
    if existing:
        return
    now = _now().isoformat()
    doc = {
        "id": _uid("u"),
        "username": "admin",
        "password_hash": _hash_password("admin123"),
        "password_version": 1,
        "full_name": "Administrator",
        "role": "admin",
        "created_at": now,
        "updated_at": now,
    }
    await db.users.insert_one(doc)
    logger.info("Bootstrapped default admin user (username=admin)")


async def _ensure_settings() -> None:
    existing = await db.settings.find_one({"key": "company"})
    if existing:
        return
    await db.settings.insert_one(
        {
            "key": "company",
            "name": "",
            "address": "",
            "gstin": "",
            "phone": "",
            "email": "",
            "website": "",
            "logo_url": "",
            "invoice_prefix": "EV",
            "next_invoice_number": 1001,
        }
    )


DEFAULT_CATEGORIES = [
    "Long Video", "Short Video / Reel", "Advertisement", "YouTube Video", "YouTube Short",
    "Instagram Reel", "Facebook Reel", "TikTok Video", "Intro", "Outro", "Trailer / Teaser",
    "Poster", "Thumbnail", "Motion Graphics", "VFX Shot", "Color Grading", "Podcast Audio Edit",
]


async def _ensure_categories() -> None:
    existing = await db.meta.find_one({"key": "categories"})
    if existing:
        return
    await db.meta.insert_one({"key": "categories", "values": list(DEFAULT_CATEGORIES)})


# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------
async def get_current_user(authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(None, 1)[1].strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    role = payload.get("r")
    pv = int(payload.get("pv") or 0)
    
    # Check the appropriate collection based on role
    if role == "client":
        user = await db.clients.find_one({"id": user_id})
        if user:
            # Transform client doc to user-like structure for consistency
            user = {
                "id": user["id"],
                "username": user["username"],
                "role": "client",
                "client_id": user["id"],
                "full_name": user.get("name", user["username"]),
                "password_version": int(user.get("password_version", 1)),
            }
    else:
        user = await db.users.find_one({"id": user_id})
        if user:
            _strip_mongo(user)
    
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    if int(user.get("password_version", 1)) != pv:
        # Password/username was changed since this token was issued.
        raise HTTPException(status_code=401, detail="Credentials updated, please sign in again")
    return user


async def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class LoginIn(BaseModel):
    username: str
    password: str


class ClientIn(BaseModel):
    name: str
    username: str
    password: Optional[str] = None
    phone: Optional[str] = ""
    email: Optional[str] = ""
    monthlyFee: float = 0
    active: bool = True
    logo_url: Optional[str] = ""


class ClientPatch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    monthlyFee: Optional[float] = None
    active: Optional[bool] = None
    logo_url: Optional[str] = None
    order: Optional[int] = None


class VideoIn(BaseModel):
    model_config = ConfigDict(extra="allow")
    client_id: str
    name: str
    duration: Optional[str] = "00:00"
    category: Optional[str] = ""
    version: Optional[str] = "V1"
    editor_status: Optional[str] = "Not Started"
    client_status: Optional[str] = None
    posted_date: Optional[str] = None
    amount: float = 0
    year: int
    month: int
    due_date: Optional[str] = None
    client_locked: bool = False
    file_url: Optional[str] = None
    file_name: Optional[str] = None


class VideoPatch(BaseModel):
    model_config = ConfigDict(extra="allow")


class CorrectionNoteIn(BaseModel):
    note: str
    from_: Literal["client", "admin"] = Field(alias="from")

    model_config = ConfigDict(populate_by_name=True)


class ExpenseIn(BaseModel):
    client_id: str
    date: str  # YYYY-MM-DD
    description: str
    amount: float
    status: Literal["Paid", "Unpaid"] = "Unpaid"
    year: int
    month: int


class ExpensePatch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    date: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[Literal["Paid", "Unpaid"]] = None
    year: Optional[int] = None
    month: Optional[int] = None


class BillIn(BaseModel):
    client_id: str
    year: int
    month: int
    subtotal: float = 0
    discount: float = 0
    tax: float = 0
    total_amount: Optional[float] = None
    status: Literal["Paid", "Pending"] = "Pending"


class BillPatch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    subtotal: Optional[float] = None
    discount: Optional[float] = None
    tax: Optional[float] = None
    total_amount: Optional[float] = None
    status: Optional[Literal["Paid", "Pending"]] = None


class SettingsPatch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    invoice_prefix: Optional[str] = None
    next_invoice_number: Optional[int] = None


class AdminIn(BaseModel):
    full_name: Optional[str] = ""
    username: str
    password: str


class AdminPatch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    full_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None


class CategoryIn(BaseModel):
    name: str


class ActivityIn(BaseModel):
    actor: str
    action: str
    target: Optional[str] = ""
    client: Optional[str] = ""


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def _startup() -> None:
    await _bootstrap_default_admin()
    await _ensure_settings()
    await _ensure_categories()
    # Indexes
    await db.users.create_index("username", unique=True)
    await db.clients.create_index("username", unique=True)
    await db.clients.create_index("order")
    await db.videos.create_index([("client_id", 1), ("year", 1), ("month", 1)])
    await db.expenses.create_index([("client_id", 1), ("year", 1), ("month", 1)])
    await db.bills.create_index([("client_id", 1), ("year", 1), ("month", 1)])


@app.on_event("shutdown")
async def _shutdown() -> None:
    client.close()


# ---------------------------------------------------------------------------
# Public / health
# ---------------------------------------------------------------------------
@api.get("/")
async def root() -> Dict[str, str]:
    return {"message": "EditVault API"}


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
async def _client_as_user(c: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    return {
        "id": c["id"],
        "username": c["username"],
        "role": "client",
        "client_id": c["id"],
        "full_name": c.get("name", c["username"]),
        "password_version": int(c.get("password_version", 1)),
    }


@api.post("/login")
async def login(body: LoginIn) -> Dict[str, Any]:
    uname = (body.username or "").strip().lower()

    # Try admin/staff first
    user = await db.users.find_one({"username": uname})
    if user and _verify_password(body.password, user.get("password_hash", "")):
        pv = int(user.get("password_version", 1))
        token = _issue_token(user["id"], user["username"], user["role"], pv)
        profile = {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "full_name": user.get("full_name", user["username"]),
        }
        return {"token": token, "profile": profile}

    # Then try client credentials
    c = await db.clients.find_one({"username": uname})
    if c and _verify_password(body.password, c.get("password_hash", "")):
        pv = int(c.get("password_version", 1))
        token = _issue_token(c["id"], c["username"], "client", pv)
        profile = {
            "id": c["id"],
            "username": c["username"],
            "role": "client",
            "client_id": c["id"],
            "full_name": c.get("name", c["username"]),
        }
        return {"token": token, "profile": profile}

    raise HTTPException(status_code=401, detail="Invalid username or password")


@api.get("/me")
async def me(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    profile = {
        "id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "full_name": user.get("full_name", user["username"]),
    }
    if user["role"] == "client":
        profile["client_id"] = user["id"]
    return profile


# ---------------------------------------------------------------------------
# Clients
# ---------------------------------------------------------------------------
def _client_public(doc: Dict[str, Any]) -> Dict[str, Any]:
    _strip_mongo(doc)
    doc.pop("password_hash", None)
    doc.pop("password_version", None)
    return doc


@api.get("/clients")
async def list_clients(user: Dict[str, Any] = Depends(get_current_user)) -> List[Dict[str, Any]]:
    if user["role"] == "client":
        docs = await db.clients.find({"id": user["id"]}).to_list(1)
    else:
        docs = await db.clients.find().sort("order", 1).to_list(5000)
    return [_client_public(d) for d in docs]


@api.get("/clients/{client_id}")
async def get_client(client_id: str, user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user["role"] == "client" and user["id"] != client_id:
        raise HTTPException(403, "Forbidden")
    doc = await db.clients.find_one({"id": client_id})
    if not doc:
        raise HTTPException(404, "Client not found")
    return _client_public(doc)


@api.post("/clients")
async def create_client(body: ClientIn, admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    uname = body.username.strip().lower()
    if not body.password:
        raise HTTPException(400, "Password required")
    if await db.clients.find_one({"username": uname}):
        raise HTTPException(400, "Username already taken")
    if await db.users.find_one({"username": uname}):
        raise HTTPException(400, "Username already taken by an admin")
    last = await db.clients.find().sort("order", -1).limit(1).to_list(1)
    order = (last[0]["order"] + 1) if last else 0
    now = _now().isoformat()
    doc = {
        "id": _uid("c"),
        "name": body.name.strip(),
        "username": uname,
        "password_hash": _hash_password(body.password),
        "password_version": 1,
        "phone": body.phone or "",
        "email": body.email or "",
        "monthlyFee": float(body.monthlyFee or 0),
        "active": bool(body.active),
        "logo_url": body.logo_url or "",
        "order": order,
        "created_at": now,
        "updated_at": now,
    }
    await db.clients.insert_one(doc)
    await _log_activity("Admin", "Created client", doc["name"], "")
    return _client_public(dict(doc))


@api.put("/clients/{client_id}")
async def update_client(
    client_id: str, body: ClientPatch, admin: Dict[str, Any] = Depends(require_admin)
) -> Dict[str, Any]:
    doc = await db.clients.find_one({"id": client_id})
    if not doc:
        raise HTTPException(404, "Client not found")
    updates: Dict[str, Any] = {}
    pv_bump = False
    if body.name is not None:
        updates["name"] = body.name.strip()
    if body.username is not None:
        uname = body.username.strip().lower()
        if uname != doc["username"]:
            if await db.clients.find_one({"username": uname, "id": {"$ne": client_id}}):
                raise HTTPException(400, "Username already taken")
            if await db.users.find_one({"username": uname}):
                raise HTTPException(400, "Username already taken by an admin")
            updates["username"] = uname
            pv_bump = True
    if body.password:
        updates["password_hash"] = _hash_password(body.password)
        pv_bump = True
    for k in ("phone", "email", "monthlyFee", "active", "logo_url", "order"):
        v = getattr(body, k, None)
        if v is not None:
            updates[k] = v
    if pv_bump:
        updates["password_version"] = int(doc.get("password_version", 1)) + 1
    if updates:
        updates["updated_at"] = _now().isoformat()
        await db.clients.update_one({"id": client_id}, {"$set": updates})
    fresh = await db.clients.find_one({"id": client_id})
    return _client_public(fresh)


@api.delete("/clients/{client_id}")
async def delete_client(client_id: str, admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, str]:
    doc = await db.clients.find_one({"id": client_id})
    if not doc:
        raise HTTPException(404, "Client not found")
    await db.clients.delete_one({"id": client_id})
    await db.videos.delete_many({"client_id": client_id})
    await _log_activity("Admin", "Deleted client", doc.get("name", client_id), "")
    return {"ok": "true"}


@api.post("/clients/{client_id}/move")
async def move_client(client_id: str, direction: int, admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, str]:
    docs = await db.clients.find().sort("order", 1).to_list(5000)
    idx = next((i for i, d in enumerate(docs) if d["id"] == client_id), -1)
    if idx < 0:
        raise HTTPException(404, "Client not found")
    j = idx + (1 if direction > 0 else -1)
    if j < 0 or j >= len(docs):
        return {"ok": "noop"}
    a, b = docs[idx], docs[j]
    await db.clients.update_one({"id": a["id"]}, {"$set": {"order": b.get("order", j)}})
    await db.clients.update_one({"id": b["id"]}, {"$set": {"order": a.get("order", idx)}})
    return {"ok": "true"}


# ---------------------------------------------------------------------------
# Videos
# ---------------------------------------------------------------------------
def _video_public(d: Dict[str, Any]) -> Dict[str, Any]:
    _strip_mongo(d)
    d.setdefault("corrections", [])
    return d


@api.get("/videos")
async def list_videos(
    client_id: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    user: Dict[str, Any] = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    q: Dict[str, Any] = {}
    if user["role"] == "client":
        q["client_id"] = user["id"]
    elif client_id:
        q["client_id"] = client_id
    if year:
        q["year"] = int(year)
    if month:
        q["month"] = int(month)
    docs = await db.videos.find(q).sort("created_at", 1).to_list(10000)
    return [_video_public(d) for d in docs]


@api.post("/videos")
async def create_video(body: VideoIn, admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    now = _now().isoformat()
    doc = body.model_dump()
    doc.update({
        "id": _uid("v"),
        "corrections": [],
        "created_at": now,
        "updated_at": now,
    })
    await db.videos.insert_one(doc)
    return _video_public(dict(doc))


@api.put("/videos/{video_id}")
async def update_video(
    video_id: str, patch: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    doc = await db.videos.find_one({"id": video_id})
    if not doc:
        raise HTTPException(404, "Video not found")
    if user["role"] == "client" and doc["client_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")

    allowed = {
        "name", "duration", "category", "version", "editor_status", "client_status",
        "posted_date", "amount", "year", "month", "due_date", "client_locked",
        "file_url", "file_name", "corrections",
    }
    # Clients can only touch a limited subset
    if user["role"] == "client":
        allowed = {"client_status", "corrections", "posted_date", "client_locked", "editor_status"}
    updates = {k: v for k, v in (patch or {}).items() if k in allowed}
    if not updates:
        return _video_public(doc)
    updates["updated_at"] = _now().isoformat()
    await db.videos.update_one({"id": video_id}, {"$set": updates})
    fresh = await db.videos.find_one({"id": video_id})
    return _video_public(fresh)


@api.delete("/videos/{video_id}")
async def delete_video(video_id: str, admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, str]:
    res = await db.videos.delete_one({"id": video_id})
    if not res.deleted_count:
        raise HTTPException(404, "Video not found")
    return {"ok": "true"}


@api.post("/videos/{video_id}/corrections")
async def add_correction(
    video_id: str, body: CorrectionNoteIn, user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    doc = await db.videos.find_one({"id": video_id})
    if not doc:
        raise HTTPException(404, "Video not found")
    if user["role"] == "client" and doc["client_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    note = {
        "id": f"cn_{uuid.uuid4().hex[:8]}",
        "at": _now().isoformat(),
        "from": body.from_,
        "note": body.note.strip(),
    }
    await db.videos.update_one({"id": video_id}, {"$push": {"corrections": note}, "$set": {"updated_at": _now().isoformat()}})
    return note


# ---------------------------------------------------------------------------
# Expenses
# ---------------------------------------------------------------------------
def _expense_public(d: Dict[str, Any]) -> Dict[str, Any]:
    _strip_mongo(d)
    return d


@api.get("/expenses")
async def list_expenses(
    client_id: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    user: Dict[str, Any] = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    q: Dict[str, Any] = {}
    if user["role"] == "client":
        q["client_id"] = user["id"]
    elif client_id:
        q["client_id"] = client_id
    if year:
        q["year"] = int(year)
    if month:
        q["month"] = int(month)
    docs = await db.expenses.find(q).sort("date", 1).to_list(10000)
    return [_expense_public(d) for d in docs]


@api.post("/expenses")
async def create_expense(body: ExpenseIn, admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    doc = body.model_dump()
    doc.update({"id": _uid("e"), "created_at": _now().isoformat()})
    await db.expenses.insert_one(doc)
    return _expense_public(dict(doc))


@api.put("/expenses/{expense_id}")
async def update_expense(expense_id: str, body: ExpensePatch, admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    updates = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if not updates:
        doc = await db.expenses.find_one({"id": expense_id})
        if not doc:
            raise HTTPException(404, "Not found")
        return _expense_public(doc)
    await db.expenses.update_one({"id": expense_id}, {"$set": updates})
    fresh = await db.expenses.find_one({"id": expense_id})
    if not fresh:
        raise HTTPException(404, "Not found")
    return _expense_public(fresh)


@api.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, str]:
    res = await db.expenses.delete_one({"id": expense_id})
    if not res.deleted_count:
        raise HTTPException(404, "Not found")
    return {"ok": "true"}


# ---------------------------------------------------------------------------
# Bills
# ---------------------------------------------------------------------------
def _bill_public(d: Dict[str, Any]) -> Dict[str, Any]:
    _strip_mongo(d)
    return d


async def _next_invoice_no() -> str:
    doc = await db.settings.find_one({"key": "company"})
    prefix = (doc or {}).get("invoice_prefix") or "EV"
    n = int((doc or {}).get("next_invoice_number") or 1001)
    await db.settings.update_one({"key": "company"}, {"$set": {"next_invoice_number": n + 1}})
    return f"{prefix}-{n}"


@api.get("/bills")
async def list_bills(
    client_id: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    user: Dict[str, Any] = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    q: Dict[str, Any] = {}
    if user["role"] == "client":
        q["client_id"] = user["id"]
    elif client_id:
        q["client_id"] = client_id
    if year:
        q["year"] = int(year)
    if month:
        q["month"] = int(month)
    docs = await db.bills.find(q).sort([("year", -1), ("month", -1)]).to_list(10000)
    return [_bill_public(d) for d in docs]


@api.get("/bills/{bill_id}")
async def get_bill(bill_id: str, user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    doc = await db.bills.find_one({"id": bill_id})
    if not doc:
        raise HTTPException(404, "Not found")
    if user["role"] == "client" and doc["client_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    return _bill_public(doc)


@api.post("/bills")
async def create_or_upsert_bill(body: BillIn, admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    subtotal = float(body.subtotal or 0)
    discount = float(body.discount or 0)
    tax = float(body.tax or 0)
    total = float(body.total_amount) if body.total_amount is not None else max(0.0, subtotal - discount + tax)
    existing = await db.bills.find_one({"client_id": body.client_id, "year": body.year, "month": body.month})
    now = _now().isoformat()
    if existing:
        await db.bills.update_one(
            {"id": existing["id"]},
            {"$set": {
                "subtotal": subtotal, "discount": discount, "tax": tax,
                "total_amount": total, "status": body.status,
                "generated_at": now[:10],
            }},
        )
        fresh = await db.bills.find_one({"id": existing["id"]})
        return _bill_public(fresh)
    invoice_no = await _next_invoice_no()
    doc = {
        "id": _uid("b"),
        "invoice_no": invoice_no,
        "client_id": body.client_id,
        "year": body.year,
        "month": body.month,
        "subtotal": subtotal,
        "discount": discount,
        "tax": tax,
        "total_amount": total,
        "status": body.status,
        "generated_at": now[:10],
        "created_at": now,
    }
    await db.bills.insert_one(doc)
    return _bill_public(dict(doc))


@api.put("/bills/{bill_id}")
async def update_bill(bill_id: str, body: BillPatch, admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    updates = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if not updates:
        doc = await db.bills.find_one({"id": bill_id})
        if not doc:
            raise HTTPException(404, "Not found")
        return _bill_public(doc)
    await db.bills.update_one({"id": bill_id}, {"$set": updates})
    fresh = await db.bills.find_one({"id": bill_id})
    if not fresh:
        raise HTTPException(404, "Not found")
    return _bill_public(fresh)


@api.delete("/bills/{bill_id}")
async def delete_bill(bill_id: str, admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, str]:
    res = await db.bills.delete_one({"id": bill_id})
    if not res.deleted_count:
        raise HTTPException(404, "Not found")
    return {"ok": "true"}


# ---------------------------------------------------------------------------
# Company settings
# ---------------------------------------------------------------------------
@api.get("/settings/company")
async def get_company_settings(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    doc = await db.settings.find_one({"key": "company"})
    if not doc:
        return {}
    _strip_mongo(doc)
    doc.pop("key", None)
    return doc


@api.put("/settings/company")
async def update_company_settings(body: SettingsPatch, admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    updates = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if updates:
        await db.settings.update_one({"key": "company"}, {"$set": updates}, upsert=True)
    doc = await db.settings.find_one({"key": "company"})
    _strip_mongo(doc)
    doc.pop("key", None)
    return doc


# ---------------------------------------------------------------------------
# Admin users
# ---------------------------------------------------------------------------
def _admin_public(d: Dict[str, Any]) -> Dict[str, Any]:
    _strip_mongo(d)
    d.pop("password_hash", None)
    d.pop("password_version", None)
    return d


@api.get("/admins")
async def list_admins(admin: Dict[str, Any] = Depends(require_admin)) -> List[Dict[str, Any]]:
    docs = await db.users.find({"role": "admin"}).sort("created_at", 1).to_list(500)
    return [_admin_public(d) for d in docs]


@api.post("/admins")
async def create_admin(body: AdminIn, admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    uname = body.username.strip().lower()
    if await db.users.find_one({"username": uname}):
        raise HTTPException(400, "Username already exists")
    if await db.clients.find_one({"username": uname}):
        raise HTTPException(400, "Username already used by a client")
    now = _now().isoformat()
    doc = {
        "id": _uid("u"),
        "username": uname,
        "password_hash": _hash_password(body.password),
        "password_version": 1,
        "full_name": (body.full_name or uname).strip(),
        "role": "admin",
        "created_at": now,
        "updated_at": now,
    }
    await db.users.insert_one(doc)
    return _admin_public(dict(doc))


@api.put("/admins/{user_id}")
async def update_admin(user_id: str, body: AdminPatch, admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    doc = await db.users.find_one({"id": user_id})
    if not doc:
        raise HTTPException(404, "Not found")
    updates: Dict[str, Any] = {}
    pv_bump = False
    if body.full_name is not None:
        updates["full_name"] = body.full_name.strip()
    if body.username is not None:
        uname = body.username.strip().lower()
        if uname != doc["username"]:
            if await db.users.find_one({"username": uname, "id": {"$ne": user_id}}):
                raise HTTPException(400, "Username already taken")
            if await db.clients.find_one({"username": uname}):
                raise HTTPException(400, "Username already used by a client")
            updates["username"] = uname
            pv_bump = True
    if body.password:
        updates["password_hash"] = _hash_password(body.password)
        pv_bump = True
    if pv_bump:
        updates["password_version"] = int(doc.get("password_version", 1)) + 1
    if updates:
        updates["updated_at"] = _now().isoformat()
        await db.users.update_one({"id": user_id}, {"$set": updates})
    fresh = await db.users.find_one({"id": user_id})
    return _admin_public(fresh)


@api.delete("/admins/{user_id}")
async def delete_admin(user_id: str, admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, str]:
    if admin["id"] == user_id:
        raise HTTPException(400, "You can't remove yourself")
    remaining = await db.users.count_documents({"role": "admin", "id": {"$ne": user_id}})
    if remaining <= 0:
        raise HTTPException(400, "At least one admin required")
    res = await db.users.delete_one({"id": user_id, "role": "admin"})
    if not res.deleted_count:
        raise HTTPException(404, "Not found")
    return {"ok": "true"}


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------
@api.get("/categories")
async def list_categories(user: Dict[str, Any] = Depends(get_current_user)) -> List[str]:
    doc = await db.meta.find_one({"key": "categories"})
    return list((doc or {}).get("values") or DEFAULT_CATEGORIES)


@api.post("/categories")
async def add_category(body: CategoryIn, admin: Dict[str, Any] = Depends(require_admin)) -> List[str]:
    name = body.name.strip()
    if not name:
        raise HTTPException(400, "Name required")
    doc = await db.meta.find_one({"key": "categories"})
    values: List[str] = list((doc or {}).get("values") or DEFAULT_CATEGORIES)
    if name not in values:
        values.append(name)
        await db.meta.update_one({"key": "categories"}, {"$set": {"values": values}}, upsert=True)
    return values


# ---------------------------------------------------------------------------
# Activity log
# ---------------------------------------------------------------------------
async def _log_activity(actor: str, action: str, target: str, client_name: str) -> None:
    await db.activity.insert_one(
        {
            "id": _uid("a"),
            "at": _now().isoformat(),
            "actor": actor,
            "action": action,
            "target": target,
            "client": client_name,
        }
    )


@api.get("/activity")
async def list_activity(limit: int = 50, admin: Dict[str, Any] = Depends(require_admin)) -> List[Dict[str, Any]]:
    docs = await db.activity.find().sort("at", -1).limit(min(limit, 200)).to_list(200)
    return [_strip_mongo(d) for d in docs]


@api.post("/activity")
async def create_activity(body: ActivityIn, admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    await _log_activity(body.actor, body.action, body.target or "", body.client or "")
    return {"ok": "true"}


# ---------------------------------------------------------------------------
# Uploads (public read; write requires auth)
# ---------------------------------------------------------------------------
class UploadResponse(BaseModel):
    id: str
    filename: str
    original_name: str
    content_type: str
    size: int
    url: str


@api.post("/uploads", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...), user: Dict[str, Any] = Depends(get_current_user)) -> UploadResponse:
    if not file.filename:
        raise HTTPException(400, "No filename provided")
    file_id = uuid.uuid4().hex
    original = os.path.basename(file.filename)
    ext = Path(original).suffix.lower()
    stored_name = f"{file_id}{ext}"
    dest = UPLOADS_DIR / stored_name
    size = 0
    with open(dest, "wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            out.write(chunk)
    ct = file.content_type or (mimetypes.guess_type(original)[0] or "application/octet-stream")
    return UploadResponse(
        id=file_id, filename=stored_name, original_name=original,
        content_type=ct, size=size, url=f"/api/uploads/{stored_name}",
    )


@api.get("/uploads/{stored_name}")
async def get_upload(stored_name: str, download: Optional[str] = None) -> FileResponse:
    safe = os.path.basename(stored_name)
    path = UPLOADS_DIR / safe
    if not path.exists() or not path.is_file():
        raise HTTPException(404, "File not found")
    ct = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
    headers: Dict[str, str] = {}
    if download:
        headers["Content-Disposition"] = f'attachment; filename="{download}"'
    return FileResponse(str(path), media_type=ct, headers=headers)


# ---------------------------------------------------------------------------
# Wire up
# ---------------------------------------------------------------------------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
