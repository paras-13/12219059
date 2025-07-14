import crypto from "crypto";
import axios from "axios";
import Log from "../../logging-middleware/log.js";

const urlDatabase = new Map();

function findShortCodeByUrl(url) {
  for (const [code, data] of urlDatabase.entries()) {
    if (data.url === url) return code;
  }
  return null;
}

async function fetchGeoInfo(ipAddress) {
  try {
    const { data } = await axios.get(`https://ipinfo.io/${ipAddress}/json/`);
    return {
      city: data.city,
      location: data.location,
      country: data.country,
    };
  } catch (error) {
    await Log(
      "backend",
      "warn",
      "service",
      `Failed to get geo info for IP ${ipAddress}`
    );
    return null;
  }
}

// Create short URL
export const generateShortUrl = async (req, res) => {
  const { url, validity = 30, customCode } = req.body;

  if (!url) {
    await Log("backend", "error", "service", "URL is required");
    return res.status(400).json({ error: "URL is required" });
  }

  // Check if URL already shortened
  const existingCode = findShortCodeByUrl(url);
  if (existingCode) {
    const existingEntry = urlDatabase.get(existingCode);
    return res.status(200).json({
      shortLink: `http://localhost:8000/r/${existingCode}`,
      expiresAt: existingEntry.expiresAt,
      message: "Short URL already exists for this URL",
    });
  }

  const shortCode = customCode || crypto.randomBytes(3).toString("hex");

  if (urlDatabase.has(shortCode)) {
    await Log(
      "backend",
      "warn",
      "service",
      `Shortcode '${shortCode}' already exists`
    );
    return res.status(409).json({ error: "Shortcode already taken" });
  }

  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + validity * 60000).toISOString();

  urlDatabase.set(shortCode, {
    url,
    createdAt,
    expiresAt,
    clicks: [],
  });

  await Log(
    "backend",
    "info",
    "service",
    `Created short URL with code: ${shortCode}`
  );

  res.status(201).json({
    shortLink: `http://localhost:8000/r/${shortCode}`,
    expiresAt,
  });
};

// Redirect and record click
export const handleRedirect = async (req, res) => {
  const { shortCode } = req.params;

  if (!urlDatabase.has(shortCode)) {
    await Log(
      "backend",
      "warn",
      "handler",
      `Shortcode '${shortCode}' not found`
    );
    return res.status(404).json({ error: "Shortcode not found" });
  }

  const record = urlDatabase.get(shortCode);

  if (new Date() > new Date(record.expiresAt)) {
    await Log("backend", "warn", "handler", `Shortcode '${shortCode}' expired`);
    return res.status(410).json({ error: "Link expired" });
  }

  const timestamp = new Date().toISOString();
  const referrer = req.get("referer") || null;

  const ipAddress =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.connection?.remoteAddress ||
    req.ip;

  const geo = await fetchGeoInfo(ipAddress);
  console.log(geo); // For debugging, you can remove this in production

  record.clicks.push({ timestamp, referrer, geo });

  await Log(
    "backend",
    "info",
    "handler",
    `Redirecting shortcode '${shortCode}' to original URL`
  );

  res.redirect(record.url);
};

// Get stats for a short URL
export const fetchStats = async (req, res) => {
  const { shortCode } = req.params;

  if (!urlDatabase.has(shortCode)) {
    await Log(
      "backend",
      "warn",
      "service",
      `Stats requested for unknown shortcode '${shortCode}'`
    );
    return res.status(404).json({ error: "Shortcode not found" });
  }

  const { url, createdAt, expiresAt, clicks } = urlDatabase.get(shortCode);

  await Log(
    "backend",
    "info",
    "service",
    `Stats returned for shortcode '${shortCode}'`
  );

  res.json({
    shortCode,
    url,
    createdAt,
    expiresAt,
    totalClicks: clicks.length,
    clicks: clicks.map(({ timestamp, referrer, geo }) => ({
      timestamp,
      referrer,
      geo,
    })),
  });
};
