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

const planContainer =
    document.getElementById(
        "planContainer"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


const timetableMessage =
    document.getElementById(
        "timetableMessage"
    );


const refreshButton =
    document.getElementById(
        "refreshButton"
    );


// =========================================================
// LOAD PLAN
// =========================================================

async function loadPlan() {

    planContainer.innerHTML = `
        <div class="loading">
            Building your schedule...
        </div>
    `;

    errorMessage.classList.remove(
        "show"
    );


    try {

        const response =
            await fetch(
                `${API_URL}/api/planner/today`,
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


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to load planner."
            );

        }


        displayPlan(
            data
        );


    } catch (error) {

        console.error(
            "Planner error:",
            error
        );


        errorMessage.textContent =
            error.message;


        errorMessage.classList.add(
            "show"
        );


        planContainer.innerHTML =
            "";

    }

}


// =========================================================
// DISPLAY PLAN
// =========================================================

function displayPlan(
    data
) {

    // -----------------------------------------------------
    // DATE
    // -----------------------------------------------------

    document.getElementById(
        "dateText"
    ).textContent =
        `${data.day} • ${data.date}`;


    // -----------------------------------------------------
    // WELLNESS
    // -----------------------------------------------------

    document.getElementById(
        "moodValue"
    ).textContent =
        data.wellness.mood ?? "—";


    document.getElementById(
        "stressValue"
    ).textContent =
        data.wellness.stress ?? "—";


    document.getElementById(
        "energyValue"
    ).textContent =
        data.wellness.energy ?? "—";


    document.getElementById(
        "sleepValue"
    ).textContent =
        data.wellness.sleep_hours
        ?? "—";


    // -----------------------------------------------------
    // TIMETABLE MESSAGE
    // -----------------------------------------------------

    if (data.has_timetable) {

        timetableMessage.textContent =
            `Your plan includes ${data.class_count} class${data.class_count === 1 ? "" : "es"} from your timetable.`;

    } else {

        timetableMessage.textContent =
            "No classes were found for today. You can use this plan as a flexible routine.";

    }


    // -----------------------------------------------------
    // DAILY CHANGES
    // -----------------------------------------------------

    const changesSummary =
        document.getElementById("changesSummary");

    if (changesSummary) {
        changesSummary.innerHTML = "";

        if (data.changes && data.changes.length) {
            changesSummary.innerHTML = `
                <div class="changes-summary-title">
                    📌 ${data.change_count} schedule change${data.change_count === 1 ? "" : "s"} today
                </div>
                ${data.changes.map(change => `
                    <div class="change-chip">
                        <strong>${escapeHtml(change.type)}</strong>
                        <span>${escapeHtml(change.subject)}</span>
                        ${change.notes ? `<small>${escapeHtml(change.notes)}</small>` : ""}
                    </div>
                `).join("")}
            `;
        }
    }

    // -----------------------------------------------------
    // PLAN
    // -----------------------------------------------------

    planContainer.innerHTML =
        "";


    if (
        !data.plan ||
        data.plan.length === 0
    ) {

        planContainer.innerHTML = `
            <div class="loading">
                No activities planned for today.
            </div>
        `;

        return;

    }


    data.plan.forEach(
        function (item) {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "plan-item " +
                `${item.type}-item`;


            element.innerHTML = `

                <div class="plan-time">

                    ${item.start_time}
                    –
                    ${item.end_time}

                </div>

                <div>

                    <h3 class="plan-title">

                        ${item.title}

                    </h3>

                    <p class="plan-description">

                        ${item.description}

                    </p>

                </div>

            `;


            planContainer.appendChild(
                element
            );

        }
    );

}


function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =========================================================
// REFRESH
// =========================================================

refreshButton.addEventListener(
    "click",
    loadPlan
);


// =========================================================
// INITIALIZE
// =========================================================

loadPlan();