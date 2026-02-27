import { POST } from "../../app/api/emails/unsubscribe/route";

jest.mock("../../lib/logger", () => ({
  logError: jest.fn(),
}));

const mockGet = jest.fn();
jest.mock("next/headers", () => ({
  cookies: () => ({ get: mockGet }),
}));

const mockGmailClient = {
  users: {
    messages: {
      get: jest.fn(),
    },
  },
};

jest.mock("../../lib/gmail", () => ({
  parseAccountsCookie: jest.fn(),
  getAccountTokens: jest.fn(),
  getGmailClient: jest.fn(() => mockGmailClient),
  markAsRead: jest.fn().mockResolvedValue(),
}));

const gmail = require("../../lib/gmail");

// Mock global fetch for one-click unsubscribe
global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

function makeRequest(body) {
  return { json: () => Promise.resolve(body) };
}

describe("POST /api/emails/unsubscribe", () => {
  const accounts = [{ email: "user@test.com", tokens: { access: "tok" } }];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue({ value: "encoded" });
    gmail.parseAccountsCookie.mockReturnValue(accounts);
    gmail.getAccountTokens.mockReturnValue({ access: "tok" });
  });

  it("returns 401 when not authenticated", async () => {
    mockGet.mockReturnValue(null);
    const res = await POST(makeRequest({ messageId: "1", accountEmail: "a@b.com" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when account not found", async () => {
    gmail.getAccountTokens.mockReturnValue(null);
    const res = await POST(makeRequest({ messageId: "1", accountEmail: "unknown@b.com" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("account_not_found");
  });

  it("performs one-click unsubscribe when supported", async () => {
    mockGmailClient.users.messages.get.mockResolvedValue({
      data: {
        payload: {
          headers: [
            { name: "From", value: "News <news@example.com>" },
            { name: "List-Unsubscribe", value: "<https://example.com/unsub>" },
            { name: "List-Unsubscribe-Post", value: "List-Unsubscribe=One-Click" },
          ],
          body: {},
        },
      },
    });

    const res = await POST(makeRequest({ messageId: "msg1", accountEmail: "user@test.com" }));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.method).toBe("one-click");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/unsub",
      expect.objectContaining({ method: "POST" })
    );
    expect(gmail.markAsRead).toHaveBeenCalled();
  });

  it("falls back to link when one-click fails", async () => {
    global.fetch.mockRejectedValueOnce(new Error("fetch failed"));
    mockGmailClient.users.messages.get.mockResolvedValue({
      data: {
        payload: {
          headers: [
            { name: "From", value: "News <news@example.com>" },
            { name: "List-Unsubscribe", value: "<https://example.com/unsub>" },
            { name: "List-Unsubscribe-Post", value: "List-Unsubscribe=One-Click" },
          ],
          body: {},
        },
      },
    });

    const res = await POST(makeRequest({ messageId: "msg1", accountEmail: "user@test.com" }));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.method).toBe("link");
    expect(data.unsubscribeUrl).toBe("https://example.com/unsub");
  });

  it("returns method none when no unsubscribe headers or links", async () => {
    mockGmailClient.users.messages.get.mockResolvedValue({
      data: {
        payload: {
          headers: [
            { name: "From", value: "person@example.com" },
          ],
          body: { data: Buffer.from("Hello world").toString("base64") },
        },
      },
    });

    const res = await POST(makeRequest({ messageId: "msg1", accountEmail: "user@test.com" }));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.method).toBe("none");
  });

  it("finds unsubscribe link in email body", async () => {
    const html = '<a href="https://example.com/unsubscribe?id=123">Unsubscribe</a>';
    mockGmailClient.users.messages.get.mockResolvedValue({
      data: {
        payload: {
          headers: [
            { name: "From", value: "news@example.com" },
          ],
          parts: [
            { mimeType: "text/html", body: { data: Buffer.from(html).toString("base64") } },
          ],
        },
      },
    });

    const res = await POST(makeRequest({ messageId: "msg1", accountEmail: "user@test.com" }));
    const data = await res.json();
    expect(data.method).toBe("link");
    expect(data.unsubscribeUrl).toContain("unsubscribe");
  });

  it("returns 500 on server error", async () => {
    mockGmailClient.users.messages.get.mockRejectedValue(new Error("gmail error"));
    const res = await POST(makeRequest({ messageId: "msg1", accountEmail: "user@test.com" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("unsubscribe_failed");
  });
});
