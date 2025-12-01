import { normalizeEOL } from "./test-utils";

describe("normalizeEOL", () => {
  test("converts CRLF (\\r\\n) to LF (\\n)", () => {
    const input = "line1\r\nline2\r\nline3";
    const expected = "line1\nline2\nline3";
    expect(normalizeEOL(input)).toBe(expected);
  });

  test("converts CR (\\r) to LF (\\n)", () => {
    const input = "line1\rline2\rline3";
    const expected = "line1\nline2\nline3";
    expect(normalizeEOL(input)).toBe(expected);
  });

  test("preserves LF (\\n)", () => {
    const input = "line1\nline2\nline3";
    const expected = "line1\nline2\nline3";
    expect(normalizeEOL(input)).toBe(expected);
  });

  test("handles mixed line endings", () => {
    const input = "line1\r\nline2\nline3\rline4\r\nline5";
    const expected = "line1\nline2\nline3\nline4\nline5";
    expect(normalizeEOL(input)).toBe(expected);
  });

  test("handles empty string", () => {
    expect(normalizeEOL("")).toBe("");
  });

  test("handles string with no line endings", () => {
    const input = "single line content";
    expect(normalizeEOL(input)).toBe(input);
  });

  test("handles string with only line endings", () => {
    const input = "\r\n\n\r";
    const expected = "\n\n\n";
    expect(normalizeEOL(input)).toBe(expected);
  });

  test("handles multiline Dockerfile content", () => {
    const input = "FROM node:18\r\nRUN npm install\r\nCMD [\"node\", \"app.js\"]";
    const expected = "FROM node:18\nRUN npm install\nCMD [\"node\", \"app.js\"]";
    expect(normalizeEOL(input)).toBe(expected);
  });
});

