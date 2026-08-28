const API_URL = "http://127.0.0.1:8000";

const statusIndicator = document.getElementById("statusIndicator");
const statusText = document.getElementById("statusText");
const statusMessage = document.getElementById("statusMessage");
const checkButton = document.getElementById("checkButton");


async function checkBackend() {

    statusText.textContent = "Checking backend...";
    statusMessage.textContent = "Connecting to the server.";

    statusIndicator.classList.remove("connected");
    statusIndicator.classList.remove("error");

    try {

        const response = await fetch(`${API_URL}/api/health`);

        if (!response.ok) {
            throw new Error("Server returned an error.");
        }

        const data = await response.json();

        statusIndicator.classList.add("connected");

        statusText.textContent = "Backend connected";

        statusMessage.textContent = data.message;

    } catch (error) {

        statusIndicator.classList.add("error");

        statusText.textContent = "Backend unavailable";

        statusMessage.textContent =
            "Make sure the FastAPI server is running.";

        console.error(error);
    }
}


checkButton.addEventListener("click", checkBackend);

checkBackend();