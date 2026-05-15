import "server-only";

/**
 * Text extraction from attachments: PDF, TXT, DOCX.
 * Ref: specs/006-provider-integration-spec.md §7
 *
 * For MVP, we use lightweight extraction:
 * - TXT: direct read
 * - PDF: basic text extraction (pdf-parse)
 * - DOCX: basic text extraction (mammoth)
 *
 * Files > 10 MB are skipped.
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function extractText(
  content: Buffer,
  mimeType: string,
  filename: string
): Promise<string | null> {
  if (content.length > MAX_FILE_SIZE) {
    console.warn(`Skipping extraction for ${filename}: exceeds 10 MB limit`);
    return null;
  }

  if (mimeType === "text/plain" || filename.endsWith(".txt")) {
    return content.toString("utf8");
  }

  if (mimeType === "application/pdf" || filename.endsWith(".pdf")) {
    try {
      const { default: pdfParse } = await import("pdf-parse") as {
        default: (buf: Buffer) => Promise<{ text: string }>;
      };
      const result = await pdfParse(content);
      return result.text || null;
    } catch (err) {
      console.error(`PDF extraction failed for ${filename}:`, err);
      return null;
    }
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filename.endsWith(".docx")
  ) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: content });
      return result.value || null;
    } catch (err) {
      console.error(`DOCX extraction failed for ${filename}:`, err);
      return null;
    }
  }

  // Unsupported format
  return null;
}
