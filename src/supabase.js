import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configured = !!(url && key);

// Clear any expired Supabase auth sessions from localStorage before the client
// initialises. An expired session causes the client to fire a token-refresh
// request on startup; if that request hangs it blocks ALL subsequent requests
// for the full timeout duration and the feed never loads.
if (configured) {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith("sb-") && k.endsWith("-auth-token"))
      .forEach(k => {
        const raw = localStorage.getItem(k);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        // expires_at is a Unix timestamp in seconds
        const exp = parsed?.expires_at ?? parsed?.session?.expires_at;
        if (exp && exp < Date.now() / 1000) {
          console.log("[Stash] Cleared expired session from localStorage");
          localStorage.removeItem(k);
        }
      });
  } catch (_) {}
}

// 8-second timeout per request.
const fetchWithTimeout = (fetchUrl, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  return fetch(fetchUrl, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

// Authenticated client — used for writes and auth operations.
// Has session management; data requests queue behind token refresh.
export const supabase = configured
  ? createClient(url, key, { global: { fetch: fetchWithTimeout } })
  : createClient("https://placeholder.supabase.co", "placeholder");

// Public client — no auth, no session, no token-refresh queue.
// Uses a unique storageKey so it never touches the main client's session.
export const publicSupabase = configured
  ? createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: "sb-stash-public",
      },
      global: { fetch: fetchWithTimeout },
    })
  : createClient("https://placeholder.supabase.co", "placeholder", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "sb-stash-public" },
    });

// ── Auth ──────────────────────────────────────────────────────────────────────

// Decode a JWT and write the session directly to Supabase's localStorage key.
// No network call — works even when the auth queue is stuck.
// Returns the decoded user object, or null on failure.
export function applyTokensDirectly(accessToken, refreshToken) {
  try {
    // JWTs use base64url (- and _ instead of + and /) — convert before calling atob
    const raw = accessToken.split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const pad = raw.length % 4;
    const payload = JSON.parse(atob(pad ? raw + "=".repeat(4 - pad) : raw));
    const projectRef = (url || "").match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (projectRef) {
      const sessionData = {
        access_token: accessToken,
        token_type: "bearer",
        expires_in: payload.exp - Math.floor(Date.now() / 1000),
        expires_at: payload.exp,
        refresh_token: refreshToken,
        user: {
          id: payload.sub,
          aud: payload.aud || "authenticated",
          role: payload.role || "authenticated",
          email: payload.email,
          email_confirmed_at: payload.email_confirmed_at,
          user_metadata: payload.user_metadata || {},
          app_metadata: payload.app_metadata || {},
        },
      };
      localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(sessionData));
      console.log("[Auth] applyTokensDirectly: session written for", sessionData.user.email);
      return sessionData.user;
    }
  } catch (e) {
    console.error("[Auth] applyTokensDirectly failed:", e);
  }
  return null;
}

export async function signInWithGoogle() {
  // Opens Google OAuth in a popup so the main page never redirects away.
  // Supabase stores the session, BroadcastChannel fires onAuthStateChange in
  // the main window automatically.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      skipBrowserRedirect: true,
      redirectTo: window.location.origin + "?auth_callback=1",
    },
  });
  if (error) throw error;

  const w = 480, h = 600;
  const left = Math.round((window.screen.width - w) / 2);
  const top  = Math.round((window.screen.height - h) / 2);
  window.open(
    data.url,
    "stash_google_auth",
    `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
  );
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchProfile(userId) {
  // Use publicSupabase — profiles are publicly readable per RLS, and this
  // avoids the auth queue (which can block if the main client is refreshing).
  const { data, error } = await publicSupabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error && error.code === "PGRST116") return null; // row not found
  if (error) throw error;
  return data;
}

export async function fetchAllProfiles() {
  const { data, error } = await publicSupabase
    .from("profiles")
    .select("id, name, initials, title, avatar_url")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data || []).map(p => ({
    id: p.id,
    name: p.name || "Unknown",
    initials: p.initials || "?",
    title: p.title || "",
    image: p.avatar_url || null,
  }));
}

export async function upsertProfile(profile) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function fetchProjects() {
  const { data: projData, error: projError } = await publicSupabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (projError) throw projError;

  // Fetch artifact counts + thumbnails per-project in parallel.
  // Full-table scans on artifacts are blocked by RLS; per-project
  // queries with .eq("project_id", id) work fine for public reads.
  const artResults = await Promise.all(
    projData.map(r =>
      publicSupabase
        .from("artifacts")
        .select("project_id, type, src, thumb")
        .eq("project_id", r.id)
    )
  );

  // Types whose src is an embed/page URL — unusable as an img/video src.
  // video/gif/image: pass src through; ProjCard will render <video> or <img>.
  // pdf/file: no visual preview, fall back to gradient thumb.
  const EMBED_TYPES = new Set(["figma", "website", "mockup", "pdf", "file"]);

  return projData.map((r, i) => {
    const p = dbToProject(r);
    const arts = artResults[i]?.data || [];
    if (arts.length > 0) {
      p.artifactCount = arts.length;
      p.thumbs = arts
        .slice(0, 4)
        .map(a => {
          // For embed types, src is an iframe URL — can't be used as background-image.
          // Fall back to the CSS gradient thumb instead.
          if (EMBED_TYPES.has(a.type)) return a.thumb || null;
          return a.src || a.thumb || null;
        })
        .filter(Boolean);
    } else {
      // Fall back to stored values if the query returned nothing
      p.artifactCount = r.artifact_count || 0;
      p.thumbs = r.thumbs || [];
    }
    return p;
  });
}

export async function createProject(p, userId) {
  const insertObj = {
    name: p.name,
    description: p.desc || "",
    folder: p.folder,
    tags: p.tags || [],
    artifact_count: 0,
    thumbs: [],
    pages: p.pages || [{ id: "p1", label: "1", name: "Page 1" }],
    rows: p.rows || ["R1"],
    members: p.members || [],
    user_id: userId || null,
  };

  let { data, error } = await supabase
    .from("projects")
    .insert(insertObj)
    .select()
    .single();

  // Graceful fallback if members / user_id column doesn't exist yet
  if (error && (error.message.includes("members") || error.message.includes("user_id"))) {
    const { members: _m, user_id: _u, ...base } = insertObj;
    const result = await supabase.from("projects").insert(base).select().single();
    if (result.error) throw result.error;
    data = result.data;
    try { localStorage.setItem(`members_${data.id}`, JSON.stringify(p.members || [])); } catch(e) {}
  } else if (error) {
    throw error;
  }

  try { localStorage.setItem(`members_${data.id}`, JSON.stringify(p.members || [])); } catch(e) {}
  return dbToProject(data, p.members);
}

export async function updateProject(id, updates) {
  const row = {};
  if (updates.thumbs !== undefined) row.thumbs = updates.thumbs;
  if (updates.artifactCount !== undefined) row.artifact_count = updates.artifactCount;
  if (updates.pages !== undefined) row.pages = updates.pages;
  if (updates.tags !== undefined) row.tags = updates.tags;
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.desc !== undefined) row.description = updates.desc;
  if (updates.members !== undefined) row.members = updates.members;
  if (updates.teams !== undefined) {
    try { row.teams = updates.teams; } catch(e) {}
  }
  const { error } = await publicSupabase.from("projects").update(row).eq("id", id);
  // If teams column doesn't exist yet, retry without it
  if (error && error.message && error.message.includes("teams")) {
    const { teams: _t, ...rowWithout } = row;
    const { error: e2 } = await publicSupabase.from("projects").update(rowWithout).eq("id", id);
    if (e2) throw e2;
    try { localStorage.setItem(`teams_${id}`, JSON.stringify(updates.teams)); } catch(e) {}
    return;
  }
  if (error) throw error;
  if (updates.members !== undefined) {
    try { localStorage.setItem(`members_${id}`, JSON.stringify(updates.members)); } catch(e) {}
  }
  if (updates.teams !== undefined) {
    try { localStorage.setItem(`teams_${id}`, JSON.stringify(updates.teams)); } catch(e) {}
  }
}

export async function deleteProject(id) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

function dbToProject(r, membersOverride) {
  let members = membersOverride || r.members || [];
  if (!membersOverride) {
    try {
      const stored = localStorage.getItem(`members_${r.id}`);
      if (stored) members = JSON.parse(stored);
    } catch(e) {}
  }
  let teams = r.teams || [];
  try {
    const storedTeams = localStorage.getItem(`teams_${r.id}`);
    if (storedTeams) teams = JSON.parse(storedTeams);
  } catch(e) {}
  return {
    id: r.id,
    name: r.name,
    desc: r.description,
    folder: r.folder,
    tags: r.tags || [],
    teams,
    artifactCount: r.artifact_count,
    thumbs: r.thumbs || [],
    pages: r.pages || [{ id: "p1", label: "1", name: "Page 1" }],
    rows: r.rows || ["R1"],
    members,
    user_id: r.user_id || null,
    artifacts: {},
  };
}

// ── Artifacts ─────────────────────────────────────────────────────────────────

export async function fetchArtifactsForProject(projectId) {
  const { data, error } = await publicSupabase
    .from("artifacts")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const byPage = {};
  for (const row of data) {
    if (!byPage[row.page_id]) byPage[row.page_id] = [];
    byPage[row.page_id].push(dbToArtifact(row));
  }
  return byPage;
}

export async function insertArtifact(projectId, pageId, art, userId) {
  const insertObj = {
    project_id: projectId,
    page_id: pageId,
    name: art.name,
    type: art.type,
    src: art.src || null,
    thumb: art.thumb || null,
    viewport: art.viewport || null,
    is_mobile: art.isMobile || false,
    device_shell: art.deviceShell || "auto",
    crop: art.crop || null,
    align: art.align || "center",
    user_name: art.user?.name || "Dennis O'Neil",
    user_initials: art.user?.initials || "DO",
    user_id: userId || null,
  };

  let { data, error } = await supabase
    .from("artifacts")
    .insert(insertObj)
    .select()
    .single();

  // Graceful fallback if display columns don't exist yet (run supabase_migration.sql to fix)
  if (error && (error.message.includes("device_shell") || error.message.includes("crop") || error.message.includes("align"))) {
    const { device_shell: _ds, crop: _c, align: _a, ...basicInsert } = insertObj;
    const result = await supabase.from("artifacts").insert(basicInsert).select().single();
    if (result.error) throw result.error;
    data = result.data;
    try {
      localStorage.setItem(`art_${data.id}`, JSON.stringify({
        deviceShell: art.deviceShell, crop: art.crop, align: art.align || "center",
      }));
    } catch(e) {}
  } else if (error) {
    throw error;
  }

  return dbToArtifact(data);
}

export async function updateArtifact(id, updates) {
  // Try to update DB columns; fall back to localStorage if columns don't exist yet
  const updateObj = {
    name: updates.name,
    device_shell: updates.deviceShell || "auto",
    crop: updates.crop !== undefined ? updates.crop : null,
    align: updates.align || "center",
    is_mobile: updates.isMobile || false,
  };

  let { data, error } = await supabase
    .from("artifacts")
    .update(updateObj)
    .eq("id", id)
    .select()
    .single();

  if (error && (error.message.includes("device_shell") || error.message.includes("crop") || error.message.includes("align"))) {
    const basicUpdate = { name: updates.name };
    const result = await supabase.from("artifacts").update(basicUpdate).eq("id", id).select().single();
    if (result.error) throw result.error;
    data = result.data;
  } else if (error) {
    throw error;
  }

  // Always persist display settings to localStorage
  try {
    localStorage.setItem(`art_${id}`, JSON.stringify({
      deviceShell: updates.deviceShell,
      crop: updates.crop,
      align: updates.align || "center",
    }));
  } catch(e) {}

  return dbToArtifact(data, updates);
}

function dbToArtifact(r, overrides) {
  let deviceShell = r.device_shell || "auto";
  let crop = r.crop !== undefined ? r.crop : null;
  let align = r.align || "center";

  // Read from localStorage as fallback (survives DB column gaps)
  try {
    const stored = localStorage.getItem(`art_${r.id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.deviceShell !== undefined) deviceShell = parsed.deviceShell;
      if ('crop' in parsed) crop = parsed.crop;
      if (parsed.align !== undefined) align = parsed.align;
    }
  } catch(e) {}

  // In-memory overrides take top priority (right after a save)
  if (overrides) {
    if (overrides.deviceShell !== undefined) deviceShell = overrides.deviceShell;
    if ('crop' in overrides) crop = overrides.crop;
    if (overrides.align !== undefined) align = overrides.align;
  }

  return {
    id: r.id,
    name: r.name,
    type: r.type,
    src: r.src,
    thumb: r.thumb,
    viewport: r.viewport,
    isMobile: r.is_mobile,
    deviceShell,
    crop,
    align,
    user_id: r.user_id || null,
    user: { name: r.user_name, initials: r.user_initials },
  };
}

// ── Feed ──────────────────────────────────────────────────────────────────────

export async function fetchFeed() {
  const { data, error } = await publicSupabase
    .from("feed_items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(dbToFeedItem);
}

export async function insertFeedItem(art, userId) {
  const insertObj = {
    name: art.name,
    type: art.type,
    src: art.src || null,
    thumb: art.thumb || null,
    viewport: art.viewport || null,
    is_mobile: art.isMobile || false,
    mock: art.mock || null,
    description: art.desc || "",
    tags: art.tags || [],
    device_shell: art.deviceShell || "auto",
    mobile_bg: art.mobileBg || null,
    crop: art.crop || null,
    align: art.align || "center",
    user_name: art.user?.name || "Dennis O'Neil",
    user_initials: art.user?.initials || "DO",
    user_id: userId || null,
  };

  let { data, error } = await supabase
    .from("feed_items")
    .insert(insertObj)
    .select()
    .single();

  // Graceful fallback if new columns don't exist yet
  if (error && (error.message.includes("device_shell") || error.message.includes("mobile_bg") || error.message.includes("crop") || error.message.includes("align") || error.message.includes("user_id"))) {
    console.warn("Some columns missing, inserting without them:", error.message);
    const { device_shell: _ds, mobile_bg: _mb, crop: _c, align: _a, user_id: _u, ...basicInsert } = insertObj;
    const result = await supabase.from("feed_items").insert(basicInsert).select().single();
    if (result.error) throw result.error;
    data = result.data;
    try {
      localStorage.setItem(`device_${data.id}`, JSON.stringify({
        deviceShell: art.deviceShell, mobileBg: art.mobileBg, crop: art.crop, align: art.align || "center",
      }));
    } catch(e) {}
  } else if (error) {
    throw error;
  }

  return dbToFeedItem(data);
}

export async function updateFeedItem(id, updates) {
  const displaySettings = {
    deviceShell: updates.deviceShell,
    mobileBg: updates.mobileBg,
    crop: updates.crop !== undefined ? updates.crop : null,
    align: updates.align || "center",
  };

  const updateObj = {
    name: updates.name,
    description: updates.desc || "",
    tags: updates.tags || [],
    device_shell: updates.deviceShell || "auto",
    mobile_bg: updates.mobileBg || "#000",
    crop: updates.crop !== undefined ? updates.crop : null,
    align: updates.align || "center",
  };

  let { data, error } = await supabase
    .from("feed_items")
    .update(updateObj)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    const missingCol = error.message.includes("device_shell") ||
                       error.message.includes("mobile_bg") ||
                       error.message.includes("crop") ||
                       error.message.includes("align");
    if (missingCol) {
      // Display columns missing — run supabase_migration.sql to fix permanently.
      // Fall back to updating only the base columns.
      console.error("[Stash] Display columns missing in DB. Run supabase_migration.sql to fix. Settings saved to localStorage only.");
      const basicUpdate = { name: updates.name, description: updates.desc || "", tags: updates.tags || [] };
      const result = await supabase.from("feed_items").update(basicUpdate).eq("id", id).select().single();
      if (result.error) throw result.error;
      data = result.data;
    } else {
      // Could be RLS blocking the update. Run supabase_migration.sql which disables
      // RLS on feed_items so writes work without per-row policies.
      console.error("[Stash] Feed item update failed:", error.code, error.message,
        "\nIf this is code PGRST116, RLS is blocking writes — run supabase_migration.sql");
      throw error;
    }
  }

  try {
    localStorage.setItem(`device_${id}`, JSON.stringify(displaySettings));
  } catch(e) {}
  return dbToFeedItem(data);
}

export async function deleteFeedItem(id) {
  const { error } = await supabase.from("feed_items").delete().eq("id", id);
  if (error) throw error;
}

function dbToFeedItem(r) {
  let deviceShell = r.device_shell || "auto";
  let mobileBg = r.mobile_bg || "#000";
  let crop = r.crop || null;
  let align = r.align || "center";

  try {
    const stored = localStorage.getItem(`device_${r.id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.deviceShell !== undefined) deviceShell = parsed.deviceShell || deviceShell;
      if (parsed.mobileBg !== undefined) mobileBg = parsed.mobileBg || mobileBg;
      if ('crop' in parsed) crop = parsed.crop; // allow null to clear a crop
      if (parsed.align !== undefined) align = parsed.align || align;
    }
  } catch(e) {}

  return {
    id: r.id,
    name: r.name,
    type: r.type,
    src: r.src,
    thumb: r.thumb,
    viewport: r.viewport,
    isMobile: r.is_mobile,
    mock: r.mock,
    desc: r.description,
    tags: r.tags || [],
    deviceShell,
    mobileBg,
    crop,
    align,
    user_id: r.user_id || null,
    user: { name: r.user_name, initials: r.user_initials },
  };
}

// ── File Storage ──────────────────────────────────────────────────────────────

export async function uploadFile(file) {
  const MAX_FILE_SIZE = 100 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size of 100MB`);
  }
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("artifacts").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("artifacts").getPublicUrl(path);
  return data.publicUrl;
}
