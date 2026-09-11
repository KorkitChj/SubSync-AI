from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SubtitleBase(BaseModel):
    language_code: str
    subtitle_file_path: str

class SubtitleCreate(SubtitleBase):
    pass

class SubtitleResponse(SubtitleBase):
    id: str
    video_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class VideoBase(BaseModel):
    original_filename: str
    video_file_path: str
    is_favorite: bool = False

class VideoCreate(VideoBase):
    pass

class VideoResponse(VideoBase):
    id: str
    created_at: datetime
    subtitles: List[SubtitleResponse] = []

    class Config:
        from_attributes = True

class TranslateRequest(BaseModel):
    target_language: str

class FavoriteRequest(BaseModel):
    is_favorite: bool

class UsageResponse(BaseModel):
    date: str
    requests_used: int
    daily_limit: int
    remaining_requests: int
    reset_in_hours: int

class RevisionCreate(BaseModel):
    time: str
    description: str

class RevisionResponse(RevisionCreate):
    id: str
    video_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class GeminiSubtitle(BaseModel):
    id: str
    startTime: float
    endTime: float
    originalText: str
    translatedText: str

class SaveSubtitlesRequest(BaseModel):
    blocks: List[GeminiSubtitle]

