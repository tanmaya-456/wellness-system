from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db

from models import (
    WellnessRecord,
    JournalEntry,
    ActivityRecord,
    TimetableEvent,
    ScreenTimeRecord,
    WearableRecord,
    DailyHabit
)

from schemas import (
    WellnessCreate,
    JournalCreate,
    ActivityCreate,
    TimetableCreate,
    ScreenTimeCreate,
    WearableCreate,
    HabitCreate
)

from auth import get_current_user


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/wellness",
    tags=["Wellness"]
)


# =========================================================
# WELLNESS CHECK-IN
# =========================================================

@router.post("/checkin")
def create_checkin(
    data: WellnessCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    record = WellnessRecord(
        user_id=current_user.id,
        mood=data.mood,
        stress=data.stress,
        sleep_hours=data.sleep_hours,
        sleep_quality=data.sleep_quality,
        energy=data.energy,
        academic_workload=data.academic_workload,
        social_connection=data.social_connection,
        source="self_report"
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "message": "Wellness check-in saved.",
        "record_id": record.id
    }


# =========================================================
# WELLNESS HISTORY
# =========================================================

@router.get("/history")
def get_wellness_history(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    records = db.query(
        WellnessRecord
    ).filter(
        WellnessRecord.user_id == current_user.id
    ).order_by(
        WellnessRecord.created_at.desc()
    ).all()

    return records


# =========================================================
# JOURNAL
# =========================================================

@router.post("/journal")
def create_journal(
    data: JournalCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    entry = JournalEntry(
        user_id=current_user.id,
        content=data.content
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {
        "message": "Journal entry saved.",
        "entry_id": entry.id
    }


@router.get("/journal")
def get_journals(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    entries = db.query(
        JournalEntry
    ).filter(
        JournalEntry.user_id == current_user.id
    ).order_by(
        JournalEntry.created_at.desc()
    ).all()

    return entries


# =========================================================
# ACTIVITY
# =========================================================

@router.post("/activity")
def create_activity(
    data: ActivityCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    activity = ActivityRecord(
        user_id=current_user.id,
        activity_type=data.activity_type,
        duration_minutes=data.duration_minutes,
        source="self_report"
    )

    db.add(activity)
    db.commit()
    db.refresh(activity)

    return {
        "message": "Activity saved.",
        "activity_id": activity.id
    }


@router.get("/activity")
def get_activities(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    activities = db.query(
        ActivityRecord
    ).filter(
        ActivityRecord.user_id == current_user.id
    ).order_by(
        ActivityRecord.created_at.desc()
    ).all()

    return activities


# =========================================================
# TIMETABLE
# =========================================================

@router.post("/timetable")
def create_timetable_event(
    data: TimetableCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    event = TimetableEvent(
        user_id=current_user.id,
        day_of_week=data.day_of_week,
        subject=data.subject,
        start_time=data.start_time,
        end_time=data.end_time,
        location=data.location
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "message": "Timetable event saved.",
        "event_id": event.id
    }


@router.get("/timetable")
def get_timetable(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    events = db.query(
        TimetableEvent
    ).filter(
        TimetableEvent.user_id == current_user.id
    ).all()

    return events


# =========================================================
# SCREEN TIME
# =========================================================

@router.post("/screen-time")
def create_screen_time(
    data: ScreenTimeCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    record = ScreenTimeRecord(
        user_id=current_user.id,
        device_type=data.device_type,
        app_name=data.app_name,
        duration_minutes=data.duration_minutes,
        source=data.source
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "message": "Screen-time data saved.",
        "record_id": record.id
    }


@router.get("/screen-time")
def get_screen_time(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    records = db.query(
        ScreenTimeRecord
    ).filter(
        ScreenTimeRecord.user_id == current_user.id
    ).order_by(
        ScreenTimeRecord.recorded_at.desc()
    ).all()

    return records


# =========================================================
# WEARABLE
# =========================================================

@router.post("/wearable")
def create_wearable_record(
    data: WearableCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    record = WearableRecord(
        user_id=current_user.id,
        source=data.source,
        sleep_hours=data.sleep_hours,
        steps=data.steps,
        heart_rate=data.heart_rate,
        resting_heart_rate=data.resting_heart_rate,
        exercise_minutes=data.exercise_minutes
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "message": "Wearable data saved.",
        "record_id": record.id
    }


@router.get("/wearable")
def get_wearable_data(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    records = db.query(
        WearableRecord
    ).filter(
        WearableRecord.user_id == current_user.id
    ).order_by(
        WearableRecord.recorded_at.desc()
    ).all()

    return records


# =========================================================
# DAILY HABITS
# =========================================================

@router.post("/habits")
def create_habit_record(
    data: HabitCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    habit = DailyHabit(
        user_id=current_user.id,
        study_minutes=data.study_minutes,
        exercise_minutes=data.exercise_minutes,
        water_glasses=data.water_glasses,
        meditation_minutes=data.meditation_minutes,
        meals_count=data.meals_count
    )

    db.add(habit)
    db.commit()
    db.refresh(habit)

    return {
        "message": "Daily habits saved.",
        "record_id": habit.id
    }


@router.get("/habits")
def get_habits(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    records = db.query(
        DailyHabit
    ).filter(
        DailyHabit.user_id == current_user.id
    ).order_by(
        DailyHabit.created_at.desc()
    ).all()

    return records