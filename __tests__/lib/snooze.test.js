import { getSnoozeTime, getSnoozedEmails, addSnoozedEmail, clearExpiredSnoozes } from "../../lib/snooze";

// Mock logger
jest.mock("../../lib/logger", () => ({
  logWarn: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, val) => { store[key] = val; }),
    clear: jest.fn(() => { store = {}; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
  };
})();
Object.defineProperty(global, "localStorage", { value: localStorageMock });

describe("snooze", () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe("getSnoozeTime", () => {
    it("returns future timestamp for hours option", () => {
      const now = Date.now();
      const result = getSnoozeTime({ hours: 2 });
      // Should be ~2 hours from now (within 1 second tolerance)
      expect(result).toBeGreaterThan(now);
      expect(result - now).toBeCloseTo(2 * 60 * 60 * 1000, -3);
    });

    it("returns tomorrow at 9am for tomorrow option", () => {
      const result = getSnoozeTime({ tomorrow: true });
      const d = new Date(result);
      expect(d.getHours()).toBe(9);
      expect(d.getMinutes()).toBe(0);
      expect(d.getDate()).toBeGreaterThan(new Date().getDate() - 1);
    });

    it("returns next Saturday at 9am for weekend option", () => {
      const result = getSnoozeTime({ weekend: true });
      const d = new Date(result);
      expect(d.getDay()).toBe(6); // Saturday
      expect(d.getHours()).toBe(9);
    });

    it("returns next Monday at 9am for nextWeek option", () => {
      const result = getSnoozeTime({ nextWeek: true });
      const d = new Date(result);
      expect(d.getDay()).toBe(1); // Monday
      expect(d.getHours()).toBe(9);
    });

    it("defaults to 3 hours for unknown option", () => {
      const now = Date.now();
      const result = getSnoozeTime({});
      expect(result - now).toBeCloseTo(3 * 60 * 60 * 1000, -3);
    });
  });

  describe("getSnoozedEmails", () => {
    it("returns empty array when no data in localStorage", () => {
      expect(getSnoozedEmails()).toEqual([]);
    });

    it("returns parsed snoozed emails from localStorage", () => {
      const data = [{ emailId: "1", account: "a@b.com", snoozeUntil: 999 }];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(data));
      expect(getSnoozedEmails()).toEqual(data);
    });

    it("returns empty array on parse error", () => {
      localStorageMock.getItem.mockReturnValueOnce("invalid json{{{");
      expect(getSnoozedEmails()).toEqual([]);
    });
  });

  describe("addSnoozedEmail", () => {
    it("adds email to snoozed list in localStorage", () => {
      addSnoozedEmail("msg1", "user@test.com", 12345);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "swipebox_snoozed",
        expect.stringContaining("msg1")
      );
      const stored = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(stored).toHaveLength(1);
      expect(stored[0]).toEqual({
        emailId: "msg1",
        account: "user@test.com",
        snoozeUntil: 12345,
      });
    });
  });

  describe("clearExpiredSnoozes", () => {
    it("removes expired snoozes and returns them", () => {
      const now = Date.now();
      const data = [
        { emailId: "old", account: "a@b.com", snoozeUntil: now - 1000 },
        { emailId: "future", account: "a@b.com", snoozeUntil: now + 100000 },
      ];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(data));
      
      const expired = clearExpiredSnoozes();
      expect(expired).toHaveLength(1);
      expect(expired[0].emailId).toBe("old");
      
      const remaining = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].emailId).toBe("future");
    });

    it("returns empty array when nothing is expired", () => {
      const data = [
        { emailId: "future", account: "a@b.com", snoozeUntil: Date.now() + 100000 },
      ];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(data));
      expect(clearExpiredSnoozes()).toEqual([]);
    });
  });
});
