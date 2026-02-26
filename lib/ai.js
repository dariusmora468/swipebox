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
  shipping: { color: "#f97316", needs_reply: false },
  travel: { color: "#0ea5e9", needs_reply: false },
  calendar: { color: "#8b5cf6", needs_reply: false },
  other: { color: "#94a3b8", needs_reply: true },
};

export async function processEmail(email) {
  const prompt = `You are an AI email assistant for Darius, a busy founder. Analyze this email and respond with valid JSON only.

Email:
- From: ${email.from} <${email.email}>
- Subject: ${email.subject}
- Body: ${email.body}

Respond with this exact JSON structure:
{
  "category": "one of: newsletter, notification, finance, marketing, personal, work, recruiting, support, investor, shipping, travel, calendar, other",
  "urgency": "low, medium, or high",
  "needs_reply": true or false,
  "ai_reply": "A draft reply if needs_reply is true, otherwise null. Keep it casual but professional, concise, and friendly. Match the tone of the sender. Sign off naturally without a formal signature.",
  "summary": "One sentence summary of what this email is about",
  "smart_actions": [
    {
      "type": "one of: add_calendar, set_reminder, save_link, track_package, save_contact, follow_up",
      "label": "Short button label like 'Add to Calendar' or 'Track Package'",
      "detail": "Brief detail like 'Meeting tomorrow at 4pm' or 'Package arrives Feb 26'"
    }
  ]
}

Rules:
- Newsletters, notifications, receipts, and marketing emails do NOT need replies
- If it is a real person asking something or expecting a response, it DOES need a reply
- Keep replies concise (2-4 sentences max)
- Be warm and direct, like texting a colleague
- Never include a formal email signature
- For smart_actions: detect ANY actionable items in the email. Examples:
  * Dates/times/meetings -> "add_calendar"
  * Deadlines or follow-ups needed -> "set_reminder"
  * Useful links, docs, resources -> "save_link"
  * Package tracking, deliveries -> "track_package"
  * New important contacts -> "save_contact"
  * Things that need follow-up later -> "follow_up"
- Return an empty array [] for smart_actions if nothing actionable
- Be generous with smart_actions - if there is ANY date, event, deadline, or actionable item, include it`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 700,
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
      urgency: result.urgency || "low",
      aiReply: result.needs_reply ? result.ai_reply : null,
      summary: result.summary,
      smartActions: result.smart_actions || [],
    };
  } catch (err) {
    console.error("AI processing error:", err);
    return {
      ...email,
      category: "Other",
      color: "#94a3b8",
      urgency: "low",
      aiReply: null,
      summary: email.preview,
      smartActions: [],
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

  // Sort by urgency: high first, then medium, then low
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  results.sort((a, b) => (urgencyOrder[a.urgency] || 2) - (urgencyOrder[b.urgency] || 2));

  return results;
}
