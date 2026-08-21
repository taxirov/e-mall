import { put } from "@vercel/blob";

const TASNIF_BASE = "https://tasnif.soliq.uz/api/cls-api/integration-mxik/references/get";

function mimeTypeForFileName(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "image/png";
  }
}

/**
 * Looks up the official product photo for an MXIK code (soliq.uz) and
 * re-hosts it on Vercel Blob so we're not depending on tasnif.soliq.uz's
 * uptime/rate limits for every storefront page view. Returns null on any
 * failure or if the classifier has no photo for this code — callers should
 * treat that as "no image available", not an error.
 */
export async function resolveMxikImage(mxikCode: string): Promise<string | null> {
  try {
    const namesRes = await fetch(
      `${TASNIF_BASE}/mxik/picture-names?lang=uz_cyrl&mxik_code=${encodeURIComponent(mxikCode)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!namesRes.ok) return null;
    const names: unknown = await namesRes.json();
    if (!Array.isArray(names) || names.length === 0 || typeof names[0] !== "string") return null;

    const fileName = names[0];
    const fileRes = await fetch(`${TASNIF_BASE}/file/${encodeURIComponent(fileName)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!fileRes.ok) return null;

    const bytes = await fileRes.arrayBuffer();
    // soliq.uz serves these as application/octet-stream regardless of the
    // actual format — infer a real image MIME type from the extension so
    // browsers render it as an <img> instead of offering it as a download.
    const contentType = mimeTypeForFileName(fileName);
    const blob = await put(`mxik/${fileName}`, Buffer.from(bytes), {
      access: "public",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return blob.url;
  } catch {
    return null;
  }
}
