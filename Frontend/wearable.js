const API_URL =
    "http://127.0.0.1:8000";


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

const form =
    document.getElementById(
        "wearableForm"
    );


const saveButton =
    document.getElementById(
        "saveButton"
    );


const message =
    document.getElementById(
        "message"
    );


const recordsContainer =
    document.getElementById(
        "recordsContainer"
    );


const successPopup =
    document.getElementById(
        "successPopup"
    );


const closePopup =
    document.getElementById(
        "closePopup"
    );


// =========================================================
// LOAD DATA
// =========================================================

async function loadWearableData() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/wellness/wearable`,
                {

                    headers: {

                        "Authorization":
                            `Bearer ${token}`

                    }

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

            return;

        }


        const records =
            await response.json();


        if (!response.ok) {

            throw new Error(
                records.detail ||
                "Unable to load wearable data."
            );

        }


        displayRecords(
            records
        );


    } catch (error) {

        console.error(
            "Wearable loading error:",
            error
        );


        recordsContainer.innerHTML =
            `<p class="empty">
                Unable to load wearable data.
            </p>`;

    }

}


// =========================================================
// DISPLAY
// =========================================================

function displayRecords(
    records
) {

    recordsContainer.innerHTML =
        "";


    if (
        !records ||
        records.length === 0
    ) {

        recordsContainer.innerHTML =
            `<p class="empty">
                No wearable data recorded yet.
            </p>`;

        return;

    }


    records
        .slice(0, 10)
        .forEach(
            function (record) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "record";


                item.innerHTML = `

                    <div class="record-date">
                        ${formatDate(
                            record.recorded_at
                        )}
                        •
                        ${escapeHTML(
                            record.source
                        )}
                    </div>


                    <div class="record-item">

                        <span>
                            😴 Sleep
                        </span>

                        <strong>
                            ${value(
                                record.sleep_hours,
                                " h"
                            )}
                        </strong>

                    </div>


                    <div class="record-item">

                        <span>
                            🚶 Steps
                        </span>

                        <strong>
                            ${value(
                                record.steps,
                                ""
                            )}
                        </strong>

                    </div>


                    <div class="record-item">

                        <span>
                            ❤️ Heart Rate
                        </span>

                        <strong>
                            ${value(
                                record.heart_rate,
                                " bpm"
                            )}
                        </strong>

                    </div>


                    <div class="record-item">

                        <span>
                            💓 Resting HR
                        </span>

                        <strong>
                            ${value(
                                record.resting_heart_rate,
                                " bpm"
                            )}
                        </strong>

                    </div>


                    <div class="record-item">

                        <span>
                            🏃 Exercise
                        </span>

                        <strong>
                            ${value(
                                record.exercise_minutes,
                                " min"
                            )}
                        </strong>

                    </div>

                `;


                recordsContainer.appendChild(
                    item
                );

            }
        );

}


// =========================================================
// SAVE
// =========================================================

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        saveButton.disabled =
            true;


        saveButton.textContent =
            "Saving...";


        message.textContent =
            "";


        const payload = {

            source:
                document.getElementById(
                    "source"
                ).value,

            sleep_hours:
                getNumber(
                    "sleepHours"
                ),

            steps:
                getNumber(
                    "steps"
                ),

            heart_rate:
                getNumber(
                    "heartRate"
                ),

            resting_heart_rate:
                getNumber(
                    "restingHeartRate"
                ),

            exercise_minutes:
                getNumber(
                    "exerciseMinutes"
                )

        };


        try {

            const response =
                await fetch(
                    `${API_URL}/api/wellness/wearable`,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`

                        },

                        body:
                            JSON.stringify(
                                payload
                            )

                    }
                );


            const data =
                await response.json();


            if (
                response.status === 401
            ) {

                localStorage.removeItem(
                    "access_token"
                );

                window.location.href =
                    "login.html";

                return;

            }


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Unable to save wearable data."
                );

            }


            form.reset();


            await loadWearableData();


            successPopup.classList.add(
                "show"
            );


        } catch (error) {

            console.error(
                "Wearable saving error:",
                error
            );


            message.textContent =
                error.message;


            message.className =
                "message error";


        } finally {

            saveButton.disabled =
                false;


            saveButton.textContent =
                "Save Wearable Data";

        }

    }
);


// =========================================================
// NUMBER HELPER
// =========================================================

function getNumber(
    id
) {

    const value =
        document.getElementById(
            id
        ).value;


    if (
        value === ""
    ) {

        return null;

    }


    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return null;

    }


    return number;

}


// =========================================================
// VALUE FORMAT
// =========================================================

function value(
    number,
    suffix
) {

    if (
        number === null ||
        number === undefined
    ) {

        return "—";

    }


    return `${number}${suffix}`;

}


// =========================================================
// DATE
// =========================================================

function formatDate(
    dateString
) {

    if (!dateString) {

        return "Recorded";

    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Recorded";

    }


    return date.toLocaleString(
        [],
        {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text ?? "";


    return div.innerHTML;

}


// =========================================================
// CLOSE POPUP
// =========================================================

closePopup.addEventListener(
    "click",
    function () {

        successPopup.classList.remove(
            "show"
        );

    }
);


// =========================================================
// INITIALIZE
// =========================================================

loadWearableData();