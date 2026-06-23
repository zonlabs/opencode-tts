import { describe, expect, test } from "bun:test";
import { stripForSpeech, shouldSkip } from "../src/filter";

describe("stripForSpeech", () => {
  test("removes code fences", () => {
    expect(stripForSpeech("a\n```py\nx=1\n```\nb")).toBe("a\n\nb");
  });
  test("removes inline code", () => {
    expect(stripForSpeech("run `npm i` now")).toBe("run now");
  });
  test("removes markdown headers", () => {
    expect(stripForSpeech("## Hi\nWorld")).toBe("Hi\nWorld");
  });
  test("removes bold/italic markers", () => {
    expect(stripForSpeech("**bold** and *italic*")).toBe("bold and italic");
  });
  test("replaces links with text", () => {
    expect(stripForSpeech("[docs](https://x.com)")).toBe("docs");
  });
  test("removes bare URLs", () => {
    expect(stripForSpeech("see https://x.com")).toBe("see");
  });
  test("removes table rows", () => {
    expect(stripForSpeech("| A | B |")).toBe("");
  });
  test("replaces dashes with commas", () => {
    expect(stripForSpeech("ok \u2014 fine")).toBe("ok , fine");
  });
  test("replaces currency symbols", () => {
    expect(stripForSpeech("$50 and \u20ac45")).toBe(" dollars 50 and  euros 45");
  });
  test("expands abbreviations", () => {
    expect(stripForSpeech("API uses JSON")).toBe("A P I uses jason");
    expect(stripForSpeech("MCP and LLM")).toBe("M C P and L L M");
  });
  test("returns empty for code-only input", () => {
    expect(stripForSpeech("```code```")).toBe("");
  });
});

describe("shouldSkip", () => {
  test("skips if exceeds maxChars", () => {
    expect(shouldSkip("x".repeat(900), 800)).toContain("exceeds");
  });
  test("allows if within maxChars", () => {
    expect(shouldSkip("Hello", 800)).toBeNull();
  });
  test("skips if >40% code fences", () => {
    const text = "a\n```" + "b".repeat(60) + "```\n" + "c".repeat(20);
    expect(shouldSkip(text, 800)).toContain("code");
  });
  test("skips if 3+ bullet points", () => {
    expect(shouldSkip("- a\n- b\n- c", 800)).toContain("bullet");
  });
  test("skips tool output (paths/diffs)", () => {
    const text = "C:\\file\n/usr/bin/foo\n{ \"k\": 1 }\n| col |";
    expect(shouldSkip(text, 800)).toContain("tool");
  });
  test("skips if under 10 chars after stripping", () => {
    expect(shouldSkip("Hi", 800)).toContain("short");
  });
});
