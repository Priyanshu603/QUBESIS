from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth import get_current_user
from ..models import User, Asteroid, WatchedAsteroid
import requests
from datetime import datetime, timedelta
import os

router = APIRouter()

NASA_API_KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")  # Get from environment

@router.get("/feed")
def get_asteroid_feed(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get current asteroid feed from NASA"""
    try:
        today = datetime.now().date()
        start_date = today - timedelta(days=7)  # Get last 7 days
        end_date = today

        url = f"https://api.nasa.gov/neo/rest/v1/feed?start_date={start_date}&end_date={end_date}&api_key={NASA_API_KEY}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        # Process and store asteroids
        asteroids = []
        for date, neo_list in data['near_earth_objects'].items():
            for neo in neo_list:
                asteroid = {
                    'id': neo['id'],
                    'name': neo['name'],
                    'diameter_min': neo['estimated_diameter']['kilometers']['estimated_diameter_min'],
                    'diameter_max': neo['estimated_diameter']['kilometers']['estimated_diameter_max'],
                    'is_hazardous': neo['is_potentially_hazardous_asteroid'],
                    'velocity': float(neo['close_approach_data'][0]['relative_velocity']['kilometers_per_hour']),
                    'miss_distance': float(neo['close_approach_data'][0]['miss_distance']['kilometers']),
                    'close_approach_date': neo['close_approach_data'][0]['close_approach_date']
                }
                asteroids.append(asteroid)

                # Store in database if not exists
                db_asteroid = db.query(Asteroid).filter(Asteroid.id == neo['id']).first()
                if not db_asteroid:
                    db_asteroid = Asteroid(**asteroid)
                    db.add(db_asteroid)

        db.commit()
        return {"asteroids": asteroids}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/watch/{asteroid_id}")
def watch_asteroid(asteroid_id: str, alert_distance: float = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Add asteroid to watch list"""
    watched = WatchedAsteroid(
        user_id=current_user.id,
        asteroid_id=asteroid_id,
        alert_distance=alert_distance
    )
    db.add(watched)
    db.commit()
    return {"message": "Asteroid added to watch list"}

@router.get("/watched")
def get_watched_asteroids(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get user's watched asteroids"""
    watched = db.query(WatchedAsteroid).filter(WatchedAsteroid.user_id == current_user.id).all()
    return watched

@router.get("/risk/{asteroid_id}")
def get_risk_analysis(asteroid_id: str, db: Session = Depends(get_db)):
    """Calculate risk score for asteroid"""
    asteroid = db.query(Asteroid).filter(Asteroid.id == asteroid_id).first()
    if not asteroid:
        raise HTTPException(status_code=404, detail="Asteroid not found")

    # Simple risk calculation
    risk_score = 0
    if asteroid.is_hazardous:
        risk_score += 50
    if asteroid.diameter_max > 1:
        risk_score += 30
    if asteroid.miss_distance < 10000000:  # Within 10 million km
        risk_score += 20

    risk_level = "Low" if risk_score < 30 else "Medium" if risk_score < 70 else "High"

    return {
        "asteroid_id": asteroid_id,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "factors": {
            "hazardous": asteroid.is_hazardous,
            "diameter": asteroid.diameter_max,
            "miss_distance": asteroid.miss_distance
        }
    }
