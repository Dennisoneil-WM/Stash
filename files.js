// File utility helpers
export function uid() {
  return Math.random().toString(36).slice(2, 9);
}
export function toURL(f) {
  return new Promise(r => {
    const rd = new FileReader();
    rd.onload = e => r(e.target.result);
    rd.readAsDataURL(f);
  });
}
export const isImg = f => f.type.startsWith("image/");
export const isVid = f => f.type.startsWith("video/");
export const isPdf = f => f.type === "application/pdf";
export function figEmbed(u) {
  if (!u) return "";
  if (u.includes("figma.com/embed")) return u;
  return "https://www.figma.com/embed?embed_host=share&url=" + encodeURIComponent(u);
}
export function ensureHttp(u) {
  if (!u) return "";
  return u.startsWith("http") ? u : "https://" + u;
}
