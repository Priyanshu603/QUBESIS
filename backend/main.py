from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, asteroids, alerts

app = FastAPI(title="Cosmic Watch API", version="1.0.0")

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(asteroids.router, prefix="/asteroids", tags=["asteroids"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])

@app.get("/")
async def root():
    return {"message": "Welcome to Cosmic Watch API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
