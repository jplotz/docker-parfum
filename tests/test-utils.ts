import { DockerParser, File, Printer } from "@tdurieux/dinghy";
import { readFile } from "fs/promises";
import { normalizeLineEndings } from "../lib/utils/line-endings";

/**
 * Normalizes line endings in a string to LF (\n) for consistent test comparisons.
 * This is a test helper that wraps the library's normalizeLineEndings function.
 * 
 * @param content - The string content to normalize
 * @returns The content with all line endings normalized to LF
 */
export function normalizeEOL(content: string): string {
  return normalizeLineEndings(content);
}

export function praseFile(file: string) {
  const filePath = `./tests/data/${file}.Dockerfile`;
  const dockerParser = new DockerParser(new File(filePath));
  const ast = dockerParser.parse();
  expect(dockerParser.errors).toHaveLength(0);
  const printer = ast.printer();
  printer.print();
  expect(printer.errors).toHaveLength(0);
  return ast;
}

export async function repairedFile(file: string) {
  const filePath = `./tests/repaired_data/${file}.Dockerfile`;
  const content = await readFile(filePath, { encoding: "utf-8" });
  return normalizeEOL(content);
}
