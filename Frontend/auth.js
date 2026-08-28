const API_URL = "https://wellness-system.onrender.com";


// =========================================================
// ELEMENTS
// =========================================================

const registerForm =
    document.getElementById("registerForm");

const loginForm =
    document.getElementById("loginForm");

const message =
    document.getElementById("message");

const successPopup =
    document.getElementById("successPopup");

const continueLogin =
    document.getElementById("continueLogin");


// =========================================================
// MESSAGE
// =========================================================

function showMessage(text, type = "error") {

    if (!message) return;

    message.textContent = text;

    message.className =
        `message ${type}`;

}


// =========================================================
// REGISTER
// =========================================================

const registerButton =
    document.getElementById("registerButton");


if (registerButton) {

    registerButton.addEventListener(
        "click",
        async function () {

            const username =
                document
                    .getElementById("username")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    .value;


            // ---------------------------------------------
            // VALIDATION
            // ---------------------------------------------

            if (!username) {

                showMessage(
                    "Please enter a username."
                );

                return;

            }


            if (username.length < 3) {

                showMessage(
                    "Username must contain at least 3 characters."
                );

                return;

            }


            if (password.length < 8) {

                showMessage(
                    "Password must contain at least 8 characters."
                );

                return;

            }


            if (password !== confirmPassword) {

                showMessage(
                    "Passwords do not match."
                );

                return;

            }


            // ---------------------------------------------
            // DISABLE BUTTON
            // ---------------------------------------------

            registerButton.disabled = true;

            registerButton.textContent =
                "Creating Account...";


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/auth/register`,
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                username: username,

                                password: password

                            })

                        }
                    );


                const data =
                    await response.json();


                // ---------------------------------------------
                // REGISTRATION FAILED
                // ---------------------------------------------

                if (!response.ok) {

                    showMessage(
                        data.detail ||
                        "Registration failed."
                    );

                    return;

                }


                // ---------------------------------------------
                // REGISTRATION SUCCESS
                // ---------------------------------------------

                console.log(
                    "Registration successful."
                );


                // Hide normal message

                if (message) {

                    message.textContent = "";

                    message.className =
                        "message";

                }


                // Clear form

                document
                    .getElementById("registerForm")
                    .reset();


                // SHOW POPUP

                if (successPopup) {

                    successPopup.classList.add(
                        "show"
                    );

                }

            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );


                showMessage(
                    "Unable to connect to the server."
                );

            } finally {

                registerButton.disabled =
                    false;

                registerButton.textContent =
                    "Create Account";

            }

        }
    );

}

// =========================================================
// CONTINUE TO LOGIN
// =========================================================

if (continueLogin) {

    continueLogin.addEventListener(
        "click",
        function () {

            window.location.href =
                "login.html";

        }
    );

}


// =========================================================
// LOGIN
// =========================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const username =
                document
                    .getElementById("username")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            try {

                const formData =
                    new URLSearchParams();


                formData.append(
                    "username",
                    username
                );


                formData.append(
                    "password",
                    password
                );


                const response =
                    await fetch(
                        `${API_URL}/api/auth/login`,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/x-www-form-urlencoded"

                            },

                            body:
                                formData.toString()

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    showMessage(
                        data.detail ||
                        "Login failed."
                    );

                    return;

                }


                // ---------------------------------------------
                // SAVE TOKEN
                // ---------------------------------------------

                localStorage.setItem(
                    "access_token",
                    data.access_token
                );


                // ---------------------------------------------
                // GO TO DASHBOARD
                // ---------------------------------------------

                window.location.href =
                    "dashboard.html";


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                showMessage(
                    "Unable to connect to the server."
                );

            }

        }
    );

}