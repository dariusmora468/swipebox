import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORY_MAP = {
  newsletter: { color: "#64748b", needs_reply: false },
  notification: { color: "#64748b", needs_reply: false },
  finance: { color: "#635bff", needs_reply: false },
  marketing: { color: "#64748b", needs_reply: false },
  personal: { color: "#ec4899", needs_reply: true },
  work: { color: "#6366f1", needs_reply: true },
  recruiting: { color: "#f59e0b", needs_reply: true },
  support: { color: "#10b981", needs_reply: true },
  investor: { color: "#ec4899", needs_reply: true },
  other: { color: "#94a3b8", needs_reply: true },
};

export async function processEmail(email) {
  const prompt = `You are an AI email assistant for Darius. Analyze this email and respond with valid JSON only.

Email:
- From: ${email.from} <${email.email}>
- Subject: ${email.subject}
- Body: ${email.body}

Respond with this exact JSON structure:
{
  "category": "one of: newsletter, notification, finance, marketing, personal, work, recruiting, support, investor, other",
  "needs_reply": true or false,
  "ai_reply": "A draft reply if needs_reply is true, otherwise null. Keep it casual but professional, concise, and friendly. Match the tone of the sender. Sign off naturally without a formal signature.",
  "summary": "One sentence summary of what this email is about"
}

Rules:
- Newsletters, notifications, receipts, and marketing emails do NOT need replies
- If it is a real person asking something or expecting a response, it DOES need a reply
- Keep replies concise (2-4 sentences max)
- Be warm and direct, like you are texting a colleague
- Never include a formal email signature`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const result = JSON.parse(jsonMatch[0]);
    const catConfig = CATEGORY_MAP[result.category] || CATEGORY_MAP.other;
    return {
      ...email,
      category: result.category.charAt(0).toUpperCase() + result.category.slice(1),
      color: catConfig.color,
      aiReply: result.needs_reply ? result.ai_reply : null,
      summary: result.summary,
    };
  } catch (err) {
    console.error("AI processing error:", err);
    return {
      ...email,
      category: "Other",
      color: "#94a3b8",
      aiReply: null,
      summary: email.preview,
    };
  }
}

export async function processEmails(emails) {
  const results = [];
  for (let i = 0; i < emails.length; i += 5) {
    const batch = emails.slice(i, i + 5);
    const processed = await Promise.all(batch.map(processEmail));
    results.push(...processed);
  }
  return results;
}
