import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, key);

// ── Projects ──────────────────────────────────────────────────────────────────

export async function fetchProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(dbToProject);
}

export async function createProject(p) {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: p.name,
      description: p.desc || "",
      folder: p.folder,
      tags: p.tags || [],
      artifact_count: 0,
      thumbs: [],
      pages: p.pages || [{ id: "p1", label: "1", name: "Page 1" }],
      rows: p.rows || ["R1"],
    })
    .select()
    .single();
  if (error) throw error;
  return dbToProject(data);
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

function dbToProject(r) {
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

export async function insertArtifact(projectId, pageId, art) {
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
    })
    .select()
    .single();
  if (error) throw error;
  return dbToArtifact(data);
}

function dbToArtifact(r) {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    src: r.src,
    thumb: r.thumb,
    viewport: r.viewport,
    isMobile: r.is_mobile,
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

export async function insertFeedItem(art) {
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
    user_name: art.user?.name || "Dennis O'Neil",
    user_initials: art.user?.initials || "DO",
  };

  let { data, error } = await supabase
    .from("feed_items")
    .insert(insertObj)
    .select()
    .single();

  // If insert fails because columns don't exist, try without them
  if (error && (error.message.includes("device_shell") || error.message.includes("mobile_bg") || error.message.includes("crop"))) {
    console.warn("New columns don't exist, inserting without them:", error.message);
    const basicInsert = {
      name: art.name,
      type: art.type,
      src: art.src || null,
      thumb: art.thumb || null,
      viewport: art.viewport || null,
      is_mobile: art.isMobile || false,
      mock: art.mock || null,
      description: art.desc || "",
      tags: art.tags || [],
      user_name: art.user?.name || "Dennis O'Neil",
      user_initials: art.user?.initials || "DO",
    };

    const result = await supabase
      .from("feed_items")
      .insert(basicInsert)
      .select()
      .single();

    if (result.error) throw result.error;

    data = result.data;

    // Store device settings in localStorage
    const devicesKey = `device_${data.id}`;
    localStorage.setItem(devicesKey, JSON.stringify({
      deviceShell: art.deviceShell,
      mobileBg: art.mobileBg,
      crop: art.crop
    }));
  } else if (error) {
    throw error;
  }

  return dbToFeedItem(data);
}

export async function updateFeedItem(id, updates) {
  // First try to update with all fields including the new ones
  const updateObj = {
    name: updates.name,
    description: updates.desc || "",
    tags: updates.tags || [],
    device_shell: updates.deviceShell || "auto",
    mobile_bg: updates.mobileBg || "#000",
    crop: updates.crop || null,
  };

  let { data, error } = await supabase
    .from("feed_items")
    .update(updateObj)
    .eq("id", id)
    .select()
    .single();

  // If the update fails because columns don't exist, try without the new fields
  if (error && (error.message.includes("device_shell") || error.message.includes("mobile_bg") || error.message.includes("crop"))) {
    console.warn("New columns don't exist yet, updating without them:", error.message);
    const basicUpdate = {
      name: updates.name,
      description: updates.desc || "",
      tags: updates.tags || [],
    };
    const result = await supabase
      .from("feed_items")
      .update(basicUpdate)
      .eq("id", id)
      .select()
      .single();

    if (result.error) {
      console.error("updateFeedItem error:", result.error);
      throw result.error;
    }

    // Store device shell and crop in local storage as a fallback
    const devicesKey = `device_${id}`;
    localStorage.setItem(devicesKey, JSON.stringify({
      deviceShell: updates.deviceShell,
      mobileBg: updates.mobileBg,
      crop: updates.crop
    }));
    console.log("Stored device settings in localStorage for:", id);

    data = result.data;
  } else if (error) {
    console.error("updateFeedItem error:", error);
    throw error;
  }

  console.log("Updated feed item in Supabase:", { id, updates: updateObj });
  return dbToFeedItem(data);
}

export async function deleteFeedItem(id) {
  const { error } = await supabase
    .from("feed_items")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

function dbToFeedItem(r) {
  // Check if device settings are stored in localStorage (fallback)
  let deviceShell = r.device_shell || "auto";
  let mobileBg = r.mobile_bg || "#000";
  let crop = r.crop || null;

  const devicesKey = `device_${r.id}`;
  try {
    const stored = localStorage.getItem(devicesKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      deviceShell = parsed.deviceShell || deviceShell;
      mobileBg = parsed.mobileBg || mobileBg;
      crop = parsed.crop || crop;
    }
  } catch (e) {
    console.warn("Error reading localStorage for device settings:", e);
  }

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
    user: { name: r.user_name, initials: r.user_initials },
  };
}

// ── File Storage ──────────────────────────────────────────────────────────────

export async function uploadFile(file) {
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
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
