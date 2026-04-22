// Compute a SHA-256 hex digest of a File's bytes.
// Used to detect duplicate receipt uploads (same image rehashes to the same value).
export async function hashFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashFiles(files: File[]): Promise<string[]> {
  return Promise.all(files.map(hashFile));
}

// Read a File as a base64 data URL (used for AI extraction).
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
