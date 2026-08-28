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

const habitsForm =
    document.getElementById(
        "habitsForm"
    );


const saveButton =
    document.getElementById(
        "saveHabitsButton"
    );


const message =
    document.getElementById(
        "message"
    );


const successPopup =
    document.getElementById(
        "successPopup"
    );


const dashboardButton =
    document.getElementById(
        "dashboardButton"
    );


// =========================================================
// SHOW MESSAGE
// =========================================================

function showMessage(
    text,
    type = "error"
) {

    message.textContent =
        text;

    message.className =
        `message ${type}`;

}


// =========================================================
// SAVE HABITS
// =========================================================

habitsForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        saveButton.disabled =
            true;

        saveButton.textContent =
            "Saving...";


        showMessage("");


        // -------------------------------------------------
        // GET VALUES
        // -------------------------------------------------

        const studyMinutes =
            Number(
                document.getElementById(
                    "studyMinutes"
                ).value
            );


        const exerciseMinutes =
            Number(
                document.getElementById(
                    "exerciseMinutes"
                ).value
            );


        const waterGlasses =
            Number(
                document.getElementById(
                    "waterGlasses"
                ).value
            );


        const meditationMinutes =
            Number(
                document.getElementById(
                    "meditationMinutes"
                ).value
            );


        const mealsCount =
            Number(
                document.getElementById(
                    "mealsCount"
                ).value
            );


        // -------------------------------------------------
        // PAYLOAD
        // -------------------------------------------------

        const payload = {

            study_minutes:
                studyMinutes,

            exercise_minutes:
                exerciseMinutes,

            water_glasses:
                waterGlasses,

            meditation_minutes:
                meditationMinutes,

            meals_count:
                mealsCount

        };


        try {

            // -------------------------------------------------
            // SEND TO BACKEND
            // -------------------------------------------------

            const response =
                await fetch(
                    `${API_URL}/api/wellness/habits`,
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


            // -------------------------------------------------
            // AUTH ERROR
            // -------------------------------------------------

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


            // -------------------------------------------------
            // OTHER ERROR
            // -------------------------------------------------

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Unable to save habits."
                );

            }


            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            successPopup.classList.add(
                "show"
            );


        } catch (error) {

            console.error(
                "Habit saving error:",
                error
            );


            showMessage(
                error.message
            );


        } finally {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save Today's Habits";

        }

    }
);


// =========================================================
// DASHBOARD BUTTON
// =========================================================

dashboardButton.addEventListener(
    "click",
    function () {

        window.location.href =
            "dashboard.html";

    }
);