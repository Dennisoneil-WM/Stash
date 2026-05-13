// Seed data — replace with real API/DB calls when backend is added
import { GR } from "./tokens.js";

export const USERS = [
  { id: 1, name: "Dennis Hwang", title: "Senior Product Designer", initials: "DH" },
  { id: 2, name: "Maria Chen",   title: "Lead UX Designer",        initials: "MC" },
  { id: 3, name: "Jake Torres",  title: "Principal Designer",      initials: "JT" },
];
export const ME = USERS[0];

export const FOLDERS = [
  { id: 1, name: "Product Design",    count: 8  },
  { id: 2, name: "Brand & Marketing", count: 5  },
  { id: 3, name: "Research",          count: 3  },
  { id: 4, name: "Documentation",     count: 6  },
  { id: 5, name: "Archive",           count: 15 },
];

const a = (id, n, t, g) => ({ id, name: n, type: t, thumb: g, src: null, viewport: null });

export const SEED_PROJECTS = [
  {
    id: 1, name: "Website Redesign", folder: 1, artifactCount: 4,
    thumbs: [GR[0], GR[1], GR[2], GR[3]],
    pages: [
      { id: "p1", label: "2", name: "Discovery" },
      { id: "p2", label: "3", name: "Concepts" },
      { id: "p3", label: "4", name: "Visual" },
      { id: "p4", label: "5", name: "Prototype" },
      { id: "p5", label: "6", name: "Handoff" },
    ],
    rows: ["R1", "PDP", "R2", "R3"],
    artifacts: {
      p1: [a("a1","Logo Animation","image",GR[0]), a("a2","Promo Video","image",GR[1]), a("a3","Hero Banner","image",GR[2]), a("a4","Mobile Mockup","image",GR[3])],
      p2: [a("a5","shop-routing","figma",GR[4]), a("a6","type-to-image","image",GR[5]), a("a7","Home Z Index B","image",GR[6]), a("a8","shop-search","figma",GR[7])],
      p3: [a("a9","UI Kit v1","figma",GR[8]), a("a10","Color System","image",GR[9])],
      p4: [a("a11","Prototype v1","website",GR[0])],
      p5: [a("a12","Handoff Doc","file",GR[1])],
    },
  },
  { id:2, name:"Mobile App",      folder:1, artifactCount:2, thumbs:[GR[4],GR[5]], pages:[{id:"p1",label:"1",name:"Research"},{id:"p2",label:"2",name:"Design"}], rows:["R1","R2"], artifacts:{p1:[a("b1","User Flows","figma",GR[4])],p2:[a("b2","Hi-fi Screens","image",GR[5])]} },
  { id:3, name:"Brand Refresh",   folder:2, artifactCount:1, thumbs:[GR[6]],       pages:[{id:"p1",label:"1",name:"Assets"}],  rows:["Brand"], artifacts:{p1:[a("c1","Logo System","image",GR[6])]} },
  { id:4, name:"API Integration", folder:1, artifactCount:2, thumbs:[GR[7],GR[8]], pages:[{id:"p1",label:"1",name:"Specs"},{id:"p2",label:"2",name:"Docs"}], rows:["R1"], artifacts:{p1:[a("d1","Flow Diagram","figma",GR[7])],p2:[a("d2","API Docs","website",GR[8])]} },
  { id:5, name:"User Portal",     folder:1, artifactCount:5, thumbs:[GR[9],GR[0],GR[1],GR[2]], pages:[{id:"p1",label:"1",name:"Research"},{id:"p2",label:"2",name:"Design"},{id:"p3",label:"3",name:"Dev"}], rows:["R1","R2","R3"], artifacts:{p1:[a("e1","Research Deck","file",GR[9]),a("e2","Interview Clips","image",GR[0])],p2:[a("e3","Wireframes","figma",GR[1]),a("e4","Visual Design","figma",GR[2])],p3:[a("e5","Spec Sheet","file",GR[3])]} },
];

export const DEVICE_MOCKS = [
  { device:"iphone",  bg:"#0A0A0F", accent:"#6366F1", layout:"app"       },
  { device:"browser", bg:"#FFFFFF", accent:"#10B981", layout:"dashboard"  },
  { device:"iphone",  bg:"#0F172A", accent:"#38BDF8", layout:"feed"       },
  { device:"ipad",    bg:"#1A0030", accent:"#A78BFA", layout:"kanban"     },
  { device:"iphone",  bg:"#0C0C0C", accent:"#F97316", layout:"player"     },
  { device:"browser", bg:"#F8F8F8", accent:"#EF4444", layout:"ecomm"      },
  { device:"iphone",  bg:"#051015", accent:"#06B6D4", layout:"map"        },
  { device:"desktop", bg:"#111827", accent:"#FBBF24", layout:"chart"      },
  { device:"iphone",  bg:"#1A0010", accent:"#EC4899", layout:"profile"    },
  { device:"browser", bg:"#FFFFFF", accent:"#8B5CF6", layout:"docs"       },
  { device:"ipad",    bg:"#0A1628", accent:"#3B82F6", layout:"grid"       },
  { device:"iphone",  bg:"#0D1117", accent:"#22C55E", layout:"checkout"   },
  { device:"browser", bg:"#F9FAFB", accent:"#F59E0B", layout:"analytics"  },
  { device:"iphone",  bg:"#1C1917", accent:"#D97706", layout:"video"      },
  { device:"ipad",    bg:"#0F0F23", accent:"#7C3AED", layout:"reader"     },
  { device:"desktop", bg:"#111827", accent:"#10B981", layout:"table"      },
  { device:"iphone",  bg:"#000D1A", accent:"#0EA5E9", layout:"messages"   },
  { device:"browser", bg:"#FFFFFF", accent:"#F43F5E", layout:"landing"    },
  { device:"iphone",  bg:"#0A0A14", accent:"#A855F7", layout:"onboard"    },
  { device:"ipad",    bg:"#0A1A00", accent:"#84CC16", layout:"camera"     },
];

const mkF = (id, i) => ({
  id, name: id, type: "mockup",
  mock: DEVICE_MOCKS[i % DEVICE_MOCKS.length],
  src: null, user: USERS[0],
});
export const SEED_FEED = Array.from({ length: 20 }, (_, i) => mkF("f" + (i+1), i));
