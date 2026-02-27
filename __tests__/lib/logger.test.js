import { logError, logWarn, logInfo, logRequest } from "../../lib/logger";

describe("logger", () => {
  let errorSpy, warnSpy, logSpy;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("logError", () => {
    it("logs structured JSON to console.error", () => {
      logError("test:context", "something broke");
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(errorSpy.mock.calls[0][0]);
      expect(output.level).toBe("ERROR");
      expect(output.context).toBe("test:context");
      expect(output.message).toBe("something broke");
      expect(output.timestamp).toBeDefined();
    });

    it("includes error details when error object is passed", () => {
      const err = new Error("fail");
      err.code = 500;
      logError("test", "oops", err);
      const output = JSON.parse(errorSpy.mock.calls[0][0]);
      expect(output.errorName).toBe("Error");
      expect(output.errorMessage).toBe("fail");
      expect(output.errorCode).toBe(500);
    });

    it("handles null error gracefully", () => {
      logError("test", "no error obj", null);
      const output = JSON.parse(errorSpy.mock.calls[0][0]);
      expect(output.level).toBe("ERROR");
      expect(output.errorName).toBeUndefined();
    });
  });

  describe("logWarn", () => {
    it("logs structured JSON to console.warn", () => {
      logWarn("test:warn", "heads up", { detail: "extra" });
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(warnSpy.mock.calls[0][0]);
      expect(output.level).toBe("WARN");
      expect(output.context).toBe("test:warn");
      expect(output.detail).toBe("extra");
    });
  });

  describe("logInfo", () => {
    it("logs structured JSON to console.log", () => {
      logInfo("test:info", "all good");
      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.level).toBe("INFO");
      expect(output.message).toBe("all good");
    });
  });

  describe("logRequest", () => {
    it("logs request method and URL", () => {
      const mockReq = { url: "https://example.com/api", method: "GET" };
      logRequest("test:req", mockReq);
      expect(logSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.level).toBe("INFO");
      expect(output.method).toBe("GET");
      expect(output.url).toBe("https://example.com/api");
    });

    it("handles missing request properties", () => {
      logRequest("test:req", null);
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.method).toBe("unknown");
      expect(output.url).toBe("unknown");
    });
  });
});
