import { describe, expect, it } from "vitest";
import { toErrorMessage } from "../src/errors.js";

describe("toErrorMessage", () => {
  it("normalizes error values", () => {
    expect(toErrorMessage(new Error("boom"))).toBe("boom");
    expect(toErrorMessage("plain")).toBe("plain");
    expect(toErrorMessage({ code: "UNKNOWN" })).toBe("Unknown error");
  });
});
