from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

import os
base_dir = os.path.abspath(".")
os.makedirs(base_dir, exist_ok=True)
db_path = os.path.join(base_dir, "subtitle_generator.db")
# Ensure the path is compatible with SQLAlchemy SQLite URL format
db_url = f"sqlite:///{db_path}"

SQLALCHEMY_DATABASE_URL = db_url
# If we were using PostgreSQL, the URL would look like:
# SQLALCHEMY_DATABASE_URL = "postgresql://user:password@postgresserver/db"

# connect_args={"check_same_thread": False} is needed only for SQLite.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
