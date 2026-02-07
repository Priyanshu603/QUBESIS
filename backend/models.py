from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    watched_asteroids = relationship("WatchedAsteroid", back_populates="user")
    alerts = relationship("Alert", back_populates="user")

class Asteroid(Base):
    __tablename__ = "asteroids"

    id = Column(String, primary_key=True)  # NASA ID
    name = Column(String)
    diameter_min = Column(Float)
    diameter_max = Column(Float)
    is_hazardous = Column(Boolean)
    velocity = Column(Float)
    miss_distance = Column(Float)
    close_approach_date = Column(DateTime)
    last_updated = Column(DateTime, default=datetime.utcnow)

    # Relationships
    watchers = relationship("WatchedAsteroid", back_populates="asteroid")

class WatchedAsteroid(Base):
    __tablename__ = "watched_asteroids"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    asteroid_id = Column(String, ForeignKey("asteroids.id"))
    alert_distance = Column(Float)  # Custom alert threshold
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="watched_asteroids")
    asteroid = relationship("Asteroid", back_populates="watchers")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    asteroid_id = Column(String, ForeignKey("asteroids.id"))
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="alerts")
