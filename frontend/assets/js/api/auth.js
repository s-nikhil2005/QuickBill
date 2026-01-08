const API_BASE = "http://localhost:5000/api";  // your backend URL

export async function loginAPI(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",   // important for cookies
      body: JSON.stringify({ email, password })
    });

    return await res.json();

  } catch (err) {
    return { error: err.message };
  }
}
