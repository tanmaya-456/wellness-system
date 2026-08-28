from datetime import datetime, timedelta

from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.orm import Session

from database import get_db

from models import (
    TimetableEvent,
    WellnessRecord,
    DailyHabit,
    ActivityRecord,
    TimetableChange
)

from auth import get_current_user


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/planner",
    tags=["Daily Planner"]
)


# =========================================================
# TIME HELPERS
# =========================================================

def time_to_minutes(time_string):

    try:

        hours, minutes = map(
            int,
            time_string.split(":")
        )

        return hours * 60 + minutes

    except Exception:

        return None


def minutes_to_time(total_minutes):

    hours = total_minutes // 60

    minutes = total_minutes % 60

    return f"{hours:02d}:{minutes:02d}"


# =========================================================
# GET TODAY
# =========================================================

def get_today_name():

    return datetime.now().strftime("%A")


# =========================================================
# DAILY PLAN
# =========================================================

@router.get("/today")
def get_today_plan(

    current_user=Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    today = get_today_name()


    # =====================================================
    # GET TODAY'S CLASSES
    # =====================================================

    classes = db.query(
        TimetableEvent
    ).filter(

        TimetableEvent.user_id ==
        current_user.id,

        TimetableEvent.day_of_week ==
        today

    ).all()


    # =====================================================
    # TODAY'S TIMETABLE CHANGES
    # =====================================================

    today_date = datetime.now().strftime("%Y-%m-%d")

    changes = db.query(
        TimetableChange
    ).filter(
        TimetableChange.user_id == current_user.id,
        TimetableChange.change_date == today_date
    ).all()

    cancelled_subjects = {
        c.subject.strip().lower()
        for c in changes
        if c.change_type == "cancelled"
    }

    classes = [
        event for event in classes
        if event.subject.strip().lower() not in cancelled_subjects
    ]

    # Extra classes and modified classes are included as daily events.
    for change in changes:
        if change.change_type in {"extra", "modified"} and change.start_time and change.end_time:
            classes.append(
                TimetableEvent(
                    day_of_week=today,
                    subject=change.subject,
                    start_time=change.start_time,
                    end_time=change.end_time,
                    location=change.location
                )
            )

    # =====================================================
    # SORT CLASSES
    # =====================================================

    classes.sort(
        key=lambda event:
        time_to_minutes(
            event.start_time
        )
        if time_to_minutes(
            event.start_time
        ) is not None
        else 9999
    )


    # =====================================================
    # LATEST WELLNESS
    # =====================================================

    wellness = db.query(
        WellnessRecord
    ).filter(
        WellnessRecord.user_id ==
        current_user.id
    ).order_by(
        WellnessRecord.created_at.desc()
    ).first()


    # =====================================================
    # LATEST HABITS
    # =====================================================

    habit = db.query(
        DailyHabit
    ).filter(
        DailyHabit.user_id ==
        current_user.id
    ).order_by(
        DailyHabit.created_at.desc()
    ).first()


    # =====================================================
    # LATEST ACTIVITY
    # =====================================================

    activity = db.query(
        ActivityRecord
    ).filter(
        ActivityRecord.user_id ==
        current_user.id
    ).order_by(
        ActivityRecord.created_at.desc()
    ).first()


    # =====================================================
    # CREATE PLAN
    # =====================================================

    plan = []


    # =====================================================
    # ADD CLASSES + BREAKS
    # =====================================================

    current_time = 8 * 60


    for event in classes:

        start = time_to_minutes(
            event.start_time
        )

        end = time_to_minutes(
            event.end_time
        )


        if start is None or end is None:

            continue


        # -------------------------------------------------
        # FREE TIME BEFORE CLASS
        # -------------------------------------------------

        if start > current_time:

            gap = start - current_time


            if gap >= 30:

                plan.append({

                    "type":
                        "personal",

                    "start_time":
                        minutes_to_time(
                            current_time
                        ),

                    "end_time":
                        minutes_to_time(
                            start
                        ),

                    "title":
                        "Study / Personal Time",

                    "description":
                        "Use this time for focused study, assignments or personal tasks."

                })


        # -------------------------------------------------
        # CLASS
        # -------------------------------------------------

        plan.append({

            "type":
                "class",

            "start_time":
                event.start_time,

            "end_time":
                event.end_time,

            "title":
                event.subject,

            "description":
                (
                    f"Class"
                    +
                    (
                        f" • {event.location}"
                        if event.location
                        else ""
                    )
                )

        })


        current_time = end


        # -------------------------------------------------
        # BREAK AFTER CLASS
        # -------------------------------------------------

        if current_time < 17 * 60:

            plan.append({

                "type":
                    "break",

                "start_time":
                    minutes_to_time(
                        current_time
                    ),

                "end_time":
                    minutes_to_time(
                        min(
                            current_time + 15,
                            17 * 60
                        )
                    ),

                "title":
                    "Short Break",

                "description":
                    "Take a short break, hydrate and reset."

            })


            current_time += 15


    # =====================================================
    # EVENING
    # =====================================================

    if current_time < 17 * 60:

        plan.append({

            "type":
                "personal",

            "start_time":
                minutes_to_time(
                    current_time
                ),

            "end_time":
                "17:00",

            "title":
                "Study / Assignment Time",

            "description":
                "Work on important academic tasks."

        })


    # =====================================================
    # WELLNESS-AWARE ACTIVITY
    # =====================================================

    if wellness:

        stress = float(
            wellness.stress
        )

        energy = float(
            wellness.energy
        )


        if stress >= 7:

            activity_title = (
                "Relaxation & Recovery"
            )

            activity_description = (
                "Your recent stress level is relatively high. "
                "Take some time away from academic work."
            )


        elif energy <= 4:

            activity_title = (
                "Rest & Recovery"
            )

            activity_description = (
                "Your recent energy level is low. "
                "Use this time for recovery rather than intense work."
            )


        else:

            activity_title = (
                "Walk / Physical Activity"
            )

            activity_description = (
                "A short movement break can help you reset."
            )


    else:

        activity_title = (
            "Walk / Physical Activity"
        )

        activity_description = (
            "Take a short movement break."
        )


    # =====================================================
    # ADD EVENING ACTIVITY
    # =====================================================

    plan.append({

        "type":
            "wellness",

        "start_time":
            "17:30",

        "end_time":
            "18:00",

        "title":
            activity_title,

        "description":
            activity_description

    })


    # =====================================================
    # DINNER
    # =====================================================

    plan.append({

        "type":
            "break",

        "start_time":
            "20:00",

        "end_time":
            "20:45",

        "title":
            "Dinner",

        "description":
            "Take a proper meal break and step away from screens."

    })


    # =====================================================
    # WIND DOWN
    # =====================================================

    plan.append({

        "type":
            "wellness",

        "start_time":
            "22:00",

        "end_time":
            "22:30",

        "title":
            "Wind Down",

        "description":
            "Reduce screen use and prepare for sleep."

    })


    # =====================================================
    # SUMMARY
    # =====================================================

    return {

        "date":
            datetime.now().strftime(
                "%Y-%m-%d"
            ),

        "day":
            today,

        "wellness": {

            "mood":
                wellness.mood
                if wellness
                else None,

            "stress":
                wellness.stress
                if wellness
                else None,

            "energy":
                wellness.energy
                if wellness
                else None,

            "sleep_hours":
                wellness.sleep_hours
                if wellness
                else None

        },

        "has_timetable":
            len(classes) > 0,

        "class_count":
            len(classes),

        "change_count":
            len(changes),

        "changes": [
            {
                "type": c.change_type,
                "subject": c.subject,
                "notes": c.notes
            }
            for c in changes
        ],

        "plan":
            plan

    }