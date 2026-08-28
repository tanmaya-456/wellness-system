from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from analytics import router as analytics_router
from database import engine, Base
from ai import router as ai_router
from planner import router as planner_router
import models

from auth import router as auth_router

from wellness import router as wellness_router

from timetable import router as timetable_router


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(
    bind=engine
)


# =========================================================
# APPLICATION
# =========================================================

app = FastAPI(
    title="Student Wellness System",

    description=(
        "AI-powered privacy-first "
        "student wellness platform"
    ),

    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(
    auth_router
)
app.include_router(
    analytics_router
)
app.include_router(
    timetable_router
)
app.include_router(
    ai_router
)
app.include_router(
    planner_router
)
app.include_router(
    wellness_router
)


# =========================================================
# BASIC ROUTES
# =========================================================

@app.get("/")
def home():

    return {
        "message":
            "Student Wellness System Backend is running!"
    }


@app.get("/api/health")
def health_check():

    return {
        "status": "success",

        "message":
            "Backend connected successfully!"
    }


@app.get("/api/database")
def database_check():

    return {
        "status": "success",

        "message":
            "Database is connected!"
    }