const BASE = "http://localhost:3000";

async function test() {
  // Step 1: Login
  console.log("=== Step 1: Login ===");
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "testing@gmail.com", password: "password123" }),
  });

  console.log("Login status:", loginRes.status);
  const loginBody = await loginRes.json();
  console.log("Login body:", loginBody);

  const cookies = loginRes.headers.getSetCookie() || [];
  console.log("Cookies received:", cookies.length);
  cookies.forEach(c => console.log("  ", c.substring(0, 80) + "..."));

  // Step 2: Access protected route with cookies
  console.log("\n=== Step 2: Access /inbox with cookies ===");
  const cookieHeader = cookies.map(c => c.split(";")[0]).join("; ");

  const inboxRes = await fetch(`${BASE}/inbox`, {
    headers: { Cookie: cookieHeader },
    redirect: "manual",
  });

  console.log("Inbox status:", inboxRes.status);
  console.log("Redirected?", inboxRes.status === 307 || inboxRes.status === 302);
  console.log("Location:", inboxRes.headers.get("location"));

  if (inboxRes.status === 200) {
    const html = await inboxRes.text();
    console.log("Contains inbox content:", html.includes("InboxView") || html.includes("inbox") || html.includes("sekpriAI"));
    console.log("HTML length:", html.length);
  }

  // Step 3: Test without cookies (should redirect to login)
  console.log("\n=== Step 3: Access /inbox WITHOUT cookies ===");
  const noAuthRes = await fetch(`${BASE}/inbox`, { redirect: "manual" });
  console.log("Status:", noAuthRes.status);
  console.log("Redirects to login:", noAuthRes.headers.get("location")?.includes("/login"));
}

test().catch(console.error);
