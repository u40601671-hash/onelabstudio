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
    const initialData = {
      keys: [],
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

/**
 * Returns ONLY keys belonging to the authenticated user.
 * Absolute tenant isolation: User A can NEVER view or access User B's keys.
 */
export function getUserMusicKeys(user) {
  if (!user) return [];
  const data = loadMusicKeys();
  const userId = user.id || "";
  const userEmail = (user.email || "").trim().toLowerCase();

  return (data.keys || []).filter((k) => {
    if (userId && k.user_id && k.user_id === userId) return true;
    if (userEmail && k.email && k.email.toLowerCase() === userEmail) return true;
    return false;
  });
}

/**
 * Generates a high-entropy, cryptographically secure Music API key
 * strictly bound to the authenticated user's ID & email.
 */
export function generateMusicApiKey({ name = "Default App", email = "", userId = "", role = "client" } = {}) {
  const data = loadMusicKeys();
  // 48-character hex cryptographic token
  const token = crypto.randomBytes(24).toString("hex");
  const newKey = `ols_music_${role === "admin" ? "adm" : "live"}_${token}`;

  const entry = {
    key: newKey,
    name: name.trim() || "My Video Bot",
    email: (email || "").trim().toLowerCase(),
    user_id: userId || "",
    created_at: new Date().toISOString(),
    status: "active",
    role: role,
    rate_limit: 1000, // 1,000 calls / day
    requests_today: 0,
    last_used: null,
    description: `Private API Key for ${name}`,
  };

  data.keys.unshift(entry);
  saveMusicKeys(data);
  return entry;
}

/**
 * Verifies key ownership before allowing revocation.
 * Rejects unauthorized attempts to revoke another user's key.
 */
export function revokeUserMusicKey(key, user) {
  if (!user || !key) return false;
  const data = loadMusicKeys();
  const userId = user.id || "";
  const userEmail = (user.email || "").trim().toLowerCase();

  const target = data.keys.find((k) => k.key === key);
  if (!target) return false;

  const owns =
    (userId && target.user_id === userId) ||
    (userEmail && target.email && target.email.toLowerCase() === userEmail);

  if (!owns && user.role !== "admin") {
    return false; // Forbidden: Cannot revoke someone else's key
  }

  target.status = "revoked";
  saveMusicKeys(data);
  return true;
}

/**
 * Validates an API key on incoming requests (e.g. from Python bots, cURL, etc.)
 * Increments usage metrics.
 */
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
