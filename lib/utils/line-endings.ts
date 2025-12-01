/**
 * Normalizes line endings in a string to LF (\n) regardless of the host OS.
 * 
 * This ensures consistent output across platforms:
 * - Replaces CRLF (\r\n) with LF (\n)
 * - Replaces CR (\r) with LF (\n)
 * - Preserves existing LF (\n)
 * 
 * @param content - The string content to normalize
 * @returns The content with all line endings normalized to LF
 */
export function normalizeLineEndings(content: string): string {
  // First replace CRLF with LF, then replace any remaining CR with LF
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

