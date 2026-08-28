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
        "screenTimeForm"
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

const totalScreenTime =
    document.getElementById(
        "totalScreenTime"
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
// LOAD RECORDS
// =========================================================

async function loadScreenTime() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/wellness/screen-time`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (response.status === 401) {

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
                "Unable to load screen time."
            );

        }


        displayRecords(records);


    } catch (error) {

        console.error(
            "Screen time loading error:",
            error
        );

        recordsContainer.innerHTML =
            `<p class="empty">
                Unable to load screen-time data.
            </p>`;

    }

}


// =========================================================
// DISPLAY RECORDS
// =========================================================

function displayRecords(records) {

    recordsContainer.innerHTML =
        "";


    if (
        !records ||
        records.length === 0
    ) {

        recordsContainer.innerHTML =
            `<p class="empty">
                No screen-time records yet.
            </p>`;

        totalScreenTime.textContent =
            "0h 0m";

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


    const hours =
        Math.floor(
            totalMinutes / 60
        );


    const minutes =
        totalMinutes % 60;


    totalScreenTime.textContent =
        `${hours}h ${minutes}m`;


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
                            ${escapeHtml(
                                record.app_name
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                record.device_type
                            )}
                            •
                            ${escapeHtml(
                                record.source
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
// ESCAPE HTML
// =========================================================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ?? "";

    return div.innerHTML;

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

            device_type:
                document.getElementById(
                    "deviceType"
                ).value,

            app_name:
                document.getElementById(
                    "appName"
                ).value.trim(),

            duration_minutes:
                Number(
                    document.getElementById(
                        "durationMinutes"
                    ).value
                ),

            source:
                document.getElementById(
                    "source"
                ).value

        };


        try {

            const response =
                await fetch(
                    `${API_URL}/api/wellness/screen-time`,
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
                    "Unable to save screen time."
                );

            }


            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            form.reset();

            await loadScreenTime();

            successPopup.classList.add(
                "show"
            );


        } catch (error) {

            console.error(
                "Screen time error:",
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
                "Save Screen Time";

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

loadScreenTime();