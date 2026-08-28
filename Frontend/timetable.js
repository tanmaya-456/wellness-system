// =========================================================
// API CONFIGURATION
// =========================================================

const API_URL =
    "https://wellness-system.onrender.com";


// =========================================================
// AUTHENTICATION
// =========================================================

const token =
    localStorage.getItem(
        "access_token"
    );


if (!token) {

    window.location.href =
        "login.html";

}


// =========================================================
// ELEMENTS
// =========================================================

const timetableFile =
    document.getElementById(
        "timetableFile"
    );

const uploadButton =
    document.getElementById(
        "uploadButton"
    );

const selectedFile =
    document.getElementById(
        "selectedFile"
    );

const analyzeButton =
    document.getElementById(
        "analyzeButton"
    );

const statusMessage =
    document.getElementById(
        "statusMessage"
    );

const previewSection =
    document.getElementById(
        "previewSection"
    );

const eventsContainer =
    document.getElementById(
        "eventsContainer"
    );

const saveExtractedButton =
    document.getElementById(
        "saveExtractedButton"
    );

const cancelPreviewButton =
    document.getElementById(
        "cancelPreviewButton"
    );

const scheduleContainer =
    document.getElementById(
        "scheduleContainer"
    );


// =========================================================
// CLASS FORM ELEMENTS
// =========================================================

const addClassButton =
    document.getElementById(
        "addClassButton"
    );

const classForm =
    document.getElementById(
        "classForm"
    );

const cancelClassButton =
    document.getElementById(
        "cancelClassButton"
    );

const saveClassButton =
    document.getElementById(
        "saveClassButton"
    );


// =========================================================
// DAILY CHANGE ELEMENTS
// =========================================================

const addChangeButton =
    document.getElementById(
        "addChangeButton"
    );

const changeForm =
    document.getElementById(
        "changeForm"
    );

const cancelChangeButton =
    document.getElementById(
        "cancelChangeButton"
    );

const saveChangeButton =
    document.getElementById(
        "saveChangeButton"
    );

const changesContainer =
    document.getElementById(
        "changesContainer"
    );


// =========================================================
// ROUTINE ELEMENTS
// =========================================================

const addRoutineButton =
    document.getElementById(
        "addRoutineButton"
    );

const routineForm =
    document.getElementById(
        "routineForm"
    );

const cancelRoutineButton =
    document.getElementById(
        "cancelRoutineButton"
    );

const saveRoutineButton =
    document.getElementById(
        "saveRoutineButton"
    );

const routineContainer =
    document.getElementById(
        "routineContainer"
    );


// =========================================================
// SELECTED IMAGE
// =========================================================

let selectedImageFile = null;


// =========================================================
// EXTRACTED EVENTS
// =========================================================

let extractedEvents = [];


// =========================================================
// API HELPER
// =========================================================

async function apiRequest(
    endpoint,
    options = {}
) {

    const headers =
        options.headers || {};

    headers["Authorization"] =
        `Bearer ${token}`;


    const response =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );


    if (
        response.status === 401
    ) {

        localStorage.removeItem(
            "access_token"
        );

        window.location.href =
            "login.html";

        return null;

    }


    let data = null;


    try {

        data =
            await response.json();

    } catch {

        data = null;

    }


    if (!response.ok) {

        const message =
            data?.detail ||
            `Request failed: ${response.status}`;

        throw new Error(
            message
        );

    }


    return data;

}


// =========================================================
// STATUS MESSAGE
// =========================================================

function showStatus(
    message,
    type = "loading"
) {

    statusMessage.textContent =
        message;

    statusMessage.className =
        `status-message ${type}`;

}


// =========================================================
// CLEAR STATUS
// =========================================================

function clearStatus() {

    statusMessage.textContent =
        "";

    statusMessage.className =
        "status-message";

}


// =========================================================
// UPLOAD BUTTON
// =========================================================

uploadButton.addEventListener(
    "click",
    function () {

        timetableFile.click();

    }
);


// =========================================================
// FILE SELECTED
// =========================================================

timetableFile.addEventListener(
    "change",
    function () {

        const file =
            timetableFile.files[0];


        if (!file) {

            selectedImageFile =
                null;

            selectedFile.style.display =
                "none";

            analyzeButton.style.display =
                "none";

            return;

        }


        const allowedTypes = [

            "image/jpeg",

            "image/png",

            "image/webp"

        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            alert(
                "Please select a JPG, PNG or WEBP image."
            );

            timetableFile.value =
                "";

            return;

        }


        selectedImageFile =
            file;


        selectedFile.textContent =
            `Selected: ${file.name}`;


        selectedFile.style.display =
            "block";


        analyzeButton.style.display =
            "inline-block";


        clearStatus();

    }
);


// =========================================================
// ANALYZE TIMETABLE
// =========================================================

analyzeButton.addEventListener(
    "click",
    async function () {

        if (!selectedImageFile) {

            alert(
                "Please select a timetable image first."
            );

            return;

        }


        const formData =
            new FormData();


        formData.append(
            "file",
            selectedImageFile
        );


        analyzeButton.disabled =
            true;


        uploadButton.disabled =
            true;


        analyzeButton.textContent =
            "Analyzing...";


        showStatus(
            "Analyzing your timetable...",
            "loading"
        );


        try {

            const data =
                await apiRequest(
                    "/api/timetable/extract",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            if (!data) return;


            extractedEvents =
                Array.isArray(
                    data.events
                )
                    ? data.events
                    : [];


            if (
                extractedEvents.length === 0
            ) {

                showStatus(
                    "No classes could be detected from the image.",
                    "error"
                );

                return;

            }


            renderExtractedEvents();


            previewSection.style.display =
                "block";


            previewSection.scrollIntoView({
                behavior: "smooth"
            });


            showStatus(
                `${extractedEvents.length} classes detected. Please review them before saving.`,
                "success"
            );


        } catch (error) {

            console.error(
                "Timetable extraction error:",
                error
            );


            let message =
                error.message;


            if (
                message.includes(
                    "429"
                ) ||
                message.includes(
                    "RESOURCE_EXHAUSTED"
                )
            ) {

                message =
                    "Gemini AI is temporarily unavailable because its current quota has been reached. Please try again later.";

            }


            showStatus(
                message,
                "error"
            );

        } finally {

            analyzeButton.disabled =
                false;

            uploadButton.disabled =
                false;

            analyzeButton.textContent =
                "Analyze Timetable";

        }

    }
);


// =========================================================
// RENDER EXTRACTED EVENTS
// =========================================================

function renderExtractedEvents() {

    eventsContainer.innerHTML =
        "";


    extractedEvents.forEach(
        function (event, index) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "event-edit-card";


            card.innerHTML = `

                <div class="event-number">
                    ${index + 1}
                </div>


                <div class="event-fields">

                    <div>

                        <label>
                            Day
                        </label>

                        <select
                            data-field="day_of_week"
                            data-index="${index}"
                        >

                            ${createDayOptions(
                                event.day_of_week
                            )}

                        </select>

                    </div>


                    <div>

                        <label>
                            Subject
                        </label>

                        <input
                            type="text"
                            data-field="subject"
                            data-index="${index}"
                            value="${escapeAttribute(
                                event.subject || ""
                            )}"
                        >

                    </div>


                    <div>

                        <label>
                            Start time
                        </label>

                        <input
                            type="time"
                            data-field="start_time"
                            data-index="${index}"
                            value="${escapeAttribute(
                                event.start_time || ""
                            )}"
                        >

                    </div>


                    <div>

                        <label>
                            End time
                        </label>

                        <input
                            type="time"
                            data-field="end_time"
                            data-index="${index}"
                            value="${escapeAttribute(
                                event.end_time || ""
                            )}"
                        >

                    </div>


                    <div>

                        <label>
                            Location
                        </label>

                        <input
                            type="text"
                            data-field="location"
                            data-index="${index}"
                            value="${escapeAttribute(
                                event.location || ""
                            )}"
                            placeholder="Optional"
                        >

                    </div>

                </div>

            `;


            eventsContainer.appendChild(
                card
            );

        }
    );


    eventsContainer
        .querySelectorAll(
            "input, select"
        )
        .forEach(
            function (input) {

                input.addEventListener(
                    "input",
                    updateExtractedEvent
                );

                input.addEventListener(
                    "change",
                    updateExtractedEvent
                );

            }
        );

}


// =========================================================
// DAY OPTIONS
// =========================================================

function createDayOptions(
    selectedDay
) {

    const days = [

        "Monday",

        "Tuesday",

        "Wednesday",

        "Thursday",

        "Friday",

        "Saturday",

        "Sunday"

    ];


    return days
        .map(
            function (day) {

                return `

                    <option
                        value="${day}"
                        ${
                            day === selectedDay
                                ? "selected"
                                : ""
                        }
                    >
                        ${day}
                    </option>

                `;

            }
        )
        .join("");

}


// =========================================================
// UPDATE EXTRACTED EVENT
// =========================================================

function updateExtractedEvent(
    event
) {

    const element =
        event.target;


    const index =
        Number(
            element.dataset.index
        );


    const field =
        element.dataset.field;


    extractedEvents[index][field] =
        element.value;

}


// =========================================================
// SAVE EXTRACTED TIMETABLE
// =========================================================

saveExtractedButton.addEventListener(
    "click",
    async function () {

        if (
            extractedEvents.length === 0
        ) {

            return;

        }


        const validEvents =
            extractedEvents.filter(
                function (event) {

                    return (

                        event.day_of_week &&
                        event.subject &&
                        event.start_time &&
                        event.end_time

                    );

                }
            );


        if (
            validEvents.length === 0
        ) {

            alert(
                "Please make sure the timetable contains valid classes."
            );

            return;

        }


        saveExtractedButton.disabled =
            true;


        saveExtractedButton.textContent =
            "Saving...";


        try {

            await apiRequest(
                "/api/timetable/save",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            validEvents
                        )

                }
            );


            showStatus(
                "Timetable saved successfully.",
                "success"
            );


            previewSection.style.display =
                "none";


            extractedEvents =
                [];


            await loadTimetable();


        } catch (error) {

            console.error(
                "Save timetable error:",
                error
            );


            showStatus(
                error.message,
                "error"
            );

        } finally {

            saveExtractedButton.disabled =
                false;

            saveExtractedButton.textContent =
                "Save Timetable";

        }

    }
);


// =========================================================
// CANCEL EXTRACTION PREVIEW
// =========================================================

cancelPreviewButton.addEventListener(
    "click",
    function () {

        previewSection.style.display =
            "none";

        extractedEvents =
            [];

    }
);


// =========================================================
// LOAD TIMETABLE
// =========================================================

async function loadTimetable() {

    try {

        const events =
            await apiRequest(
                "/api/timetable"
            );


        if (!events) return;


        renderTimetable(
            events
        );


    } catch (error) {

        console.error(
            "Load timetable error:",
            error
        );

    }

}


// =========================================================
// RENDER TIMETABLE
// =========================================================

function renderTimetable(
    events
) {

    if (
        !events ||
        events.length === 0
    ) {

        scheduleContainer.innerHTML = `

            <div class="empty-state">

                <div>
                    📅
                </div>

                <p>
                    No classes added yet.
                </p>

            </div>

        `;

        return;

    }


    const days = [

        "Monday",

        "Tuesday",

        "Wednesday",

        "Thursday",

        "Friday",

        "Saturday",

        "Sunday"

    ];


    scheduleContainer.innerHTML =
        "";


    days.forEach(
        function (day) {

            const dayEvents =
                events.filter(
                    function (event) {

                        return (
                            event.day_of_week ===
                            day
                        );

                    }
                );


            if (
                dayEvents.length === 0
            ) {

                return;

            }


            dayEvents.sort(
                function (a, b) {

                    return (
                        a.start_time.localeCompare(
                            b.start_time
                        )
                    );

                }
            );


            const daySection =
                document.createElement(
                    "div"
                );


            daySection.className =
                "day-section";


            daySection.innerHTML = `

                <h3>
                    ${day}
                </h3>

                <div class="day-events">

                    ${dayEvents
                        .map(
                            function (event) {

                                return `

                                    <div class="saved-event">

                                        <div>

                                            <strong>
                                                ${escapeHTML(
                                                    event.subject
                                                )}
                                            </strong>

                                            <span>
                                                ${event.start_time}
                                                –
                                                ${event.end_time}
                                            </span>

                                            ${
                                                event.location
                                                    ? `
                                                        <small>
                                                            📍
                                                            ${escapeHTML(
                                                                event.location
                                                            )}
                                                        </small>
                                                    `
                                                    : ""
                                            }

                                        </div>

                                    </div>

                                `;

                            }
                        )
                        .join("")}

                </div>

            `;


            scheduleContainer.appendChild(
                daySection
            );

        }
    );

}


// =========================================================
// ADD CLASS
// =========================================================

addClassButton.addEventListener(
    "click",
    function () {

        classForm.style.display =
            "block";


        classForm.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }
);


// =========================================================
// CANCEL ADD CLASS
// =========================================================

cancelClassButton.addEventListener(
    "click",
    function () {

        classForm.style.display =
            "none";

        clearClassForm();

    }
);


// =========================================================
// SAVE CLASS
// =========================================================

saveClassButton.addEventListener(
    "click",
    async function () {

        const day =
            document.getElementById(
                "classDay"
            ).value;


        const subject =
            document.getElementById(
                "classSubject"
            ).value.trim();


        const start =
            document.getElementById(
                "classStart"
            ).value;


        const end =
            document.getElementById(
                "classEnd"
            ).value;


        const location =
            document.getElementById(
                "classLocation"
            ).value.trim();


        if (!subject) {

            alert(
                "Please enter the subject."
            );

            return;

        }


        if (!start || !end) {

            alert(
                "Please enter the start and end time."
            );

            return;

        }


        if (start >= end) {

            alert(
                "End time must be after start time."
            );

            return;

        }


        saveClassButton.disabled =
            true;


        saveClassButton.textContent =
            "Saving...";


        try {

            await apiRequest(
                "/api/timetable",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            day_of_week:
                                day,

                            subject:
                                subject,

                            start_time:
                                start,

                            end_time:
                                end,

                            location:
                                location ||
                                null

                        })

                }
            );


            classForm.style.display =
                "none";


            clearClassForm();


            await loadTimetable();


            showStatus(
                "Class added successfully.",
                "success"
            );


        } catch (error) {

            console.error(
                "Save class error:",
                error
            );


            showStatus(
                error.message,
                "error"
            );

        } finally {

            saveClassButton.disabled =
                false;

            saveClassButton.textContent =
                "Save Class";

        }

    }
);


// =========================================================
// CLEAR CLASS FORM
// =========================================================

function clearClassForm() {

    document.getElementById(
        "classSubject"
    ).value = "";


    document.getElementById(
        "classStart"
    ).value = "";


    document.getElementById(
        "classEnd"
    ).value = "";


    document.getElementById(
        "classLocation"
    ).value = "";

}


// =========================================================
// DAILY CHANGES
// =========================================================

addChangeButton.addEventListener(
    "click",
    function () {

        changeForm.style.display =
            "block";


        const dateInput =
            document.getElementById(
                "changeDate"
            );


        if (!dateInput.value) {

            dateInput.value =
                getTodayDate();

        }


        changeForm.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }
);


// =========================================================
// CANCEL CHANGE
// =========================================================

cancelChangeButton.addEventListener(
    "click",
    function () {

        changeForm.style.display =
            "none";

        clearChangeForm();

    }
);


// =========================================================
// SAVE CHANGE
// =========================================================

saveChangeButton.addEventListener(
    "click",
    async function () {

        const changeDate =
            document.getElementById(
                "changeDate"
            ).value;


        const changeType =
            document.getElementById(
                "changeType"
            ).value;


        const subject =
            document.getElementById(
                "changeSubject"
            ).value.trim();


        const startTime =
            document.getElementById(
                "changeStart"
            ).value;


        const endTime =
            document.getElementById(
                "changeEnd"
            ).value;


        const location =
            document.getElementById(
                "changeLocation"
            ).value.trim();


        const notes =
            document.getElementById(
                "changeNotes"
            ).value.trim();


        if (!changeDate) {

            alert(
                "Please select a date."
            );

            return;

        }


        if (!subject) {

            alert(
                "Please enter the subject."
            );

            return;

        }


        if (
            changeType !== "cancelled" &&
            (
                !startTime ||
                !endTime
            )
        ) {

            alert(
                "Please enter start and end time."
            );

            return;

        }


        if (
            startTime &&
            endTime &&
            startTime >= endTime
        ) {

            alert(
                "End time must be after start time."
            );

            return;

        }


        saveChangeButton.disabled =
            true;


        saveChangeButton.textContent =
            "Saving...";


        try {

            await apiRequest(
                "/api/timetable/change",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            change_date:
                                changeDate,

                            change_type:
                                changeType,

                            subject:
                                subject,

                            start_time:
                                startTime ||
                                null,

                            end_time:
                                endTime ||
                                null,

                            location:
                                location ||
                                null,

                            notes:
                                notes ||
                                null

                        })

                }
            );


            changeForm.style.display =
                "none";


            clearChangeForm();


            await loadTodayChanges();


            showStatus(
                "Schedule change saved successfully.",
                "success"
            );


        } catch (error) {

            console.error(
                "Save change error:",
                error
            );


            showStatus(
                error.message,
                "error"
            );

        } finally {

            saveChangeButton.disabled =
                false;

            saveChangeButton.textContent =
                "Save Change";

        }

    }
);


// =========================================================
// CLEAR CHANGE FORM
// =========================================================

function clearChangeForm() {

    document.getElementById(
        "changeSubject"
    ).value = "";


    document.getElementById(
        "changeStart"
    ).value = "";


    document.getElementById(
        "changeEnd"
    ).value = "";


    document.getElementById(
        "changeLocation"
    ).value = "";


    document.getElementById(
        "changeNotes"
    ).value = "";

}


// =========================================================
// LOAD TODAY'S CHANGES
// =========================================================

async function loadTodayChanges() {

    try {

        const changes =
            await apiRequest(
                "/api/timetable/changes/today"
            );


        if (!changes) return;


        renderTodayChanges(
            changes
        );


    } catch (error) {

        console.error(
            "Load changes error:",
            error
        );

    }

}


// =========================================================
// RENDER TODAY'S CHANGES
// =========================================================

function renderTodayChanges(
    changes
) {

    if (
        !changes ||
        changes.length === 0
    ) {

        changesContainer.innerHTML = `

            <div class="empty-state">

                <div>
                    📅
                </div>

                <p>
                    No changes for today.
                </p>

            </div>

        `;

        return;

    }


    changesContainer.innerHTML =
        "";


    changes.forEach(
        function (change) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "change-card";


            let icon = "✏️";

            let label = "Modified";


            if (
                change.change_type ===
                "cancelled"
            ) {

                icon = "❌";

                label = "Cancelled";

            }


            if (
                change.change_type ===
                "extra"
            ) {

                icon = "➕";

                label = "Extra class";

            }


            let timeText =
                "Time not specified";


            if (
                change.start_time &&
                change.end_time
            ) {

                timeText =
                    `${change.start_time} – ${change.end_time}`;

            }


            card.innerHTML = `

                <div class="change-card-left">

                    <div
                        class="change-icon ${change.change_type}"
                    >
                        ${icon}
                    </div>


                    <div>

                        <h3>
                            ${escapeHTML(
                                change.subject
                            )}
                        </h3>

                        <p>

                            ${timeText}

                            ${
                                change.location
                                    ? ` • ${escapeHTML(
                                        change.location
                                    )}`
                                    : ""
                            }

                            ${
                                change.notes
                                    ? ` • ${escapeHTML(
                                        change.notes
                                    )}`
                                    : ""
                            }

                        </p>

                    </div>

                </div>


                <div class="change-card-right">

                    <span
                        class="change-type ${change.change_type}"
                    >
                        ${label}
                    </span>


                    <button
                        type="button"
                        class="delete-change"
                        onclick="deleteChange(${change.id})"
                        title="Delete change"
                    >
                        🗑️
                    </button>

                </div>

            `;


            changesContainer.appendChild(
                card
            );

        }
    );

}


// =========================================================
// DELETE DAILY CHANGE
// =========================================================

async function deleteChange(
    changeId
) {

    const confirmed =
        confirm(
            "Delete this timetable change?"
        );


    if (!confirmed) {

        return;

    }


    try {

        await apiRequest(
            `/api/timetable/change/${changeId}`,
            {

                method: "DELETE"

            }
        );


        await loadTodayChanges();


        showStatus(
            "Timetable change deleted.",
            "success"
        );


    } catch (error) {

        console.error(
            "Delete change error:",
            error
        );


        showStatus(
            error.message,
            "error"
        );

    }

}


// =========================================================
// PERSONAL ROUTINE
// =========================================================
//
// For now routine items are stored in localStorage.
// Later we will connect these to the backend/database
// so they can be used by the Daily Planner.
//

const ROUTINE_STORAGE_KEY =
    "student_wellness_routines";


// =========================================================
// LOAD ROUTINES FROM LOCAL STORAGE
// =========================================================

function getRoutines() {

    try {

        return JSON.parse(
            localStorage.getItem(
                ROUTINE_STORAGE_KEY
            ) || "[]"
        );

    } catch {

        return [];

    }

}


// =========================================================
// SAVE ROUTINES TO LOCAL STORAGE
// =========================================================

function saveRoutines(
    routines
) {

    localStorage.setItem(
        ROUTINE_STORAGE_KEY,
        JSON.stringify(
            routines
        )
    );

}


// =========================================================
// ADD ROUTINE BUTTON
// =========================================================

addRoutineButton.addEventListener(
    "click",
    function () {

        routineForm.style.display =
            "block";


        routineForm.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }
);


// =========================================================
// CANCEL ROUTINE
// =========================================================

cancelRoutineButton.addEventListener(
    "click",
    function () {

        routineForm.style.display =
            "none";

        clearRoutineForm();

    }
);


// =========================================================
// SAVE ROUTINE
// =========================================================

saveRoutineButton.addEventListener(
    "click",
    function () {

        const type =
            document.getElementById(
                "routineType"
            ).value;


        const name =
            document.getElementById(
                "routineName"
            ).value.trim();


        const start =
            document.getElementById(
                "routineStart"
            ).value;


        const end =
            document.getElementById(
                "routineEnd"
            ).value;


        const notes =
            document.getElementById(
                "routineNotes"
            ).value.trim();


        if (!start || !end) {

            alert(
                "Please enter start and end time."
            );

            return;

        }


        if (start >= end) {

            alert(
                "End time must be after start time."
            );

            return;

        }


        const activityName =
            name || type;


        const routines =
            getRoutines();


        routines.push({

            id:
                Date.now(),

            type:
                type,

            name:
                activityName,

            start:
                start,

            end:
                end,

            notes:
                notes

        });


        saveRoutines(
            routines
        );


        routineForm.style.display =
            "none";


        clearRoutineForm();


        renderRoutines();


        showStatus(
            "Routine added successfully.",
            "success"
        );

    }
);


// =========================================================
// CLEAR ROUTINE FORM
// =========================================================

function clearRoutineForm() {

    document.getElementById(
        "routineName"
    ).value = "";


    document.getElementById(
        "routineStart"
    ).value = "";


    document.getElementById(
        "routineEnd"
    ).value = "";


    document.getElementById(
        "routineNotes"
    ).value = "";

}


// =========================================================
// RENDER ROUTINES
// =========================================================

function renderRoutines() {

    const routines =
        getRoutines();


    if (
        routines.length === 0
    ) {

        routineContainer.innerHTML = `

            <div class="empty-state">

                <div>
                    🌱
                </div>

                <p>
                    Add sleep, meals, study, exercise or other activities.
                </p>

            </div>

        `;

        return;

    }


    routines.sort(
        function (a, b) {

            return a.start.localeCompare(
                b.start
            );

        }
    );


    routineContainer.innerHTML =
        "";


    routines.forEach(
        function (routine) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "change-card";


            const icon =
                getRoutineIcon(
                    routine.type
                );


            card.innerHTML = `

                <div class="change-card-left">

                    <div class="change-icon modified">
                        ${icon}
                    </div>


                    <div>

                        <h3>
                            ${escapeHTML(
                                routine.name
                            )}
                        </h3>

                        <p>

                            ${routine.start}
                            –
                            ${routine.end}

                            ${
                                routine.notes
                                    ? ` • ${escapeHTML(
                                        routine.notes
                                    )}`
                                    : ""
                            }

                        </p>

                    </div>

                </div>


                <div class="change-card-right">

                    <span class="change-type modified">
                        ${escapeHTML(
                            routine.type
                        )}
                    </span>


                    <button
                        type="button"
                        class="delete-change"
                        onclick="deleteRoutine(${routine.id})"
                        title="Delete routine"
                    >
                        🗑️
                    </button>

                </div>

            `;


            routineContainer.appendChild(
                card
            );

        }
    );

}


// =========================================================
// ROUTINE ICON
// =========================================================

function getRoutineIcon(
    type
) {

    const icons = {

        "Sleep":
            "😴",

        "Study":
            "📚",

        "Exercise":
            "🏃",

        "Breakfast":
            "🍳",

        "Lunch":
            "🍛",

        "Dinner":
            "🍽️",

        "Meditation":
            "🧘",

        "Other":
            "📌"

    };


    return (
        icons[type] ||
        "📌"
    );

}


// =========================================================
// DELETE ROUTINE
// =========================================================

function deleteRoutine(
    routineId
) {

    const confirmed =
        confirm(
            "Delete this routine?"
        );


    if (!confirmed) {

        return;

    }


    const routines =
        getRoutines();


    const updated =
        routines.filter(
            function (routine) {

                return (
                    routine.id !==
                    routineId
                );

            }
        );


    saveRoutines(
        updated
    );


    renderRoutines();


    showStatus(
        "Routine deleted.",
        "success"
    );

}


// =========================================================
// TODAY DATE
// =========================================================

function getTodayDate() {

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


// =========================================================
// ESCAPE ATTRIBUTE
// =========================================================

function escapeAttribute(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );

}


// =========================================================
// INITIALIZE
// =========================================================

loadTimetable();

loadTodayChanges();

renderRoutines();