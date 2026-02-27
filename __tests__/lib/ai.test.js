import { processEmail, processEmails } from "../../lib/ai";

// Mock logger
jest.mock("../../lib/logger", () => ({
  logError: jest.fn(),
}));

// Mock Anthropic SDK
const mockCreate = jest.fn();
jest.mock("@anthropic-ai/sdk", () => {
  return jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  }));
});

describe("ai", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEmail = {
    id: "msg1",
    from: "Test User",
    email: "test@example.com",
    subject: "Test Subject",
    body: "Test body content",
    preview: "Test preview",
  };

  describe("processEmail", () => {
    it("returns enriched email on successful AI response", async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{
          text: JSON.stringify({
            category: "work",
            urgency: "high",
            needs_reply: true,
            ai_reply: "Thanks for reaching out!",
            summary: "A work email about a project",
            suggest_unsubscribe: false,
            smart_actions: [{ type: "follow_up", label: "Follow up", detail: "Reply by Friday" }],
          }),
        }],
      });

      const result = await processEmail(mockEmail);
      expect(result.category).toBe("Work");
      expect(result.urgency).toBe("high");
      expect(result.aiReply).toBe("Thanks for reaching out!");
      expect(result.summary).toBe("A work email about a project");
      expect(result.color).toBe("#6366f1");
      expect(result.smartActions).toHaveLength(1);
    });

    it("returns fallback email when AI fails", async () => {
      mockCreate.mockRejectedValueOnce(new Error("API down"));

      const result = await processEmail(mockEmail);
      expect(result.category).toBe("Other");
      expect(result.color).toBe("#94a3b8");
      expect(result.urgency).toBe("low");
      expect(result.aiReply).toBeNull();
      expect(result.summary).toBe("Test preview");
    });

    it("handles previouslyUnsubscribed flag", async () => {
      const unsubEmail = { ...mockEmail, previouslyUnsubscribed: true };
      mockCreate.mockResolvedValueOnce({
        content: [{
          text: JSON.stringify({
            category: "newsletter",
            urgency: "low",
            needs_reply: false,
            ai_reply: null,
            summary: "Newsletter",
            suggest_unsubscribe: true,
            smart_actions: [],
          }),
        }],
      });

      const result = await processEmail(unsubEmail);
      expect(result.suggestUnsubscribe).toBe(true);
      // Verify the prompt included unsubscribe context
      const promptArg = mockCreate.mock.calls[0][0].messages[0].content;
      expect(promptArg).toContain("PREVIOUSLY UNSUBSCRIBED");
    });

    it("handles malformed AI JSON response", async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ text: "Sorry, I cannot help with that." }],
      });

      const result = await processEmail(mockEmail);
      // Should fall back to defaults
      expect(result.category).toBe("Other");
      expect(result.urgency).toBe("low");
    });

    it("sets aiReply to null when needs_reply is false", async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{
          text: JSON.stringify({
            category: "notification",
            urgency: "low",
            needs_reply: false,
            ai_reply: null,
            summary: "A notification",
            suggest_unsubscribe: false,
            smart_actions: [],
          }),
        }],
      });

      const result = await processEmail(mockEmail);
      expect(result.aiReply).toBeNull();
    });
  });

  describe("processEmails", () => {
    it("processes emails in batches of 5", async () => {
      const emails = Array.from({ length: 7 }, (_, i) => ({
        ...mockEmail,
        id: "msg" + i,
      }));

      mockCreate.mockResolvedValue({
        content: [{
          text: JSON.stringify({
            category: "work",
            urgency: "medium",
            needs_reply: false,
            ai_reply: null,
            summary: "Email",
            suggest_unsubscribe: false,
            smart_actions: [],
          }),
        }],
      });

      const results = await processEmails(emails);
      expect(results).toHaveLength(7);
      expect(mockCreate).toHaveBeenCalledTimes(7);
    });

    it("sorts results by urgency (high first)", async () => {
      const emails = [
        { ...mockEmail, id: "low" },
        { ...mockEmail, id: "high" },
        { ...mockEmail, id: "med" },
      ];

      const urgencies = ["low", "high", "medium"];
      emails.forEach((_, i) => {
        mockCreate.mockResolvedValueOnce({
          content: [{
            text: JSON.stringify({
              category: "work",
              urgency: urgencies[i],
              needs_reply: false,
              ai_reply: null,
              summary: "Email",
              suggest_unsubscribe: false,
              smart_actions: [],
            }),
          }],
        });
      });

      const results = await processEmails(emails);
      expect(results[0].urgency).toBe("high");
      expect(results[1].urgency).toBe("medium");
      expect(results[2].urgency).toBe("low");
    });

    it("returns empty array for empty input", async () => {
      const results = await processEmails([]);
      expect(results).toEqual([]);
    });
  });
});
