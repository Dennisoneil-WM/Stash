import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configured = !!(url && key);
export const supabase = configured
  ? createClient(url, key)
  : createClient("https://placeholder.supabase.co", "placeholder");

// ── Auth ──────────────────────────────────────────────────────────────────────

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
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error && error.code === "PGRST116") return null; // row not found
  if (error) throw error;
  return data;
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
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(dbToProject);
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
  const { error } = await supabase.from("projects").update(row).eq("id", id);
  if (error) throw error;
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
  return {
    id: r.id,
    name: r.name,
    desc: r.description,
    folder: r.folder,
    tags: r.tags || [],
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
    .from("artifacts")
    .insert({
      project_id: projectId,
      page_id: pageId,
      name: art.name,
      type: art.type,
      src: art.src || null,
      thumb: art.thumb || null,
      viewport: art.viewport || null,
      is_mobile: art.isMobile || false,
      user_name: art.user?.name || "Dennis O'Neil",
      user_initials: art.user?.initials || "DO",
      user_id: userId || null,
    })
    .select()
    .single();
  if (error) throw error;
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
  const { data, error } = await supabase
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
  const updateObj = {
    name: updates.name,
    description: updates.desc || "",
    tags: updates.tags || [],
    device_shell: updates.deviceShell || "auto",
    mobile_bg: updates.mobileBg || "#000",
    crop: updates.crop || null,
    align: updates.align || "center",
  };

  let { data, error } = await supabase
    .from("feed_items")
    .update(updateObj)
    .eq("id", id)
    .select()
    .single();

  if (error && (error.message.includes("device_shell") || error.message.includes("mobile_bg") || error.message.includes("crop") || error.message.includes("align"))) {
    console.warn("New columns don't exist yet, updating without them:", error.message);
    const basicUpdate = { name: updates.name, description: updates.desc || "", tags: updates.tags || [] };
    const result = await supabase.from("feed_items").update(basicUpdate).eq("id", id).select().single();
    if (result.error) throw result.error;
    try {
      localStorage.setItem(`device_${id}`, JSON.stringify({
        deviceShell: updates.deviceShell, mobileBg: updates.mobileBg, crop: updates.crop, align: updates.align || "center",
      }));
    } catch(e) {}
    data = result.data;
  } else if (error) {
    throw error;
  }

  try {
    localStorage.setItem(`device_${id}`, JSON.stringify({
      deviceShell: updates.deviceShell, mobileBg: updates.mobileBg, crop: updates.crop, align: updates.align || "center",
    }));
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
