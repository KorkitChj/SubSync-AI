import os
import json
import subprocess
import uuid
import asyncio
import shutil
from datetime import datetime, date
from sqlalchemy.orm import Session
from fastapi import HTTPException
from dotenv import load_dotenv
try:
    from . import models, schemas
except ImportError:
    import models, schemas
from pydantic import BaseModel

from google import genai
from google.genai import types

import sys
if hasattr(sys, '_MEIPASS'):
    env_path = os.path.join(sys._MEIPASS, '.env')
else:
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(dotenv_path=env_path)
client = genai.Client()

# Define base storage directory relative to backend
STORAGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "storage", "uploads")
# Ensure storage directory exists
os.makedirs(STORAGE_DIR, exist_ok=True)

DAILY_QUOTA_LIMIT = 250

def get_usage(db: Session):
    today_str = date.today().isoformat()
    usage = db.query(models.ApiUsage).filter(models.ApiUsage.date == today_str).first()
    requests_used = usage.requests_used if usage else 0
    
    now = datetime.now()
    hours_until_midnight = 24 - now.hour
    if hours_until_midnight == 24:
        hours_until_midnight = 0
        
    return {
        "date": today_str,
        "requests_used": requests_used,
        "daily_limit": DAILY_QUOTA_LIMIT,
        "remaining_requests": max(0, DAILY_QUOTA_LIMIT - requests_used),
        "reset_in_hours": hours_until_midnight
    }

def increment_usage(db: Session):
    today_str = date.today().isoformat()
    usage = db.query(models.ApiUsage).filter(models.ApiUsage.date == today_str).first()
    if not usage:
        usage = models.ApiUsage(date=today_str, requests_used=1)
        db.add(usage)
    else:
        usage.requests_used += 1  # type: ignore
    db.commit()
    return usage

def get_video(db: Session, video_id: str):
    return db.query(models.Video).filter(models.Video.id == video_id).first()

def delete_video(db: Session, video_id: str):
    video = get_video(db, video_id)
    if not video:
        return False
    video_dir = os.path.join(STORAGE_DIR, str(video_id))
    if os.path.exists(video_dir):
        shutil.rmtree(video_dir, ignore_errors=True)
    db.delete(video)
    db.commit()
    return True

def toggle_favorite(db: Session, video_id: str, is_favorite: bool):
    video = get_video(db, video_id)
    if video:
        video.is_favorite = is_favorite
        db.commit()
        db.refresh(video)
    return video

def get_subtitle_by_language(db: Session, video_id: str, language_code: str):
    return db.query(models.Subtitle).filter(
        models.Subtitle.video_id == video_id,
        models.Subtitle.language_code == language_code
    ).first()

def load_subtitle_file(file_path: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Subtitle file not found on disk")
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_audio(video_path: str) -> str:
    audio_path = video_path.rsplit(".", 1)[0] + ".mp3"
    # Execute ffmpeg to extract audio at 64k bitrate for fast upload
    cmd = [
        "ffmpeg",
        "-y",
        "-i", video_path,
        "-q:a", "0",
        "-b:a", "64k",
        "-map", "a",
        audio_path
    ]
    try:
        print(f"Extracting audio to {audio_path} at 64k...")
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg error: {e.stderr.decode()}")
        raise HTTPException(status_code=500, detail="Failed to extract audio from video.")
    return audio_path

class GeminiSubtitle(BaseModel):
    id: str
    startTime: float
    endTime: float
    originalText: str
    translatedText: str

async def generate_subtitles_with_gemini(audio_path: str, target_language: str = "Thai") -> list:
    print(f"Uploading audio file {audio_path} to Gemini...")
    uploaded_file = None
    try:
        # Upload the file to Gemini
        uploaded_file = client.files.upload(file=audio_path)
        print(f"File uploaded successfully. URI: {uploaded_file.uri}")
        
        prompt = (
            f"Listen carefully to this audio. Transcribe the spoken words with precise start "
            f"and end timestamps in seconds. Also translate each segment into {target_language}."
        )
        
        print(f"Generating subtitles using gemini-3.6-flash...")

        safety_settings = [
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold=types.HarmBlockThreshold.BLOCK_NONE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold=types.HarmBlockThreshold.BLOCK_NONE,
            ),
        ]
        
        # Use sync generate_content since google-genai is mostly sync by default, but we'll wrap it if needed.
        # Actually client.models.generate_content is synchronous. If we want async, we can use client.aio.models.generate_content
        # Let's use the async client aio
        response = await client.aio.models.generate_content(
            model='gemini-3.6-flash',
            contents=[uploaded_file, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                safety_settings=safety_settings,
                response_schema=list[GeminiSubtitle],
                temperature=0.2
            )
        )
        
        if not response.text:
            raise HTTPException(status_code=500, detail="Gemini returned an empty response.")
            
        blocks = json.loads(response.text)
        
        # Ensure UUIDs just in case Gemini returned sequential IDs
        for block in blocks:
            block["id"] = str(uuid.uuid4())
            
        return blocks

    except Exception as e:
        print(f"Gemini API Error: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini API error: {e}")
        
    finally:
        # Clean up files
        if uploaded_file and uploaded_file.name is not None:
            print(f"Deleting file from Gemini API: {uploaded_file.name}")
            try:
                client.files.delete(name=uploaded_file.name)
            except Exception as e:
                print(f"Failed to delete file from Gemini: {e}")
                
        if os.path.exists(audio_path):
            print(f"Deleting local temporary file: {audio_path}")
            try:
                os.remove(audio_path)
            except Exception as e:
                print(f"Failed to delete local audio: {e}")

async def process_and_save_translation(db: Session, video_id: str, target_language: str):
    video = get_video(db, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    existing_sub = get_subtitle_by_language(db, video_id, target_language)
    if existing_sub:
        raise HTTPException(status_code=400, detail=f"Subtitle for {target_language} already exists")
        
    usage = get_usage(db)
    if usage["remaining_requests"] <= 0:
        raise HTTPException(status_code=429, detail="Daily Free Quota Exceeded")
        
    video_path = str(video.video_file_path)
    
    # 1. Extract Audio
    audio_path = extract_audio(video_path)
    
    # 2. Transcription & Translation via Gemini Single-Pass
    translated_blocks = await generate_subtitles_with_gemini(audio_path, target_language)
    
    if not translated_blocks:
        raise HTTPException(status_code=400, detail="No speech detected in video or generation failed.")
        
    increment_usage(db)
    
    # 3. Save
    video_dir = os.path.join(STORAGE_DIR, str(video_id))
    os.makedirs(video_dir, exist_ok=True)
    
    file_name = f"subs_{target_language.upper()}.json"
    file_path = os.path.join(video_dir, file_name)
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(translated_blocks, f, ensure_ascii=False, indent=2)
        
    new_subtitle = models.Subtitle(
        video_id=video_id,
        language_code=target_language.upper(),
        subtitle_file_path=file_path
    )
    
    db.add(new_subtitle)
    db.commit()
    db.refresh(new_subtitle)
    
    return {
        "subtitle_record": new_subtitle,
        "blocks": translated_blocks
    }

def save_subtitle_file(db: Session, video_id: str, language_code: str, blocks: list):
    subtitle = get_subtitle_by_language(db, video_id, language_code)
    if not subtitle:
        raise HTTPException(status_code=404, detail='Subtitle file not found')
    file_path = str(subtitle.subtitle_file_path)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump([b.dict() for b in blocks], f, ensure_ascii=False, indent=2)
    return True

def get_revisions(db: Session, video_id: str):
    return db.query(models.Revision).filter(models.Revision.video_id == video_id).order_by(models.Revision.created_at.desc()).limit(50).all()

def create_revision(db: Session, video_id: str, time: str, description: str):
    rev = models.Revision(video_id=video_id, time=time, description=description)
    db.add(rev)
    db.commit()
    db.refresh(rev)
    return rev

