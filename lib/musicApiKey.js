import fs from "fs";
import path from "path";
import crypto from "crypto";

const KEYS_FILE = path.join(process.cwd(), "data", "music_api_keys.json");

function ensureKeysFile() {
  const dir = path.dirname(KEYS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(KEYS_FILE)) {
    // Initialize with a default test key for immediate developer testing
    const initialData = {
      keys: [
        {
          key: "ols_music_demo_2026_unlimited",
          name: "OneLab Studio Demo Key",
          email: "demo@onelabstudio.com",
          created_at: new Date().toISOString(),
          status: "active",
          role: "demo",
          rate_limit: 5000,
          requests_today: 0,
          last_used: null,
          description: "Public demo key for testing the Music & SFX API",
        },
      ],
    };
    fs.writeFileSync(KEYS_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  }
}

export function loadMusicKeys() {
  ensureKeysFile();
  try {
    const raw = fs.readFileSync(KEYS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading music API keys file:", err);
    return { keys: [] };
  }
}

export function saveMusicKeys(data) {
  ensureKeysFile();
  fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function generateMusicApiKey({ name = "Default App", email = "", role = "client" } = {}) {
  const data = loadMusicKeys();
  const token = crypto.randomBytes(16).toString("hex");
  const newKey = `ols_music_${role === "admin" ? "adm" : "live"}_${token}`;

  const entry = {
    key: newKey,
    name: name.trim() || "My Video Bot",
    email: email.trim(),
    created_at: new Date().toISOString(),
    status: "active",
    role: role,
    rate_limit: 1000, // 1000 calls / day
    requests_today: 0,
    last_used: null,
    description: `Dedicated Music API Key for ${name}`,
  };

  data.keys.unshift(entry);
  saveMusicKeys(data);
  return entry;
}

export function verifyMusicApiKey(key) {
  if (!key || typeof key !== "string") return null;
  const cleanKey = key.trim().replace(/^Bearer\s+/i, "");
  if (!cleanKey.startsWith("ols_music_")) return null;

  const data = loadMusicKeys();
  const found = data.keys.find((k) => k.key === cleanKey && k.status === "active");
  if (!found) return null;

  // Track usage
  found.requests_today = (found.requests_today || 0) + 1;
  found.last_used = new Date().toISOString();
  saveMusicKeys(data);

  return found;
}

export function revokeMusicApiKey(key) {
  const data = loadMusicKeys();
  const target = data.keys.find((k) => k.key === key);
  if (target) {
    target.status = "revoked";
    saveMusicKeys(data);
    return true;
  }
  return false;
}
