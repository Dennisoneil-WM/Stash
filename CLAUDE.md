# Stash — Claude Code Context

Internal design artifact platform for Weedmaps design team and leadership.
Inspired by Shopify's internal "Artifact" tool. Built with React + Vite, deployed to Vercel.

---

## Project overview

Stash is a visual repository where designers and PMs can:
- Upload and organize design artifacts (images, videos, GIFs, PDFs, Figma embeds, URLs)
- Browse a team-wide Explore feed (masonry grid, pure media)
- Organize work into Projects > Pages > Artifacts
- Publish artifacts to the shared feed
- View everything in context — mobile content auto-wraps in iPhone device frames

---

## Stack

| Layer | Choice |
|---|---|
| Framework | React 18 (functional components, hooks only) |
| Build | Vite 5 |
| Styling | Inline styles only — no CSS modules, no Tailwind, no styled-components |
| State | useState / useCallback / useEffect — no Redux, no Zustand |
| Routing | None yet — single-page, view switching via `useState` |
| Backend | None yet — all state is in-memory |
| Deploy | Vercel (auto-detect Vite) |

---

## File structure

```
stash/
├── src/
│   ├── App.jsx        # Entire app — all components in one file (1,100+ lines)
│   ├── main.jsx       # ReactDOM entry point
│   └── index.css      # Global reset only
├── public/
│   └── index.html
├── package.json
├── vite.config.js
├── CLAUDE.md          # This file
└── README.md
```

**App.jsx is currently a single monolithic file.** The first major refactor task is splitting it into proper components (see Immediate next steps below).

---

## Design tokens (defined at top of App.jsx)

```js
const BG  = "#FFFFFF"   // white — card/modal backgrounds
const PG  = "#F5F5F5"   // page background
const BD  = "#E8E8E8"   // border default (hairline)
const BM  = "#D0D0D0"   // border medium (hover/focus)
const T1  = "#0D0D0D"   // text primary
const T2  = "#6B6B6B"   // text secondary
const T3  = "#ABABAB"   // text muted/placeholder
const BK  = "#0D0D0D"   // black — primary buttons, active states
const FF  = "'Geist','DM Sans',-apple-system,sans-serif"
```

**Always use these constants.** Never hardcode color values inline.

---

## Component map (App.jsx)

### Atoms
| Component | Props | Purpose |
|---|---|---|
| `Av` | `{user, size=32}` | Circular avatar with initials |
| `Bdg` | `{type}` | Artifact type badge (Figma/URL/File/Image/Video/PDF/GIF) |
| `BBtn` | `{children, onClick, disabled, fw, sm}` | Black filled button (`fw`=fullWidth, `sm`=small) |
| `GBtn` | `{children, onClick, sm}` | Ghost/outline button |
| `TIn` | `{ph, val, set, multi, af}` | Text input/textarea (`af`=autoFocus) |
| `TSel` | `{val, set, opts}` | Select dropdown |
| `Fld` | `{label, children}` | Form field with label |
| `Mdl` | `{title, onClose, children, w=520}` | Modal overlay wrapper |

### Media
| Component | Props | Purpose |
|---|---|---|
| `Thumb` | `{art, h=220, onClick}` | Renders any artifact type — image/video/PDF/Figma iframe/website iframe. Auto-wraps in `PhoneShell` if `art.isMobile===true` |
| `LBox` | `{art, onClose}` | Full-screen lightbox. ESC to close |
| `PhoneShell` | `{children, bg="#000"}` | Pure CSS iPhone frame wrapper. No SVG, no foreignObject |
| `MockSVG` | `{mock}` | Pure SVG device mockup (iPhone/iPad/Browser/Desktop) for seed data placeholders |
| `ScreenDraw` | `{layout, c, dim, sub, card, card2, W, H}` | SVG UI content drawn inside MockSVG screens |
| `mkRows` | `(n, rowH, gap, startY, render)` | Helper that generates repeated SVG row groups |

### Upload flow
| Component | Purpose |
|---|---|
| `UplProg` | Upload progress modal — simulated progress bar with file preview |
| `NewArtMdl` | New Artifact modal — File (drag/drop), Figma URL, Website URL tabs |

**Upload dimension detection** (in `NewArtMdl.proc`):
- Images: uses `new Image()` to read `naturalWidth/naturalHeight`
- Videos: uses `video.onloadedmetadata` to read `videoWidth/videoHeight`
- If `height/width > 1.3` → sets `isMobile: true` on the artifact
- Mobile website (viewport includes "390" or "Mobile") → `isMobile: true` automatically

### Modals
| Component | Purpose |
|---|---|
| `NewProjMdl` | Create new project — name, description, folder |
| `NewFolderMdl` | Create new folder — name, description, project picker |
| `PubMdl` | Publish to Feed — name, description, success state |
| `SaveMdl` | Save to Project — project + page dropdowns |

### Views
| Component | Props | Purpose |
|---|---|---|
| `ExploreCard` | `{item, onSave, onOpen}` | Single masonry card. Renders MockSVG, PhoneShell-wrapped media, or raw Thumb |
| `Explore` | `{feed, projects, onSave}` | Masonry grid (CSS columns). No text, no avatars — pure media |
| `Projects` | `{projects, onOpen}` | Folders row + Projects grid with 2×2 thumb collages |
| `ProjDetail` | `{project, projects, onBack}` | Project view — page dots nav, row labels sidebar, horizontal artifact scroll |
| `ArtTile` | `{art, onPublish, onSave, onOpen}` | Artifact tile in project detail — hover: Save + ⋯ menu |
| `Profile` | `{user, feed}` | User profile with avatar, title, Slack link, personal artifact grid |

### App shell
`App` (default export) — top-level state, nav bar, view routing via `view` state string (`"explore"` | `"projects"` | `"project"` | `"profile"`).

---

## Data shapes

### Artifact object
```js
{
  id: string,           // uid()
  name: string,
  type: "image"|"gif"|"video"|"pdf"|"figma"|"website"|"file"|"mockup",
  src: string|null,     // dataURL for uploaded files, embed URL for figma, URL for website
  thumb: string,        // CSS gradient fallback when no src
  viewport: string|null, // e.g. "Desktop (1512x900)" — website only
  isMobile: boolean,    // true = wrap in PhoneShell
  mock: object|null,    // {device, bg, accent, layout} — seed data placeholders only
  user: object,         // {id, name, title, initials}
}
```

### Project object
```js
{
  id: number,
  name: string,
  folder: number,       // folder.id
  artifactCount: number,
  thumbs: string[],     // gradient/src strings for 2x2 collage preview
  pages: [{id, label, name}],
  rows: string[],       // row labels shown in left sidebar of detail view
  artifacts: {          // keyed by page.id
    [pageId]: Artifact[]
  }
}
```

### Feed item
Same shape as Artifact — feed items can be type `"mockup"` (seed data) or any real uploaded type.

---

## Key patterns

### Inline styles only
All styling is via `style={{...}}` props. No className, no CSS files beyond the global reset.

```jsx
// Correct
<div style={{background: BG, border: `1px solid ${BD}`, borderRadius: 12}}>

// Wrong — don't introduce CSS modules or utility classes
<div className="card">
```

### Single return in components
The artifact's Babel transform is strict. Always use a single `return (...)` per component.
Use conditional rendering `{condition && (...)}` instead of multiple `if/return` statements.

```jsx
// Correct
return (
  <div>
    {isMobile && <PhoneShell>...</PhoneShell>}
    {!isMobile && <Thumb art={art}/>}
  </div>
);

// Wrong — multiple returns break the transpiler
if (isMobile) return <PhoneShell>...</PhoneShell>;
return <Thumb art={art}/>;
```

### No foreignObject in SVG
`<foreignObject>` is unreliable in this environment. All device frame rendering uses pure SVG primitives or CSS div-based frames (`PhoneShell`).

### Emoji → HTML entities
Use HTML entities instead of emoji literals in JSX to avoid transpiler issues:
- ✕ → `&#x2715;`
- → → `&#x2192;`
- ← → `&#x2190;`
- ▶ → `&#x25B6;`
- ⋯ → `&#x22EF;`
- ✦ → `&#x2736;`

---

## Immediate next steps (priority order)

### 1. Split App.jsx into components
The file is 1,100+ lines. Split into:
```
src/
  components/
    atoms/
      Avatar.jsx
      Badge.jsx
      Button.jsx      # BBtn + GBtn
      Field.jsx       # Fld + TIn + TSel
      Modal.jsx
    media/
      Thumb.jsx
      Lightbox.jsx
      PhoneShell.jsx
      DeviceMockup.jsx  # MockSVG + ScreenDraw + mkRows
      UploadProgress.jsx
    modals/
      NewArtifactModal.jsx
      NewProjectModal.jsx
      NewFolderModal.jsx
      PublishModal.jsx
      SaveToProjectModal.jsx
    views/
      Explore.jsx       # ExploreCard + Explore
      Projects.jsx
      ProjectDetail.jsx  # ProjDetail + ArtTile
      Profile.jsx
    layout/
      Nav.jsx
  data/
    seed.js           # SPROJ, SFEED, DMOCKS, FOLDERS, USERS, VPS
    tokens.js         # BG, PG, BD, BM, T1, T2, T3, BK, FF, GR
  utils/
    files.js          # toURL, isImg, isVid, isPdf, uid, figEmbed, ensureHttp
  App.jsx             # Thin shell — imports + view routing only
```

### 2. Add real persistence
Currently all state is in-memory and resets on page refresh. Options:
- **Quick**: `localStorage` (no backend needed — fine for internal tool)
- **Proper**: Supabase (free tier, Postgres + Storage for file uploads)
- Files (images/videos) need a storage solution — Supabase Storage or Vercel Blob

### 3. Real file storage
Currently uploaded files are stored as base64 dataURLs in state (lost on refresh).
Replace `toURL` dataURL approach with actual upload to a storage bucket.

### 4. Auth
Weedmaps uses Okta SSO. Options:
- Clerk (easiest, has Okta OIDC integration)
- NextAuth (if migrating to Next.js)
- Direct Okta OIDC

### 5. Multi-user / real-time feed
Feed is currently per-session only. To make it team-wide:
- Supabase Realtime subscriptions for the feed
- User identities from auth provider

### 6. Figma MCP integration
The Joint Design System tokens are accessible via Figma MCP. 
When implementing design token updates, use: `mcp.figma.com/mcp` (already connected to this account).

---

## What NOT to do

- **Don't introduce a CSS framework** (no Tailwind, no MUI, no Chakra) — inline styles are intentional
- **Don't use React Router** until multi-page features require it
- **Don't use class components** — functional + hooks only
- **Don't add foreignObject to SVG** — always causes rendering issues
- **Don't hardcode colors** — always use the token constants from `tokens.js` (or top of App.jsx)
- **Don't add `return` statements before the main JSX return** — use conditional rendering

---

## Running locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # output to dist/
npm run preview   # preview production build
```

## Deploying to Vercel

```bash
# First time
npx vercel

# Subsequent deploys
npx vercel --prod
```

Vercel auto-detects Vite. No `vercel.json` needed unless you add API routes.

---

## Context for new features

When adding a new feature, follow this checklist:
1. Add the data shape change to `seed.js` (or wherever state lives)
2. Update the relevant modal if user input is needed
3. Update the relevant view component
4. Update `App.jsx` state and handlers
5. If it touches artifact rendering, update `Thumb.jsx` and `ExploreCard.jsx`
6. Test all three entry points: Explore feed, Project detail, Lightbox

---

## Weedmaps context

- **Product**: Cannabis discovery platform — dispensary listings, menus, delivery
- **Design system**: Joint — CircularXX typeface, teal accent (`#00D4AA`), dark-first aesthetic
- **Figma MCP**: `mcp.figma.com/mcp` — connected, can read/write Figma files
- **Key teams**: Core 2 (checkout/address), Checkout team, Budbot (AI shopping assistant)
- **Internal tools deploy**: Vercel under Weedmaps org
