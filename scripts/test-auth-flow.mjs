/**
 * End-to-end auth flow test against the running dev server.
 * Tests: signup → login → access protected route → verify session.
 */

const BASE = "http://localhost:3000";

async function testSignup() {
  console.log("\n=== TEST: Signup ===");
  const formData = new URLSearchParams();
  formData.append("email", "e2etest@gmail.com");
  formData.append("password", "password123");

  const res = await fetch(`${BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
    redirect: "manual",
  });

  console.log("Status:", res.status);
  console.log("Location:", res.headers.get("location"));
  console.log("Set-Cookie count:", res.headers.getSetCookie?.()?.length || 0);
  
  const cookies = res.headers.getSetCookie?.() || [];
  console.log("Cookies:", cookies.map(c => c.split("=")[0]).join(", "));
  
  return cookies;
}

async function testLogin() {
  console.log("\n=== TEST: Login ===");
  const formData = new URLSearchParams();
  formData.append("email", "testing@gmail.com");
  formData.append("password", "password123");

  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
    redirect: "manual",
  });

  console.log("Status:", res.status);
  console.log("Location:", res.headers.get("location"));
  
  const cookies = res.headers.getSetCookie?.() || [];
  console.log("Set-Cookie count:", cookies.length);
  console.log("Cookie names:", cookies.map(c => c.split("=")[0]).join(", "));
  
  return cookies;
}

async function testProtectedRoute(cookies) {
  console.log("\n=== TEST: Access /inbox with cookies ===");
  const cookieHeader = cookies.map(c => c.split(";")[0]).join("; ");
  
  const res = await fetch(`${BASE}/inbox`, {
    headers: { Cookie: cookieHeader },
    redirect: "manual",
  });

  console.log("Status:", res.status);
  console.log("Location:", res.headers.get("location"));
  console.log("Redirected to login?", res.headers.get("location")?.includes("/login"));
}

async function testLoginPage() {
  console.log("\n=== TEST: GET /login (should render) ===");
  const res = await fetch(`${BASE}/login`);
  console.log("Status:", res.status);
  const html = await res.text();
  console.log("Contains form:", html.includes('<form'));
  console.log("Contains error param:", html.includes('error'));
}

async function main() {
  await testLoginPage();
  const loginCookies = await testLogin();
  await testProtectedRoute(loginCookies);
}

main().catch(console.error);
