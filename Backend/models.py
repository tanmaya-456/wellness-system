from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship

from datetime import datetime

from database import Base


# =========================================================
# USER
# =========================================================

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


    # -----------------------------------------------------
    # RELATIONSHIPS
    # -----------------------------------------------------

    wellness_records = relationship(
        "WellnessRecord",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    journal_entries = relationship(
        "JournalEntry",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    activities = relationship(
        "ActivityRecord",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    timetable_events = relationship(
        "TimetableEvent",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # IMPORTANT:
    # This must match:
    # back_populates="timetable_changes"
    # inside TimetableChange

    timetable_changes = relationship(
        "TimetableChange",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    screen_time_records = relationship(
        "ScreenTimeRecord",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    wearable_records = relationship(
        "WearableRecord",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    habit_records = relationship(
        "DailyHabit",
        back_populates="user",
        cascade="all, delete-orphan"
    )


# =========================================================
# WELLNESS CHECK-IN
# =========================================================

class WellnessRecord(Base):

    __tablename__ = "wellness_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    mood = Column(
        Float,
        nullable=False
    )

    stress = Column(
        Float,
        nullable=False
    )

    sleep_hours = Column(
        Float,
        nullable=False
    )

    sleep_quality = Column(
        Float,
        nullable=False
    )

    energy = Column(
        Float,
        nullable=False
    )

    academic_workload = Column(
        Float,
        nullable=False
    )

    social_connection = Column(
        Float,
        nullable=False
    )

    source = Column(
        String,
        default="self_report"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship(
        "User",
        back_populates="wellness_records"
    )


# =========================================================
# JOURNAL
# =========================================================

class JournalEntry(Base):

    __tablename__ = "journal_entries"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    content = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship(
        "User",
        back_populates="journal_entries"
    )


# =========================================================
# ACTIVITY
# =========================================================

class ActivityRecord(Base):

    __tablename__ = "activities"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    activity_type = Column(
        String,
        nullable=False
    )

    duration_minutes = Column(
        Integer,
        nullable=False
    )

    source = Column(
        String,
        default="self_report"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship(
        "User",
        back_populates="activities"
    )


# =========================================================
# TIMETABLE
# =========================================================

class TimetableEvent(Base):

    __tablename__ = "timetable_events"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    day_of_week = Column(
        String,
        nullable=False
    )

    subject = Column(
        String,
        nullable=False
    )

    start_time = Column(
        String,
        nullable=False
    )

    end_time = Column(
        String,
        nullable=False
    )

    location = Column(
        String,
        nullable=True
    )

    user = relationship(
        "User",
        back_populates="timetable_events"
    )


# =========================================================
# TIMETABLE DAILY CHANGES
# =========================================================

class TimetableChange(Base):

    __tablename__ = "timetable_changes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    # Date on which this change applies
    # Example: "2026-08-28"

    change_date = Column(
        String,
        nullable=False
    )

    # cancelled / extra / modified

    change_type = Column(
        String,
        nullable=False
    )

    subject = Column(
        String,
        nullable=False
    )

    start_time = Column(
        String,
        nullable=True
    )

    end_time = Column(
        String,
        nullable=True
    )

    location = Column(
        String,
        nullable=True
    )

    notes = Column(
        Text,
        nullable=True
    )

    user = relationship(
        "User",
        back_populates="timetable_changes"
    )


# =========================================================
# SCREEN TIME
# =========================================================

class ScreenTimeRecord(Base):

    __tablename__ = "screen_time_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    device_type = Column(
        String,
        nullable=False
    )

    app_name = Column(
        String,
        nullable=False
    )

    duration_minutes = Column(
        Integer,
        nullable=False
    )

    source = Column(
        String,
        nullable=False
    )

    recorded_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship(
        "User",
        back_populates="screen_time_records"
    )


# =========================================================
# WEARABLE / HEALTH DATA
# =========================================================

class WearableRecord(Base):

    __tablename__ = "wearable_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    source = Column(
        String,
        nullable=False
    )

    sleep_hours = Column(
        Float,
        nullable=True
    )

    steps = Column(
        Integer,
        nullable=True
    )

    heart_rate = Column(
        Float,
        nullable=True
    )

    resting_heart_rate = Column(
        Float,
        nullable=True
    )

    exercise_minutes = Column(
        Integer,
        nullable=True
    )

    recorded_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship(
        "User",
        back_populates="wearable_records"
    )


# =========================================================
# DAILY HABITS
# =========================================================

class DailyHabit(Base):

    __tablename__ = "daily_habits"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    study_minutes = Column(
        Integer,
        nullable=True
    )

    exercise_minutes = Column(
        Integer,
        nullable=True
    )

    water_glasses = Column(
        Integer,
        nullable=True
    )

    meditation_minutes = Column(
        Integer,
        nullable=True
    )

    meals_count = Column(
        Integer,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship(
        "User",
        back_populates="habit_records"
    )