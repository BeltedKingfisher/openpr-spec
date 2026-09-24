import { describe, it, expect } from "vitest";
import { Pronoun } from "./index.js";

describe("preact", () => {
  it("exports Pronoun component", () => {
    expect(Pronoun).toBeDefined();
    expect(typeof Pronoun).toBe("function");
  });
});
