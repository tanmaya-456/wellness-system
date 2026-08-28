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
        "journalForm"
    );


const journalContent =
    document.getElementById(
        "journalContent"
    );


const saveButton =
    document.getElementById(
        "saveButton"
    );


const message =
    document.getElementById(
        "message"
    );


const entriesContainer =
    document.getElementById(
        "entriesContainer"
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
// LOAD JOURNALS
// =========================================================

async function loadJournals() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/wellness/journal`,
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


        const entries =
            await response.json();


        if (!response.ok) {

            throw new Error(
                entries.detail ||
                "Unable to load journal."
            );

        }


        displayJournals(
            entries
        );


    } catch (error) {

        console.error(
            "Journal loading error:",
            error
        );


        entriesContainer.innerHTML =
            `<p class="empty">
                Unable to load journal entries.
            </p>`;

    }

}


// =========================================================
// DISPLAY JOURNALS
// =========================================================

function displayJournals(
    entries
) {

    entriesContainer.innerHTML =
        "";


    if (
        !entries ||
        entries.length === 0
    ) {

        entriesContainer.innerHTML =
            `<p class="empty">
                No journal entries yet.
            </p>`;

        return;

    }


    entries
        .slice(0, 10)
        .forEach(
            function (entry) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "entry";


                item.innerHTML = `

                    <div class="entry-date">
                        ${formatDate(
                            entry.created_at
                        )}
                    </div>

                    <div class="entry-content">
                        ${escapeHTML(
                            entry.content
                        )}
                    </div>

                `;


                entriesContainer.appendChild(
                    item
                );

            }
        );

}


// =========================================================
// SAVE JOURNAL
// =========================================================

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const content =
            journalContent.value.trim();


        if (!content) {

            showError(
                "Please write something before saving."
            );

            return;

        }


        saveButton.disabled =
            true;


        saveButton.textContent =
            "Saving...";


        message.textContent =
            "";


        try {

            const response =
                await fetch(
                    `${API_URL}/api/wellness/journal`,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`

                        },

                        body:
                            JSON.stringify({
                                content: content
                            })

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
                    "Unable to save journal entry."
                );

            }


            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            journalContent.value =
                "";


            await loadJournals();


            successPopup.classList.add(
                "show"
            );


        } catch (error) {

            console.error(
                "Journal saving error:",
                error
            );


            showError(
                error.message
            );

        } finally {

            saveButton.disabled =
                false;


            saveButton.textContent =
                "Save Journal Entry";

        }

    }
);


// =========================================================
// ERROR
// =========================================================

function showError(
    text
) {

    message.textContent =
        text;

    message.className =
        "message error";

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
// SECURITY
// =========================================================

function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


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

loadJournals();