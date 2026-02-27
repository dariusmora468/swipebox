import { POST } from "../../app/api/emails/action/route";

jest.mock("../../lib/logger", () => ({
  logError: jest.fn(),
}));

const mockGet = jest.fn();
jest.mock("next/headers", () => ({
  cookies: () => ({ get: mockGet }),
}));

const mockGmail = {
  parseAccountsCookie: jest.fn(),
  getAccountTokens: jest.fn(),
  sendReply: jest.fn().mockResolvedValue(),
  markAsRead: jest.fn().mockResolvedValue(),
  archiveEmail: jest.fn().mockResolvedValue(),
  trashEmail: jest.fn().mockResolvedValue(),
  snoozeEmail: jest.fn().mockResolvedValue(),
  unsnoozeEmail: jest.fn().mockResolvedValue(),
  forwardEmail: jest.fn().mockResolvedValue(),
};
jest.mock("../../lib/gmail", () => mockGmail);

function makeRequest(body) {
  return { json: () => Promise.resolve(body) };
}

describe("POST /api/emails/action", () => {
  const accounts = [{ email: "a@b.com", tokens: { access: "tok" } }];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue({ value: "encoded" });
    mockGmail.parseAccountsCookie.mockReturnValue(accounts);
    mockGmail.getAccountTokens.mockReturnValue({ access: "tok" });
  });

  it("returns 401 when no accounts cookie", async () => {
    mockGet.mockReturnValue(null);
    const res = await POST(makeRequest({ action: "send", email: {} }));
    expect(res.status).toBe(401);
  });

  it("handles send action without reply text (mark read + archive)", async () => {
    const req = makeRequest({
      action: "send",
      email: { id: "msg1", account: "a@b.com" },
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockGmail.markAsRead).toHaveBeenCalledWith({ access: "tok" }, "msg1");
    expect(mockGmail.archiveEmail).toHaveBeenCalledWith({ access: "tok" }, "msg1");
  });

  it("handles send action with reply text", async () => {
    const email = { id: "msg1", account: "a@b.com" };
    const req = makeRequest({ action: "send", email, replyText: "Thanks!" });
    const res = await POST(req);
    expect(mockGmail.sendReply).toHaveBeenCalledWith({ access: "tok" }, email, "Thanks!");
    expect(mockGmail.archiveEmail).toHaveBeenCalled();
  });

  it("handles delete action", async () => {
    const req = makeRequest({
      action: "delete",
      email: { id: "msg1", account: "a@b.com" },
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockGmail.trashEmail).toHaveBeenCalled();
  });

  it("handles snooze action", async () => {
    const req = makeRequest({
      action: "snooze",
      email: { id: "msg1", account: "a@b.com" },
    });
    await POST(req);
    expect(mockGmail.snoozeEmail).toHaveBeenCalled();
  });

  it("handles forward action", async () => {
    const email = { id: "msg1", account: "a@b.com" };
    const req = makeRequest({ action: "forward", email, forwardTo: "x@y.com" });
    await POST(req);
    expect(mockGmail.forwardEmail).toHaveBeenCalledWith({ access: "tok" }, email, "x@y.com");
  });

  it("returns 400 for forward without address", async () => {
    const req = makeRequest({
      action: "forward",
      email: { id: "msg1", account: "a@b.com" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid action", async () => {
    const req = makeRequest({
      action: "bogus",
      email: { id: "msg1", account: "a@b.com" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("invalid_action");
  });

  it("returns 400 when account not found", async () => {
    mockGmail.getAccountTokens.mockReturnValue(null);
    const req = makeRequest({
      action: "send",
      email: { id: "msg1", account: "unknown@b.com" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("account_not_found");
  });

  it("handles batch unsnooze", async () => {
    const req = makeRequest({
      action: "unsnooze_batch",
      snoozeIds: [
        { emailId: "m1", account: "a@b.com" },
        { emailId: "m2", account: "a@b.com" },
      ],
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.action).toBe("unsnooze_batch");
    expect(data.count).toBe(2);
  });

  it("returns 500 on server error", async () => {
    mockGmail.markAsRead.mockRejectedValueOnce(new Error("gmail down"));
    const req = makeRequest({
      action: "mark_read",
      email: { id: "msg1", account: "a@b.com" },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("action_failed");
  });
});
