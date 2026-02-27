import { GET } from "../../app/api/emails/route";

// Mock dependencies
jest.mock("../../lib/logger", () => ({
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

const mockGet = jest.fn();
jest.mock("next/headers", () => ({
  cookies: () => ({ get: mockGet }),
}));

jest.mock("../../lib/gmail", () => ({
  parseAccountsCookie: jest.fn(),
  fetchAllAccountEmails: jest.fn(),
}));

jest.mock("../../lib/ai", () => ({
  processEmails: jest.fn(),
}));

const { parseAccountsCookie, fetchAllAccountEmails } = require("../../lib/gmail");
const { processEmails } = require("../../lib/ai");

describe("GET /api/emails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no accounts cookie", async () => {
    mockGet.mockReturnValue(null);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBe("not_authenticated");
  });

  it("returns 401 when accounts cookie parses to empty array", async () => {
    mockGet.mockReturnValue({ value: "somevalue" });
    parseAccountsCookie.mockReturnValue([]);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBe("not_authenticated");
  });

  it("returns inbox_zero when no emails found", async () => {
    mockGet.mockImplementation((name) => {
      if (name === "swipebox_accounts") return { value: "encoded" };
      return null;
    });
    parseAccountsCookie.mockReturnValue([{ email: "a@b.com", name: "Test" }]);
    fetchAllAccountEmails.mockResolvedValue([]);

    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.message).toBe("inbox_zero");
    expect(data.emails).toEqual([]);
  });

  it("processes and returns emails on success", async () => {
    mockGet.mockImplementation((name) => {
      if (name === "swipebox_accounts") return { value: "encoded" };
      return null;
    });
    const accounts = [{ email: "a@b.com", name: "Test" }];
    parseAccountsCookie.mockReturnValue(accounts);
    
    const rawEmails = [{ id: "1", email: "sender@x.com", from: "Sender" }];
    fetchAllAccountEmails.mockResolvedValue(rawEmails);
    
    const processed = [{ id: "1", category: "Work", urgency: "high" }];
    processEmails.mockResolvedValue(processed);

    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.emails).toEqual(processed);
    expect(data.accounts).toEqual([{ email: "a@b.com", name: "Test" }]);
  });

  it("returns 401 on auth error from gmail", async () => {
    mockGet.mockImplementation((name) => {
      if (name === "swipebox_accounts") return { value: "encoded" };
      return null;
    });
    parseAccountsCookie.mockReturnValue([{ email: "a@b.com", name: "Test" }]);
    
    const authErr = new Error("invalid_grant");
    authErr.isAuthError = true;
    fetchAllAccountEmails.mockRejectedValue(authErr);

    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBe("token_expired");
  });

  it("returns 500 on generic server error", async () => {
    mockGet.mockImplementation((name) => {
      if (name === "swipebox_accounts") return { value: "encoded" };
      return null;
    });
    parseAccountsCookie.mockReturnValue([{ email: "a@b.com", name: "Test" }]);
    fetchAllAccountEmails.mockRejectedValue(new Error("network fail"));

    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(500);
    expect(data.error).toBe("fetch_failed");
  });
});
