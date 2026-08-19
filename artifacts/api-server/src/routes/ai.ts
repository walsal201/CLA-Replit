import { Router } from "express";

const router = Router();

const AGENCY_CONTEXT = `You are CLIA — the Child Lost Intelligence Assistant for The Child Lost Agency (CLA), a professional Canadian child-tracking and protection agency founded in 2010 by Head Officer Walid Ibrahim (ID: 000539337), Toronto, Canada.

YOUR PRIMARY ROLE: Act as an emergency intake officer. When a caller reports a missing child, guide them step-by-step through collecting ALL required information below. Ask for one or two fields at a time — never dump all questions at once. Be calm, professional, and reassuring.

REQUIRED INTAKE FIELDS (collect ALL before filing):
1. childName — Full name of the missing child
2. childAge — Age in years (must be under 18)
3. gender — Boy / Girl / Other
4. lastSeen — Last known location (address, area, landmark)
5. dateMissing — Date and time last seen (e.g. "July 21, 2026 at 3:00 PM")
6. description — Physical description: height, hair colour, eye colour, clothing worn
7. reporterName — Full name of the person reporting (parent/guardian/witness)
8. reporterPhone — Contact phone number
9. caseType — Nature of disappearance: Missing / Runaway / Kidnapping / Parental Abduction / Stolen Newborn / Gang Involvement / Child Exploitation / School Non-Attendance
10. gpsEnrolled — Is the child enrolled in CLA GPS tracking? (yes / no)
11. province — Province (default: ONTARIO TORONTO if in Toronto area)
12. additionalDetails — Any other relevant details (suspects, vehicles, witnesses)

CONVERSATION FLOW:
- Start by greeting the caller and immediately asking for the child's name and age.
- After each answer, acknowledge it briefly ("Noted — child's name recorded.") then ask for the next field(s).
- If a caller gives vague answers, politely ask for clarification.
- Always remind them: "Stay calm — our units are standing by to deploy immediately once the report is filed."
- Once ALL 10 required fields (1–10) are collected, produce the CASE FILING block exactly as shown below — no exceptions, no abbreviations:

CASE FILING (only when ALL fields are collected):
Write a brief professional summary telling the caller their case has been filed and authorized personnel have been alerted. Then on a new line output EXACTLY:

[CASE_DATA]
{
  "childName": "...",
  "childAge": 0,
  "gender": "...",
  "lastSeen": "...",
  "dateMissing": "...",
  "description": "...",
  "reporterName": "...",
  "reporterPhone": "...",
  "caseType": "...",
  "gpsEnrolled": "yes or no",
  "province": "ONTARIO TORONTO",
  "additionalDetails": "..."
}
[/CASE_DATA]

AGENCY TECHNOLOGY: GPS microchip bracelets, necklaces, flying insect robots, spider robots, drone fleet (FALCON-1, HAWK-2, EAGLE-3). Command center runs on Python & AI controlling camera rotation, stereo reconstruction algorithms, and real-time robot activity. AES-256 encryption. Solar power (day) / Electric (night). Garmin G-162, G-176, G76, Magellan Meridian, Sport Rack GPS units.

For non-intake questions (agency info, technology, enrollment, status updates), answer professionally and concisely. Always steer the conversation back to "Do you need to report a missing child?"

IMPORTANT: Never invent case data. Only output [CASE_DATA] when the caller has provided all required fields.`;

async function callOpenAI(messages: Array<{ role: string; content: string }>, maxTokens = 700): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured on the server.");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens: maxTokens, temperature: 0.7 }),
  });

  const data = (await res.json()) as {
    error?: { message: string };
    choices?: Array<{ message: { content: string } }>;
  };
  if (data.error) throw new Error(data.error.message);
  return data.choices?.[0]?.message?.content ?? "";
}

router.post("/ai/chat", async (req, res) => {
  try {
    const { messages = [] } = req.body as { messages: Array<{ role: string; content: string }> };
    const fullMessages = [{ role: "system", content: AGENCY_CONTEXT }, ...messages.slice(-14)];
    const reply = await callOpenAI(fullMessages, 600);
    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "AI chat failed");
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/ai/case-analysis", async (req, res) => {
  try {
    const { caseData = {} } = req.body as { caseData: Record<string, string> };
    const desc = Object.entries(caseData).map(([k, v]) => `${k}: ${v}`).join("\n") || "Case data not provided";

    const prompt = `You are the CLA Case Analysis AI. Analyze the following missing child case:\n\n${desc}\n\nProvide:\n1. Case urgency classification (Priority 1–5)\n2. Most probable scenario\n3. Recommended immediate actions (first 24 hours)\n4. GPS and drone deployment suggestions\n5. Key contacts to notify\n6. Risk factors identified\n\nBe thorough but concise.`;

    const text = await callOpenAI([{ role: "user", content: prompt }], 800);
    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "AI case analysis failed");
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/ai/emergency-alert", async (req, res) => {
  try {
    const { situation = "", area = "Toronto" } = req.body as { situation?: string; area?: string };

    const prompt = `You are the CLA Emergency Alert AI. Generate a professional AMBER-style emergency alert for:\n\nSituation: ${situation || "Missing child — details unknown"}\nArea: ${area}\n\nInclude:\n1. Alert headline (max 10 words, urgent tone)\n2. Public broadcast message (150 words max)\n3. What the public should look for\n4. Who to contact and how\n5. What NOT to do\n\nFormat for immediate broadcast.`;

    const text = await callOpenAI([{ role: "user", content: prompt }], 600);
    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "AI alert failed");
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/ai/maintenance", async (req, res) => {
  try {
    const { systems = [], notes = "" } = req.body as { systems?: string[]; notes?: string };
    const systemList = systems.length
      ? systems.join(", ")
      : "GPS Network, Drone Fleet, Robot Units, Communications, Data Vault";

    const prompt = `You are the CLA Maintenance AI. Generate a professional maintenance status report for: ${systemList}.${notes ? " Additional notes: " + notes : ""}\n\nFor each system include:\n- Current operational status\n- Recommended actions or alerts\n- Next scheduled maintenance window\n- Performance score (0–100%)\n\nToday's date: ${new Date().toDateString()}.`;

    const text = await callOpenAI([{ role: "user", content: prompt }], 800);
    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "AI maintenance failed");
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/ai/battery", async (req, res) => {
  try {
    const { units = [] } = req.body as { units?: Array<{ name: string; charge: number; type?: string }> };
    const unitsDesc = units.length
      ? units.map((u) => `${u.name}: ${u.charge}% (${u.type ?? "electric"})`).join(", ")
      : "Falcon-1 Drone: 87% (solar), Hawk-2 Drone: 62% (electric), Eagle-3 Drone: 95% (solar), Spider-Robot SR-01: 44% (electric), Spider-Robot SR-02: 78% (electric)";

    const prompt = `You are the CLA Power & Battery AI. Analyze the following unit power levels:\n\n${unitsDesc}\n\nProvide:\n1. Overall fleet power health rating\n2. Units needing immediate recharging (below 50%)\n3. Estimated operational range hours for each unit\n4. Recommendations: solar vs. electric charging priority\n5. Deployment readiness assessment\n\nBe concise and structured.`;

    const text = await callOpenAI([{ role: "user", content: prompt }], 700);
    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "AI battery failed");
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/ai/threat", async (req, res) => {
  try {
    const { target = "", weapons = [], location = "Toronto" } = req.body as {
      target?: string;
      weapons?: string[];
      location?: string;
    };
    const weaponList = weapons.length ? weapons.join(", ") : "standard drone deployment";

    const prompt = `You are the CLA Threat Assessment AI. Pre-deployment threat assessment:\n\nTarget: ${target || "Unknown suspect"}\nLocation: ${location}\nDeployment systems: ${weaponList}\n\nProvide:\n1. Threat level rating (LOW / MEDIUM / HIGH / CRITICAL)\n2. Environmental risk factors\n3. Recommended approach and deployment order\n4. Collateral concern mitigation (child safety priority)\n5. Abort conditions\n6. Expected outcome probability\n\nPrioritize non-lethal options. This is a child rescue operation.`;

    const text = await callOpenAI([{ role: "user", content: prompt }], 700);
    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "AI threat failed");
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
