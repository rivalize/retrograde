import { describe, expect, it } from "vitest";
import { toErrorMessage } from "../src/errors.js";

describe("toErrorMessage", () => {
  it("reads Error messages", () => {
    expect(toErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("passes through string errors", () => {
    expect(toErrorMessage("plain failure")).toBe("plain failure");
  });

  it("falls back for non-error values", () => {
    expect(toErrorMessage({ code: "UNKNOWN" })).toBe("Unknown error");
  });
});
