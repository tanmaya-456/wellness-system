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
// API
// =========================================================

async function loadAnalytics() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/analytics/overview`,
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
                "Unable to load analytics."
            );

        }


        updateDashboard(
            data
        );


    } catch (error) {

        console.error(
            "Analytics error:",
            error
        );


        document.getElementById(
            "message"
        ).textContent =
            error.message;

        document.getElementById(
            "message"
        ).className =
            "message error";

    }

}


// =========================================================
// UPDATE DASHBOARD
// =========================================================

function updateDashboard(
    data
) {

    const wellness =
        data.wellness;


    const habits =
        data.habits;


    const screen =
        data.screen_time;


    const wearable =
        data.wearable;


    const activity =
        data.activity;


    // -----------------------------------------------------
    // WELLNESS
    // -----------------------------------------------------

    setText(
        "averageMood",
        wellness.average_mood
    );


    setText(
        "averageStress",
        wellness.average_stress
    );


    setText(
        "averageEnergy",
        wellness.average_energy
    );


    setText(
        "averageSleep",
        wellness.average_sleep
    );


    // -----------------------------------------------------
    // HABITS
    // -----------------------------------------------------

    setText(
        "studyAverage",
        habits.average_study_minutes
    );


    setText(
        "exerciseAverage",
        habits.average_exercise_minutes
    );


    setText(
        "waterAverage",
        habits.average_water_glasses
    );


    setText(
        "meditationAverage",
        habits.average_meditation_minutes
    );


    // -----------------------------------------------------
    // SCREEN TIME
    // -----------------------------------------------------

    setText(
        "screenTime",
        screen.total_minutes
    );


    setText(
        "mostUsedApp",
        screen.most_used_app || "—"
    );


    // -----------------------------------------------------
    // ACTIVITY
    // -----------------------------------------------------

    setText(
        "totalActivity",
        activity.total_activity_minutes
    );


    // -----------------------------------------------------
    // WEARABLE
    // -----------------------------------------------------

    setText(
        "averageSteps",
        wearable.average_steps || "—"
    );


    // -----------------------------------------------------
    // RECORD COUNTS
    // -----------------------------------------------------

    setText(
        "wellnessRecords",
        data.record_counts.wellness
    );


    setText(
        "habitRecords",
        data.record_counts.habits
    );


    setText(
        "screenRecords",
        data.record_counts.screen_time
    );


    setText(
        "wearableRecords",
        data.record_counts.wearable
    );


    // -----------------------------------------------------
    // SCORE
    // -----------------------------------------------------

    calculateWellnessScore(
        wellness
    );


    // -----------------------------------------------------
    // CHART
    // -----------------------------------------------------

    drawChart(
        data.wellness_trend
    );

}


// =========================================================
// WELLNESS SCORE
// =========================================================

function calculateWellnessScore(
    wellness
) {

    if (
        wellness.average_mood === 0 &&
        wellness.average_stress === 0 &&
        wellness.average_energy === 0
    ) {

        setText(
            "wellnessScore",
            "—"
        );

        setText(
            "scoreDescription",
            "Complete a few check-ins to calculate your wellness score."
        );

        return;

    }


    /*
        Higher mood = better
        Higher energy = better
        Lower stress = better
    */

    const mood =
        wellness.average_mood;


    const energy =
        wellness.average_energy;


    const stress =
        wellness.average_stress;


    const score =
        (
            mood * 0.4 +
            energy * 0.3 +
            (10 - stress) * 0.3
        ) * 10;


    const finalScore =
        Math.round(
            Math.max(
                0,
                Math.min(
                    100,
                    score
                )
            )
        );


    setText(
        "wellnessScore",
        finalScore
    );


    let description;


    if (
        finalScore >= 75
    ) {

        description =
            "Your recent indicators look generally positive. Keep maintaining the habits that support you.";

    } else if (
        finalScore >= 50
    ) {

        description =
            "Your wellness indicators are mixed. Look for patterns in sleep, stress, activity and workload.";

    } else {

        description =
            "Some wellness indicators may need attention. Look at your recent trends and consider supportive changes.";

    }


    setText(
        "scoreDescription",
        description
    );

}


// =========================================================
// CHART
// =========================================================

function drawChart(
    records
) {

    const canvas =
        document.getElementById(
            "wellnessChart"
        );


    const ctx =
        canvas.getContext(
            "2d"
        );


    if (
        !records ||
        records.length === 0
    ) {

        drawEmptyChart(
            canvas,
            ctx
        );

        return;

    }


    const rect =
        canvas.getBoundingClientRect();


    const ratio =
        window.devicePixelRatio || 1;


    canvas.width =
        rect.width * ratio;


    canvas.height =
        rect.height * ratio;


    ctx.scale(
        ratio,
        ratio
    );


    const width =
        rect.width;


    const height =
        rect.height;


    const padding = {

        top: 30,

        right: 30,

        bottom: 45,

        left: 45

    };


    const chartWidth =
        width -
        padding.left -
        padding.right;


    const chartHeight =
        height -
        padding.top -
        padding.bottom;


    // -----------------------------------------------------
    // SORT CHRONOLOGICALLY
    // -----------------------------------------------------

    const data =
        [...records]
            .sort(
                function (
                    a,
                    b
                ) {

                    return new Date(a.date) -
                        new Date(b.date);

                }
            );


    const values = [

        ...data.map(
            item => Number(item.mood)
        ),

        ...data.map(
            item => Number(item.stress)
        ),

        ...data.map(
            item => Number(item.energy)
        )

    ];


    // -----------------------------------------------------
    // GRID
    // -----------------------------------------------------

    ctx.font =
        "12px Arial";


    ctx.textAlign =
        "right";


    for (
        let value = 0;
        value <= 10;
        value += 2
    ) {

        const y =
            padding.top +
            chartHeight -
            (
                value / 10
            ) *
            chartHeight;


        ctx.beginPath();


        ctx.moveTo(
            padding.left,
            y
        );


        ctx.lineTo(
            width -
            padding.right,
            y
        );


        ctx.strokeStyle =
            "#e5e7eb";


        ctx.lineWidth =
            1;


        ctx.stroke();


        ctx.fillStyle =
            "#7b8190";


        ctx.fillText(
            value,
            padding.left - 8,
            y + 4
        );

    }


    // -----------------------------------------------------
    // X POSITION
    // -----------------------------------------------------

    function getX(
        index
    ) {

        if (
            data.length === 1
        ) {

            return width / 2;

        }


        return (
            padding.left +
            index *
            (
                chartWidth /
                (data.length - 1)
            )
        );

    }


    // -----------------------------------------------------
    // Y POSITION
    // -----------------------------------------------------

    function getY(
        value
    ) {

        return (
            padding.top +
            chartHeight -
            (
                value / 10
            ) *
            chartHeight
        );

    }


    // -----------------------------------------------------
    // DATE LABELS
    // -----------------------------------------------------

    ctx.textAlign =
        "center";


    data.forEach(
        function (
            item,
            index
        ) {

            const x =
                getX(index);


            const date =
                new Date(
                    item.date
                );


            const label =
                date.toLocaleDateString(
                    [],
                    {
                        day: "numeric",
                        month: "short"
                    }
                );


            ctx.fillStyle =
                "#7b8190";


            ctx.fillText(
                label,
                x,
                height - 15
            );

        }
    );


    // -----------------------------------------------------
    // DRAW LINE
    // -----------------------------------------------------

    drawLine(
        ctx,
        data,
        "mood",
        "#4f46e5",
        getX,
        getY
    );


    drawLine(
        ctx,
        data,
        "stress",
        "#f59e0b",
        getX,
        getY
    );


    drawLine(
        ctx,
        data,
        "energy",
        "#16a34a",
        getX,
        getY
    );

}


// =========================================================
// DRAW LINE
// =========================================================

function drawLine(
    ctx,
    data,
    property,
    color,
    getX,
    getY
) {

    if (
        data.length === 0
    ) {

        return;

    }


    ctx.beginPath();


    data.forEach(
        function (
            item,
            index
        ) {

            const value =
                Number(
                    item[property]
                );


            const x =
                getX(index);


            const y =
                getY(value);


            if (
                index === 0
            ) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );

            }

        }
    );


    ctx.strokeStyle =
        color;


    ctx.lineWidth =
        2.5;


    ctx.stroke();


    // Points

    data.forEach(
        function (
            item,
            index
        ) {

            const value =
                Number(
                    item[property]
                );


            const x =
                getX(index);


            const y =
                getY(value);


            ctx.beginPath();


            ctx.arc(
                x,
                y,
                4,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                color;


            ctx.fill();

        }
    );

}


// =========================================================
// EMPTY CHART
// =========================================================

function drawEmptyChart(
    canvas,
    ctx
) {

    const width =
        canvas.clientWidth;


    const height =
        canvas.clientHeight;


    canvas.width =
        width *
        (window.devicePixelRatio || 1);


    canvas.height =
        height *
        (window.devicePixelRatio || 1);


    ctx.scale(
        window.devicePixelRatio || 1,
        window.devicePixelRatio || 1
    );


    ctx.fillStyle =
        "#8a91a0";


    ctx.font =
        "15px Arial";


    ctx.textAlign =
        "center";


    ctx.fillText(
        "Complete at least one wellness check-in to see your trend.",
        width / 2,
        height / 2
    );

}


// =========================================================
// HELPER
// =========================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.textContent =
        value;

}


// =========================================================
// INITIALIZE
// =========================================================

loadAnalytics();