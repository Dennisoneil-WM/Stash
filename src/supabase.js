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
  const { data, error } = await supabase
    .from("feed_items")
    .insert({
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
    })
    .select()
    .single();
  if (error) throw error;
  return dbToFeedItem(data);
}

export async function updateFeedItem(id, updates) {
  const { data, error } = await supabase
    .from("feed_items")
    .update({
      name: updates.name,
      description: updates.desc || "",
      tags: updates.tags || [],
      device_shell: updates.deviceShell || "auto",
      mobile_bg: updates.mobileBg || null,
      crop: updates.crop || null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
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
    deviceShell: r.device_shell || "auto",
    mobileBg: r.mobile_bg || "#000",
    crop: r.crop || null,
    user: { name: r.user_name, initials: r.user_initials },
  };
}

// ── File Storage ──────────────────────────────────────────────────────────────

export async function uploadFile(file) {
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("artifacts").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("artifacts").getPublicUrl(path);
  return data.publicUrl;
}
