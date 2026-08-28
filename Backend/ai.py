import json

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from database import get_db

from models import (
    WellnessRecord,
    DailyHabit,
    ActivityRecord,
    ScreenTimeRecord,
    WearableRecord,
    JournalEntry,
    TimetableEvent
)

from auth import get_current_user

from timetable import client


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Insights"]
)


# =========================================================
# AI PROMPT
# =========================================================

AI_PROMPT = """
You are a supportive student wellness assistant.

Analyze the student's recent wellness data.

Your job is NOT to diagnose mental-health conditions.

Instead:

1. Identify meaningful patterns.
2. Explain them in simple language.
3. Suggest practical, low-risk actions.
4. Encourage healthy routines.
5. If concerning patterns appear, recommend talking
   to a trusted person or qualified professional.

Do not make medical diagnoses.

Do not claim certainty about the student's mental state.

Use phrases such as:

"Your data suggests..."
"There appears to be a pattern..."
"It may be helpful to..."

Return ONLY valid JSON in this exact structure:

{
    "summary": "short overall summary",

    "patterns": [
        "pattern 1",
        "pattern 2"
    ],

    "suggestions": [
        "suggestion 1",
        "suggestion 2",
        "suggestion 3"
    ],

    "watch_for": [
        "thing to monitor"
    ],

    "support_note": "short supportive message"
}

Keep the response concise and student-friendly.
"""


# =========================================================
# AI INSIGHTS
# =========================================================

@router.get("/insights")
def get_ai_insights(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # =====================================================
    # GET WELLNESS DATA
    # =====================================================

    wellness = db.query(
        WellnessRecord
    ).filter(
        WellnessRecord.user_id == current_user.id
    ).order_by(
        WellnessRecord.created_at.desc()
    ).limit(14).all()


    # =====================================================
    # GET HABITS
    # =====================================================

    habits = db.query(
        DailyHabit
    ).filter(
        DailyHabit.user_id == current_user.id
    ).order_by(
        DailyHabit.created_at.desc()
    ).limit(14).all()


    # =====================================================
    # GET ACTIVITY
    # =====================================================

    activities = db.query(
        ActivityRecord
    ).filter(
        ActivityRecord.user_id == current_user.id
    ).order_by(
        ActivityRecord.created_at.desc()
    ).limit(20).all()


    # =====================================================
    # GET SCREEN TIME
    # =====================================================

    screen_time = db.query(
        ScreenTimeRecord
    ).filter(
        ScreenTimeRecord.user_id == current_user.id
    ).order_by(
        ScreenTimeRecord.recorded_at.desc()
    ).limit(30).all()


    # =====================================================
    # GET WEARABLE DATA
    # =====================================================

    wearable = db.query(
        WearableRecord
    ).filter(
        WearableRecord.user_id == current_user.id
    ).order_by(
        WearableRecord.recorded_at.desc()
    ).limit(14).all()


    # =====================================================
    # GET JOURNALS
    # =====================================================

    journals = db.query(
        JournalEntry
    ).filter(
        JournalEntry.user_id == current_user.id
    ).order_by(
        JournalEntry.created_at.desc()
    ).limit(10).all()


    # =====================================================
    # GET TIMETABLE
    # =====================================================

    timetable = db.query(
        TimetableEvent
    ).filter(
        TimetableEvent.user_id == current_user.id
    ).all()


    # =====================================================
    # PREPARE DATA FOR GEMINI
    # =====================================================

    student_data = {

        "wellness": [

            {
                "date":
                    r.created_at.strftime(
                        "%Y-%m-%d"
                    ),

                "mood":
                    r.mood,

                "stress":
                    r.stress,

                "sleep_hours":
                    r.sleep_hours,

                "sleep_quality":
                    r.sleep_quality,

                "energy":
                    r.energy,

                "academic_workload":
                    r.academic_workload,

                "social_connection":
                    r.social_connection
            }

            for r in wellness
        ],


        "habits": [

            {
                "date":
                    r.created_at.strftime(
                        "%Y-%m-%d"
                    ),

                "study_minutes":
                    r.study_minutes,

                "exercise_minutes":
                    r.exercise_minutes,

                "water_glasses":
                    r.water_glasses,

                "meditation_minutes":
                    r.meditation_minutes,

                "meals_count":
                    r.meals_count
            }

            for r in habits
        ],


        "activity": [

            {
                "type":
                    r.activity_type,

                "duration_minutes":
                    r.duration_minutes
            }

            for r in activities
        ],


        "screen_time": [

            {
                "device":
                    r.device_type,

                "app":
                    r.app_name,

                "minutes":
                    r.duration_minutes
            }

            for r in screen_time
        ],


        "wearable": [

            {
                "source":
                    r.source,

                "sleep_hours":
                    r.sleep_hours,

                "steps":
                    r.steps,

                "heart_rate":
                    r.heart_rate,

                "resting_heart_rate":
                    r.resting_heart_rate,

                "exercise_minutes":
                    r.exercise_minutes
            }

            for r in wearable
        ],


        "journal": [

            {
                "date":
                    r.created_at.strftime(
                        "%Y-%m-%d"
                    ),

                "content":
                    r.content
            }

            for r in journals
        ],


        "timetable": [

            {
                "day":
                    r.day_of_week,

                "subject":
                    r.subject,

                "start":
                    r.start_time,

                "end":
                    r.end_time,

                "location":
                    r.location
            }

            for r in timetable
        ]

    }


    # =====================================================
    # CHECK FOR DATA
    # =====================================================

    if (
        not wellness
        and
        not habits
        and
        not journals
    ):

        return {

            "summary":
                "I need a little more information before I can identify useful patterns.",

            "patterns": [],

            "suggestions": [

                "Complete a wellness check-in.",

                "Record some daily habits.",

                "Write a journal entry if you feel comfortable."

            ],

            "watch_for": [],

            "support_note":
                "Small amounts of consistent data will help make your insights more meaningful."

        }


    # =====================================================
    # BUILD GEMINI PROMPT
    # =====================================================

    prompt = (
        AI_PROMPT
        + "\n\nSTUDENT DATA:\n"
        + json.dumps(
            student_data,
            default=str
        )
    )


    # =====================================================
    # GEMINI MODEL FALLBACK
    # =====================================================

    models_to_try = [

        "gemini-3.7-flash",

        "gemini-2.5-flash",

        "gemini-3.5-flash-lite"




    ]


    response = None

    last_error = None


    # =====================================================
    # TRY GEMINI
    # =====================================================

    for model_name in models_to_try:

        try:

            print("")
            print(
                f"Trying Gemini model: {model_name}"
            )


            response = client.models.generate_content(

                model=model_name,

                contents=prompt

            )


            print(
                f"Gemini success using: {model_name}"
            )


            break


        except Exception as error:

            print("")
            print(
                f"Gemini model {model_name} failed:"
            )

            print(error)

            last_error = error


    # =====================================================
    # ALL MODELS FAILED
    # =====================================================

    if response is None:

        print("")
        print("====================================")
        print("ALL GEMINI MODELS FAILED")
        print("====================================")
        print(last_error)
        print("====================================")
        print("")


        raise HTTPException(

            status_code=503,

            detail=(
                "Gemini AI is temporarily unavailable. "
                "Please try again in a moment."
            )

        )


    # =====================================================
    # READ GEMINI RESPONSE
    # =====================================================

    try:

        if not response.text:

            raise ValueError(
                "Gemini returned an empty response."
            )


        text = response.text.strip()


        # -------------------------------------------------
        # REMOVE MARKDOWN CODE FENCES
        # -------------------------------------------------

        if text.startswith("```"):

            text = text.replace(
                "```json",
                ""
            )

            text = text.replace(
                "```",
                ""
            )

            text = text.strip()


        # -------------------------------------------------
        # PARSE JSON
        # -------------------------------------------------

        result = json.loads(
            text
        )


    except Exception as error:

        print("")
        print("====================================")
        print("AI JSON PARSING ERROR")
        print("====================================")

        print(error)

        print("")

        print("AI RESPONSE:")

        print(
            response.text
        )

        print("====================================")
        print("")


        raise HTTPException(

            status_code=500,

            detail=(
                "AI returned an invalid response."
            )

        )


    # =====================================================
    # VALIDATE RESULT
    # =====================================================

    if not isinstance(
        result,
        dict
    ):

        raise HTTPException(

            status_code=500,

            detail=(
                "AI returned an invalid response structure."
            )

        )


    # =====================================================
    # DEFAULT VALUES
    # =====================================================

    result.setdefault(

        "summary",

        "No summary was generated."

    )


    result.setdefault(

        "patterns",

        []

    )


    result.setdefault(

        "suggestions",

        []

    )


    result.setdefault(

        "watch_for",

        []

    )


    result.setdefault(

        "support_note",

        (
            "Take care of yourself and pay "
            "attention to your overall wellbeing."
        )

    )


    # =====================================================
    # RETURN
    # =====================================================

    return result

# =========================================================
# PATTERN-BASED WELLNESS RISK CHECK
# =========================================================

@router.get("/risk")
def get_wellness_risk(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    A transparent, non-diagnostic safety signal based only on
    recent self-reported wellness values. This is not a medical
    assessment and does not replace professional support.
    """

    records = (
        db.query(WellnessRecord)
        .filter(WellnessRecord.user_id == current_user.id)
        .order_by(WellnessRecord.created_at.desc())
        .limit(7)
        .all()
    )

    if not records:
        return {
            "level": "low",
            "label": "Not enough data",
            "score": 0,
            "factors": [],
            "message": "Complete a few check-ins to establish your personal pattern.",
            "disclaimer": "This is a wellness signal, not a medical diagnosis."
        }

    latest = records[0]
    score = 0
    factors = []

    stress = float(latest.stress)
    mood = float(latest.mood)
    energy = float(latest.energy)
    sleep = float(latest.sleep_hours)

    if stress >= 8:
        score += 3
        factors.append("Recent stress is high.")
    elif stress >= 7:
        score += 2
        factors.append("Recent stress is elevated.")

    if mood <= 3:
        score += 3
        factors.append("Recent mood is low.")
    elif mood <= 4:
        score += 2
        factors.append("Recent mood is below your usual range.")

    if energy <= 3:
        score += 2
        factors.append("Recent energy is low.")
    elif energy <= 4:
        score += 1
        factors.append("Recent energy is reduced.")

    if sleep < 5:
        score += 2
        factors.append("Recent sleep duration is quite low.")
    elif sleep < 6:
        score += 1
        factors.append("Recent sleep duration is below 6 hours.")

    if len(records) >= 3:
        recent = records[:3]
        if all(float(r.stress) >= 7 for r in recent):
            score += 2
            factors.append("Elevated stress has persisted across recent check-ins.")
        if all(float(r.mood) <= 4 for r in recent):
            score += 2
            factors.append("Low mood has persisted across recent check-ins.")

    if len(records) >= 2:
        previous = records[1]
        if stress - float(previous.stress) >= 2:
            score += 1
            factors.append("Stress increased noticeably since the previous check-in.")
        if float(previous.mood) - mood >= 2:
            score += 1
            factors.append("Mood decreased noticeably since the previous check-in.")

    if score >= 8:
        level = "high"
        label = "Higher concern"
        message = (
            "Several recent signals suggest that extra support may be helpful. "
            "Consider talking with someone you trust or a qualified professional."
        )
    elif score >= 4:
        level = "moderate"
        label = "Worth paying attention"
        message = (
            "Some recent signals stand out. Consider slowing down, checking your "
            "routine, and reaching out for support if this pattern continues."
        )
    else:
        level = "low"
        label = "Looking relatively stable"
        message = (
            "Your recent check-ins do not show a strong cluster of concerning signals. "
            "Keep checking in and pay attention to changes over time."
        )

    return {
        "level": level,
        "label": label,
        "score": score,
        "factors": factors,
        "message": message,
        "disclaimer": "This is a wellness signal, not a medical diagnosis."
    }
