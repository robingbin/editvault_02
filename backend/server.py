from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
import mimetypes
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


class UploadResponse(BaseModel):
    id: str
    filename: str
    original_name: str
    content_type: str
    size: int
    url: str


@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.post("/uploads", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Store an uploaded file on disk and return its metadata + retrievable URL."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    file_id = str(uuid.uuid4())
    original = os.path.basename(file.filename)
    # Preserve original extension so previews/downloads work naturally.
    ext = Path(original).suffix.lower()
    stored_name = f"{file_id}{ext}"
    dest = UPLOADS_DIR / stored_name

    size = 0
    with open(dest, 'wb') as out:
        while True:
            chunk = await file.read(1024 * 1024)  # 1MB chunks
            if not chunk:
                break
            size += len(chunk)
            out.write(chunk)

    ct = file.content_type or (mimetypes.guess_type(original)[0] or 'application/octet-stream')
    return UploadResponse(
        id=file_id,
        filename=stored_name,
        original_name=original,
        content_type=ct,
        size=size,
        url=f"/api/uploads/{stored_name}",
    )


@api_router.get("/uploads/{stored_name}")
async def get_upload(stored_name: str, download: str | None = None):
    # Prevent path traversal: only allow files that exist directly inside uploads dir.
    safe = os.path.basename(stored_name)
    path = UPLOADS_DIR / safe
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    ct = mimetypes.guess_type(str(path))[0] or 'application/octet-stream'
    headers = {}
    if download:
        headers['Content-Disposition'] = f'attachment; filename="{download}"'
    return FileResponse(str(path), media_type=ct, headers=headers)


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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
