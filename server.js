const express = require("express");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { createReadStream, unlinkSync, existsSync } = require("fs");
const { join } = require("path");
const os = require("os");
const crypto = require("crypto");

const exec = promisify(execFile);
const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static("public"));

// GET /api/info?url=...
app.get("/api/info", async (req, res) => {
  const url = req.query.url?.trim();
  if (!url) return res.status(400).json({ error: "Missing url" });

  try {
    const { stdout } = await exec("yt-dlp", [
      "--dump-json",
      "--no-download",
      "--no-warnings",
      url,
    ], { timeout: 30000 });

    const info = JSON.parse(stdout);

    res.json({
      success: true,
      data: {
        title: info.title || "TikTok Video",
        author: info.uploader || info.creator || "Unknown",
        thumbnail: info.thumbnail || "",
        duration: info.duration || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.stderr?.trim() || err.message });
  }
});

// GET /api/download?url=...
app.get("/api/download", async (req, res) => {
  const url = req.query.url?.trim();
  if (!url) return res.status(400).json({ error: "Missing url" });

  const filename = `tiktok_${crypto.randomBytes(6).toString("hex")}.mp4`;
  const outputPath = join(os.tmpdir(), filename);

  try {
    await exec("yt-dlp", [
      "-f", "best[ext=mp4]/best",
      "-o", outputPath,
      "--no-warnings",
      url,
    ], { timeout: 60000 });

    if (!existsSync(outputPath)) {
      return res.status(500).json({ error: "Download failed" });
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const stream = createReadStream(outputPath);
    stream.pipe(res);
    stream.on("end", () => { try { unlinkSync(outputPath); } catch {} });
    stream.on("error", () => { try { unlinkSync(outputPath); } catch {} res.status(500).end(); });
  } catch (err) {
    try { unlinkSync(outputPath); } catch {}
    res.status(500).json({ error: err.stderr?.trim() || err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✓ TikPick running at http://localhost:${PORT}`);
});
