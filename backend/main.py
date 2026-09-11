from fastapi import FastAPI, Depends, HTTPException, Query, File, UploadFile
from fastapi.staticfiles import StaticFiles
import os
import shutil
import uuid
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
try:
    from . import models, schemas, services
    from .database import engine, get_db
except ImportError:
    import models, schemas, services
    from database import engine, get_db

# Create all tables in the engine
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Video Subtitle Generator MVP")

# Allow CORS for React frontend (adjust origins in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

storage_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "storage")
os.makedirs(storage_path, exist_ok=True)
app.mount("/api/storage", StaticFiles(directory=storage_path), name="storage")

@app.get("/api/videos")
def read_videos(db: Session = Depends(get_db)):
    videos = db.query(models.Video).order_by(models.Video.created_at.desc()).all()
    return [
        {
            "id": v.id,
            "name": v.original_filename,
            "timestamp": v.created_at.isoformat(),
            "duration": 0,
            "url": f"http://localhost:8000/api/storage/uploads/{v.id}/{v.original_filename}",
            "is_favorite": v.is_favorite
        }
        for v in videos
    ]

@app.get("/api/videos/{video_id}", response_model=schemas.VideoResponse)
def read_video(video_id: str, db: Session = Depends(get_db)):
    db_video = services.get_video(db, video_id=video_id)
    if db_video is None:
        raise HTTPException(status_code=404, detail="Video not found")
    return db_video

@app.post("/api/upload")
def upload_video(file: UploadFile = File(...), db: Session = Depends(get_db)):
    video_id = str(uuid.uuid4())
    storage_dir = os.path.join(storage_path, "uploads", video_id)
    os.makedirs(storage_dir, exist_ok=True)
    
    filename = file.filename or f"video_{video_id}.mp4"
    file_path = os.path.join(storage_dir, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    new_video = models.Video(
        id=video_id,
        original_filename=filename,
        video_file_path=file_path
    )
    db.add(new_video)
    db.commit()
    db.refresh(new_video)
    
    return {
        "id": new_video.id,
        "name": new_video.original_filename,
        "timestamp": "Just now",
        "duration": 0,
        "url": f"http://localhost:8000/api/storage/uploads/{new_video.id}/{new_video.original_filename}"
    }

@app.get("/api/videos/{video_id}/subtitles")
def read_subtitles(video_id: str, lang: str, db: Session = Depends(get_db)):
    db_video = services.get_video(db, video_id=video_id)
    if db_video is None:
        raise HTTPException(status_code=404, detail="Video not found")
        
    # Check if subtitle exists in DB for this language
    subtitle = services.get_subtitle_by_language(db, video_id=video_id, language_code=lang.upper())
    if subtitle is None:
        raise HTTPException(status_code=404, detail=f"Subtitle for language {lang} not found")
        
    # Load blocks from disk
    blocks = services.load_subtitle_file(str(subtitle.subtitle_file_path))
    
    return {
        "subtitle_id": subtitle.id,
        "language_code": subtitle.language_code,
        "blocks": blocks
    }

@app.post("/api/videos/{video_id}/translate")
async def translate_video(video_id: str, payload: schemas.TranslateRequest, db: Session = Depends(get_db)):
    result = await services.process_and_save_translation(
        db=db,
        video_id=video_id,
        target_language=payload.target_language
    )
    return result

@app.delete("/api/videos/{video_id}")
def delete_video_endpoint(video_id: str, db: Session = Depends(get_db)):
    success = services.delete_video(db, video_id)
    if not success:
        raise HTTPException(status_code=404, detail="Video not found")
    return {"message": "Video deleted"}

@app.patch("/api/videos/{video_id}/favorite")
def set_favorite(video_id: str, payload: schemas.FavoriteRequest, db: Session = Depends(get_db)):
    video = services.toggle_favorite(db, video_id, payload.is_favorite)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return {"message": "Updated"}

@app.get("/api/usage", response_model=schemas.UsageResponse)
def get_usage_endpoint(db: Session = Depends(get_db)):
    return services.get_usage(db)

@app.put("/api/videos/{video_id}/subtitles")
def update_subtitles(video_id: str, lang: str, payload: schemas.SaveSubtitlesRequest, db: Session = Depends(get_db)):
    success = services.save_subtitle_file(db, video_id, lang.upper(), payload.blocks)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to save subtitles")
    return {"message": "Subtitles saved successfully"}

@app.get("/api/videos/{video_id}/revisions", response_model=list[schemas.RevisionResponse])
def get_revisions(video_id: str, db: Session = Depends(get_db)):
    return services.get_revisions(db, video_id)

@app.post("/api/videos/{video_id}/revisions", response_model=schemas.RevisionResponse)
def create_revision(video_id: str, payload: schemas.RevisionCreate, db: Session = Depends(get_db)):
    return services.create_revision(db, video_id, payload.time, payload.description)

