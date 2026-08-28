import os
import json

from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    HTTPException
)

from sqlalchemy.orm import Session

from dotenv import load_dotenv

from google import genai
from google.genai import types

from database import get_db
from models import (
    TimetableEvent,
    TimetableChange
)
from schemas import (
    TimetableChangeCreate
)
from auth import get_current_user


# =========================================================
# ENVIRONMENT
# =========================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not configured.")

client = genai.Client(
    api_key=GEMINI_API_KEY
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/timetable",
    tags=["Timetable"]
)


# =========================================================
# AI PROMPT
# =========================================================

TIMETABLE_PROMPT = """
You are a timetable extraction system.

Analyze the uploaded timetable image.

Extract every class/event that can be reliably identified.

Return ONLY valid JSON in this exact structure:

{
    "events": [
        {
            "day_of_week": "Monday",
            "subject": "Mathematics",
            "start_time": "09:00",
            "end_time": "10:00",
            "location": "Room 201"
        }
    ]
}

Rules:

1. Identify the correct day for every class.
2. Convert times to 24-hour format.
3. Preserve the actual subject names.
4. Extract room/location when visible.
5. Do not invent missing information.
6. If the room is not visible, use null.
7. If a time cannot be determined reliably, do not invent it.
8. Ignore decorative text, logos and unrelated information.
9. Extract all visible classes.
10. Return only JSON.
"""


# =========================================================
# EXTRACT TIMETABLE FROM IMAGE
# =========================================================

@router.post("/extract")
async def extract_timetable(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):

    # -----------------------------------------------------
    # CHECK FILE TYPE
    # -----------------------------------------------------

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/jpg"
    }

    if file.content_type not in allowed_types:

        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG or WEBP timetable image."
        )


    # -----------------------------------------------------
    # READ IMAGE
    # -----------------------------------------------------

    image_bytes = await file.read()

    if not image_bytes:

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )


    # -----------------------------------------------------
    # SEND IMAGE TO GEMINI
    # -----------------------------------------------------

    try:

        image_part = types.Part.from_bytes(
            data=image_bytes,
            mime_type=file.content_type
        )


        response = client.models.generate_content(

            model="gemini-3.7-flash",

            contents=[
                image_part,
                TIMETABLE_PROMPT
            ],

            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )


    except Exception as error:

        print("========================================")
        print("GEMINI ERROR")
        print(repr(error))
        print("========================================")

        raise HTTPException(
            status_code=500,
            detail=f"Gemini error: {str(error)}"
        )


    # -----------------------------------------------------
    # READ AI RESPONSE
    # -----------------------------------------------------

    try:

        text = response.text.strip()

        result = json.loads(text)


    except Exception as error:

        print("========================================")
        print("JSON PARSING ERROR")
        print(repr(error))
        print("AI RESPONSE:")
        print(response.text)
        print("========================================")

        raise HTTPException(
            status_code=500,
            detail="AI could not produce a valid timetable."
        )


    # -----------------------------------------------------
    # VALIDATE RESPONSE
    # -----------------------------------------------------

    if not isinstance(result, dict):

        raise HTTPException(
            status_code=500,
            detail="Invalid timetable structure returned by AI."
        )


    if "events" not in result:

        raise HTTPException(
            status_code=500,
            detail="AI response does not contain timetable events."
        )


    if not isinstance(result["events"], list):

        raise HTTPException(
            status_code=500,
            detail="Timetable events must be a list."
        )


    # -----------------------------------------------------
    # RETURN EXTRACTED EVENTS
    # -----------------------------------------------------

    return {
        "message": "Timetable extracted successfully.",
        "events": result["events"]
    }


# =========================================================
# SAVE CONFIRMED TIMETABLE
# =========================================================

@router.post("/save")
async def save_timetable(
    events: list[dict],
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # REMOVE EXISTING TIMETABLE
    # -----------------------------------------------------

    db.query(
        TimetableEvent
    ).filter(
        TimetableEvent.user_id == current_user.id
    ).delete()


    # -----------------------------------------------------
    # SAVE EVENTS
    # -----------------------------------------------------

    saved_count = 0

    for event in events:

        subject = str(
            event.get("subject", "")
        ).strip()

        day = str(
            event.get("day_of_week", "")
        ).strip()

        start = str(
            event.get("start_time", "")
        ).strip()

        end = str(
            event.get("end_time", "")
        ).strip()

        location = event.get("location")


        if not subject:
            continue

        if not day:
            continue

        if not start:
            continue

        if not end:
            continue


        timetable_event = TimetableEvent(

            user_id=current_user.id,

            day_of_week=day,

            subject=subject,

            start_time=start,

            end_time=end,

            location=location
        )


        db.add(timetable_event)

        saved_count += 1


    db.commit()


    return {
        "message": "Timetable saved successfully.",
        "saved_count": saved_count
    }


# =========================================================
# GET TIMETABLE
# =========================================================

@router.get("")
async def get_timetable(
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
# DELETE TIMETABLE
# =========================================================

@router.delete("")
async def delete_timetable(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    db.query(
        TimetableEvent
    ).filter(
        TimetableEvent.user_id == current_user.id
    ).delete()


    db.commit()


    return {
        "message": "Timetable deleted."
    }
# =========================================================
# DAILY CHANGE
# =========================================================

@router.post("/change")
async def create_timetable_change(

    data: TimetableChangeCreate,

    current_user=Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    # -----------------------------------------------------
    # VALIDATE CHANGE TYPE
    # -----------------------------------------------------

    allowed_types = [

        "cancelled",

        "extra",

        "modified"

    ]


    if data.change_type not in allowed_types:

        raise HTTPException(

            status_code=400,

            detail=(
                "Change type must be "
                "cancelled, extra or modified."
            )

        )


    # -----------------------------------------------------
    # VALIDATE SUBJECT
    # -----------------------------------------------------

    if not data.subject.strip():

        raise HTTPException(

            status_code=400,

            detail="Subject is required."

        )


    # -----------------------------------------------------
    # CREATE CHANGE
    # -----------------------------------------------------

    change = TimetableChange(

        user_id=current_user.id,

        change_date=data.change_date,

        change_type=data.change_type,

        subject=data.subject.strip(),

        start_time=data.start_time,

        end_time=data.end_time,

        location=data.location,

        notes=data.notes

    )


    db.add(change)

    db.commit()

    db.refresh(change)


    return {

        "message":
            "Timetable change saved.",

        "change_id":
            change.id

    }


# =========================================================
# GET CHANGES
# =========================================================

@router.get("/changes")
async def get_timetable_changes(

    current_user=Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    changes = db.query(

        TimetableChange

    ).filter(

        TimetableChange.user_id ==
        current_user.id

    ).order_by(

        TimetableChange.change_date.asc(),

        TimetableChange.start_time.asc()

    ).all()


    return changes


# =========================================================
# GET TODAY'S CHANGES
# =========================================================

@router.get("/changes/today")
async def get_today_changes(

    current_user=Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    from datetime import datetime


    today = datetime.now().strftime(
        "%Y-%m-%d"
    )


    changes = db.query(

        TimetableChange

    ).filter(

        TimetableChange.user_id ==
        current_user.id,

        TimetableChange.change_date ==
        today

    ).order_by(

        TimetableChange.start_time.asc()

    ).all()


    return changes


# =========================================================
# DELETE CHANGE
# =========================================================

@router.delete("/change/{change_id}")
async def delete_timetable_change(

    change_id: int,

    current_user=Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    change = db.query(

        TimetableChange

    ).filter(

        TimetableChange.id ==
        change_id,

        TimetableChange.user_id ==
        current_user.id

    ).first()


    if not change:

        raise HTTPException(

            status_code=404,

            detail="Timetable change not found."

        )


    db.delete(change)

    db.commit()


    return {

        "message":
            "Timetable change deleted."

    }