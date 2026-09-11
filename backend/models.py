import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, Integer
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
try:
    from .database import Base
except ImportError:
    from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Video(Base):
    __tablename__ = "videos"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    original_filename = Column(String, index=True, nullable=False)
    video_file_path = Column(String, nullable=False)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subtitles = relationship("Subtitle", back_populates="video", cascade="all, delete-orphan")

class Subtitle(Base):
    __tablename__ = "subtitles"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False, index=True)
    language_code = Column(String, index=True, nullable=False)  # e.g., 'EN', 'TH'
    subtitle_file_path = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    video = relationship("Video", back_populates="subtitles")

class ApiUsage(Base):
    __tablename__ = "api_usage"

    date = Column(String, primary_key=True, index=True)
    requests_used = Column(Integer, default=0)

class Revision(Base):
    __tablename__ = "revisions"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False, index=True)
    time = Column(String, nullable=False)
    description = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    video = relationship("Video")

