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
        "activityForm"
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


const totalActivity =
    document.getElementById(
        "totalActivity"
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
// LOAD ACTIVITIES
// =========================================================

async function loadActivities() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/wellness/activity`,
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
                "Unable to load activities."
            );

        }


        displayActivities(
            records
        );


    } catch (error) {

        console.error(
            "Activity loading error:",
            error
        );


        recordsContainer.innerHTML =
            `<p class="empty">
                Unable to load activity data.
            </p>`;

    }

}


// =========================================================
// DISPLAY ACTIVITIES
// =========================================================

function displayActivities(
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
                No activities recorded yet.
            </p>`;

        totalActivity.textContent =
            "0 min";

        return;

    }


    // -----------------------------------------------------
    // TOTAL
    // -----------------------------------------------------

    const totalMinutes =
        records.reduce(
            function (
                total,
                record
            ) {

                return total +
                    Number(
                        record.duration_minutes
                    );

            },
            0
        );


    totalActivity.textContent =
        `${totalMinutes} min`;


    // -----------------------------------------------------
    // RECENT RECORDS
    // -----------------------------------------------------

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

                    <div class="record-left">

                        <strong>
                            ${formatActivity(
                                record.activity_type
                            )}
                        </strong>

                        <span>
                            ${formatDate(
                                record.created_at
                            )}
                        </span>

                    </div>


                    <div class="record-time">
                        ${record.duration_minutes} min
                    </div>

                `;


                recordsContainer.appendChild(
                    item
                );

            }
        );

}


// =========================================================
// ACTIVITY NAME
// =========================================================

function formatActivity(
    activity
) {

    const names = {

        walking: "🚶 Walking",

        running: "🏃 Running",

        workout: "🏋️ Workout",

        cycling: "🚴 Cycling",

        yoga: "🧘 Yoga",

        sports: "⚽ Sports",

        studying: "📚 Studying",

        other: "🎨 Other"

    };


    return names[activity] ||
        activity;

}


// =========================================================
// DATE FORMAT
// =========================================================

function formatDate(
    dateString
) {

    if (!dateString) {

        return "Recorded today";

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
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


// =========================================================
// SAVE ACTIVITY
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


        const activityType =
            document.getElementById(
                "activityType"
            ).value;


        const durationMinutes =
            Number(
                document.getElementById(
                    "durationMinutes"
                ).value
            );


        const payload = {

            activity_type:
                activityType,

            duration_minutes:
                durationMinutes

        };


        try {

            const response =
                await fetch(
                    `${API_URL}/api/wellness/activity`,
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
                    "Unable to save activity."
                );

            }


            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            form.reset();


            await loadActivities();


            successPopup.classList.add(
                "show"
            );


        } catch (error) {

            console.error(
                "Activity saving error:",
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
                "Save Activity";

        }

    }
);


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

loadActivities();