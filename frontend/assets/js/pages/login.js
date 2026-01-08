import { loginAPI } from "../api/auth.js";

document.getElementById("loginBtn").addEventListener("click", async () => {

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const errorMsg = document.getElementById("errorMsg");
  errorMsg.innerText = ""; // clear old errors

  if (!email || !password) {
    errorMsg.innerText = "Email and password are required";
    return;
  }

  const result = await loginAPI(email, password);

  if (result.error) {
    errorMsg.innerText = result.error;
    return;
  }

  if (result.message !== "Login successful") {
    errorMsg.innerText = result.message;
    return;
  }

  // Login success
  alert("Login successful!");
  window.location.href = "./dashboard.html";  // next page
});
