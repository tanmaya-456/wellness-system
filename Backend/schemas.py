from pydantic import BaseModel


# =========================================================
# AUTH
# =========================================================

class UserCreate(BaseModel):

    username: str
    password: str


class Token(BaseModel):

    access_token: str
    token_type: str


# =========================================================
# WELLNESS CHECK-IN
# =========================================================

class WellnessCreate(BaseModel):

    mood: float
    stress: float
    sleep_hours: float
    sleep_quality: float
    energy: float
    academic_workload: float
    social_connection: float


# =========================================================
# JOURNAL
# =========================================================

class JournalCreate(BaseModel):

    content: str


# =========================================================
# ACTIVITY
# =========================================================

class ActivityCreate(BaseModel):

    activity_type: str
    duration_minutes: int


# =========================================================
# TIMETABLE
# =========================================================

class TimetableCreate(BaseModel):

    day_of_week: str
    subject: str
    start_time: str
    end_time: str
    location: str | None = None


# =========================================================
# SCREEN TIME
# =========================================================

class ScreenTimeCreate(BaseModel):

    device_type: str
    app_name: str
    duration_minutes: int
    source: str


# =========================================================
# WEARABLE
# =========================================================

class WearableCreate(BaseModel):

    source: str

    sleep_hours: float | None = None

    steps: int | None = None

    heart_rate: float | None = None

    resting_heart_rate: float | None = None

    exercise_minutes: int | None = None


# =========================================================
# DAILY HABITS
# =========================================================

class HabitCreate(BaseModel):

    study_minutes: int | None = None

    exercise_minutes: int | None = None

    water_glasses: int | None = None

    meditation_minutes: int | None = None

    meals_count: int | None = None

    # =========================================================
# TIMETABLE DAILY CHANGE
# =========================================================

class TimetableChangeCreate(BaseModel):

    change_date: str

    change_type: str

    subject: str

    start_time: str | None = None

    end_time: str | None = None

    location: str | None = None

    notes: str | None = None