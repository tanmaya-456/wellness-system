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

const loading =
    document.getElementById(
        "loading"
    );


const content =
    document.getElementById(
        "insightsContent"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


const refreshButton =
    document.getElementById(
        "refreshButton"
    );


// =========================================================
// LOAD INSIGHTS
// =========================================================

async function loadInsights() {

    loading.style.display =
        "flex";

    content.classList.remove(
        "show"
    );

    errorMessage.classList.remove(
        "show"
    );


    refreshButton.disabled =
        true;


    try {

        const response =
            await fetch(
                `${API_URL}/api/ai/insights`,
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
                "Unable to generate insights."
            );

        }


        displayInsights(
            data
        );


    } catch (error) {

        console.error(
            "AI insight error:",
            error
        );


        const message = error.message || "";
        errorMessage.textContent =
            message.includes("temporarily unavailable") || message.includes("503")
                ? "AI insights are temporarily unavailable. Your dashboard safety check still works, and you can try again later."
                : (message || "Unable to generate AI insights.");


        errorMessage.classList.add(
            "show"
        );


    } finally {

        loading.style.display =
            "none";

        refreshButton.disabled =
            false;

    }

}


// =========================================================
// DISPLAY
// =========================================================

function displayInsights(
    data
) {

    document.getElementById(
        "summary"
    ).textContent =
        data.summary ||
        "No summary available.";


    displayList(
        "patterns",
        data.patterns,
        "insight-item"
    );


    displayList(
        "suggestions",
        data.suggestions,
        "insight-item suggestion-item"
    );


    displayList(
        "watchFor",
        data.watch_for,
        "insight-item watch-item"
    );


    document.getElementById(
        "supportNote"
    ).textContent =
        data.support_note ||
        "Take care of yourself and pay attention to your overall wellbeing.";


    content.classList.add(
        "show"
    );

}


// =========================================================
// LIST
// =========================================================

function displayList(
    elementId,
    items,
    className
) {

    const container =
        document.getElementById(
            elementId
        );


    container.innerHTML =
        "";


    if (
        !items ||
        items.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            className;


        empty.textContent =
            "No significant patterns detected yet.";


        container.appendChild(
            empty
        );


        return;

    }


    items.forEach(
        function (item) {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                className;


            element.textContent =
                item;


            container.appendChild(
                element
            );

        }
    );

}


// =========================================================
// REFRESH
// =========================================================

refreshButton.addEventListener(
    "click",
    function () {

        loadInsights();

    }
);


// =========================================================
// INITIALIZE
// =========================================================

loadInsights();