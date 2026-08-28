const API_URL = "http://127.0.0.1:8000";


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
// API REQUEST HELPER
// =========================================================

async function apiRequest(endpoint) {

    const response =
        await fetch(
            `${API_URL}${endpoint}`,
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

        return null;

    }


    if (!response.ok) {

        throw new Error(
            `Request failed: ${response.status}`
        );

    }


    return await response.json();

}


// =========================================================
// LOAD USER
// =========================================================

async function loadUser() {

    try {

        const user =
            await apiRequest(
                "/api/auth/me"
            );


        if (!user) return;


        const usernameElement =
            document.getElementById(
                "username"
            );


        const avatarElement =
            document.getElementById(
                "avatar"
            );


        if (usernameElement) {

            usernameElement.textContent =
                user.username;

        }


        if (avatarElement) {

            avatarElement.textContent =
                user.username
                    .charAt(0)
                    .toUpperCase();

        }


    } catch (error) {

        console.error(
            "User loading error:",
            error
        );

    }

}


// =========================================================
// LOAD WELLNESS DATA
// =========================================================

async function loadWellness() {

    try {

        const records =
            await apiRequest(
                "/api/wellness/history"
            );


        if (!records) return;


        if (records.length === 0) {

            return;

        }


        // Latest record

        const latest =
            records[0];


        // =================================================
        // UPDATE OVERVIEW CARDS
        // =================================================

        const moodValue =
            document.getElementById(
                "moodValue"
            );


        const stressValue =
            document.getElementById(
                "stressValue"
            );


        const energyValue =
            document.getElementById(
                "energyValue"
            );


        const sleepValue =
            document.getElementById(
                "sleepValue"
            );


        if (moodValue) {

            moodValue.textContent =
                latest.mood;

        }


        if (stressValue) {

            stressValue.textContent =
                latest.stress;

        }


        if (energyValue) {

            energyValue.textContent =
                latest.energy;

        }


        if (sleepValue) {

            sleepValue.textContent =
                latest.sleep_hours;

        }


        // =================================================
        // CHART
        // =================================================

        drawChart(records);


        // =================================================
        // CHANGES
        // =================================================

        showChanges(records);


    } catch (error) {

        console.error(
            "Wellness loading error:",
            error
        );

    }

}


// =========================================================
// GET DATE FROM RECORD
// =========================================================

function getRecordDate(record) {

    const possibleDates = [

        record.created_at,

        record.date,

        record.checkin_date,

        record.timestamp,

        record.createdAt

    ];


    for (
        const dateValue
        of possibleDates
    ) {

        if (dateValue) {

            const date =
                new Date(dateValue);


            if (
                !isNaN(
                    date.getTime()
                )
            ) {

                return date;

            }

        }

    }


    return null;

}


// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(record) {

    const date =
        getRecordDate(record);


    if (!date) {

        return "";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short"
        }
    );

}


// =========================================================
// DRAW WELLNESS CHART
// =========================================================

function drawChart(records) {

    const canvas = document.getElementById("wellnessChart");
    const empty = document.getElementById("chartEmpty");

    if (!canvas) return;

    if (!records || records.length < 2) {
        if (empty) empty.style.display = "flex";
        canvas.style.display = "none";

        const oldSvg = document.getElementById("wellnessChartSvg");
        if (oldSvg) oldSvg.remove();

        return;
    }

    if (empty) empty.style.display = "none";
    canvas.style.display = "none";

    /*
     * Use SVG instead of canvas.
     *
     * Canvas is raster-based and can look soft when the browser scales it.
     * SVG keeps every line, label and point vector-sharp at any resolution.
     */
    const container = canvas.parentElement;
    if (!container) return;

    let svg = document.getElementById("wellnessChartSvg");

    if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "wellnessChartSvg";
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", "Wellness trend chart");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");

        container.appendChild(svg);
    }

    svg.innerHTML = "";

    // Stable vector coordinate system. SVG scales this without raster blur.
    const width = 1000;
    const height = 320;

    svg.setAttribute("viewBox", "0 0 1000 320");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const NS = "http://www.w3.org/2000/svg";

    function createElement(name, attrs = {}) {
        const el = document.createElementNS(NS, name);

        Object.entries(attrs).forEach(([key, value]) => {
            el.setAttribute(key, String(value));
        });

        return el;
    }

    function addText(text, x, y, attrs = {}) {
        const el = createElement("text", {
            x,
            y,
            ...attrs
        });

        el.textContent = text;
        svg.appendChild(el);
        return el;
    }

    const data = [...records].reverse();

    const moods = data.map(item => Number(item.mood));
    const stresses = data.map(item => Number(item.stress));

    const left = 40;
    const right = 18;
    const top = 34;
    const bottom = 35;

    const chartWidth = Math.max(1, width - left - right);
    const chartHeight = Math.max(1, height - top - bottom);

    const getX = index =>
        data.length === 1
            ? left + chartWidth / 2
            : left + index * (chartWidth / (data.length - 1));

    const getY = value => {
        const safe = Math.max(1, Math.min(10, Number(value) || 1));
        return top + chartHeight - ((safe - 1) / 9) * chartHeight;
    };

    /* Grid + selected Y-axis labels */
    for (let value = 1; value <= 10; value++) {
        const y = getY(value);

        svg.appendChild(createElement("line", {
            x1: left,
            y1: y,
            x2: width - right,
            y2: y,
            stroke: "#cbd5e1",
            "stroke-width": "1",
            "vector-effect": "non-scaling-stroke"
        }));

        if (value === 1 || value === 5 || value === 10) {
            addText(String(value), left - 9, y + 3, {
                "text-anchor": "end",
                fill: "#7d8799",
                "font-size": "10",
                "font-family": "Arial, Helvetica, sans-serif",
                "font-weight": "500"
            });
        }
    }

    /* X-axis dates — keep the chart clean when there are many points. */
    const labelStep = Math.max(1, Math.ceil(data.length / 7));

    data.forEach((item, index) => {
        if (index % labelStep !== 0 && index !== data.length - 1) return;

        const dateText = formatDate(item);
        if (!dateText) return;

        addText(dateText, getX(index), height - 8, {
            "text-anchor": "middle",
            fill: "#7d8799",
            "font-size": "9",
            "font-family": "Arial, Helvetica, sans-serif",
            "font-weight": "500"
        });
    });

    function drawLine(values, lineColor) {

        if (!values.length) return;

        const points = values
            .map((value, index) => `${getX(index)},${getY(value)}`)
            .join(" ");

        svg.appendChild(createElement("polyline", {
            points,
            fill: "none",
            stroke: lineColor,
            "stroke-width": "2.25",
            "stroke-linejoin": "round",
            "stroke-linecap": "round",
            "vector-effect": "non-scaling-stroke"
        }));

        values.forEach((value, index) => {
            svg.appendChild(createElement("circle", {
                cx: getX(index),
                cy: getY(value),
                r: "3",
                fill: lineColor,
                "vector-effect": "non-scaling-stroke"
            }));
        });
    }

    drawLine(moods, "#4f46e5");
    drawLine(stresses, "#f59e0b");

    /* SVG legend */
    const legendStart = Math.max(left + 10, width - 116);

    function addLegend(x, color, label) {
        svg.appendChild(createElement("circle", {
            cx: x,
            cy: 13,
            r: "3.5",
            fill: color
        }));

        addText(label, x + 8, 16, {
            fill: "#737e91",
            "font-size": "10",
            "font-family": "Arial, Helvetica, sans-serif",
            "font-weight": "600"
        });
    }

    addLegend(legendStart, "#4f46e5", "Mood");
    addLegend(legendStart + 65, "#f59e0b", "Stress");
}


// =========================================================
// WHAT CHANGED?
// =========================================================

function showChanges(records) {

    const container =
        document.getElementById(
            "changesContainer"
        );


    if (!container) {

        return;

    }


    if (
        !records ||
        records.length < 2
    ) {

        return;

    }


    const latest =
        records[0];


    const previous =
        records[1];


    container.innerHTML =
        "";


    addChange(
        container,
        "Mood",
        latest.mood,
        previous.mood
    );


    addChange(
        container,
        "Stress",
        latest.stress,
        previous.stress
    );


    addChange(
        container,
        "Energy",
        latest.energy,
        previous.energy
    );


    addChange(
        container,
        "Sleep",
        latest.sleep_hours,
        previous.sleep_hours
    );


    if (
        container.children.length === 0
    ) {

        container.innerHTML = `

            <div class="no-change">
                No major changes since your last check-in.
            </div>

        `;

    }

}


// =========================================================
// ADD CHANGE
// =========================================================

function addChange(
    container,
    label,
    current,
    previous
) {

    const difference =
        Number(current) -
        Number(previous);


    if (
        isNaN(difference) ||
        difference === 0
    ) {

        return;

    }


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "change-item";


    const direction =
        difference > 0
            ? "↑"
            : "↓";


    const formatted =
        Math.abs(difference)
            .toFixed(1);


    item.innerHTML = `

        <span class="change-label">
            ${label}
        </span>

        <span class="change-value">
            ${direction} ${formatted}
        </span>

    `;


    container.appendChild(
        item
    );

}


// =========================================================
// LOGOUT
// =========================================================

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "access_token"
            );


            window.location.href =
                "login.html";

        }
    );

}


// =========================================================
// INITIALIZE
// =========================================================

loadUser();

loadWellness();


// =========================================================
// REDRAW CHART WHEN WINDOW RESIZES
// =========================================================

let chartResizeTimer;

window.addEventListener("resize", function () {
    clearTimeout(chartResizeTimer);

    chartResizeTimer = setTimeout(function () {
        apiRequest("/api/wellness/history")
            .then(records => {
                if (records) drawChart(records);
            })
            .catch(error => {
                console.error("Chart resize error:", error);
            });
    }, 180);
});

// =========================================================
// TODAY'S SCHEDULE
// =========================================================

async function loadTodaySchedule() {
    const container = document.getElementById("scheduleContainer");
    if (!container) return;

    try {
        const events = await apiRequest("/api/timetable");
        if (!events) return;

        const today = new Date().toLocaleDateString("en-US", {
            weekday: "long"
        });

        const todayEvents = events
            .filter(e => e.day_of_week === today)
            .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));

        if (!todayEvents.length) return;

        container.innerHTML = "";

        todayEvents.slice(0, 6).forEach(event => {
            const item = document.createElement("div");
            item.className = "schedule-item";
            item.innerHTML = `
                <span class="schedule-time">${escapeHtml(event.start_time)}–${escapeHtml(event.end_time)}</span>
                <div>
                    <div class="schedule-subject">${escapeHtml(event.subject)}</div>
                    ${event.location ? `<div class="schedule-location">📍 ${escapeHtml(event.location)}</div>` : ""}
                </div>
            `;
            container.appendChild(item);
        });
    } catch (error) {
        console.error("Schedule loading error:", error);
    }
}


// =========================================================
// DAILY PLANNER SUMMARY
// =========================================================

async function loadPlannerSummary() {
    const container = document.getElementById("plannerSummary");
    if (!container) return;

    try {
        const data = await apiRequest("/api/planner/today");
        if (!data) return;

        if (!data.plan || !data.plan.length) {
            container.innerHTML = `<div class="empty-insight"><span>🧭</span><p>No plan generated yet.</p></div>`;
            return;
        }

        container.innerHTML = "";
        data.plan.slice(0, 4).forEach(item => {
            const row = document.createElement("div");
            row.className = "mini-plan-item";
            row.innerHTML = `
                <span class="mini-plan-time">${escapeHtml(item.start_time)}</span>
                <span class="mini-plan-title">${escapeHtml(item.title)}</span>
            `;
            container.appendChild(row);
        });
    } catch (error) {
        console.error("Planner summary error:", error);
    }
}


// =========================================================
// PATTERN-BASED RISK CHECK
// =========================================================

async function loadRiskSummary() {
    const container = document.getElementById("riskSummary");
    if (!container) return;

    try {
        const data = await apiRequest("/api/ai/risk");
        if (!data) return;

        const levelClass = String(data.level || "low").toLowerCase();
        const factors = Array.isArray(data.factors) ? data.factors : [];

        container.innerHTML = `
            <div class="risk-box ${escapeHtml(levelClass)}">
                <div class="risk-level">${escapeHtml(data.label || "Low concern")}</div>
                <div class="risk-message">${escapeHtml(data.message || "")}</div>
                ${factors.slice(0, 3).map(f => `<div class="risk-factor">• ${escapeHtml(f)}</div>`).join("")}
            </div>
        `;
    } catch (error) {
        console.error("Risk summary error:", error);
    }
}


// =========================================================
// SMALL HTML ESCAPER
// =========================================================

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}




// =========================================================
// DAILY MOTIVATION
// =========================================================

const dailyMotivationalQuotes = [
    { text: "Believe you can, and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Small steps every day still move you forward.", author: "Unknown" },
    { text: "You do not have to be perfect to make progress.", author: "Unknown" },
    { text: "Your future is built by what you do today.", author: "Unknown" },
    { text: "Be proud of how far you've come.", author: "Unknown" },
    { text: "Difficult roads often lead to beautiful destinations.", author: "Unknown" },
    { text: "Progress, not perfection.", author: "Unknown" },
    { text: "A calm mind can handle a busy day.", author: "Unknown" },
    { text: "You are capable of more than you think.", author: "Unknown" },
    { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
    { text: "Keep going. Your effort is adding up.", author: "Unknown" },
    { text: "One good choice can change the direction of your day.", author: "Unknown" }
];

function setDailyMotivation() {
    const quoteElement = document.getElementById("dailyQuote");
    const authorElement = document.getElementById("quoteAuthor");
    if (!quoteElement || !authorElement) return;

    const previous = Number(localStorage.getItem("wellnessLastQuoteIndex"));
    let index = Math.floor(Math.random() * dailyMotivationalQuotes.length);

    if (dailyMotivationalQuotes.length > 1 && index === previous) {
        index = (index + 1) % dailyMotivationalQuotes.length;
    }

    const quote = dailyMotivationalQuotes[index];
    quoteElement.textContent = quote.text;
    authorElement.textContent = `— ${quote.author}`;
    localStorage.setItem("wellnessLastQuoteIndex", String(index));
}


// =========================================================
// FINAL LOADS
setDailyMotivation();
// =========================================================

loadTodaySchedule();
loadPlannerSummary();
loadRiskSummary();
