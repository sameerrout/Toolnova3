/**
 * Client-Side File Signature (Magic Byte) Validator
 * Protects against file extension spoofing and corrupted files per Master Prompt §34 & §46.
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string;
}

export async function validateImageFile(
  file: File,
  maxSizeBytes = 50 * 1024 * 1024
): Promise<FileValidationResult> {
  // 1. Zero-byte check
  if (file.size === 0) {
    return {
      valid: false,
      error: `File "${file.name}" is empty (0 bytes).`,
    };
  }

  // 2. File size limit
  if (file.size > maxSizeBytes) {
    const mb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File "${file.name}" exceeds the maximum size limit of ${mb}MB.`,
    };
  }

  // 3. Read header bytes (first 16 bytes)
  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { valid: true, detectedType: 'image/jpeg' };
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return { valid: true, detectedType: 'image/png' };
    }

    // WEBP: "RIFF" (52 49 46 46) ... "WEBP" (57 45 42 50) at bytes 8-11
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return { valid: true, detectedType: 'image/webp' };
    }

    // GIF (if uploaded): 47 49 46 38
    if (
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38
    ) {
      return { valid: true, detectedType: 'image/gif' };
    }

    return {
      valid: false,
      error: `File "${file.name}" is not a valid or supported image format (JPEG, PNG, WEBP).`,
    };
  } catch (err) {
    return {
      valid: false,
      error: `Could not read or verify file header for "${file.name}". The file may be corrupted.`,
    };
  }
}

