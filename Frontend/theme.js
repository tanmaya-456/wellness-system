(function () {
    const STORAGE_KEY = "wellness_theme";

    function getTheme() {
        return localStorage.getItem(STORAGE_KEY) || "light";
    }

    function applyTheme(theme) {
        const isDark = theme === "dark";

        document.documentElement.classList.toggle("dark-mode-preload", isDark);

        if (document.body) {
            document.body.classList.toggle("dark-mode", isDark);
        }

        localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");

        const button = document.getElementById("themeToggle");

        if (button) {
            button.textContent = isDark ? "☀️ Light" : "🌙 Dark";
            button.setAttribute(
                "aria-label",
                isDark ? "Switch to light mode" : "Switch to dark mode"
            );
            button.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");
        }
    }

    // Apply as early as possible.
    const initialTheme = getTheme();
    document.documentElement.classList.toggle(
        "dark-mode-preload",
        initialTheme === "dark"
    );

    document.addEventListener("DOMContentLoaded", function () {
        applyTheme(initialTheme);

        let button = document.getElementById("themeToggle");

        if (!button) {
            button = document.createElement("button");
            button.id = "themeToggle";
            button.className = "theme-toggle";
            button.type = "button";
            document.body.appendChild(button);
        }

        button.onclick = function () {
            const nextTheme =
                document.body.classList.contains("dark-mode")
                    ? "light"
                    : "dark";

            applyTheme(nextTheme);
        };

        applyTheme(getTheme());
    });
})();
