const API_URL = "https://wellness-system.onrender.com";


// =========================================================
// AUTHENTICATION
// =========================================================

const token =
    localStorage.getItem("access_token");


if (!token) {

    window.location.href =
        "login.html";

}


// =========================================================
// ELEMENTS
// =========================================================

const form =
    document.getElementById("checkinForm");

const submitButton =
    document.getElementById("submitButton");

const successPopup =
    document.getElementById("successPopup");

const dashboardButton =
    document.getElementById("dashboardButton");

const errorMessage =
    document.getElementById("errorMessage");


// =========================================================
// RANGE VALUES
// =========================================================

const rangeFields = [

    {
        input: "mood",
        display: "moodDisplay"
    },

    {
        input: "stress",
        display: "stressDisplay"
    },

    {
        input: "energy",
        display: "energyDisplay"
    },

    {
        input: "academicWorkload",
        display: "workloadDisplay"
    },

    {
        input: "socialConnection",
        display: "socialDisplay"
    }

];


rangeFields.forEach(function (field) {

    const input =
        document.getElementById(field.input);

    const display =
        document.getElementById(field.display);


    input.addEventListener(
        "input",
        function () {

            display.textContent =
                input.value;

        }
    );

});


// =========================================================
// SLEEP
// =========================================================

const sleepHours =
    document.getElementById("sleepHours");

const sleepDisplay =
    document.getElementById("sleepDisplay");


sleepHours.addEventListener(
    "input",
    function () {

        sleepDisplay.textContent =
            `${sleepHours.value} h`;

    }
);


// =========================================================
// ERROR
// =========================================================

function showError(message) {

    errorMessage.textContent =
        message;

    errorMessage.classList.add("show");


    setTimeout(function () {

        errorMessage.classList.remove("show");

    }, 4000);

}


// =========================================================
// SUBMIT CHECK-IN
// =========================================================

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        submitButton.disabled = true;

        submitButton.textContent =
            "Saving...";


        try {

            const selectedSleepQuality =
                document.querySelector(
                    'input[name="sleepQuality"]:checked'
                );


            const payload = {

                mood: Number(
                    document.getElementById("mood").value
                ),

                stress: Number(
                    document.getElementById("stress").value
                ),

                sleep_hours: Number(
                    sleepHours.value
                ),

                sleep_quality: Number(
                    selectedSleepQuality.value
                ),

                energy: Number(
                    document.getElementById("energy").value
                ),

                academic_workload: Number(
                    document.getElementById(
                        "academicWorkload"
                    ).value
                ),

                social_connection: Number(
                    document.getElementById(
                        "socialConnection"
                    ).value
                )

            };


            console.log(
                "Sending check-in:",
                payload
            );


            const response =
                await fetch(
                    `${API_URL}/api/wellness/checkin`,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`

                        },

                        body:
                            JSON.stringify(payload)

                    }
                );


            const data =
                await response.json();


            console.log(
                "Server response:",
                data
            );


            // =================================================
            // TOKEN EXPIRED
            // =================================================

            if (response.status === 401) {

                localStorage.removeItem(
                    "access_token"
                );

                window.location.href =
                    "login.html";

                return;

            }


            // =================================================
            // SERVER ERROR
            // =================================================

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Unable to save check-in."
                );

            }


            // =================================================
            // SUCCESS
            // =================================================

            successPopup.classList.add("show");


            // IMPORTANT:
            // We DO NOT reset the form here.
            //
            // Whatever values the student selected
            // remain visible behind the popup.


        } catch (error) {

            console.error(
                "Check-in error:",
                error
            );


            showError(
                error.message
            );


        } finally {

            submitButton.disabled = false;

            submitButton.textContent =
                "Save Today's Check-in";

        }

    }
);


// =========================================================
// GO TO DASHBOARD
// =========================================================

dashboardButton.addEventListener(
    "click",
    function () {

        window.location.href =
            "dashboard.html";

    }
);