const API_KEY = "AIzaSyCXu-ohyVhxpnDrhy5rAUdYPisp45Cqy9Q";

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: 'Respond with JSON only: {"greeting": "hello"}' }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 100 },
    }),
  }
);

const data = await res.json();
if (data.error) {
  console.log("ERROR:", JSON.stringify(data.error, null, 2));
} else {
  console.log("SUCCESS:", data.candidates?.[0]?.content?.parts?.[0]?.text);
}
