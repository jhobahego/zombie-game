import fs from "fs";
import path from "path";

export function ensureGCloudKeyOnFs() {
  const existingPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (existingPath && fs.existsSync(existingPath)) return;

  const raw =
    process.env.GOOGLE_CREDENTIALS || process.env.GOOGLE_CREDENTIALS_BASE64;
  if (!raw) return;

  let content = raw.trim();
  if (!content.startsWith("{")) {
    try {
      const decoded = Buffer.from(content, "base64").toString("utf8");
      if (decoded.trim().startsWith("{")) {
        content = decoded;
      }
    } catch (error) {
      console.error("Failed to decode base64 credentials", error);
    }
  }

  const tmpDir = process.env.TMPDIR || "/tmp";
  const tmpPath = path.join(tmpDir, "gcloud-key.json");

  fs.writeFileSync(tmpPath, content, { mode: 0o600 });
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
}
