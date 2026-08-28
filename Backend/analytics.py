from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db

from models import (
    WellnessRecord,
    ActivityRecord,
    ScreenTimeRecord,
    WearableRecord,
    DailyHabit
)

from auth import get_current_user


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)


# =========================================================
# OVERVIEW
# =========================================================

@router.get("/overview")
def get_analytics_overview(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =====================================================
    # WELLNESS
    # =====================================================

    wellness_records = db.query(
        WellnessRecord
    ).filter(
        WellnessRecord.user_id == current_user.id
    ).order_by(
        WellnessRecord.created_at.asc()
    ).all()


    if wellness_records:

        average_mood = round(
            sum(
                float(r.mood)
                for r in wellness_records
            ) / len(wellness_records),
            2
        )

        average_stress = round(
            sum(
                float(r.stress)
                for r in wellness_records
            ) / len(wellness_records),
            2
        )

        average_energy = round(
            sum(
                float(r.energy)
                for r in wellness_records
            ) / len(wellness_records),
            2
        )

        average_sleep = round(
            sum(
                float(r.sleep_hours)
                for r in wellness_records
            ) / len(wellness_records),
            2
        )

        average_workload = round(
            sum(
                float(r.academic_workload)
                for r in wellness_records
            ) / len(wellness_records),
            2
        )

        average_social = round(
            sum(
                float(r.social_connection)
                for r in wellness_records
            ) / len(wellness_records),
            2
        )

    else:

        average_mood = 0
        average_stress = 0
        average_energy = 0
        average_sleep = 0
        average_workload = 0
        average_social = 0


    # =====================================================
    # WELLNESS TREND
    # =====================================================

    wellness_trend = []


    for record in wellness_records:

        wellness_trend.append({

            "date":
                record.created_at.strftime(
                    "%Y-%m-%d"
                ),

            "mood":
                float(record.mood),

            "stress":
                float(record.stress),

            "energy":
                float(record.energy),

            "sleep":
                float(record.sleep_hours)

        })


    # =====================================================
    # HABITS
    # =====================================================

    habit_records = db.query(
        DailyHabit
    ).filter(
        DailyHabit.user_id == current_user.id
    ).all()


    if habit_records:

        study_values = [
            r.study_minutes
            for r in habit_records
            if r.study_minutes is not None
        ]

        exercise_values = [
            r.exercise_minutes
            for r in habit_records
            if r.exercise_minutes is not None
        ]

        water_values = [
            r.water_glasses
            for r in habit_records
            if r.water_glasses is not None
        ]

        meditation_values = [
            r.meditation_minutes
            for r in habit_records
            if r.meditation_minutes is not None
        ]


        average_study = round(
            sum(study_values) /
            len(study_values),
            2
        ) if study_values else 0


        average_exercise = round(
            sum(exercise_values) /
            len(exercise_values),
            2
        ) if exercise_values else 0


        average_water = round(
            sum(water_values) /
            len(water_values),
            2
        ) if water_values else 0


        average_meditation = round(
            sum(meditation_values) /
            len(meditation_values),
            2
        ) if meditation_values else 0

    else:

        average_study = 0
        average_exercise = 0
        average_water = 0
        average_meditation = 0


    # =====================================================
    # ACTIVITY
    # =====================================================

    activities = db.query(
        ActivityRecord
    ).filter(
        ActivityRecord.user_id == current_user.id
    ).all()


    total_activity_minutes = sum(
        int(activity.duration_minutes)
        for activity in activities
    )


    # =====================================================
    # SCREEN TIME
    # =====================================================

    screen_records = db.query(
        ScreenTimeRecord
    ).filter(
        ScreenTimeRecord.user_id == current_user.id
    ).all()


    total_screen_minutes = sum(
        int(record.duration_minutes)
        for record in screen_records
    )


    # =====================================================
    # MOST USED APP
    # =====================================================

    app_usage = {}


    for record in screen_records:

        app = record.app_name

        app_usage[app] = (
            app_usage.get(app, 0)
            + int(record.duration_minutes)
        )


    most_used_app = None


    if app_usage:

        most_used_app = max(
            app_usage,
            key=app_usage.get
        )


    # =====================================================
    # WEARABLE
    # =====================================================

    wearable_records = db.query(
        WearableRecord
    ).filter(
        WearableRecord.user_id == current_user.id
    ).all()


    wearable_sleep = [
        r.sleep_hours
        for r in wearable_records
        if r.sleep_hours is not None
    ]


    wearable_steps = [
        r.steps
        for r in wearable_records
        if r.steps is not None
    ]


    wearable_exercise = [
        r.exercise_minutes
        for r in wearable_records
        if r.exercise_minutes is not None
    ]


    average_wearable_sleep = round(
        sum(wearable_sleep) /
        len(wearable_sleep),
        2
    ) if wearable_sleep else 0


    average_steps = round(
        sum(wearable_steps) /
        len(wearable_steps),
        0
    ) if wearable_steps else 0


    average_wearable_exercise = round(
        sum(wearable_exercise) /
        len(wearable_exercise),
        2
    ) if wearable_exercise else 0


    # =====================================================
    # RETURN
    # =====================================================

    return {

        "wellness": {

            "average_mood":
                average_mood,

            "average_stress":
                average_stress,

            "average_energy":
                average_energy,

            "average_sleep":
                average_sleep,

            "average_academic_workload":
                average_workload,

            "average_social_connection":
                average_social

        },


        "wellness_trend":
            wellness_trend,


        "habits": {

            "average_study_minutes":
                average_study,

            "average_exercise_minutes":
                average_exercise,

            "average_water_glasses":
                average_water,

            "average_meditation_minutes":
                average_meditation

        },


        "activity": {

            "total_activity_minutes":
                total_activity_minutes,

            "activity_records":
                len(activities)

        },


        "screen_time": {

            "total_minutes":
                total_screen_minutes,

            "record_count":
                len(screen_records),

            "most_used_app":
                most_used_app

        },


        "wearable": {

            "average_sleep":
                average_wearable_sleep,

            "average_steps":
                average_steps,

            "average_exercise_minutes":
                average_wearable_exercise,

            "record_count":
                len(wearable_records)

        },

        "record_counts": {

            "wellness":
                len(wellness_records),

            "habits":
                len(habit_records),

            "activity":
                len(activities),

            "screen_time":
                len(screen_records),

            "wearable":
                len(wearable_records)

        }

    }