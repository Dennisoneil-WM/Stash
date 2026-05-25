// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — Stash design artifact platform
//
// STATUS: Monolithic — all components in one file.
// REFACTOR: Split into src/components/** per CLAUDE.md component map.
//
// Data/utils already extracted to:
//   src/data/tokens.js   — design tokens (BG, T1, BK, FF, GR, VPS...)
//   src/data/seed.js     — SEED_PROJECTS, SEED_FEED, DEVICE_MOCKS, USERS, FOLDERS
//   src/utils/files.js   — uid, toURL, isImg, isVid, isPdf, figEmbed, ensureHttp
//
// When splitting: import tokens + utils from those files instead of redeclaring.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useCallback, useEffect } from "react";
import { supabase, configured, fetchProjects, createProject, deleteProject, fetchArtifactsForProject, insertArtifact, fetchFeed, insertFeedItem, updateFeedItem, deleteFeedItem, uploadFile, signInWithGoogle, signOutUser, fetchProfile, upsertProfile } from "./supabase.js";

const BG="#FFF",PG="#F5F5F5",BD="#E8E8E8",BM="#D0D0D0";
const T1="#0D0D0D",T2="#6B6B6B",T3="#ABABAB",BK="#0D0D0D";
const FF="'Geist','DM Sans',-apple-system,sans-serif";
// Material Symbols Rounded icon helper
const MI=({name,size=24,style={}})=>(<span className="material-symbols-rounded" style={{fontSize:size,lineHeight:1,userSelect:"none",display:"inline-flex",alignItems:"center",justifyContent:"center",...style}}>{name}</span>);
const GR=["linear-gradient(135deg,#0d1117,#1a472a)","linear-gradient(135deg,#1a0030,#6b21a8)","linear-gradient(135deg,#1c1c1c,#f97316)","linear-gradient(160deg,#0f172a,#1e40af)","linear-gradient(135deg,#0a0a0a,#dc2626)","linear-gradient(135deg,#111827,#059669)","linear-gradient(135deg,#1c1917,#d97706)","linear-gradient(160deg,#0f0f23,#7c3aed)","linear-gradient(135deg,#0c1a0c,#16a34a)","linear-gradient(135deg,#1e1b4b,#a78bfa)"];
const USERS=[{id:1,name:"Dennis O'Neil",title:"Senior Product Designer",initials:"DO",image:"https://cdn.builder.io/api/v1/image/assets%2Fc65332bdb1b641359feb3e4d8ecc47de%2F8d0ed44f84aa42ffb662bd68b4c40eb8?format=webp&width=800&height=1200"},{id:2,name:"Maria Chen",title:"Lead UX Designer",initials:"MC"},{id:3,name:"Jake Torres",title:"Principal Designer",initials:"JT"}];
const ME=USERS[0];
const VPS={"Desktop (1512x900)":{w:1512,h:900},"Laptop (1280x800)":{w:1280,h:800},"Mobile (390x844)":{w:390,h:844},"Tablet (768x1024)":{w:768,h:1024}};
const FOLDERS=[{id:1,name:"Product Design",count:8},{id:2,name:"Brand & Marketing",count:5},{id:3,name:"Research",count:3},{id:4,name:"Documentation",count:6},{id:5,name:"Archive",count:15}];
const a=(id,n,t,g)=>({id,name:n,type:t,thumb:g,src:null,viewport:null});
const SPROJ=[
  {id:1,name:"Website Redesign",folder:1,artifactCount:4,thumbs:[GR[0],GR[1],GR[2],GR[3]],
   desc:"Full redesign of the consumer web experience with focus on discovery and checkout flows.",
   members:[USERS[0],USERS[1]],
   tags:["web","redesign","core"],
   pages:[{id:"p1",label:"2",name:"Discovery"},{id:"p2",label:"3",name:"Concepts"},{id:"p3",label:"4",name:"Visual"},{id:"p4",label:"5",name:"Prototype"},{id:"p5",label:"6",name:"Handoff"}],
   rows:["R1","PDP","R2","R3"],
   artifacts:{p1:[a("a1","Logo Animation","image",GR[0]),a("a2","Promo Video","image",GR[1]),a("a3","Hero Banner","image",GR[2]),a("a4","Mobile Mockup","image",GR[3])],p2:[a("a5","shop-routing","figma",GR[4]),a("a6","type-to-image","image",GR[5]),a("a7","Home Z Index B","image",GR[6]),a("a8","shop-search","figma",GR[7])],p3:[a("a9","UI Kit v1","figma",GR[8]),a("a10","Color System","image",GR[9])],p4:[a("a11","Prototype v1","website",GR[0])],p5:[a("a12","Handoff Doc","file",GR[1])]}},
  {id:2,name:"Mobile App",folder:1,artifactCount:2,thumbs:[GR[4],GR[5]],
   desc:"Native iOS and Android app redesign covering onboarding, search, and dispensary detail pages.",
   members:[USERS[0],USERS[2]],
   tags:["mobile","app"],pages:[{id:"p1",label:"1",name:"Research"},{id:"p2",label:"2",name:"Design"}],rows:["R1","R2"],artifacts:{p1:[a("b1","User Flows","figma",GR[4])],p2:[a("b2","Hi-fi Screens","image",GR[5])]}},
  {id:3,name:"Brand Refresh",folder:2,artifactCount:1,thumbs:[GR[6]],
   desc:"Updated brand guidelines including typography, color system, and logo variants.",
   members:[USERS[1]],
   tags:["brand","refresh"],pages:[{id:"p1",label:"1",name:"Assets"}],rows:["Brand"],artifacts:{p1:[a("c1","Logo System","image",GR[6])]}},
  {id:4,name:"API Integration",folder:1,artifactCount:2,thumbs:[GR[7],GR[8]],
   desc:"Design specs and documentation for the new partner API integration endpoints.",
   members:[USERS[0]],
   tags:["api","backend"],pages:[{id:"p1",label:"1",name:"Specs"},{id:"p2",label:"2",name:"Docs"}],rows:["R1"],artifacts:{p1:[a("d1","Flow Diagram","figma",GR[7])],p2:[a("d2","API Docs","website",GR[8])]}},
  {id:5,name:"User Portal",folder:1,artifactCount:5,thumbs:[GR[9],GR[0],GR[1],GR[2]],
   desc:"Self-service portal for dispensary owners to manage listings, hours, and promotions.",
   members:[USERS[0],USERS[1],USERS[2]],
   tags:["portal","user"],pages:[{id:"p1",label:"1",name:"Research"},{id:"p2",label:"2",name:"Design"},{id:"p3",label:"3",name:"Dev"}],rows:["R1","R2","R3"],artifacts:{p1:[a("e1","Research Deck","file",GR[9]),a("e2","Interview Clips","image",GR[0])],p2:[a("e3","Wireframes","figma",GR[1]),a("e4","Visual Design","figma",GR[2])],p3:[a("e5","Spec Sheet","file",GR[3])]}},
];
// Device mockup types and screen color themes for each feed card
const DMOCKS=[
  {device:"iphone", bg:"#0A0A0F", accent:"#6366F1", layout:"app"},
  {device:"browser",bg:"#FFFFFF", accent:"#10B981", layout:"dashboard"},
  {device:"iphone", bg:"#0F172A", accent:"#38BDF8", layout:"feed"},
  {device:"ipad",   bg:"#1A0030", accent:"#A78BFA", layout:"kanban"},
  {device:"iphone", bg:"#0C0C0C", accent:"#F97316", layout:"player"},
  {device:"browser",bg:"#F8F8F8", accent:"#EF4444", layout:"ecomm"},
  {device:"iphone", bg:"#051015", accent:"#06B6D4", layout:"map"},
  {device:"desktop",bg:"#111827", accent:"#FBBF24", layout:"chart"},
  {device:"iphone", bg:"#1A0010", accent:"#EC4899", layout:"profile"},
  {device:"browser",bg:"#FFFFFF", accent:"#8B5CF6", layout:"docs"},
  {device:"ipad",   bg:"#0A1628", accent:"#3B82F6", layout:"grid"},
  {device:"iphone", bg:"#0D1117", accent:"#22C55E", layout:"checkout"},
  {device:"browser",bg:"#F9FAFB", accent:"#F59E0B", layout:"analytics"},
  {device:"iphone", bg:"#1C1917", accent:"#D97706", layout:"video"},
  {device:"ipad",   bg:"#0F0F23", accent:"#7C3AED", layout:"reader"},
  {device:"desktop",bg:"#111827", accent:"#10B981", layout:"table"},
  {device:"iphone", bg:"#000D1A", accent:"#0EA5E9", layout:"messages"},
  {device:"browser",bg:"#FFFFFF", accent:"#F43F5E", layout:"landing"},
  {device:"iphone", bg:"#0A0A14", accent:"#A855F7", layout:"onboard"},
  {device:"ipad",   bg:"#0A1A00", accent:"#84CC16", layout:"camera"},
];
const mkF=(id,i)=>({id,name:id,type:"mockup",mock:DMOCKS[i%DMOCKS.length],src:null,user:USERS[0]});
const SFEED=[
  mkF("f1",0),mkF("f2",1),mkF("f3",2),mkF("f4",3),mkF("f5",4),
  mkF("f6",5),mkF("f7",6),mkF("f8",7),mkF("f9",8),mkF("f10",9),
  mkF("f11",10),mkF("f12",11),mkF("f13",12),mkF("f14",13),mkF("f15",14),
  mkF("f16",15),mkF("f17",16),mkF("f18",17),mkF("f19",18),mkF("f20",19),
];

function uid(){return Math.random().toString(36).slice(2,9);}
function toURL(f){return new Promise(r=>{const rd=new FileReader();rd.onload=e=>r(e.target.result);rd.readAsDataURL(f);});}
function isImg(f){return f.type.startsWith("image/");}
function isVid(f){return f.type.startsWith("video/");}
function isPdf(f){return f.type==="application/pdf";}
function figEmbed(u){if(!u)return "";if(u.includes("figma.com/embed"))return u;return "https://www.figma.com/embed?embed_host=share&url="+encodeURIComponent(u);}
function ensureHttp(u){if(!u)return "";return u.startsWith("http")?u:"https://"+u;}

function Av({user,size=32,src}){
  if(src) return (<img src={src} alt={user.name} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,display:"block"}}/>);
  const bg=["#EBF5FB","#F0EBFB","#FBF0EB","#EBFBF0","#FBEBF0"],fg=["#1A6FA8","#6B21A8","#C2410C","#065F46","#9D174D"],i=(user.id-1)%5;
  return (<div style={{width:size,height:size,borderRadius:"50%",background:bg[i],display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.34,fontWeight:700,color:fg[i],flexShrink:0,userSelect:"none"}}>{user.initials}</div>);
}
function Bdg({type}){
  const L={figma:"Figma",website:"URL",file:"File",image:"Image",video:"Video",pdf:"PDF",gif:"GIF"};
  return (<span style={{fontSize:10,fontWeight:600,color:T2,background:"#F0F0F0",padding:"2px 7px",borderRadius:4,letterSpacing:"0.04em",textTransform:"uppercase"}}>{L[type]||"Media"}</span>);
}
function BBtn({children,onClick,disabled,fw,sm}){
  return (<button onClick={onClick} disabled={disabled} style={{background:disabled?"#E0E0E0":BK,color:disabled?T3:"#FFF",border:"none",borderRadius:100,padding:sm?"9px 20px":"13px 24px",fontWeight:600,fontSize:sm?13:15,cursor:disabled?"default":"pointer",width:fw?"100%":"auto",fontFamily:FF}}>{children}</button>);
}
function GBtn({children,onClick,sm}){
  return (<button onClick={onClick} style={{background:"transparent",color:T1,border:`1px solid ${BM}`,borderRadius:100,padding:sm?"8px 18px":"12px 22px",fontWeight:500,fontSize:sm?13:15,cursor:"pointer",fontFamily:FF}}>{children}</button>);
}
function TIn({ph,val,set,multi,af}){
  const s={background:"#FAFAFA",border:`1px solid ${BD}`,borderRadius:10,padding:"11px 14px",color:T1,fontSize:14,width:"100%",outline:"none",fontFamily:FF,boxSizing:"border-box"};
  return multi ? (<textarea placeholder={ph} value={val} onChange={e=>set(e.target.value)} rows={3} style={{...s,resize:"vertical"}}/>) : (<input placeholder={ph} value={val} onChange={e=>set(e.target.value)} autoFocus={af} style={s}/>);
}
function TSel({val,set,opts}){
  return (<select value={val} onChange={e=>set(e.target.value)} style={{background:"#FAFAFA",border:`1px solid ${BD}`,borderRadius:10,padding:"11px 14px",color:T1,fontSize:14,width:"100%",outline:"none",fontFamily:FF}}>{opts.map(o=>(<option key={o.v!=null?o.v:o} value={o.v!=null?o.v:o}>{o.l!=null?o.l:o}</option>))}</select>);
}
function Fld({label,children}){
  return (<div>{label&&(<label style={{fontSize:13,color:T2,display:"block",marginBottom:8,fontWeight:500}}>{label}</label>)}{children}</div>);
}
function Mdl({title,onClose,children,w=520,isMobile=false}){
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:isMobile?0:24}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#FFF",borderRadius:isMobile?0:20,width:"100%",maxWidth:isMobile?"100%":w,height:isMobile?"100vh":"auto",padding:isMobile?"16px 16px 24px":"28px 28px 24px",boxShadow:isMobile?"none":"0 20px 60px rgba(0,0,0,.18)",maxHeight:isMobile?"100vh":"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
          <span style={{fontSize:18,fontWeight:700,color:T1,fontFamily:FF}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:T3,fontSize:22,lineHeight:1,padding:4}}>&#x2715;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CroppedVideo({src, crop, onClick, wrapStyle={}}){
  const vRef=useRef();
  const cW=crop.r-crop.l, cH=crop.b-crop.t;
  const [pt,setPt]=useState(cH/cW*100);
  useEffect(()=>{
    const v=vRef.current; if(!v)return;
    const update=()=>setPt((cH/cW)*(v.videoHeight/v.videoWidth)*100);
    if(v.readyState>=1)update();
    else v.addEventListener("loadedmetadata",update,{once:true});
    return ()=>v.removeEventListener("loadedmetadata",update);
  },[cW,cH]);
  return (
    <div onClick={onClick} style={{width:"100%",paddingTop:`${pt}%`,overflow:"hidden",position:"relative",background:"#000",...wrapStyle}}>
      <video ref={vRef} src={src} muted loop playsInline autoPlay
        style={{position:"absolute",top:`${-crop.t*100/cH}%`,left:`${-crop.l*100/cW}%`,width:`${10000/cW}%`,height:"auto",display:"block"}}
      />
    </div>
  );
}

function Thumb({art,h=220,onClick,darkMode,bare=false}){
  const [fl,setFl]=useState(false);
  const ds=art.deviceShell||"auto";
  const showMobile=(ds==="mobile")||(ds==="auto"&&art.isMobile);
  const br=bare?0:12;
  const bd=bare?"none":`1px solid ${BD}`;

  if((art.type==="image"||art.type==="gif")&&art.src){
    if(ds==="none"){
      const cropClip=art.crop?`polygon(${art.crop.l}% ${art.crop.t}%,${art.crop.r}% ${art.crop.t}%,${art.crop.r}% ${art.crop.b}%,${art.crop.l}% ${art.crop.b}%)`:null;
      const croppedHeight=art.crop?h/(((art.crop.r-art.crop.l)/(art.crop.b-art.crop.t))):h;
      return (
        <div onClick={onClick} style={{height:croppedHeight,borderRadius:br,overflow:"hidden",border:bd,cursor:"pointer",...(cropClip?{clipPath:cropClip}:{})}}>
          <img src={art.src} alt={art.name} style={{width:"100%",height:"100%",objectFit:art.crop?"fill":"cover",objectPosition:!art.crop&&art.align==="left"?"left center":"center",display:"block"}}/>
        </div>
      );
    }
    if(showMobile) return (
      <div onClick={onClick} style={{cursor:"pointer"}}>
        <PhoneShell bg={art.mobileBg||"#000"} darkMode={darkMode}>
          <img src={art.src} alt={art.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
        </PhoneShell>
      </div>
    );
    return (<div onClick={onClick} style={{height:h,borderRadius:br,overflow:"hidden",border:bd,cursor:"pointer"}}><img src={art.src} alt={art.name} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:art.align==="left"?"left center":"center",display:"block"}}/></div>);
  }
  if(art.type==="video"&&art.src){
    if(ds==="none"||ds==="desktop"){
      return art.crop
        ? <CroppedVideo src={art.src} crop={art.crop} onClick={onClick} wrapStyle={{borderRadius:br,border:bd,cursor:"pointer"}}/>
        : <div onClick={onClick} style={{height:h,borderRadius:br,overflow:"hidden",border:bd,cursor:"pointer",background:"#000"}}>
            <video src={art.src} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:art.align==="left"?"left center":"center"}} muted loop playsInline autoPlay/>
          </div>;
    }
    if(showMobile) return (
      <div onClick={onClick} style={{cursor:"pointer"}}>
        <PhoneShell bg={art.mobileBg||"#000"} darkMode={darkMode}>
          <video src={art.src} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}} muted loop playsInline autoPlay/>
        </PhoneShell>
      </div>
    );
    return (
      <div onClick={onClick} style={{height:h,borderRadius:br,overflow:"hidden",border:bd,cursor:"pointer",background:"#000"}}>
        <video src={art.src} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:art.align==="left"?"left center":"center"}} muted loop playsInline autoPlay/>
      </div>
    );
  }
  if(art.type==="pdf"&&art.src){
    return (<div onClick={onClick} style={{height:h,borderRadius:br,border:bd,cursor:"pointer",background:"#F8F8F8",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}><span style={{fontSize:40}}>&#x1F4C4;</span><span style={{fontSize:12,color:T2,fontFamily:FF,maxWidth:"90%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{art.name}</span></div>);
  }
  if(art.type==="figma"&&art.src){
    return (
      <div style={{height:h,borderRadius:br,overflow:"hidden",border:bd,position:"relative",background:"#F5F5F5"}}>
        {!fl&&(<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,background:"#F5F5F5",zIndex:1}}><span style={{fontSize:28,opacity:.5}}>&#x2736;</span><span style={{fontSize:12,color:T2,fontFamily:FF}}>Loading Figma...</span></div>)}
        <iframe src={art.src} title={art.name} style={{width:"100%",height:"100%",border:"none"}} onLoad={()=>setFl(true)} allowFullScreen/>
      </div>
    );
  }
  if(art.type==="website"&&art.src){
    if(showMobile) return (
      <div onClick={onClick} style={{cursor:"pointer"}}>
        <PhoneShell bg={art.mobileBg||"#FFF"} darkMode={darkMode}>
          <div style={{position:"relative",height:420,overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,width:390,height:844,transform:"scale("+(204/390)+")",transformOrigin:"top left",pointerEvents:"none"}}>
              <iframe src={art.src} title={art.name} style={{width:390,height:844,border:"none",display:"block"}} sandbox="allow-scripts allow-same-origin"/>
            </div>
          </div>
        </PhoneShell>
      </div>
    );
    const vp=VPS[art.viewport]||VPS["Desktop (1512x900)"];
    const sc=Math.min(h/vp.h,280/vp.w);
    return (
      <div onClick={onClick} style={{height:h,borderRadius:12,overflow:"hidden",border:`1px solid ${BD}`,cursor:"pointer",background:"#F0F0F0",position:"relative"}}>
        <div style={{position:"absolute",top:0,left:0,width:vp.w,height:vp.h,transform:`scale(${sc})`,transformOrigin:"top left",pointerEvents:"none"}}>
          <iframe src={art.src} title={art.name} style={{width:"100%",height:"100%",border:"none"}} sandbox="allow-scripts allow-same-origin"/>
        </div>
      </div>
    );
  }
  return (
    <div onClick={onClick} style={{height:h,borderRadius:12,background:art.thumb||GR[0],border:`1px solid ${BD}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      {art.type==="figma"&&(<span style={{fontSize:32,opacity:.5}}>&#x2736;</span>)}
      {art.type==="website"&&(<span style={{fontSize:32,opacity:.5}}>&#x1F310;</span>)}
      {art.type==="file"&&(<span style={{fontSize:32,opacity:.5}}>&#x1F4C4;</span>)}
    </div>
  );
}

function LBox({art,onClose,onTagClick}){
  const [winH,setWinH]=useState(window.innerHeight);
  const [winW,setWinW]=useState(window.innerWidth);
  useEffect(()=>{
    const onKey=e=>{if(e.key==="Escape")onClose();};
    const onResize=()=>{setWinH(window.innerHeight);setWinW(window.innerWidth);};
    window.addEventListener("keydown",onKey);
    window.addEventListener("resize",onResize);
    return ()=>{window.removeEventListener("keydown",onKey);window.removeEventListener("resize",onResize);};
  },[onClose]);
  const ds=art.deviceShell||"auto";
  const hasCrop=art.type==="video"&&!!art.crop;
  const showMobile=((ds==="mobile")||(ds==="auto"&&art.isMobile))&&!hasCrop;
  const showNoDevice=ds==="none";
  // PhoneShell natural dimensions with noBackground=true (padding:0)
  const PHONE_W=307, PHONE_H=649;
  const phoneScale=Math.min(2.2,Math.min((winH*0.82)/PHONE_H,(winW*0.48)/PHONE_W));
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:32}}>
      <button onClick={onClose} style={{position:"absolute",top:20,right:24,background:"none",border:"none",color:"#FFF",fontSize:28,cursor:"pointer"}}>&#x2715;</button>
      <div onClick={onClose} style={{display:"flex",alignItems:"center",justifyContent:"center",width:"90vw",height:"90vh"}}>
        {hasCrop&&art.src&&(
          <div style={{width:"min(90vw, 70vh)"}} onClick={e=>e.stopPropagation()}>
            <CroppedVideo src={art.src} crop={art.crop} wrapStyle={{borderRadius:23}}/>
          </div>
        )}
        {(art.type==="image"||art.type==="gif"||art.type==="video")&&art.src&&showMobile&&(
          // Outer div reserves the scaled space so flex centering works correctly
          <div onClick={e=>e.stopPropagation()} style={{width:PHONE_W*phoneScale,height:PHONE_H*phoneScale,position:"relative",flexShrink:0}}>
            <div style={{position:"absolute",top:"50%",left:"50%",transform:`translate(-50%,-50%) scale(${phoneScale})`,transformOrigin:"center center"}}>
              <PhoneShell bg={art.mobileBg||"#000"} noBackground={true}>
                {(art.type==="image"||art.type==="gif") && (
                  <img src={art.src} alt={art.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                )}
                {art.type==="video" && (
                  <video src={art.src} muted loop playsInline autoPlay style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                )}
              </PhoneShell>
            </div>
          </div>
        )}
        {(art.type==="image"||art.type==="gif"||art.type==="video")&&art.src&&showNoDevice&&!hasCrop&&(
          <div style={{maxWidth:"90vw",maxHeight:"90vh",borderRadius:23,overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
            {(art.type==="image"||art.type==="gif") && (
              <img src={art.src} alt={art.name} style={{width:"100%",height:"100%",objectFit:"contain",display:"block"}}/>
            )}
            {art.type==="video" && (
              <video src={art.src} muted loop playsInline autoPlay style={{width:"100%",display:"block"}}/>
            )}
          </div>
        )}
        {(art.type==="image"||art.type==="gif"||art.type==="video")&&art.src&&!hasCrop&&!showMobile&&!showNoDevice&&(
          <div style={{maxWidth:"90vw",maxHeight:"90vh",borderRadius:23,overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
            {(art.type==="image"||art.type==="gif") && (
              <img src={art.src} alt={art.name} style={{maxWidth:"90vw",maxHeight:"90vh",objectFit:"contain",display:"block"}}/>
            )}
            {art.type==="video" && (
              <video src={art.src} muted loop playsInline autoPlay style={{maxWidth:"90vw",maxHeight:"90vh",display:"block"}}/>
            )}
          </div>
        )}
        {(art.type==="pdf"||art.type==="figma"||art.type==="website")&&art.src&&(<iframe src={art.src} title={art.name} allowFullScreen onClick={e=>e.stopPropagation()} style={{width:"80vw",height:"85vh",border:"none",display:"block",borderRadius:23}}/>)}
        {!art.src&&(<div style={{width:560,height:340,background:art.thumb||GR[0],display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"rgba(255,255,255,.4)",fontSize:13,fontFamily:FF}}>Seed data placeholder - upload a real file</span></div>)}
      </div>
      <div style={{position:"absolute",bottom:20,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:10}} onClick={e=>e.stopPropagation()}>
        {art.tags&&art.tags.length>0&&(
          <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
            {art.tags.map(t=>(
              <button key={t} onClick={()=>{onTagClick&&onTagClick(t);onClose();}} style={{background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.22)",borderRadius:100,padding:"4px 13px",color:"rgba(255,255,255,.85)",fontSize:12,fontFamily:FF,cursor:"pointer",fontWeight:500}}>#{t}</button>
            ))}
          </div>
        )}
        <span style={{color:"rgba(255,255,255,.45)",fontSize:12,fontFamily:FF}}>{art.name}</span>
      </div>
    </div>
  );
}

function UplProg({files,onDone}){
  const [pct,setPct]=useState(0);
  const [cur,setCur]=useState(0);
  useEffect(()=>{
    let p=0,c=0;
    const iv=setInterval(()=>{
      p+=Math.random()*22+6;
      if(p>=100){p=0;c++;if(c>=files.length){clearInterval(iv);onDone();return;}setCur(c);}
      setPct(Math.min(p,99));
    },60);
    return ()=>clearInterval(iv);
  },[]);
  const f=files[cur];
  if(!f)return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
      <div style={{background:"#FFF",borderRadius:20,width:480,padding:"32px 28px",boxShadow:"0 20px 60px rgba(0,0,0,.18)",textAlign:"center"}}>
        <p style={{margin:"0 0 20px",fontSize:16,fontWeight:600,color:T1,fontFamily:FF}}>Uploading...</p>
        {f._prev
          ? (<img src={f._prev} alt="" style={{width:80,height:80,borderRadius:12,objectFit:"cover",margin:"0 auto 16px",display:"block",border:`1px solid ${BD}`}}/>)
          : (<div style={{width:80,height:80,borderRadius:12,background:"#F0F0F0",margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>{isVid(f)?"&#x1F3AC;":isPdf(f)?"&#x1F4C4;":"&#x1F4CE;"}</div>)
        }
        <p style={{margin:"0 0 4px",fontSize:13,color:T2,fontFamily:FF,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",padding:"0 20px"}}>{f.name}</p>
        <p style={{margin:"0 0 20px",fontSize:12,color:T3,fontFamily:FF}}>Uploading {cur+1} of {files.length}</p>
        <div style={{background:"#F0F0F0",borderRadius:8,height:6,overflow:"hidden",marginBottom:8}}>
          <div style={{height:"100%",background:BK,borderRadius:8,width:Math.round(pct)+"%",transition:"width .08s"}}/>
        </div>
        <p style={{margin:0,fontSize:12,color:T3,fontFamily:FF}}>{Math.round(pct)}%</p>
      </div>
    </div>
  );
}

function CropTool({src,onCrop,onCancel}){
  const [crop,setCrop]=useState({l:0,t:0,r:100,b:100});
  const [dragging,setDragging]=useState(null);
  const imgRef=useRef();
  const containerRef=useRef();
  const dragRef=useRef(null);

  const updateCrop=(clientX,clientY)=>{
    if(!dragRef.current||!containerRef.current) return;
    const rect=containerRef.current.getBoundingClientRect();
    const x=Math.max(0,Math.min(clientX-rect.left,rect.width));
    const y=Math.max(0,Math.min(clientY-rect.top,rect.height));
    const pctX=(x/rect.width)*100;
    const pctY=(y/rect.height)*100;

    setCrop(c=>{
      const minW=10,minH=10;
      switch(dragRef.current){
        case "nw":return {l:Math.min(pctX,c.r-minW),t:Math.min(pctY,c.b-minH),r:c.r,b:c.b};
        case "ne":return {l:c.l,t:Math.min(pctY,c.b-minH),r:Math.max(pctX,c.l+minW),b:c.b};
        case "sw":return {l:Math.min(pctX,c.r-minW),t:c.t,r:c.r,b:Math.max(pctY,c.t+minH)};
        case "se":return {l:c.l,t:c.t,r:Math.max(pctX,c.l+minW),b:Math.max(pctY,c.t+minH)};
        default:return c;
      }
    });
  };

  const handleMouseDown=(handle)=>(e)=>{
    e.preventDefault();
    dragRef.current=handle;
    setDragging(handle);
  };

  const handleTouchStart=(handle)=>(e)=>{
    e.preventDefault();
    dragRef.current=handle;
    setDragging(handle);
  };

  useEffect(()=>{
    const handleMouseMove=(e)=>updateCrop(e.clientX,e.clientY);
    const handleTouchMove=(e)=>{if(e.touches.length>0) updateCrop(e.touches[0].clientX,e.touches[0].clientY);};
    const handleEnd=()=>{dragRef.current=null;setDragging(null);};

    if(dragging){
      window.addEventListener("mousemove",handleMouseMove);
      window.addEventListener("touchmove",handleTouchMove);
      window.addEventListener("mouseup",handleEnd);
      window.addEventListener("touchend",handleEnd);
      return ()=>{
        window.removeEventListener("mousemove",handleMouseMove);
        window.removeEventListener("touchmove",handleTouchMove);
        window.removeEventListener("mouseup",handleEnd);
        window.removeEventListener("touchend",handleEnd);
      };
    }
  },[dragging]);

  const isVideo=src&&(src.includes(".mp4")||src.includes(".mov")||src.includes(".webm")||src.includes(".avi"));
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div ref={containerRef} style={{position:"relative",borderRadius:12,overflow:"hidden",border:`2px solid ${BD}`,background:"#000",maxWidth:"100%",aspectRatio:"16/9"}}>
        {isVideo?(
          <video ref={imgRef} src={src} style={{display:"block",width:"100%",height:"100%",objectFit:"cover"}} muted loop playsInline/>
        ):(
          <img ref={imgRef} src={src} alt="crop" style={{display:"block",width:"100%",height:"100%",objectFit:"cover"}}/>
        )}
        <div style={{position:"absolute",left:crop.l+"%",top:crop.t+"%",right:(100-crop.r)+"%",bottom:(100-crop.b)+"%",border:`2px solid ${BK}`,boxShadow:"inset 0 0 0 4000px rgba(0,0,0,.4)"}}>
          {["nw","ne","sw","se"].map(h=>(
            <div key={h} onMouseDown={handleMouseDown(h)} onTouchStart={handleTouchStart(h)} style={{position:"absolute",...(h.includes("n")?{top:"-8px"}:{bottom:"-8px"}),...(h.includes("w")?{left:"-8px"}:{right:"-8px"}),width:24,height:24,background:"#FFF",border:`2px solid ${BK}`,borderRadius:"50%",cursor:`${h}-resize`,zIndex:10,touchAction:"none"}}/>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <GBtn sm onClick={onCancel}>Cancel</GBtn>
        <BBtn sm onClick={()=>onCrop({l:crop.l,t:crop.t,r:crop.r,b:crop.b})}>Apply Crop</BBtn>
      </div>
    </div>
  );
}

function TagInput({tags,setTags}){
  const [tg,setTg]=useState("");
  const add=()=>{const v=tg.trim().toLowerCase();if(v&&!tags.includes(v)){setTags([...tags,v]);}setTg("");};
  return (
    <div>
      {tags.length>0&&(
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
          {tags.map(t=>(
            <div key={t} style={{display:"flex",alignItems:"center",gap:5,background:"#F0F0F0",border:`1px solid ${BD}`,borderRadius:6,padding:"3px 10px",fontSize:12,color:T1,fontFamily:FF}}>
              #{t}
              <button onClick={()=>setTags(tags.filter(x=>x!==t))} style={{background:"none",border:"none",cursor:"pointer",color:T3,fontSize:13,padding:0,lineHeight:1,marginLeft:2}}>&#x2715;</button>
            </div>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:8}}>
        <input value={tg} onChange={e=>setTg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();add();}}} placeholder="e.g. mobile, checkout, v2" style={{flex:1,background:"#F5F5F5",border:`1px solid ${BD}`,borderRadius:8,padding:"8px 12px",fontSize:13,color:T1,outline:"none",fontFamily:FF,transition:"border .15s"}} onFocus={e=>e.target.style.borderColor=BM} onBlur={e=>e.target.style.borderColor=BD}/>
        <button onClick={add} style={{background:"#F0F0F0",border:`1px solid ${BD}`,borderRadius:100,padding:"8px 14px",color:T1,cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:FF}}>Add</button>
      </div>
    </div>
  );
}

function ProjectPicker({projects,selected,onSelect,onNewProject}){
  const [mode,setMode]=useState("none"); // "none"|"existing"|"new"
  const [newName,setNewName]=useState("");
  return (
    <div>
      {mode==="none"&&(
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setMode("existing")} style={{flex:1,background:"#F5F5F5",border:`1px solid ${BD}`,borderRadius:100,padding:"9px 14px",fontSize:13,color:T1,cursor:"pointer",fontFamily:FF,fontWeight:500,textAlign:"left"}}>Link to existing project</button>
          <button onClick={()=>setMode("new")} style={{flex:1,background:"#F5F5F5",border:`1px solid ${BD}`,borderRadius:100,padding:"9px 14px",fontSize:13,color:T1,cursor:"pointer",fontFamily:FF,fontWeight:500,textAlign:"left"}}>+ Create new project</button>
        </div>
      )}
      {mode==="existing"&&(
        <div style={{border:`1px solid ${BD}`,borderRadius:12,overflow:"hidden"}}>
          {/* Header row */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderBottom:`1px solid ${BD}`,background:"#FAFAFA"}}>
            <span style={{fontSize:12,fontWeight:600,color:T2,fontFamily:FF}}>Select a project</span>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setMode("new")} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:T2,fontFamily:FF,fontWeight:500,padding:"2px 6px"}}>+ Create new</button>
              <button onClick={()=>setMode("none")} style={{background:"none",border:"none",cursor:"pointer",color:T3,fontSize:18,lineHeight:1,padding:"0 2px"}}>&#x2715;</button>
            </div>
          </div>
          {/* Project list */}
          <div style={{maxHeight:160,overflowY:"auto"}}>
            {projects.map(p=>(
              <button key={p.id} onClick={()=>{onSelect(p);setMode("selected");}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",background:selected?.id===p.id?"#F5F5F5":"#FFF",border:"none",borderBottom:`1px solid ${BD}`,padding:"10px 14px",cursor:"pointer",fontFamily:FF,textAlign:"left"}}>
                <div style={{display:"flex",gap:3,flexShrink:0}}>
                  {(p.thumbs||[]).slice(0,2).map((t,i)=>(<div key={i} style={{width:20,height:20,borderRadius:4,background:t}}/>))}
                </div>
                <span style={{fontSize:13,fontWeight:600,color:T1,flex:1}}>{p.name}</span>
                {selected?.id===p.id&&<MI name="check" size={16} style={{color:BK,flexShrink:0}}/>}
              </button>
            ))}
          </div>
        </div>
      )}
      {mode==="new"&&(
        <div style={{display:"flex",gap:8}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newName.trim()){onNewProject(newName.trim());setMode("none");setNewName("");}}} placeholder="New project name..." autoFocus style={{flex:1,background:"#F5F5F5",border:`1px solid ${BM}`,borderRadius:8,padding:"8px 12px",fontSize:13,color:T1,outline:"none",fontFamily:FF}}/>
          <button onClick={()=>{if(newName.trim()){onNewProject(newName.trim());setMode("none");setNewName("");}}} style={{background:BK,border:"none",borderRadius:100,padding:"8px 14px",color:"#FFF",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:FF}}>Create</button>
          <button onClick={()=>{setMode("none");setNewName("");}} style={{background:"#F0F0F0",border:`1px solid ${BD}`,borderRadius:100,padding:"8px 14px",color:T2,cursor:"pointer",fontSize:13,fontFamily:FF}}>Cancel</button>
        </div>
      )}
      {mode==="selected"&&selected&&(
        <div style={{display:"flex",alignItems:"center",gap:10,background:"#F5F5F5",border:`1px solid ${BD}`,borderRadius:12,padding:"10px 14px"}}>
          <span style={{fontSize:13,fontWeight:600,color:T1,flex:1}}>{selected.name}</span>
          <button onClick={()=>{onSelect(null);setMode("existing");}} style={{background:"none",border:"none",cursor:"pointer",color:T3,fontSize:13,fontFamily:FF}}>Change</button>
          <button onClick={()=>{onSelect(null);setMode("none");}} style={{background:"none",border:"none",cursor:"pointer",color:T3,fontSize:16,padding:0}}>&#x2715;</button>
        </div>
      )}
    </div>
  );
}

function NewArtMdl({onClose,onAdd,projects=[],onCreateProject,darkMode,isMobile=false}){
  const [tab,setTab]=useState("file");
  const [drag,setDrag]=useState(false);
  const [q,setQ]=useState([]);
  const [upl,setUpl]=useState(false);
  const [preview,setPreview]=useState(null); // {art, index} for editing metadata
  const [cropMode,setCropMode]=useState(null); // {artIndex} when cropping
  // per-source fields
  const [fu,setFu]=useState(""); const [fn,setFn]=useState("");
  const [su,setSu]=useState(""); const [sn,setSn]=useState("");
  const [vp,setVp]=useState("Desktop (1512x900)");
  // shared fields
  const [desc,setDesc]=useState("");
  const [tags,setTags]=useState([]);
  const [linkedProj,setLinkedProj]=useState(null);
  const ref=useRef();

  const proc=useCallback(async raw=>{
    const list=Array.from(raw);
    for(const f of list){
      if(isImg(f)||isVid(f)||isPdf(f)){
        try{f._prev=await toURL(f);}catch(e){}
        if(isImg(f)&&f._prev){
          await new Promise(res=>{const img=new Image();img.onload=()=>{f._iw=img.naturalWidth;f._ih=img.naturalHeight;res();};img.onerror=res;img.src=f._prev;});
        }
        if(isVid(f)&&f._prev){
          await new Promise(res=>{const v=document.createElement("video");v.onloadedmetadata=()=>{f._iw=v.videoWidth;f._ih=v.videoHeight;res();};v.onerror=res;v.src=f._prev;});
        }
      }
    }
    setQ(list);setUpl(true);
  },[]);

  const submit=useCallback(arts=>{
    onAdd(arts.map(a=>({...a,desc,tags,linkedProjectId:linkedProj?.id||null})));
    onClose();
  },[desc,tags,linkedProj,onAdd,onClose]);

  const done=useCallback(async()=>{
    const arts=[];
    for(const f of q){
      let t="file";
      if(f.type==="image/gif") t="gif";
      else if(isImg(f)) t="image";
      else if(isVid(f)) t="video";
      else if(isPdf(f)) t="pdf";
      const fileIsMobile=f._iw&&f._ih?(f._ih/f._iw>1.3):false;
      arts.push({id:uid(),name:f.name.replace(/\.[^.]+$/,""),type:t,src:f._prev||null,_file:f,thumb:GR[Math.floor(Math.random()*GR.length)],viewport:null,isMobile:fileIsMobile,deviceShell:"auto",crop:null,mobileBg:"#000",align:"center"});
    }
    setUpl(false);
    setPreview(arts);
  },[q]);

  // Render upload progress
  if(upl) return (<UplProg files={q} onDone={done}/>);

  // Render crop tool
  if(preview&&cropMode!==null){
    const art=preview[cropMode.artIndex];
    return (
      <Mdl title="Crop Image" onClose={()=>setCropMode(null)} w={640} isMobile={isMobile}>
        <CropTool src={art.src} onCancel={()=>setCropMode(null)} onCrop={(c)=>{art.crop=c;setCropMode(null);setPreview([...preview]);}}/>
      </Mdl>
    );
  }

  // Render preview/metadata
  if(preview){
    return (
      <Mdl title="Review & Add Metadata" onClose={()=>setPreview(null)} w={560} isMobile={isMobile}>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          {preview.map((art,i)=>(
            <div key={art.id} style={{display:"flex",flexDirection:"column",gap:12,padding:16,background:"#F5F5F5",borderRadius:12}}>
              {art.type==="video"?(
                <div style={{height:200,borderRadius:12,overflow:"hidden",background:"#000",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                  {art.src||art._prev?(
                    <video src={art.src||art._prev} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} muted loop playsInline autoPlay controls={false}/>
                  ):(
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,color:"#666"}}>
                      <span style={{fontSize:32}}>🎬</span>
                      <span style={{fontSize:12}}>Loading video...</span>
                    </div>
                  )}
                </div>
              ):(
                <Thumb art={art} h={200} darkMode={darkMode}/>
              )}
              {(art.type==="image"||art.type==="video"||art.type==="gif")&&(
                <Fld label="Device Shell">
                  <div style={{display:"flex",gap:8}}>
                    {[{v:"auto",l:"Auto Detect"},{v:"mobile",l:"Mobile"},{v:"desktop",l:"Desktop"},{v:"none",l:"No Device"}].map(o=>(
                      <button key={o.v} onClick={()=>{art.deviceShell=o.v;setPreview([...preview]);}} style={{flex:1,background:"#FFF",border:`${art.deviceShell===o.v?2:1}px solid ${art.deviceShell===o.v?BK:BD}`,color:T1,borderRadius:12,padding:"8px 12px",fontSize:12,fontWeight:art.deviceShell===o.v?700:500,cursor:"pointer",fontFamily:FF,transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                        {o.l}{art.deviceShell===o.v&&<MI name="check" size={13} style={{color:BK}}/>}
                      </button>
                    ))}
                  </div>
                </Fld>
              )}
              {(art.deviceShell==="mobile"||art.deviceShell==="auto")&&(art.type==="image"||art.type==="video"||art.type==="gif")&&(
                <Fld label="Mobile Background">
                  <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                    {[{v:"#000",l:"Black"},{v:"#FFF",l:"White"},{v:"#1A1A1A",l:"Dark"},{v:"#E8E8E8",l:"Light"}].map(o=>(
                      <button key={o.v} onClick={()=>{art.mobileBg=o.v;setPreview([...preview]);}} style={{flex:1,minWidth:70,display:"flex",flexDirection:"column",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",fontFamily:FF}}>
                        <div style={{width:"100%",height:50,background:o.v,borderRadius:8,border:`2px solid ${(art.mobileBg||"#000")===o.v?BK:BD}`,boxSizing:"border-box"}}/>
                        <span style={{fontSize:11,fontWeight:500,color:T2}}>{o.l}</span>
                      </button>
                    ))}
                  </div>
                </Fld>
              )}
              {art.deviceShell==="none"&&(art.type==="image"||art.type==="gif"||art.type==="video")&&art.src&&(
                <button onClick={()=>setCropMode({artIndex:i})} style={{background:"#F5F5F5",border:`1px solid ${BD}`,borderRadius:100,padding:"10px 14px",textAlign:"center",color:T2,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:FF,transition:"all .15s"}} onMouseOver={e=>e.target.style.borderColor=BM} onMouseOut={e=>e.target.style.borderColor=BD}>
                  {art.crop?"Adjust Crop":"Add Crop Tool"}
                </button>
              )}
              {!(art.deviceShell==="mobile"||(art.deviceShell==="auto"&&art.isMobile))&&!art.crop&&(art.type==="image"||art.type==="gif"||art.type==="video")&&(
                <Fld label="Alignment">
                  <div style={{display:"flex",gap:8}}>
                    {[{v:"center",l:"Center"},{v:"left",l:"Left"}].map(o=>{
                      const sel=(art.align||"center")===o.v;
                      return (
                        <button key={o.v} onClick={()=>{art.align=o.v;setPreview([...preview]);}} style={{flex:1,background:"#FFF",border:`${sel?2:1}px solid ${sel?BK:BD}`,color:T1,borderRadius:12,padding:"8px 12px",fontSize:12,fontWeight:sel?700:500,cursor:"pointer",fontFamily:FF,transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                          {o.l}{sel&&<MI name="check" size={13} style={{color:BK}}/>}
                        </button>
                      );
                    })}
                  </div>
                </Fld>
              )}
              <Fld label="Name"><TIn value={art.name} set={v=>{art.name=v;setPreview([...preview]);}} ph="Artifact name"/></Fld>
              <Fld label="Description (optional)"><TIn value={art.desc||""} set={v=>{art.desc=v;setPreview([...preview]);}} ph="Add a description..." multi/></Fld>
              <Fld label="Tags (optional)">
                <TagInput tags={art.tags||[]} setTags={v=>{art.tags=v;setPreview([...preview]);}}/>
              </Fld>
            </div>
          ))}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <GBtn sm onClick={()=>setPreview(null)}>Cancel</GBtn>
            <BBtn fw onClick={()=>{submit(preview);setPreview(null);}}>Add {preview.length} Artifact{preview.length!==1?"s":""}</BBtn>
          </div>
        </div>
      </Mdl>
    );
  }

  const tabs=[{id:"file",label:"File"},{id:"figma",label:"Figma"},{id:"website",label:"Website"}];

  const sharedFields=(
    <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:16,paddingTop:16,borderTop:`1px solid ${BD}`}}>
      <Fld label="Description (optional)"><TIn ph="What is this artifact?" val={desc} set={setDesc} multi/></Fld>
      <Fld label="Tags (optional)"><TagInput tags={tags} setTags={setTags}/></Fld>
      {projects.length>0&&(
        <Fld label="Link to Project (optional)">
          <ProjectPicker projects={projects} selected={linkedProj} onSelect={setLinkedProj} onNewProject={nm=>{if(onCreateProject){onCreateProject({name:nm,folder:1,tags:[],desc:"",pages:[{id:"p1",label:"1",name:"Page 1"}],thumbs:[],artifacts:{p1:[]},rows:["R1"]},p=>setLinkedProj(p));}}}/>
        </Fld>
      )}
    </div>
  );

  return (
    <Mdl title="New Artifact" onClose={onClose} w={560} isMobile={isMobile}>
      <div style={{display:"flex",gap:8,marginBottom:24,background:"#F5F5F5",borderRadius:12,padding:4}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:tab===t.id?"#FFF":"transparent",border:tab===t.id?`1px solid ${BD}`:"1px solid transparent",borderRadius:9,padding:"9px 0",cursor:"pointer",color:tab===t.id?T1:T2,fontWeight:600,fontSize:14,fontFamily:FF}}>
            {t.label}
          </button>
        ))}
      </div>

      {tab==="file" && (
        <>
          <div
            onDragOver={e=>{e.preventDefault();setDrag(true);}}
            onDragLeave={()=>setDrag(false)}
            onDrop={e=>{e.preventDefault();setDrag(false);if(e.dataTransfer.files.length)proc(e.dataTransfer.files);}}
            onClick={()=>ref.current.click()}
            style={{border:`1.5px dashed ${drag?BK:BM}`,borderRadius:14,padding:"36px 24px",textAlign:"center",background:drag?"#F5F5F5":"#FAFAFA",cursor:"pointer",transition:"all .15s"}}>
            <input ref={ref} type="file" multiple accept="image/*,video/*,.pdf,.gif" style={{display:"none"}} onChange={e=>{if(e.target.files.length)proc(e.target.files);}}/>
            <div style={{fontSize:28,marginBottom:10,color:T3}}>&#x2191;</div>
            <p style={{color:T1,fontWeight:600,margin:"0 0 4px",fontSize:15}}>{drag?"Drop files here":"Drag and drop files here"}</p>
            <p style={{color:T1,fontSize:14,margin:"0 0 8px",textDecoration:"underline"}}>or browse files</p>
            <p style={{color:T3,fontSize:12,margin:0}}>Images, videos, GIFs, and PDFs supported</p>
          </div>
          {sharedFields}
          <div style={{marginTop:20}}><BBtn fw disabled>Add Artifact</BBtn></div>
        </>
      )}

      {tab==="figma" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Fld label="Figma URL"><TIn ph="https://www.figma.com/design/..." val={fu} set={v=>{setFu(v);if(!fn)setFn(v.split("/").filter(Boolean).pop()||"");}} /></Fld>
          <Fld label="Name"><TIn ph="Frame or file name" val={fn} set={setFn}/></Fld>
          <div style={{background:"#FFFBEB",border:"1px solid #F0D060",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#7A6000",fontFamily:FF,lineHeight:1.5}}>
            The file must be set to "Anyone with the link can view" in Figma share settings.
          </div>
          {sharedFields}
          <BBtn fw disabled={!fu.trim()} onClick={()=>submit([{id:uid(),name:fn||fu,type:"figma",src:figEmbed(fu),thumb:GR[1],viewport:null,deviceShell:"auto",crop:null,mobileBg:"#000"}])}>Add Figma Artifact</BBtn>
        </div>
      )}

      {tab==="website" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Fld label="URL">
            <div style={{position:"relative"}}>
              <TIn ph="https://weedmaps.com" val={su} set={v=>{setSu(v);if(!sn)setSn(v.replace(/https?:\/\//,"").split("/")[0]);}}/>
              <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"#F0F0F0",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:700,color:T2}}>Quick</span>
            </div>
          </Fld>
          <Fld label="Viewport"><TSel val={vp} set={setVp} opts={Object.keys(VPS)}/></Fld>
          <Fld label="Name"><TIn ph="weedmaps.com" val={sn} set={setSn}/></Fld>
          {sharedFields}
          <BBtn fw disabled={!su.trim()} onClick={()=>submit([{id:uid(),name:sn||su,type:"website",src:ensureHttp(su),thumb:GR[3],viewport:vp,isMobile:vp.includes("390")||vp.includes("Mobile"),deviceShell:"auto",crop:null,mobileBg:"#FFF"}])}>Add Website Artifact</BBtn>
        </div>
      )}
    </Mdl>
  );
}

function EditArtMdl({art,onClose,onSave,onDelete,onSaveToProject,projects=[],isMobile=false}){
  const [name,setName]=useState(art.name||"");
  const [desc,setDesc]=useState(art.desc||"");
  const [tags,setTags]=useState(art.tags||[]);
  const [deviceShell,setDeviceShell]=useState(art.deviceShell||"auto");
  const [mobileBg,setMobileBg]=useState(art.mobileBg||"#000");
  const [cropMode,setCropMode]=useState(false);
  const [crop,setCrop]=useState(art.crop||null);
  const [align,setAlign]=useState(art.align||"center");
  const [linkedProj,setLinkedProj]=useState(null);
  const [linkedPage,setLinkedPage]=useState("p1");
  const [saving,setSaving]=useState(false);

  const save=async()=>{
    setSaving(true);
    const updated={...art,name,desc,tags,deviceShell,crop,mobileBg,align};
    console.log("Saving artifact:",{id:updated.id,deviceShell:updated.deviceShell,name:updated.name});
    await onSave(updated);
    if(linkedProj&&onSaveToProject) await onSaveToProject(updated,linkedProj,linkedPage);
    setSaving(false);
    onClose();
  };

  if(cropMode){
    return (
      <Mdl title="Crop Image" onClose={()=>setCropMode(false)} w={640} isMobile={isMobile}>
        <CropTool src={art.src} onCancel={()=>setCropMode(false)} onCrop={(c)=>{setCrop(c);setCropMode(false);}}/>
      </Mdl>
    );
  }

  return (
    <Mdl title="Edit Artifact" onClose={onClose} w={560} isMobile={isMobile}>
      <div style={{display:"flex",flexDirection:"column",gap:16,marginBottom:24}}>
        <Fld label="Name"><TIn val={name} set={setName} ph="Artifact name"/></Fld>
        <Fld label="Description (optional)"><TIn val={desc} set={setDesc} ph="Describe this artifact..." multi/></Fld>
        <Fld label="Tags (optional)"><TagInput tags={tags} setTags={setTags}/></Fld>
        {(art.type==="image"||art.type==="video"||art.type==="gif")&&(
          <Fld label="Device Shell">
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[{v:"auto",l:"Auto Detect"},{v:"mobile",l:"Mobile"},{v:"desktop",l:"Desktop"},{v:"none",l:"No Device"}].map(o=>(
                <button key={o.v} onClick={()=>setDeviceShell(o.v)} style={{flex:1,minWidth:100,background:"#FFF",border:`${deviceShell===o.v?2:1}px solid ${deviceShell===o.v?BK:BD}`,color:T1,borderRadius:12,padding:"8px 12px",fontSize:12,fontWeight:deviceShell===o.v?700:500,cursor:"pointer",fontFamily:FF,transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                  {o.l}{deviceShell===o.v&&<MI name="check" size={13} style={{color:BK}}/>}
                </button>
              ))}
            </div>
          </Fld>
        )}
        {(art.type==="image"||art.type==="video"||art.type==="gif")&&(deviceShell==="mobile"||deviceShell==="auto")&&(
          <Fld label="Mobile Background">
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {[{v:"#000",l:"Black"},{v:"#FFF",l:"White"},{v:"#1A1A1A",l:"Dark"},{v:"#E8E8E8",l:"Light"}].map(o=>(
                <button key={o.v} onClick={()=>setMobileBg(o.v)} style={{flex:1,minWidth:70,display:"flex",flexDirection:"column",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",fontFamily:FF}}>
                  <div style={{width:"100%",height:50,background:o.v,borderRadius:8,border:`2px solid ${mobileBg===o.v?BK:BD}`,boxSizing:"border-box"}}/>
                  <span style={{fontSize:11,fontWeight:500,color:T2}}>{o.l}</span>
                </button>
              ))}
            </div>
          </Fld>
        )}
        {(art.type==="image"||art.type==="gif"||art.type==="video")&&(deviceShell==="none"||deviceShell==="desktop")&&art.src&&(
          <button onClick={()=>setCropMode(true)} style={{background:"#F5F5F5",border:`1px solid ${BD}`,borderRadius:100,padding:"10px 14px",textAlign:"center",color:T2,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:FF,transition:"all .15s"}} onMouseOver={e=>e.target.style.borderColor=BM} onMouseOut={e=>e.target.style.borderColor=BD}>
            {crop?"Adjust Crop":"Add Crop Tool"}
          </button>
        )}
        {!(deviceShell==="mobile"||(deviceShell==="auto"&&art.isMobile))&&!crop&&(art.type==="image"||art.type==="gif"||art.type==="video")&&(
          <Fld label="Alignment">
            <div style={{display:"flex",gap:8}}>
              {[{v:"center",l:"Center"},{v:"left",l:"Left"}].map(o=>{
                const sel=align===o.v;
                return (
                  <button key={o.v} onClick={()=>setAlign(o.v)} style={{flex:1,background:"#FFF",border:`${sel?2:1}px solid ${sel?BK:BD}`,color:T1,borderRadius:12,padding:"8px 12px",fontSize:12,fontWeight:sel?700:500,cursor:"pointer",fontFamily:FF,transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                    {o.l}{sel&&<MI name="check" size={13} style={{color:BK}}/>}
                  </button>
                );
              })}
            </div>
          </Fld>
        )}
        {art.src&&(art.type==="image"||art.type==="gif")&&(
          <div style={{borderRadius:10,overflow:"hidden",border:`1px solid ${BD}`,maxHeight:200}}>
            <img src={art.src} alt={art.name} style={{width:"100%",objectFit:"cover",display:"block",maxHeight:200}}/>
          </div>
        )}
        {art.type==="website"&&art.src&&(
          <div style={{background:"#F5F5F5",border:`1px solid ${BD}`,borderRadius:10,padding:"10px 14px",fontSize:13,color:T2,fontFamily:FF,display:"flex",alignItems:"center",gap:8}}>
            <span style={{color:T3}}>&#x1F517;</span>
            <a href={art.src} target="_blank" rel="noopener noreferrer" style={{color:"#0066CC",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{art.src}</a>
          </div>
        )}
        {art.type==="figma"&&(
          <div style={{background:"#F5F5F5",border:`1px solid ${BD}`,borderRadius:10,padding:"10px 14px",fontSize:13,color:T2,fontFamily:FF}}>
            Figma embed
          </div>
        )}
        {projects.length>0&&(
          <div style={{borderTop:`1px solid ${BD}`,paddingTop:16,display:"flex",flexDirection:"column",gap:12}}>
            <span style={{fontSize:12,fontWeight:700,color:T3,letterSpacing:".04em",textTransform:"uppercase"}}>Save to Project</span>
            <ProjectPicker projects={projects} selected={linkedProj} onSelect={p=>{setLinkedProj(p);if(p)setLinkedPage(p.pages?.[0]?.id||"p1");}}/>
            {linkedProj&&(
              <Fld label="Page">
                <TSel val={linkedPage} set={setLinkedPage} opts={(linkedProj.pages||[]).map(p=>({v:p.id,l:p.name}))}/>
              </Fld>
            )}
          </div>
        )}
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"space-between"}}>
        {onDelete&&(
          <button onClick={()=>{if(confirm("Delete this artifact?")){onDelete(art.id);onClose();}}} style={{background:"#FEF2F2",border:`1px solid #FECACA`,borderRadius:100,padding:"8px 18px",color:"#DC2626",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:FF}}>Delete</button>
        )}
        <div style={{display:"flex",gap:10}}>
          <GBtn sm onClick={onClose}>Cancel</GBtn>
          <BBtn sm disabled={!name.trim()||saving} onClick={save}>{saving?"Saving...":"Save"}</BBtn>
        </div>
      </div>
    </Mdl>
  );
}

function NewProjMdl({onClose,onCreate,isMobile=false}){
  const [nm,setNm]=useState(""); const [ds,setDs]=useState(""); const [fl,setFl]=useState(1); const [tg,setTg]=useState(""); const [tags,setTags]=useState([]);
  const [members,setMembers]=useState([ME]);
  const toggleMember=u=>setMembers(prev=>prev.some(m=>m.id===u.id)?prev.filter(m=>m.id!==u.id):[...prev,u]);
  const addTag=()=>{
    if(tg.trim()&&!tags.includes(tg.trim().toLowerCase())){
      setTags([...tags,tg.trim().toLowerCase()]);
      setTg("");
    }
  };
  return (
    <Mdl title="New Project" onClose={onClose} w={480} isMobile={isMobile}>
      <div style={{display:"flex",flexDirection:"column",gap:16,marginBottom:24}}>
        <Fld label="Project Name"><TIn ph="e.g. Search Redesign" val={nm} set={setNm} af/></Fld>
        <Fld label="Description (optional)"><TIn ph="What is this project about?" val={ds} set={setDs} multi/></Fld>
        <Fld label="Designers">
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {USERS.map(u=>{
              const sel=members.some(m=>m.id===u.id);
              return (
                <button key={u.id} onClick={()=>toggleMember(u)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",border:`${sel?2:1}px solid ${sel?BK:BD}`,borderRadius:12,background:"#FAFAFA",cursor:"pointer",textAlign:"left",transition:"all .15s",fontFamily:FF}}>
                  <Av user={u} size={32} src={u.image}/>
                  <div style={{flex:1}}>
                    <p style={{margin:0,fontSize:13,fontWeight:sel?700:500,color:T1}}>{u.name}</p>
                    <p style={{margin:0,fontSize:11,color:T3}}>{u.title}</p>
                  </div>
                  {sel&&(<MI name="check_circle" size={20} style={{color:BK,flexShrink:0}}/>)}
                </button>
              );
            })}
          </div>
        </Fld>
        <Fld label="Tags (optional)">
          <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
            {tags.map(t=>(
              <div key={t} style={{display:"flex",alignItems:"center",gap:6,background:"#F0F0F0",border:`1px solid ${BD}`,borderRadius:6,padding:"4px 10px",fontSize:12,color:T1,fontFamily:FF}}>
                {t}
                <button onClick={()=>setTags(tags.filter(x=>x!==t))} style={{background:"none",border:"none",cursor:"pointer",color:T3,fontSize:14,padding:0,lineHeight:1}}>&#x2715;</button>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <input value={tg} onChange={e=>setTg(e.target.value)} onKeyPress={e=>{if(e.key==="Enter"){e.preventDefault();addTag();}}} placeholder="Add a tag..." style={{flex:1,background:"#F5F5F5",border:`1px solid ${BD}`,borderRadius:8,padding:"8px 12px",fontSize:13,color:T1,outline:"none",fontFamily:FF}}/>
            <button onClick={addTag} style={{background:BK,border:"none",borderRadius:100,padding:"8px 14px",color:"#FFF",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:FF}}>Add</button>
          </div>
        </Fld>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <GBtn sm onClick={onClose}>Cancel</GBtn>
        <BBtn disabled={!nm.trim()||members.length===0} onClick={()=>{onCreate({name:nm.trim(),desc:ds,folder:fl,tags,members,artifactCount:0,pages:[{id:"p1",label:"1",name:"Page 1"}],thumbs:[],artifacts:{p1:[]},rows:["R1"]});onClose();}}>Create Project</BBtn>
      </div>
    </Mdl>
  );
}

function NewFolderMdl({onClose,projects,isMobile=false}){
  const [nm,setNm]=useState(""); const [ds,setDs]=useState(""); const [srch,setSrch]=useState("");
  const fp=projects.filter(p=>p.name.toLowerCase().includes(srch.toLowerCase()));
  return (
    <Mdl title="New Folder" onClose={onClose} w={600} isMobile={isMobile}>
      <div style={{display:"flex",gap:20,marginBottom:24}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:16}}>
          <Fld label="Folder Name"><TIn ph="e.g. Q3 Initiatives" val={nm} set={setNm}/></Fld>
          <Fld label="Description"><TIn ph="What goes in this folder?" val={ds} set={setDs} multi/></Fld>
        </div>
        <div style={{flex:1}}>
          <label style={{fontSize:13,color:T2,display:"block",marginBottom:8,fontWeight:500}}>Add Projects</label>
          <div style={{border:`1px solid ${BD}`,borderRadius:10,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",padding:"0 12px",borderBottom:`1px solid ${BD}`}}>
              <MI name="search" size={32} style={{color:T3}}/>
              <input placeholder="Search" value={srch} onChange={e=>setSrch(e.target.value)} style={{flex:1,background:"transparent",border:"none",outline:"none",padding:"10px 8px",fontSize:13,color:T1,fontFamily:FF}}/>
            </div>
            <div style={{maxHeight:172,overflowY:"auto"}}>
              {fp.map(p=>(
                <label key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${BD}`}}>
                  <div style={{display:"flex",gap:3,flexShrink:0}}>{p.thumbs.slice(0,2).map((t,i)=>(<div key={i} style={{width:22,height:22,borderRadius:4,background:t}}/>))}</div>
                  <div style={{flex:1}}><p style={{margin:0,fontSize:13,fontWeight:600,color:T1}}>{p.name}</p><p style={{margin:0,fontSize:11,color:T3}}>{p.artifactCount} artifacts</p></div>
                  <input type="radio" name="fp"/>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      <BBtn fw disabled={!nm.trim()} onClick={onClose}>Create Folder</BBtn>
    </Mdl>
  );
}

function PubMdl({art,onClose,isMobile=false}){
  const [nm,setNm]=useState(art?art.name:""); const [ds,setDs]=useState(""); const [done,setDone]=useState(false);
  if(done){
    return (
      <Mdl title="" onClose={onClose} w={400} isMobile={isMobile}>
        <div style={{textAlign:"center",padding:"16px 0 8px"}}>
          <div style={{fontSize:48,marginBottom:16}}>&#x1F389;</div>
          <p style={{color:T1,fontWeight:700,fontSize:18,margin:"0 0 8px",fontFamily:FF}}>Published to Feed</p>
          <p style={{color:T2,fontSize:14,margin:"0 0 24px",fontFamily:FF}}>"{nm}" is now visible to the team.</p>
          <BBtn onClick={onClose}>Done</BBtn>
        </div>
      </Mdl>
    );
  }
  return (
    <Mdl title="Publish to Feed" onClose={onClose} w={480} isMobile={isMobile}>
      {art&&(<div style={{width:72,height:72,borderRadius:12,background:art.thumb||GR[0],margin:"0 auto 20px",border:`1px solid ${BD}`,overflow:"hidden"}}>{art.src&&(art.type==="image"||art.type==="gif")&&(<img src={art.src} style={{width:"100%",height:"100%",objectFit:"cover"}}/>)}</div>)}
      <p style={{color:T2,fontSize:13,textAlign:"center",margin:"-4px 0 22px",fontFamily:FF}}>Publishing will share this artifact to the team feed where other members can see it.</p>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:24}}>
        <Fld label="Name"><TIn val={nm} set={setNm} ph="Artifact name"/></Fld>
        <Fld label="Description (optional)"><TIn val={ds} set={setDs} ph="Add a description..." multi/></Fld>
      </div>
      <BBtn fw disabled={!nm.trim()} onClick={()=>setDone(true)}>Publish to Feed</BBtn>
    </Mdl>
  );
}

function SaveMdl({art,projects,onClose,onSave,isMobile=false}){
  const [pj,setPj]=useState(projects[0]?projects[0].id:1); const [pg,setPg]=useState("p1");
  const proj=projects.find(x=>x.id===pj)||projects[0];
  return (
    <Mdl title="Save to Project" onClose={onClose} w={420} isMobile={isMobile}>
      <div style={{display:"flex",flexDirection:"column",gap:16,marginBottom:24}}>
        <Fld label="Project"><TSel val={pj} set={v=>{setPj(Number(v));setPg("p1");}} opts={projects.map(p=>({v:p.id,l:p.name}))}/></Fld>
        <Fld label="Page"><TSel val={pg} set={setPg} opts={(proj?proj.pages:[]).map(p=>({v:p.id,l:p.name}))}/></Fld>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <GBtn onClick={onClose}>Cancel</GBtn>
        <BBtn onClick={()=>{onSave&&onSave();onClose();}}>Save</BBtn>
      </div>
    </Mdl>
  );
}

function ArtTile({art,onPublish,onSave,onOpen,onDelete,darkMode,canDelete}){
  const [hov,setHov]=useState(false); const [menu,setMenu]=useState(false);
  return (
    <div style={{position:"relative"}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>{setHov(false);setMenu(false);}}>
      <Thumb art={art} onClick={()=>onOpen(art)} darkMode={darkMode}/>
      {hov&&(
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6}}>
          <button onClick={e=>{e.stopPropagation();onSave(art);}} style={{background:"rgba(255,255,255,.94)",border:`1px solid ${BM}`,borderRadius:100,padding:"6px 14px",color:T1,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FF}}>Save</button>
          <button onClick={e=>{e.stopPropagation();setMenu(!menu);}} style={{background:"rgba(255,255,255,.94)",border:`1px solid ${BM}`,borderRadius:8,width:30,height:30,cursor:"pointer",color:T1,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>&#x22EF;</button>
        </div>
      )}
      {menu&&(
        <div style={{position:"absolute",top:46,right:10,zIndex:20,background:"#FFF",border:`1px solid ${BD}`,borderRadius:12,padding:"6px 0",minWidth:170,boxShadow:"0 8px 32px rgba(0,0,0,.10)"}}>
          {["Show Controls","Loop Video","Audio On","Replace Media"].map(it=>(
            <button key={it} onClick={()=>setMenu(false)} onMouseEnter={e=>e.currentTarget.style.background="#F5F5F5"} onMouseLeave={e=>e.currentTarget.style.background="none"} style={{display:"block",width:"100%",background:"none",border:"none",padding:"10px 16px",color:T1,fontSize:14,textAlign:"left",cursor:"pointer",fontFamily:FF}}>{it}</button>
          ))}
          <div style={{height:1,background:BD,margin:"4px 0"}}/>
          <button onClick={()=>{onPublish(art);setMenu(false);}} onMouseEnter={e=>e.currentTarget.style.background="#F5F5F5"} onMouseLeave={e=>e.currentTarget.style.background="none"} style={{display:"block",width:"100%",background:"none",border:"none",padding:"10px 16px",color:T1,fontSize:14,textAlign:"left",cursor:"pointer",fontFamily:FF}}>Publish</button>
          {canDelete&&(
            <button onClick={()=>{onDelete&&onDelete(art.id);setMenu(false);}} onMouseEnter={e=>e.currentTarget.style.background="#FEF2F2"} onMouseLeave={e=>e.currentTarget.style.background="none"} style={{display:"block",width:"100%",background:"none",border:"none",padding:"10px 16px",color:"#DC2626",fontSize:14,textAlign:"left",cursor:"pointer",fontFamily:FF}}>Delete</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Pure SVG device mockups (no foreignObject) ───────────────────────────────
// All rendering is pure SVG primitives. W=280 fixed viewport, scale via SVG viewBox.

function MockSVG({mock}){
  const {device,bg,accent:c,layout}=mock;
  const isLight=bg==="#FFFFFF"||bg==="#F8F8F8"||bg==="#F9FAFB";
  const dim=isLight?"#111111":"#FFFFFF";
  const sub=isLight?"rgba(0,0,0,.35)":"rgba(255,255,255,.4)";
  const card=isLight?"#EEEEEE":"rgba(255,255,255,.09)";
  const card2=isLight?"#E4E4E4":"rgba(255,255,255,.14)";

  // All mockups use a shared 280-wide canvas
  const W=280;

  // ── iPhone frame: 280×606 ──
  if(device==="iphone"){
    const H=606; const R=36; const SW=W-16; const SH=H-16; const SX=8; const SY=8;
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" style={{display:"block"}}>
        <defs>
          <clipPath id="iphClip"><rect x={SX} y={SY} width={SW} height={SH} rx={R-4}/></clipPath>
          <linearGradient id="iphShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF" stopOpacity=".08"/>
            <stop offset="100%" stopColor="#FFF" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Body */}
        <rect x={0} y={0} width={W} height={H} rx={R} fill="#1A1A1A"/>
        <rect x={3} y={3} width={W-6} height={H-6} rx={R-2} fill="#0F0F0F"/>
        {/* Screen area */}
        <rect x={SX} y={SY} width={SW} height={SH} rx={R-4} fill={bg}/>
        {/* Screen UI content clipped */}
        <g clipPath="url(#iphClip)">
          <ScreenUI layout={layout} c={c} bg={bg} dim={dim} sub={sub} card={card} card2={card2} W={SW} H={SH} ox={SX} oy={SY}/>
        </g>
        {/* Dynamic Island */}
        <rect x={W/2-44} y={16} width={88} height={26} rx={13} fill="#0A0A0A"/>
        <circle cx={W/2+22} cy={29} r={7} fill="#141414"/>
        {/* Side buttons left */}
        <rect x={-3} y={130} width={5} height={32} rx={2.5} fill="#2C2C2C"/>
        <rect x={-3} y={174} width={5} height={52} rx={2.5} fill="#2C2C2C"/>
        <rect x={-3} y={238} width={5} height={52} rx={2.5} fill="#2C2C2C"/>
        {/* Power button right */}
        <rect x={W-2} y={170} width={5} height={72} rx={2.5} fill="#2C2C2C"/>
        {/* Shine */}
        <rect x={3} y={3} width={W-6} height={H/2} rx={R-2} fill="url(#iphShine)"/>
      </svg>
    );
  }

  // ── iPad frame: 280×380 ──
  if(device==="ipad"){
    const H=380; const R=20; const SX=14; const SY=14; const SW=W-28; const SH=H-28;
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" style={{display:"block"}}>
        <defs><clipPath id="ipdClip"><rect x={SX} y={SY} width={SW} height={SH} rx={6}/></clipPath></defs>
        <rect x={0} y={0} width={W} height={H} rx={R} fill="#1C1C1E"/>
        <rect x={2} y={2} width={W-4} height={H-4} rx={R-1} fill="#111"/>
        <rect x={SX} y={SY} width={SW} height={SH} rx={6} fill={bg}/>
        <g clipPath="url(#ipdClip)">
          <ScreenUI layout={layout} c={c} bg={bg} dim={dim} sub={sub} card={card} card2={card2} W={SW} H={SH} ox={SX} oy={SY}/>
        </g>
        <circle cx={W/2} cy={H-7} r={5} fill="#2A2A2A"/>
        <rect x={-3} y={H*0.32} width={5} height={H*0.1} rx={2.5} fill="#2C2C2C"/>
      </svg>
    );
  }

  // ── Browser frame: 280×216 ──
  if(device==="browser"){
    const H=216; const BAR=34; const SX=2; const SY=BAR; const SW=W-4; const SH=H-BAR-2;
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" style={{display:"block"}}>
        <defs><clipPath id="brClip"><rect x={SX} y={SY} width={SW} height={SH}/></clipPath></defs>
        {/* Chrome bar */}
        <rect x={0} y={0} width={W} height={H} rx={10} fill="#E2E2E2"/>
        <rect x={1} y={1} width={W-2} height={BAR-1} rx={9} fill="#F0F0F0"/>
        {/* Traffic lights */}
        <circle cx={14} cy={17} r={5.5} fill="#FF5F57"/>
        <circle cx={28} cy={17} r={5.5} fill="#FFBD2E"/>
        <circle cx={42} cy={17} r={5.5} fill="#28C840"/>
        {/* URL bar */}
        <rect x={56} y={9} width={W-74} height={16} rx={8} fill="#E0E0E0"/>
        <rect x={66} y={14} width={70} height={6} rx={3} fill="#C8C8C8"/>
        <circle cx={56+((W-74)/2)+50} cy={17} r={4} fill="#C0C0C0"/>
        {/* Screen */}
        <rect x={SX} y={SY} width={SW} height={SH} fill={bg}/>
        <g clipPath="url(#brClip)">
          <ScreenUI layout={layout} c={c} bg={bg} dim={dim} sub={sub} card={card} card2={card2} W={SW} H={SH} ox={SX} oy={SY}/>
        </g>
        <rect x={1} y={H-2} width={W-2} height={2} rx={1} fill="#D8D8D8"/>
      </svg>
    );
  }

  // ── Desktop/monitor frame: 280×240 ──
  const H=240; const BAR=26; const SX=5; const SY=BAR+2; const SW=W-10; const SH=H-BAR-24;
  const STANDH=22; const BASEH=8;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H+STANDH+BASEH}`} xmlns="http://www.w3.org/2000/svg" style={{display:"block"}}>
      <defs><clipPath id="dtClip"><rect x={SX} y={SY} width={SW} height={SH}/></clipPath></defs>
      {/* Monitor bezel */}
      <rect x={0} y={0} width={W} height={H} rx={8} fill="#2A2A2A"/>
      <rect x={2} y={2} width={W-4} height={H-4} rx={7} fill="#1A1A1A"/>
      {/* Menu bar */}
      <rect x={2} y={2} width={W-4} height={BAR} rx={7} fill="#242424"/>
      <circle cx={14} cy={BAR/2+2} r={4} fill="#FF5F57"/>
      <circle cx={26} cy={BAR/2+2} r={4} fill="#FFBD2E"/>
      <circle cx={38} cy={BAR/2+2} r={4} fill="#28C840"/>
      <rect x={W/2-36} y={BAR/2-4} width={72} height={10} rx={5} fill="#333"/>
      {/* Screen content */}
      <rect x={SX} y={SY} width={SW} height={SH} fill={bg}/>
      <g clipPath="url(#dtClip)">
        <ScreenUI layout={layout} c={c} bg={bg} dim={dim} sub={sub} card={card} card2={card2} W={SW} H={SH} ox={SX} oy={SY}/>
      </g>
      {/* Stand */}
      <rect x={W/2-16} y={H} width={32} height={STANDH} rx={2} fill="#2A2A2A"/>
      <rect x={W/2-52} y={H+STANDH} width={104} height={BASEH} rx={4} fill="#2A2A2A"/>
    </svg>
  );
}

// ── Screen UI drawn purely in SVG, offset to match device screen position ────
function ScreenUI({layout,c,bg,dim,sub,card,card2,W,H,ox,oy}){
  // Translate so all drawing is relative to screen origin
  return (
    <g transform={`translate(${ox},${oy})`}>
      <ScreenDraw layout={layout} c={c} dim={dim} sub={sub} card={card} card2={card2} W={W} H={H}/>
    </g>
  );
}

function mkRows(n,rowH,gap,startY,render){
  return Array.from({length:n},(_,i)=>(
    <g key={i} transform={"translate(0,"+(startY+i*(rowH+gap))+")"}>{render(i,rowH)}</g>
  ));
}

function ScreenDraw({layout,c,dim,sub,card,card2,W,H}){
  const isApp = layout==="app"||layout==="onboard";
  const isFeed = layout==="feed"||layout==="profile";
  const isMap = layout==="map";
  const isPlayer = layout==="player"||layout==="video"||layout==="camera";
  const isDash = layout==="dashboard"||layout==="analytics"||layout==="table";
  const isEcomm = layout==="ecomm"||layout==="checkout";
  const isMsg = layout==="messages";
  const isKanban = layout==="kanban"||layout==="grid"||layout==="reader"||layout==="docs";
  const isLanding = layout==="landing";

  return (
    <g>
      {isApp && (
        <g>
          <rect x={0} y={0} width={W} height={44} fill={card}/>
          <rect x={12} y={15} width={W*0.35} height={9} rx={4.5} fill={c} opacity=".85"/>
          <rect x={W-44} y={12} width={32} height={18} rx={9} fill={c} opacity=".2"/>
          {mkRows(4,68,8,52,(i)=>(
            <g>
              <rect x={0} y={0} width={W} height={68} fill={i%2===0?card:card2}/>
              <rect x={12} y={12} width={40} height={40} rx={10} fill={c} opacity={0.7-i*0.08}/>
              <rect x={62} y={14} width={W*0.5} height={9} rx={4.5} fill={dim} opacity=".65"/>
              <rect x={62} y={28} width={W*0.38} height={7} rx={3.5} fill={sub} opacity=".45"/>
              <rect x={62} y={42} width={W*0.22} height={7} rx={3.5} fill={c} opacity=".5"/>
              <rect x={W-32} y={24} width={20} height={20} rx={10} fill={c} opacity=".15"/>
            </g>
          ))}
          <rect x={0} y={H-48} width={W} height={48} fill={card}/>
          {[0,1,2,3].map(i=>(
            <g key={i} transform={"translate("+(W/4*i+W/8-10)+","+(H-36)+")"}>
              <rect x={0} y={0} width={20} height={20} rx={i===0?6:4} fill={i===0?c:sub} opacity={i===0?0.9:0.3}/>
            </g>
          ))}
        </g>
      )}
      {isFeed && (
        <g>
          <rect x={0} y={0} width={W} height={50} fill={card}/>
          <circle cx={22} cy={25} r={14} fill={c} opacity=".5"/>
          <rect x={44} y={18} width={W*0.4} height={9} rx={4.5} fill={dim} opacity=".7"/>
          <rect x={W-36} y={15} width={24} height={24} rx={12} fill={c} opacity=".2"/>
          <rect x={0} y={50} width={W} height={72} fill={card2}/>
          {[0,1,2,3,4].map(i=>(
            <g key={i} transform={"translate("+(8+i*52)+",58)"}>
              <circle cx={22} cy={20} r={22} fill="none" stroke={c} strokeWidth={2.5} opacity=".6"/>
              <circle cx={22} cy={20} r={17} fill={c} opacity={0.18+i*0.04}/>
            </g>
          ))}
          {[0,1].map(i=>(
            <g key={i} transform={"translate(0,"+(130+i*160)+")"}>
              <circle cx={20} cy={4} r={12} fill={c} opacity={0.4+i*0.1}/>
              <rect x={36} y={-2} width={W*0.42} height={8} rx={4} fill={dim} opacity=".55"/>
              <rect x={0} y={16} width={W} height={100} fill={c} opacity={0.12+i*0.04}/>
              <rect x={10} y={125} width={28} height={22} rx={11} fill={c} opacity=".3"/>
              <rect x={46} y={125} width={28} height={22} rx={11} fill={sub} opacity=".25"/>
              <rect x={W-50} y={125} width={28} height={22} rx={11} fill={sub} opacity=".25"/>
            </g>
          ))}
        </g>
      )}
      {isMap && (
        <g>
          <rect x={0} y={0} width={W} height={H*0.55} fill="#0D2137"/>
          {Array.from({length:5},(_,i)=>Array.from({length:4},(_,j)=>(
            <rect key={i*4+j} x={j*(W/4)} y={i*36} width={W/4-1} height={35} fill={"rgba(255,255,255,"+(0.015+((i+j)%3)*0.01)+")"}/>
          )))}
          <line x1={0} y1={H*0.28} x2={W} y2={H*0.28} stroke="rgba(255,255,255,.08)" strokeWidth={6}/>
          <line x1={W*0.6} y1={0} x2={W*0.6} y2={H*0.55} stroke="rgba(255,255,255,.06)" strokeWidth={4}/>
          <circle cx={W/2} cy={H*0.3} r={14} fill={c}/>
          <circle cx={W/2} cy={H*0.3} r={22} fill={c} opacity=".18"/>
          <circle cx={W/2} cy={H*0.3} r={4} fill="white" opacity=".9"/>
          <circle cx={W*0.28} cy={H*0.18} r={9} fill="rgba(255,255,255,.35)"/>
          <circle cx={W*0.75} cy={H*0.42} r={9} fill="rgba(255,255,255,.35)"/>
          <rect x={10} y={10} width={W-20} height={32} rx={16} fill="rgba(255,255,255,.92)"/>
          <rect x={24} y={21} width={W*0.55} height={10} rx={5} fill="#D0D0D0"/>
          <circle cx={W-22} cy={26} r={8} fill={c} opacity=".5"/>
          <rect x={0} y={H*0.55} width={W} height={H*0.45} fill={card}/>
          <rect x={W/2-24} y={H*0.55+8} width={48} height={5} rx={2.5} fill={sub} opacity=".35"/>
          {mkRows(2,56,8,H*0.55+22,(i)=>(
            <g>
              <rect x={10} y={0} width={W-20} height={56} rx={10} fill={card2}/>
              <rect x={20} y={10} width={36} height={36} rx={8} fill={c} opacity={0.28+i*0.08}/>
              <rect x={64} y={12} width={W*0.45} height={8} rx={4} fill={dim} opacity=".6"/>
              <rect x={64} y={26} width={W*0.35} height={7} rx={3.5} fill={sub} opacity=".4"/>
              <rect x={64} y={40} width={W*0.2} height={7} rx={3.5} fill={c} opacity=".55"/>
            </g>
          ))}
        </g>
      )}
      {isPlayer && (
        <g>
          <rect x={0} y={0} width={W} height={H*0.48} fill={c} opacity=".18"/>
          <rect x={0} y={0} width={W} height={H*0.48} fill="rgba(0,0,0,.3)"/>
          <circle cx={W/2} cy={H*0.24} r={28} fill="rgba(255,255,255,.12)"/>
          <polygon points={(W/2-10)+","+(H*0.24-14)+" "+(W/2-10)+","+(H*0.24+14)+" "+(W/2+16)+","+H*0.24} fill="rgba(255,255,255,.88)"/>
          <rect x={14} y={H*0.44} width={W-28} height={4} rx={2} fill="rgba(255,255,255,.15)"/>
          <rect x={14} y={H*0.44} width={(W-28)*0.38} height={4} rx={2} fill={c}/>
          <circle cx={14+(W-28)*0.38} cy={H*0.44+2} r={7} fill={c}/>
          <rect x={14} y={H*0.5+8} width={W*0.55} height={10} rx={5} fill={dim} opacity=".7"/>
          <rect x={14} y={H*0.5+24} width={W*0.4} height={8} rx={4} fill={sub} opacity=".45"/>
          {mkRows(3,62,6,H*0.6,(i)=>(
            <g>
              <rect x={8} y={0} width={W-16} height={62} rx={10} fill={card}/>
              <rect x={18} y={10} width={72} height={42} rx={8} fill={c} opacity={0.22+i*0.06}/>
              <rect x={98} y={12} width={W-118} height={8} rx={4} fill={dim} opacity=".6"/>
              <rect x={98} y={26} width={W-138} height={7} rx={3.5} fill={sub} opacity=".4"/>
              <rect x={98} y={40} width={W*0.22} height={8} rx={4} fill={c} opacity=".5"/>
            </g>
          ))}
        </g>
      )}
      {isDash && (
        <g>
          <rect x={0} y={0} width={W} height={40} fill={card}/>
          <rect x={10} y={13} width={W*0.28} height={10} rx={5} fill={c}/>
          <rect x={W-80} y={11} width={70} height={18} rx={9} fill={c} opacity=".2"/>
          {[0,1,2].map(i=>(
            <g key={i} transform={"translate("+(8+i*((W-24)/3+4))+",48)"}>
              <rect x={0} y={0} width={(W-24)/3} height={48} rx={8} fill={card2}/>
              <rect x={8} y={8} width={(W-24)/3-16} height={8} rx={4} fill={sub} opacity=".5"/>
              <rect x={8} y={22} width={(W-24)/3-24} height={14} rx={7} fill={c} opacity={0.65+i*0.1}/>
            </g>
          ))}
          <rect x={8} y={106} width={W-16} height={100} rx={10} fill={card}/>
          <polyline
            points={"14,"+(106+85)+" "+(W*0.2)+","+(106+55)+" "+(W*0.4)+","+(106+70)+" "+(W*0.6)+","+(106+28)+" "+(W*0.8)+","+(106+45)+" "+(W-14)+","+(106+35)}
            fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          />
          <rect x={8} y={214} width={W-16} height={H-222} rx={10} fill={card}/>
          {[0,1,2,3,4].map(i=>{
            const bh=[55,35,70,48,30][i];
            const x=18+i*((W-36)/5);
            return <rect key={i} x={x} y={214+H-222-12-bh} width={(W-36)/5-8} height={bh} rx={4} fill={c} opacity={0.45+i*0.08}/>;
          })}
        </g>
      )}
      {isEcomm && (
        <g>
          <rect x={0} y={0} width={W} height={42} fill={card}/>
          <rect x={12} y={14} width={W*0.3} height={9} rx={4.5} fill={c}/>
          <rect x={W-40} y={11} width={28} height={20} rx={4} fill="none" stroke={c} strokeWidth={1.5} opacity=".6"/>
          <rect x={10} y={50} width={W-20} height={130} rx={12} fill={card2}/>
          <rect x={20} y={60} width={W-40} height={80} rx={8} fill={c} opacity=".18"/>
          <rect x={20} y={150} width={W*0.45} height={9} rx={4.5} fill={dim} opacity=".7"/>
          <rect x={20} y={164} width={W*0.25} height={8} rx={4} fill={c} opacity=".7"/>
          {mkRows(3,58,8,192,(i)=>(
            <g>
              <rect x={10} y={0} width={W-20} height={58} rx={10} fill={card}/>
              <rect x={20} y={9} width={40} height={40} rx={8} fill={c} opacity={0.22+i*0.06}/>
              <rect x={68} y={11} width={W*0.42} height={8} rx={4} fill={dim} opacity=".6"/>
              <rect x={68} y={24} width={W*0.32} height={7} rx={3.5} fill={sub} opacity=".4"/>
              <rect x={68} y={38} width={W*0.18} height={8} rx={4} fill={c} opacity=".6"/>
            </g>
          ))}
          <rect x={12} y={H-44} width={W-24} height={36} rx={18} fill={c} opacity=".85"/>
          <rect x={W/2-30} y={H-31} width={60} height={9} rx={4.5} fill="white" opacity=".88"/>
        </g>
      )}
      {isMsg && (
        <g>
          <rect x={0} y={0} width={W} height={42} fill={card}/>
          <rect x={W/2-38} y={14} width={76} height={14} rx={7} fill={dim} opacity=".55"/>
          {[
            {left:true, y:50,  w:W*0.62, lines:2},
            {left:false,y:118, w:W*0.5,  lines:1},
            {left:true, y:172, w:W*0.7,  lines:2},
            {left:false,y:244, w:W*0.45, lines:1},
            {left:true, y:296, w:W*0.55, lines:2},
            {left:false,y:368, w:W*0.6,  lines:1},
          ].map((m,i)=>{
            const bx=m.left?44:W-m.w-8;
            const bh=m.lines===2?52:36;
            return (
              <g key={i}>
                {m.left&&<circle cx={22} cy={m.y+bh/2} r={14} fill={c} opacity=".4"/>}
                <rect x={bx} y={m.y} width={m.w} height={bh} rx={14} fill={m.left?card:c} opacity={m.left?1:0.35}/>
                <rect x={bx+14} y={m.y+10} width={m.w*0.72} height={8} rx={4} fill={dim} opacity=".5"/>
                {m.lines===2&&<rect x={bx+14} y={m.y+24} width={m.w*0.5} height={7} rx={3.5} fill={sub} opacity=".35"/>}
              </g>
            );
          })}
          <rect x={10} y={H-46} width={W-20} height={36} rx={18} fill={card2}/>
          <rect x={24} y={H-33} width={W*0.45} height={9} rx={4.5} fill={sub} opacity=".35"/>
          <circle cx={W-22} cy={H-28} r={13} fill={c} opacity=".75"/>
        </g>
      )}
      {isKanban && (
        <g>
          <rect x={0} y={0} width={W} height={42} fill={card}/>
          <rect x={10} y={13} width={W*0.3} height={10} rx={5} fill={c}/>
          <rect x={W-76} y={12} width={66} height={18} rx={9} fill={c} opacity=".2"/>
          {layout==="kanban" ? [0,1,2].map(i=>(
            <g key={i} transform={"translate("+(8+i*((W-24)/3+4))+",50)"}>
              <rect x={0} y={0} width={(W-24)/3} height={12} rx={6} fill={c} opacity=".2"/>
              {[0,1,2].map(j=>(
                <rect key={j} x={0} y={18+j*52} width={(W-24)/3} height={46} rx={8} fill={card2}/>
              ))}
            </g>
          )) : [0,1,2,3].map(i=>(
            <g key={i} transform={"translate(0,"+(50+i*72)+")"}>
              <rect x={8} y={0} width={W-16} height={64} rx={10} fill={card}/>
              <rect x={18} y={10} width={44} height={44} rx={10} fill={c} opacity={0.22+i*0.06}/>
              <rect x={70} y={12} width={W*0.48} height={9} rx={4.5} fill={dim} opacity=".62"/>
              <rect x={70} y={26} width={W*0.36} height={7} rx={3.5} fill={sub} opacity=".4"/>
              <rect x={70} y={40} width={W*0.22} height={8} rx={4} fill={c} opacity=".5"/>
            </g>
          ))}
        </g>
      )}
      {isLanding && (
        <g>
          <rect x={0} y={0} width={W} height={42} fill={card}/>
          <rect x={14} y={13} width={W*0.22} height={10} rx={5} fill={c}/>
          {[W*0.35,W*0.5,W*0.65].map((x,i)=>(
            <rect key={i} x={x} y={15} width={W*0.1} height={7} rx={3.5} fill={sub} opacity=".5"/>
          ))}
          <rect x={W-80} y={11} width={68} height={20} rx={10} fill={c} opacity=".85"/>
          <rect x={0} y={42} width={W} height={H*0.38} fill={c} opacity=".14"/>
          <rect x={W/2-60} y={60} width={120} height={14} rx={7} fill={dim} opacity=".75"/>
          <rect x={W/2-44} y={80} width={88} height={10} rx={5} fill={sub} opacity=".5"/>
          <rect x={W/2-44} y={100} width={88} height={28} rx={14} fill={c} opacity=".85"/>
          {[0,1,2].map(i=>(
            <g key={i} transform={"translate("+(8+i*((W-24)/3+4))+","+(H*0.38+52)+")"}>
              <rect x={0} y={0} width={(W-24)/3} height={80} rx={10} fill={card2}/>
              <rect x={8} y={10} width={(W-24)/3-16} height={24} rx={8} fill={c} opacity={0.22+i*0.06}/>
              <rect x={8} y={42} width={(W-24)/3-16} height={8} rx={4} fill={dim} opacity=".55"/>
              <rect x={8} y={56} width={(W-24)/3-24} height={7} rx={3.5} fill={sub} opacity=".4"/>
            </g>
          ))}
        </g>
      )}
      {(!isApp&&!isFeed&&!isMap&&!isPlayer&&!isDash&&!isEcomm&&!isMsg&&!isKanban&&!isLanding) && (
        <g>
          <rect x={0} y={0} width={W} height={42} fill={card}/>
          <rect x={12} y={14} width={W*0.32} height={10} rx={5} fill={c}/>
          <rect x={W-72} y={12} width={60} height={18} rx={9} fill={c} opacity=".2"/>
          {Array.from({length:5},(_,i)=>(
            <g key={i} transform={"translate(0,"+(50+i*72)+")"}>
              <rect x={8} y={0} width={W-16} height={64} rx={10} fill={i%2===0?card:card2}/>
              <rect x={18} y={10} width={44} height={44} rx={10} fill={c} opacity={0.55-i*0.06}/>
              <rect x={70} y={12} width={W*0.48} height={9} rx={4.5} fill={dim} opacity=".62"/>
              <rect x={70} y={26} width={W*0.36} height={7} rx={3.5} fill={sub} opacity=".4"/>
              <rect x={70} y={40} width={W*0.2} height={8} rx={4} fill={c} opacity=".5"/>
            </g>
          ))}
        </g>
      )}
    </g>
  );
}


// ── ExploreCard ───────────────────────────────────────────────────────────────
// iPhone shell wrapper for real uploaded mobile content
function PhoneShell({children,bg="#000",darkMode,noBackground=false}){
  // iPhone Air: ultra-thin uniform aluminum frame, no Dynamic Island overlay (it's in the video)
  const frameGrad="linear-gradient(175deg,#F0F0F2 0%,#D8D8DA 15%,#B8B8BC 35%,#C8C8CC 55%,#D4D4D8 75%,#E8E8EA 100%)";
  const edgeGrad="linear-gradient(175deg,#E0E0E2 0%,#C0C0C4 40%,#D0D0D4 100%)";
  return (
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",
                 background:noBackground?"transparent":darkMode?"#1A1A1A":"#BFC9D4",padding:noBackground?"0":"24px 18px 28px",transition:"background 0.3s"}}>
      <div style={{position:"relative",width:307}}>
        {/* Aluminum frame — single band, uniform 3px all around */}
        <div style={{
          background:frameGrad,
          borderRadius:50,
          padding:"3px",
          position:"relative",
          boxShadow:"0 0 0 0.5px rgba(0,0,0,0.18), 0 24px 64px rgba(0,0,0,0.38), 0 6px 16px rgba(0,0,0,0.18), inset 0 1.5px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(0,0,0,0.12)",
        }}>
          {/* Thin black inner ring — even 4px all sides */}
          <div style={{
            background:"#080808",
            borderRadius:48,
            padding:"4px",
            position:"relative",
          }}>
            {/* Screen */}
            <div style={{
              borderRadius:45,
              overflow:"hidden",
              background:bg,
              position:"relative",
              aspectRatio:"393/852",
            }}>
              <div style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
                {children}
              </div>
            </div>
          </div>
          {/* Power button - right */}
          <div style={{position:"absolute",right:-3,top:"30%",width:3,height:64,background:edgeGrad,borderRadius:"0 2.5px 2.5px 0",boxShadow:"1px 0 3px rgba(0,0,0,0.25)"}}/>
          {/* Action button - left */}
          <div style={{position:"absolute",left:-3,top:"20%",width:3,height:28,background:edgeGrad,borderRadius:"2.5px 0 0 2.5px",boxShadow:"-1px 0 3px rgba(0,0,0,0.25)"}}/>
          {/* Volume up - left */}
          <div style={{position:"absolute",left:-3,top:"29%",width:3,height:42,background:edgeGrad,borderRadius:"2.5px 0 0 2.5px",boxShadow:"-1px 0 3px rgba(0,0,0,0.25)"}}/>
          {/* Volume down - left */}
          <div style={{position:"absolute",left:-3,top:"39%",width:3,height:42,background:edgeGrad,borderRadius:"2.5px 0 0 2.5px",boxShadow:"-1px 0 3px rgba(0,0,0,0.25)"}}/>
        </div>
        {/* Subtle glass reflection over screen */}
        <div style={{
          position:"absolute",top:10,left:8,right:8,height:"28%",
          background:"linear-gradient(180deg,rgba(255,255,255,0.08) 0%,transparent 100%)",
          borderRadius:"46px 46px 0 0",pointerEvents:"none",zIndex:6,
        }}/>
      </div>
    </div>
  );
}

function ExploreCard({item,onSave,onOpen,onEdit,onDelete,darkMode}){
  const [hov,setHov]=useState(false);
  const [ifErr,setIfErr]=useState(false);
  const isMock=item.type==="mockup"&&item.mock;
  const ds=item.deviceShell||"auto";
  const showMobile=(ds==="mobile")||(ds==="auto"&&item.isMobile===true);
  const showNoDevice=ds==="none";
  const isMobileWebsite=item.type==="website"&&item.src&&showMobile;
  const hasCrop=item.type==="video"&&!!item.crop;
  const isMobileMedia=(item.type==="image"||item.type==="gif"||(item.type==="video"&&!hasCrop))&&item.src&&showMobile&&!showNoDevice;
  const showCroppedVideo=hasCrop&&item.src;
  const vidCropW=item.crop?item.crop.r-item.crop.l:null;
  const vidCropH=item.crop?item.crop.b-item.crop.t:null;

  // Timeout to detect iframe load failure (X-Frame-Options blocking)
  const ifRef=useRef();
  useEffect(()=>{
    if(isMobileWebsite&&ifRef.current&&!ifErr){
      const t=setTimeout(()=>setIfErr(true),3000);
      return ()=>clearTimeout(t);
    }
  },[isMobileWebsite,ifErr]);

  return (
    <div
      style={{breakInside:"avoid",marginBottom:16,borderRadius:24,overflow:"hidden",
              position:"relative",cursor:"pointer",background:"#EBEBEB",transform:"translateZ(0)"}}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      onClick={()=>onOpen(item)}
    >
      {isMock && (
        <div style={{padding:item.mock.device==="iphone"?"20px 28px 20px":item.mock.device==="ipad"?"14px 12px":"10px 8px",background:item.mock.device==="iphone"?"#F0F0F0":item.mock.device==="ipad"?"#EAEAEA":"#E6E6E6"}}>
          <MockSVG mock={item.mock}/>
        </div>
      )}
      {isMobileMedia && (
        <PhoneShell bg={item.mobileBg||"#000"} darkMode={darkMode}>
          {(item.type==="image"||item.type==="gif") && (
            <img src={item.src} alt={item.name}
              style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
          )}
          {item.type==="video" && (
            <video src={item.src} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}}
              muted loop playsInline autoPlay/>
          )}
        </PhoneShell>
      )}
      {isMobileWebsite && (
        <PhoneShell bg={item.mobileBg||"#FFF"} darkMode={darkMode}>
          {ifErr ? (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:445,padding:20,textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:12,color:T3}}>&#x26A0;</div>
              <p style={{margin:"0 0 8px",fontSize:13,fontWeight:600,color:T1}}>Cannot embed this site</p>
              <p style={{margin:"0 0 14px",fontSize:12,color:T2}}>This website blocks iframe embedding</p>
              <a href={item.src} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:"#0066CC",textDecoration:"none",fontWeight:500,cursor:"pointer"}} onClick={e=>e.stopPropagation()}>Open in new tab &#x2192;</a>
            </div>
          ) : (
            <div style={{position:"relative",height:445,overflow:"hidden"}}>
              <div style={{
                position:"absolute",top:0,left:0,
                width:390,height:844,
                transform:"scale("+220/390+")",
                transformOrigin:"top left",
                pointerEvents:"none",
              }}>
                <iframe ref={ifRef} src={item.src} title={item.name}
                  style={{width:390,height:844,border:"none",display:"block"}}
                  sandbox="allow-scripts allow-same-origin"
                  onError={()=>setIfErr(true)}
                  onLoad={()=>setIfErr(false)}/>
              </div>
            </div>
          )}
        </PhoneShell>
      )}
      {showNoDevice && (item.type==="image"||item.type==="gif"||item.type==="video")&&item.src && (
        <>
          {(item.type==="image"||item.type==="gif") && (
            <div style={{width:"100%",aspectRatio:item.crop?`${(item.crop.r-item.crop.l)/(item.crop.b-item.crop.t)}`:"auto",overflow:"hidden",background:"#F0F0F0",...(item.crop?{clipPath:`polygon(${item.crop.l}% ${item.crop.t}%,${item.crop.r}% ${item.crop.t}%,${item.crop.r}% ${item.crop.b}%,${item.crop.l}% ${item.crop.b}%)`}:{})}}>
              <img src={item.src} alt={item.name} style={{width:"100%",height:"100%",objectFit:item.crop?"fill":"cover",objectPosition:!item.crop&&item.align==="left"?"left center":"center",display:"block"}}/>
            </div>
          )}
          {item.type==="video" && !hasCrop && (
            <div style={{width:"100%",overflow:"hidden",background:"#000"}}>
              <video src={item.src} style={{width:"100%",display:"block"}} muted loop playsInline autoPlay/>
            </div>
          )}
        </>
      )}
      {showCroppedVideo && (
        <CroppedVideo src={item.src} crop={item.crop}/>
      )}
      {!isMock&&!isMobileMedia&&!isMobileWebsite&&!showNoDevice&&!showCroppedVideo && (
        <Thumb art={item} h={320} darkMode={darkMode} bare/>
      )}
      {hov&&(
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.1)",
                     display:"flex",alignItems:"flex-start",justifyContent:"flex-end",padding:10,gap:6}}>
          {onEdit&&item.type!=="mockup"&&(
            <button
              onClick={e=>{e.stopPropagation();onEdit(item);}}
              style={{background:"rgba(255,255,255,.96)",border:"none",borderRadius:100,
                      padding:"6px 14px",color:T1,fontSize:12,fontWeight:600,
                      cursor:"pointer",fontFamily:FF}}
            >Edit</button>
          )}
          <button
            onClick={e=>{e.stopPropagation();onSave(item);}}
            style={{background:"rgba(255,255,255,.96)",border:"none",borderRadius:100,
                    padding:"6px 14px",color:T1,fontSize:12,fontWeight:600,
                    cursor:"pointer",fontFamily:FF}}
          >Save</button>
        </div>
      )}
    </div>
  );
}

function Explore({feed,projects,onSave,onEdit,onDelete,onSearch,darkMode,cols=3}){
  const [lb,setLb]=useState(null);
  const realItems=feed.filter(item=>item.type!=="mockup");
  return (
    <div style={{padding:"16px 0"}}>
      <div style={{columns:cols,gap:16}}>
        {realItems.map(item=>(
          <ExploreCard key={item.id} item={item} onSave={onSave} onOpen={setLb} onEdit={onEdit} onDelete={onDelete} darkMode={darkMode}/>
        ))}
      </div>
      {lb&&(<LBox art={lb} onClose={()=>setLb(null)} onTagClick={t=>{onSearch&&onSearch(t);}}/>)}
    </div>
  );
}

function ProjCard({project,onOpen,onDelete}){
  const [hov,setHov]=useState(false);
  const thumbs=project.thumbs||[];
  const members=project.members||[];
  // Build stacked card positions: up to 3 cards, back-most first
  const stackCount=Math.min(thumbs.length,3);
  const stackCards=thumbs.slice(0,stackCount);
  return (
    <div style={{borderRadius:20,overflow:"visible",background:BG,border:`1px solid ${BD}`,cursor:"pointer",transition:"box-shadow .2s, transform .2s",boxShadow:hov?"0 12px 40px rgba(0,0,0,.13)":"0 2px 8px rgba(0,0,0,.06)",transform:hov?"translateY(-2px)":"none",display:"flex",flexDirection:"column"}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={()=>onOpen(project)}>
      {/* Preview area */}
      <div style={{height:220,background:"#F2F2F2",borderRadius:"20px 20px 0 0",position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
        {stackCount===0&&(
          <div style={{width:"72%",height:160,borderRadius:14,background:"linear-gradient(135deg,#E8E8E8,#D0D0D0)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:32,opacity:.3}}>&#x1F4C2;</span>
          </div>
        )}
        {stackCount>0&&stackCards.map((t,idx)=>{
          const isBack=idx<stackCount-1;
          const isFront=idx===stackCount-1;
          // Back cards peek out rotated behind front card
          const rotations=stackCount===3?[-5,4,0]:stackCount===2?[-4,0]:([0]);
          const yOffsets=stackCount===3?[10,6,0]:stackCount===2?[8,0]:([0]);
          const rot=rotations[idx]||0;
          const yOff=yOffsets[idx]||0;
          return (
            <div key={idx} style={{
              position:"absolute",
              width:"68%",height:152,
              borderRadius:14,
              background:t,
              transform:`rotate(${rot}deg) translateY(${yOff}px)`,
              transformOrigin:"center center",
              boxShadow:isFront?"0 6px 20px rgba(0,0,0,.18)":"0 3px 10px rgba(0,0,0,.12)",
              zIndex:idx,
            }}/>
          );
        })}
        {/* Artifact count badge */}
        <div style={{position:"absolute",bottom:12,right:14,background:"rgba(0,0,0,.45)",borderRadius:20,padding:"3px 10px",display:"flex",alignItems:"center",gap:5,backdropFilter:"blur(6px)"}}>
          <span style={{fontSize:11,color:"rgba(255,255,255,.9)",fontFamily:FF,fontWeight:600}}>{project.artifactCount} artifact{project.artifactCount!==1?"s":""}</span>
        </div>
      </div>
      {/* Info section */}
      <div style={{padding:"16px 18px 18px",flex:1,display:"flex",flexDirection:"column",gap:6}}>
        <p style={{margin:0,fontSize:15,fontWeight:700,color:T1,fontFamily:FF,lineHeight:1.2}}>{project.name}</p>
        {project.desc&&(<p style={{margin:0,fontSize:13,color:T2,fontFamily:FF,lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{project.desc}</p>)}
        {members.length>0&&(
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
            <div style={{display:"flex",alignItems:"center"}}>
              {members.slice(0,4).map((m,i)=>(
                <div key={m.id} style={{marginLeft:i>0?-7:0,border:"2px solid #FFF",borderRadius:"50%",zIndex:members.length-i,position:"relative",flexShrink:0}}>
                  <Av user={m} size={24} src={m.image}/>
                </div>
              ))}
            </div>
            <span style={{fontSize:12,color:T2,fontFamily:FF,lineHeight:1.3}}>
              {members.length===1
                ? members[0].name
                : members.length===2
                  ? `${members[0].name} & ${members[1].name}`
                  : `${members[0].name} +${members.length-1} more`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Projects({projects,onOpen,onDelete}){
  return (
    <div style={{padding:"16px 0"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:20}}>
        {projects.map(p=>(<ProjCard key={p.id} project={p} onOpen={onOpen} onDelete={onDelete}/>))}
      </div>
    </div>
  );
}

function ProjDetail({project,projects,onBack,onDelete,darkMode,authUser,isAdmin,currentUser,canDeleteItem,onRequireAuth}){
  const [ap,setAp]=useState(project.pages[0].id);
  const [arts,setArts]=useState(project.artifacts||{});
  const [pages,setPages]=useState(project.pages);
  const [showNew,setShowNew]=useState(false);
  const [pub,setPub]=useState(null);
  const [save,setSave]=useState(null);
  const [lb,setLb]=useState(null);
  const [artsLoaded,setArtsLoaded]=useState(false);
  const [cardSize,setCardSize]=useState(260);
  const [sizePhase,setSizePhase]=useState(0); // toggles to re-trigger bounce animation
  const [presMode,setPresMode]=useState(false);
  const [presIdx,setPresIdx]=useState(0);
  const [dragFrom,setDragFrom]=useState(null);
  const [dragOver,setDragOver]=useState(null);
  const [confirmDel,setConfirmDel]=useState(false);

  useEffect(()=>{
    const isUuid=typeof project.id==="string"&&project.id.includes("-");
    if(!isUuid){setArtsLoaded(true);return;}
    fetchArtifactsForProject(project.id)
      .then(byPage=>{setArts(byPage);setArtsLoaded(true);})
      .catch(()=>setArtsLoaded(true));
  },[project.id]);

  // Keyboard nav for presentation mode
  useEffect(()=>{
    if(!presMode)return;
    const pa=arts[ap]||[];
    const total=pa.length+1;
    const onKey=e=>{
      if(e.key==="ArrowRight"||e.key==="ArrowDown")setPresIdx(i=>Math.min(i+1,total-1));
      else if(e.key==="ArrowLeft"||e.key==="ArrowUp")setPresIdx(i=>Math.max(i-1,0));
      else if(e.key==="Escape"){setPresMode(false);setPresIdx(0);}
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[presMode,arts,ap]);

  // Flatten all artifacts across all pages into one list
  const pa=Object.values(arts).flat();
  const total=pa.length+1; // title slide + artifacts
  const members=project.members||[];

  const addArts=async list=>{
    const isUuid=typeof project.id==="string"&&project.id.includes("-");
    const pageId=pages[0]?.id||"p1";
    const saved=[];
    for(const art of list){
      if(isUuid){
        try{
          let src=art.src;
          if(art._file){try{src=await uploadFile(art._file);}catch(e){console.error(e);}}
          const r=await insertArtifact(project.id,pageId,{...art,src,user:currentUser||art.user},authUser?.id);
          saved.push(r);
        }catch(e){saved.push({...art,user_id:authUser?.id||null});}
      }else{saved.push({...art,user_id:authUser?.id||null});}
    }
    setArts(prev=>({...prev,[pageId]:[...(prev[pageId]||[]),...saved]}));
  };

  const addPage=()=>{
    const id="pg"+uid();
    const num=pages.length+1;
    const np={id,label:String(num),name:"Page "+num};
    setPages(prev=>[...prev,np]);
    setArts(prev=>({...prev,[id]:[]}));
    setAp(id);
  };

  const reorder=(from,to)=>{
    if(from===null||from===to)return;
    // Reorder within the flat all-pages list, then redistribute back
    const flat=[...Object.values(arts).flat()];
    const [item]=flat.splice(from,1);
    flat.splice(to,0,item);
    // Write all back to first page
    const pageId=pages[0]?.id||"p1";
    setArts({[pageId]:flat});
  };

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:PG,fontFamily:FF}}>

      {/* ── Top header ─────────────────────────────────────────────────── */}
      <div style={{background:"#FFF",borderBottom:`1px solid ${BD}`,display:"flex",alignItems:"center",padding:"0 20px",height:54,flexShrink:0,gap:10}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",alignItems:"center",borderRadius:8,marginRight:2}}>
          <MI name="arrow_back" size={22} style={{color:T2}}/>
        </button>
        <span style={{fontSize:15,fontWeight:700,color:T1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:220}}>{project.name}</span>

        {/* Card size slider */}
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <MI name="grid_view" size={16} style={{color:T3}}/>
          <input type="range" min={160} max={480} step={40} value={cardSize} onChange={e=>{setCardSize(Number(e.target.value));setSizePhase(p=>p+1);}} style={{width:120,accentColor:BK,cursor:"pointer"}}/>
          <MI name="crop_square" size={18} style={{color:T3}}/>
        </div>

        {/* Action buttons */}
        <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
          <button onClick={()=>{setPresIdx(0);setPresMode(true);}} style={{background:"#F5F5F5",border:`1px solid ${BD}`,borderRadius:100,padding:"6px 14px",color:T1,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:FF,display:"flex",alignItems:"center",gap:5,transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background="#EBEBEB"} onMouseLeave={e=>e.currentTarget.style.background="#F5F5F5"}>
            <MI name="play_arrow" size={18} style={{color:T1}}/>Present
          </button>
          <BBtn sm onClick={()=>{if(onRequireAuth){onRequireAuth(()=>setShowNew(true),`new_artifact_in_project:${project.id}`);}else{setShowNew(true);}}}>+ New Artifact</BBtn>
          {(isAdmin||(authUser&&project.user_id===authUser?.id))&&(
            <button onClick={()=>setConfirmDel(true)} style={{background:"none",border:"none",cursor:"pointer",padding:6,borderRadius:8,display:"flex",alignItems:"center"}} title="Delete project">
              <MI name="delete_outline" size={22} style={{color:T3}}/>
            </button>
          )}
        </div>
      </div>

      {/* ── Artifact grid ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes cardBounceA{0%{transform:scale(.97)}55%{transform:scale(1.025)}100%{transform:scale(1)}}
        @keyframes cardBounceB{0%{transform:scale(.97)}55%{transform:scale(1.025)}100%{transform:scale(1)}}
      `}</style>
      <div style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:"24px 28px"}}>
        {pa.length===0?(
          <div style={{height:"100%",minHeight:300,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
            <div style={{fontSize:48,color:BM}}>&#x25FB;</div>
            <p style={{margin:0,fontSize:15,color:T3,fontFamily:FF}}>No artifacts yet in this project</p>
            <BBtn onClick={()=>setShowNew(true)}>+ Add First Artifact</BBtn>
          </div>
        ):(
          <div style={{display:"flex",flexWrap:"wrap",gap:20,alignContent:"flex-start"}}>
            {pa.map((art,idx)=>(
              <div key={art.id}
                draggable
                onDragStart={e=>{e.dataTransfer.effectAllowed="move";setDragFrom(idx);}}
                onDragEnd={()=>{setDragFrom(null);setDragOver(null);}}
                onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect="move";setDragOver(idx);}}
                onDragLeave={()=>{if(dragOver===idx)setDragOver(null);}}
                onDrop={e=>{e.preventDefault();reorder(dragFrom,idx);setDragFrom(null);setDragOver(null);}}
                style={{
                  flexBasis:cardSize,
                  flexGrow:1,
                  flexShrink:0,
                  minWidth:0,
                  opacity:dragFrom===idx?0.35:1,
                  borderRadius:16,
                  outline:dragOver===idx&&dragFrom!==idx?`2px dashed ${BM}`:"2px solid transparent",
                  cursor:"grab",
                  transition:"flex-basis 0.42s cubic-bezier(0.34,1.56,0.64,1), opacity .15s",
                  animation:`${sizePhase%2===0?"cardBounceA":"cardBounceB"} 0.42s cubic-bezier(0.34,1.56,0.64,1)`,
                  willChange:"flex-basis, transform",
                }}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,paddingLeft:2}}>
                  <MI name="drag_indicator" size={16} style={{color:T3,flexShrink:0}}/>
                  <span style={{fontSize:12,color:T3,fontWeight:500,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{art.name}</span>
                  <Bdg type={art.type}/>
                </div>
                <ArtTile art={art} onPublish={setPub} onSave={setSave} onOpen={setLb} onDelete={artId=>{const pageId=pages[0]?.id||"p1";setArts(prev=>({...prev,[pageId]:(prev[pageId]||[]).filter(a=>a.id!==artId)}));}} darkMode={darkMode} canDelete={canDeleteItem?canDeleteItem(art):false}/>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Delete confirmation ───────────────────────────────────────── */}
      {confirmDel&&(
        <div onClick={e=>{if(e.target===e.currentTarget)setConfirmDel(false);}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:24}}>
          <div style={{background:"#FFF",borderRadius:20,padding:28,width:"100%",maxWidth:360,boxShadow:"0 20px 60px rgba(0,0,0,.18)"}}>
            <p style={{margin:"0 0 8px",fontSize:17,fontWeight:700,color:T1,fontFamily:FF}}>Delete &#x201C;{project.name}&#x201D;?</p>
            <p style={{margin:"0 0 24px",fontSize:14,color:T2,fontFamily:FF,lineHeight:1.5}}>This will permanently delete this project. Artifacts published to the feed won&#x2019;t be removed.</p>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <GBtn sm onClick={()=>setConfirmDel(false)}>Cancel</GBtn>
              <button onClick={()=>{onDelete&&onDelete(project.id);onBack();}} style={{background:"#DC2626",border:"none",color:"#FFF",borderRadius:100,padding:"9px 20px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:FF}}>Delete Project</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Presentation mode ─────────────────────────────────────────── */}
      {presMode&&(
        <div style={{position:"fixed",inset:0,background:"#080808",zIndex:2000,display:"flex",flexDirection:"column",fontFamily:FF}}>
          <style>{`@keyframes pdFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Slide area */}
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",padding:"48px 80px",overflow:"hidden"}}>

            {/* Title slide */}
            {presIdx===0&&(
              <div key="title" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:22,maxWidth:620,width:"100%",textAlign:"center",animation:"pdFadeUp .35s ease-out"}}>
                <div style={{width:40,height:3,background:"rgba(255,255,255,.12)",borderRadius:2}}/>
                <h1 style={{margin:0,fontSize:"clamp(28px,4.5vw,54px)",fontWeight:800,color:"#FFF",lineHeight:1.1,letterSpacing:"-0.03em"}}>{project.name}</h1>
                {project.desc&&(<p style={{margin:0,fontSize:17,color:"rgba(255,255,255,.42)",lineHeight:1.65,maxWidth:460}}>{project.desc}</p>)}
                {members.length>0&&(
                  <div style={{display:"flex",gap:28,marginTop:8,flexWrap:"wrap",justifyContent:"center"}}>
                    {members.map(m=>(
                      <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
                        <div style={{padding:2,background:"rgba(255,255,255,.08)",borderRadius:"50%",border:"1px solid rgba(255,255,255,.1)"}}>
                          <Av user={m} size={58} src={m.image}/>
                        </div>
                        <div style={{textAlign:"center"}}>
                          <p style={{margin:"0 0 2px",fontSize:13,fontWeight:600,color:"rgba(255,255,255,.82)"}}>{m.name}</p>
                          <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,.32)"}}>{m.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{display:"inline-flex",alignItems:"center",gap:10,marginTop:4,background:"rgba(255,255,255,.05)",borderRadius:100,padding:"8px 20px",border:"1px solid rgba(255,255,255,.07)"}}>
                  <span style={{fontSize:13,color:"rgba(255,255,255,.32)"}}>{pa.length} artifact{pa.length!==1?"s":""}</span>
                  <span style={{color:"rgba(255,255,255,.14)",fontSize:18,lineHeight:1}}>&#xB7;</span>
                  <span style={{fontSize:13,color:"rgba(255,255,255,.32)"}}>Press &#x2192; to begin</span>
                </div>
              </div>
            )}

            {/* Artifact slides */}
            {presIdx>0&&presIdx<=pa.length&&(
              <div key={presIdx} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18,maxWidth:"90vw",animation:"pdFadeUp .25s ease-out"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",maxHeight:"72vh"}}>
                  <Thumb art={pa[presIdx-1]} h={Math.round(window.innerHeight*0.62)} onClick={()=>setLb(pa[presIdx-1])} darkMode/>
                </div>
                <p style={{margin:0,fontSize:14,color:"rgba(255,255,255,.45)",fontWeight:500,letterSpacing:".01em"}}>{pa[presIdx-1].name}</p>
              </div>
            )}

            {/* Prev / next buttons */}
            <button onClick={()=>setPresIdx(i=>Math.max(0,i-1))} disabled={presIdx===0} style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,.08)",border:"none",borderRadius:"50%",width:48,height:48,cursor:presIdx===0?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:presIdx===0?.2:0.75,transition:"opacity .2s"}}>
              <MI name="arrow_back" size={22} style={{color:"#FFF"}}/>
            </button>
            <button onClick={()=>setPresIdx(i=>Math.min(total-1,i+1))} disabled={presIdx===total-1} style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,.08)",border:"none",borderRadius:"50%",width:48,height:48,cursor:presIdx===total-1?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:presIdx===total-1?.2:0.75,transition:"opacity .2s"}}>
              <MI name="arrow_forward" size={22} style={{color:"#FFF"}}/>
            </button>
          </div>

          {/* Footer bar */}
          <div style={{height:52,borderTop:"1px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",padding:"0 24px",flexShrink:0,gap:16}}>
            <button onClick={()=>{setPresMode(false);setPresIdx(0);}} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:100,padding:"6px 14px",color:"rgba(255,255,255,.55)",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:FF,display:"flex",alignItems:"center",gap:6}}>
              <MI name="close" size={15} style={{color:"rgba(255,255,255,.5)"}}/>Exit
            </button>
            <div style={{flex:1,display:"flex",justifyContent:"center",alignItems:"center",gap:5,overflow:"hidden"}}>
              {Array.from({length:total}).map((_,i)=>(
                <button key={i} onClick={()=>setPresIdx(i)} style={{width:presIdx===i?18:6,height:6,borderRadius:3,background:presIdx===i?"#FFF":"rgba(255,255,255,.18)",border:"none",cursor:"pointer",transition:"width .2s,background .2s",padding:0,flexShrink:0}}/>
              ))}
            </div>
            <span style={{fontSize:13,color:"rgba(255,255,255,.28)",fontFamily:FF,minWidth:40,textAlign:"right"}}>{presIdx+1} / {total}</span>
          </div>
        </div>
      )}

      {showNew&&(<NewArtMdl onClose={()=>setShowNew(false)} onAdd={addArts} projects={projects} darkMode={darkMode}/>)}
      {pub&&(<PubMdl art={pub} onClose={()=>setPub(null)}/>)}
      {save&&(<SaveMdl art={save} projects={projects} onClose={()=>setSave(null)}/>)}
      {lb&&(<LBox art={lb} onClose={()=>setLb(null)}/>)}
    </div>
  );
}

function Profile({user,feed,darkMode}){
  const uf=feed.filter(i=>i.user.id===user.id);
  return (
    <div style={{maxWidth:1100,margin:"0 auto",padding:"48px 32px"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:48}}>
        <Av user={user} size={72}/>
        <h1 style={{margin:"16px 0 6px",fontSize:22,fontWeight:700,color:T1,fontFamily:FF}}>{user.name}</h1>
        <p style={{margin:"0 0 16px",fontSize:14,color:T2,fontFamily:FF}}>{user.title}</p>
        <button style={{background:"#F0F0F0",border:`1px solid ${BD}`,borderRadius:20,padding:"6px 16px",fontSize:13,color:T2,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,fontFamily:FF}}>&#x1F4AC; Slack</button>
      </div>
      <div style={{columns:"5 200px",gap:16}}>
        {uf.map(item=>(<ExploreCard key={item.id} item={item} onSave={()=>{}} onOpen={()=>{}} darkMode={darkMode}/>))}
      </div>
    </div>
  );
}

function LoginModal({onClose}){
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const handle=async()=>{
    setLoading(true); setErr("");
    try{ await signInWithGoogle(); }
    catch(e){ setErr("Sign-in failed — please try again."); setLoading(false); }
  };
  return (
    <Mdl title="" onClose={onClose} w={380}>
      <div style={{textAlign:"center",padding:"4px 0 8px"}}>
        <div style={{width:56,height:56,background:BK,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
          <MI name="diamond" size={28} style={{color:"#FFF"}}/>
        </div>
        <p style={{margin:"0 0 8px",fontSize:17,fontWeight:700,color:T1,fontFamily:FF}}>Sign in to contribute</p>
        <p style={{margin:"0 0 28px",fontSize:13,color:T2,fontFamily:FF,lineHeight:1.65}}>Use your Weedmaps Google account to upload artifacts and manage projects.<br/>Viewing is available to everyone.</p>
        {err&&(<p style={{margin:"0 0 16px",fontSize:13,color:"#DC2626",fontFamily:FF}}>{err}</p>)}
        <button onClick={handle} disabled={loading} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:loading?"#F5F5F5":"#FFF",border:`1px solid ${BD}`,borderRadius:100,padding:"13px 20px",cursor:loading?"default":"pointer",fontFamily:FF,fontSize:14,fontWeight:600,color:T1,transition:"background .15s"}} onMouseEnter={e=>{if(!loading)e.currentTarget.style.background="#F5F5F5";}} onMouseLeave={e=>{e.currentTarget.style.background=loading?"#F5F5F5":"#FFF";}}>
          {/* Google G icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" style={{flexShrink:0}}>
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.657 12.015 17.64 10.23 17.64 9.2z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {loading ? "Opening Google…" : "Continue with Google"}
        </button>
        <p style={{margin:"16px 0 0",fontSize:11,color:T3,fontFamily:FF}}>Only @weedmaps.com accounts can contribute.</p>
      </div>
    </Mdl>
  );
}

function Toaster({toasts}){
  return (
    <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",zIndex:4000,display:"flex",flexDirection:"column",gap:8,alignItems:"center",pointerEvents:"none"}}>
      {toasts.map(t=>(
        <div key={t.id} style={{background:"#0D0D0D",color:"#FFF",padding:"10px 22px",borderRadius:100,fontSize:14,fontFamily:FF,boxShadow:"0 4px 20px rgba(0,0,0,.25)",whiteSpace:"nowrap",letterSpacing:".01em"}}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export default function App(){
  const [view,setView]=useState("explore");
  const [proj,setProj]=useState(null);
  const [projects,setProjects]=useState([]);
  const [feed,setFeed]=useState(SFEED);
  const [loading,setLoading]=useState(true);
  const [srch,setSrch]=useState(""); const [sf,setSf]=useState(false);
  const [newP,setNewP]=useState(false); const [newF,setNewF]=useState(false);
  const [uplFeed,setUplFeed]=useState(false);
  const [saveIt,setSaveIt]=useState(null);
  const [isMobile,setIsMobile]=useState(()=>window.innerWidth<=640);
  const [winW,setWinW]=useState(()=>window.innerWidth);
  const [mobileMenu,setMobileMenu]=useState(false);
  const [searchExp,setSearchExp]=useState(false);
  const [showTags,setShowTags]=useState(false);
  const [darkMode,setDarkMode]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [uplError,setUplError]=useState(null);
  const [toasts,setToasts]=useState([]);
  // ── Auth state ────────────────────────────────────────────────────────────
  const [authUser,setAuthUser]=useState(null);
  const [profile,setProfile]=useState(null);
  const [showLogin,setShowLogin]=useState(false);
  const searchRef=useRef(null);
  const logoRef=useRef(null);
  const toast=useCallback(msg=>{
    const id=Date.now()+Math.random();
    setToasts(p=>[...p,{id,msg}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),2500);
  },[]);

  useEffect(()=>{
    if(!configured){setProjects(SPROJ);setFeed(SFEED);setLoading(false);return;}
    const deletedProjIds=JSON.parse(localStorage.getItem("stash_deleted_projects")||"[]");
    Promise.all([fetchProjects(),fetchFeed()])
      .then(([projs,feedItems])=>{
        const filteredProjs=projs.filter(p=>!deletedProjIds.includes(String(p.id)));
        setProjects(filteredProjs.length?filteredProjs:SPROJ);
        const realItems=feedItems.filter(f=>f.type!=="mockup");
        setFeed(realItems.length?[...realItems,...SFEED]:SFEED);
      })
      .catch(()=>{setProjects(SPROJ);setFeed(SFEED);})
      .finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    const onResize=()=>{const w=window.innerWidth;setIsMobile(w<=640);setWinW(w);};
    window.addEventListener("resize",onResize);
    return()=>window.removeEventListener("resize",onResize);
  },[]);
  useEffect(()=>{
    if(searchExp&&searchRef.current){
      setTimeout(()=>{searchRef.current?.focus({preventScroll:true});},300);
    }
  },[searchExp]);

  useEffect(()=>{
    if(searchExp){
      document.body.style.overflow="hidden";
    }else{
      document.body.style.overflow="";
    }
    return ()=>{
      document.body.style.overflow="";
    };
  },[searchExp]);

  // ── Auth ─────────────────────────────────────────────────────────────────────
  // Close auth-callback popup (when this window IS the popup)
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    if(params.get("auth_callback")==="1"&&window.opener){
      setTimeout(()=>window.close(),400);
    }
  },[]);

  // Load profile from an auth user object
  const loadProfile=useCallback(async(user)=>{
    setAuthUser(user);
    try{
      let prof=await fetchProfile(user.id);
      if(!prof){
        const name=user.user_metadata?.full_name||user.email?.split("@")[0]||"Designer";
        const words=name.trim().split(" ");
        const initials=((words.length>=2?words[0][0]+words[words.length-1][0]:name.slice(0,2)).toUpperCase());
        prof=await upsertProfile({
          id:user.id,
          email:user.email,
          name,
          initials,
          title:"Designer",
          avatar_url:user.user_metadata?.avatar_url||null,
          is_admin:user.email==="doneil@weedmaps.com",
        });
      }
      setProfile(prof);
    }catch(e){
      // Profiles table may not exist yet — build a local profile from auth metadata
      setProfile({
        id:user.id,
        email:user.email,
        name:user.user_metadata?.full_name||user.email?.split("@")[0]||"Designer",
        initials:((user.user_metadata?.full_name||"D").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()),
        title:"Designer",
        avatar_url:user.user_metadata?.avatar_url||null,
        is_admin:user.email==="doneil@weedmaps.com",
      });
    }
  },[]);

  // Subscribe to Supabase auth state
  useEffect(()=>{
    if(!configured)return;
    // Check for existing session (e.g. on page load)
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session?.user)loadProfile(session.user);
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange(async(event,session)=>{
      if(event==="SIGNED_IN"&&session?.user){
        await loadProfile(session.user);
        setShowLogin(false);
      }else if(event==="SIGNED_OUT"){
        setAuthUser(null);setProfile(null);
      }
    });
    return()=>subscription.unsubscribe();
  },[loadProfile]);

  // After auth, execute any pending action stored before the login popup
  useEffect(()=>{
    if(!authUser||loading)return;
    const pending=sessionStorage.getItem("stash_auth_pending");
    if(!pending)return;
    sessionStorage.removeItem("stash_auth_pending");
    if(pending==="new_project")setTimeout(()=>setNewP(true),200);
    else if(pending==="new_artifact")setTimeout(()=>setUplFeed(true),200);
    else if(pending.startsWith("new_artifact_in_project:")){
      const pId=pending.split(":")[1];
      const p=projects.find(x=>String(x.id)===pId);
      if(p)setTimeout(()=>{setProj(p);setView("project");},200);
    }
  },[authUser,loading,projects]);

  // Require auth before executing a write action.
  // actionKey is stored in sessionStorage as a fallback across popup sessions.
  const requireAuth=useCallback((fn,actionKey)=>{
    if(!configured||authUser){fn();return;}
    if(actionKey)sessionStorage.setItem("stash_auth_pending",actionKey);
    setShowLogin(true);
  },[authUser]);

  const handleSignOut=useCallback(async()=>{
    try{await signOutUser();}catch(e){console.error(e);}
    setAuthUser(null);setProfile(null);
    toast("Signed out");
  },[]);

  // Dynamic current-user object (for artifact attribution)
  const currentUser=profile
    ?{id:profile.id,name:profile.name,initials:profile.initials,title:profile.title||"Designer",image:profile.avatar_url}
    :ME;

  // Super-admin check
  const isAdmin=!!authUser&&(authUser.email==="doneil@weedmaps.com"||profile?.is_admin===true);

  // Permission helpers
  const canDeleteItem=useCallback(item=>{
    if(!authUser)return false;
    if(isAdmin)return true;
    return item?.user_id&&item.user_id===authUser.id;
  },[authUser,isAdmin]);

  const open=p=>{setProj(p);setView("project");};
  const deleteProj=async projId=>{
    try{
      const deleted=JSON.parse(localStorage.getItem("stash_deleted_projects")||"[]");
      if(!deleted.includes(String(projId)))deleted.push(String(projId));
      localStorage.setItem("stash_deleted_projects",JSON.stringify(deleted));
    }catch(e){}
    const isUuid=typeof projId==="string"&&projId.includes("-");
    if(isUuid){
      try{ await deleteProject(projId); }
      catch(e){ console.error("Failed to delete from Supabase (will stay deleted via localStorage):",e); }
    }
    setProjects(prev=>prev.filter(p=>p.id!==projId));
  };

  if(view==="project"&&proj){
    return (<ProjDetail project={proj} projects={projects} onBack={()=>setView("projects")} onDelete={deleteProj} darkMode={darkMode} authUser={authUser} isAdmin={isAdmin} currentUser={currentUser} canDeleteItem={canDeleteItem} onRequireAuth={requireAuth}/>);
  }

  const toggleDarkMode=()=>{
    if(logoRef.current){
      const rect=logoRef.current.getBoundingClientRect();
      const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
      for(let i=0;i<12;i++){
        const angle=Math.random()*Math.PI*2,dist=60+Math.random()*60,x=cx+Math.cos(angle)*dist,y=cy+Math.sin(angle)*dist;
        const p=document.createElement("div");
        p.style.cssText=`position:fixed;width:${8+Math.random()*12}px;height:${8+Math.random()*12}px;background:${i%2?"rgba(255,0,0,0.8)":"rgba(100,100,100,0.6)"};border-radius:50%;left:${x}px;top:${y}px;pointer-events:none;z-index:2000;animation:${i%2?"laser":"smoke"} ${0.6+Math.random()*0.4}s ease-out forwards;`;
        document.body.appendChild(p);
        setTimeout(()=>p.remove(),1200);
      }
    }
    setDarkMode(v=>!v);
  };

  const create=async p=>{
    try{
      const saved=await createProject(p,authUser?.id);
      setProjects(prev=>[saved,...prev]);
      toast("Project created");
      if(p._navigate!==false) open(saved);
      return saved;
    }catch(e){
      console.error("createProject failed",e);
      const n={...p,id:Date.now(),thumbs:[],artifacts:{},user_id:authUser?.id||null};
      setProjects(prev=>[n,...prev]);
      if(p._navigate!==false) open(n);
      return n;
    }
  };
  const addToFeed=async arts=>{
    setUplError(null);
    const saved=[];
    for(const art of arts){
      let src=art.src;
      if(art._file){
        try{src=await uploadFile(art._file);}catch(e){
          console.error("Upload failed:",e);
          setUplError(e.message||"Upload failed. Please try a smaller file.");
          return;
        }
      }
      const item={...art,src,user:currentUser};
      try{const r=await insertFeedItem(item,authUser?.id);saved.push(r);}
      catch(e){saved.push({...item,id:"upl"+uid(),user_id:authUser?.id||null});}
    }
    setFeed(prev=>[...saved,...prev]);
    setUplFeed(false);
    toast("Published to Explore");
  };

  const saveEdit=async updated=>{
    // Always persist display settings to localStorage so they survive reload
    // regardless of whether Supabase succeeds (belt-and-suspenders)
    try{
      localStorage.setItem(`device_${updated.id}`,JSON.stringify({
        deviceShell:updated.deviceShell,
        mobileBg:updated.mobileBg,
        crop:updated.crop,
        align:updated.align||"center",
      }));
    }catch(e){}
    const isUuid=typeof updated.id==="string"&&updated.id.includes("-");
    if(isUuid){
      try{
        const r=await updateFeedItem(updated.id,updated);
        setFeed(prev=>prev.map(f=>f.id===r.id?r:f));
        toast("Changes saved");
        return;
      }catch(e){
        console.error("Supabase update failed, change persisted via localStorage",e);
      }
    }
    setFeed(prev=>prev.map(f=>String(f.id)===String(updated.id)?{...f,...updated}:f));
    toast("Changes saved");
  };
  const deleteArt=async artId=>{
    const isUuid=typeof artId==="string"&&artId.includes("-");
    if(isUuid){
      try{
        await deleteFeedItem(artId);
        console.log("Deleted artifact from Supabase:",artId);
      }catch(e){
        console.error("Failed to delete from Supabase:",e);
      }
    }
    setFeed(prev=>prev.filter(f=>f.id!==artId));
  };
  const addArtToProject=async(art,proj,pageId)=>{
    const isUuid=typeof proj.id==="string"&&proj.id.includes("-");
    let saved=art;
    if(isUuid){
      try{saved=await insertArtifact(proj.id,pageId,art);}
      catch(e){console.error("insertArtifact failed",e);}
    }
    setProjects(prev=>prev.map(p=>{
      if(p.id!==proj.id)return p;
      const page=p.artifacts||{};
      return{...p,artifacts:{...page,[pageId]:[...(page[pageId]||[]),saved]},artifactCount:(p.artifactCount||0)+1};
    }));
    toast(`Saved to ${proj.name}`);
  };

  const allTags=Array.from(new Set(projects.flatMap(p=>p.tags||[])));
  const matchingTags=srch.toLowerCase().trim()?allTags.filter(t=>t.includes(srch.toLowerCase())):allTags;
  const filtProj=projects.filter(p=>{
    const matchName=!srch||p.name.toLowerCase().includes(srch.toLowerCase());
    const matchTag=!srch||(p.tags||[]).some(t=>t.includes(srch.toLowerCase()));
    return matchName||matchTag;
  });

  if(loading) return (
    <div style={{minHeight:"100vh",background:PG,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FF}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:36,height:36,border:`3px solid ${BD}`,borderTopColor:BK,borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto 16px"}}/>
        <p style={{color:T3,fontSize:14,margin:0}}>Loading Stash...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:darkMode?"#0D0D0D":PG,color:darkMode?"#FFF":T1,fontFamily:FF,transition:"background 0.3s, color 0.3s"}}>
      <style>{`@keyframes smoke{from{opacity:1;transform:translate(0,0) scale(1)}to{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0)}}@keyframes laser{from{opacity:1;transform:translate(0,0) scale(1)}to{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0.5)}}`}</style>
      <nav style={{background:darkMode?"#1A1A1A":"#FFF",borderBottom:`1px solid ${darkMode?"#333":"#E8E8E8"}`,display:"flex",alignItems:"center",gap:12,padding:"0 20px",height:52,position:"sticky",top:0,zIndex:100,transition:"background 0.3s, border-color 0.3s"}}>
        {!isMobile&&(<>
          <button ref={logoRef} onClick={toggleDarkMode} style={{display:"flex",alignItems:"center",gap:7,flexShrink:0,background:"none",border:"none",cursor:"pointer",padding:0}}>
            <img src="https://cdn.builder.io/api/v1/image/assets%2Fc65332bdb1b641359feb3e4d8ecc47de%2F74e1336a6c56406e884d27bcf1b26ce4?format=webp&width=800&height=1200" alt="The Stash" style={{width:28,height:28,borderRadius:"50%",objectFit:"cover",display:"block"}}/>
            <span style={{fontFamily:FF,fontWeight:800,fontSize:15,letterSpacing:".04em",color:darkMode?"#FFF":T1,textTransform:"uppercase",transition:"color 0.3s"}}>The Stash</span>
          </button>
          <div style={{display:"flex",gap:2,background:darkMode?"#2A2A2A":"#F0F0F0",borderRadius:20,padding:3,transition:"background 0.3s"}}>
            {["Explore","Projects"].map(v=>(
              <button key={v} onClick={()=>setView(v.toLowerCase())} style={{background:view===v.toLowerCase()?(darkMode?"#333":"#FFF"):"transparent",border:view===v.toLowerCase()?`1px solid ${darkMode?"#444":"#E8E8E8"}`:"1px solid transparent",borderRadius:16,padding:"6px 18px",color:view===v.toLowerCase()?(darkMode?"#FFF":T1):(darkMode?"#AAA":T2),fontWeight:view===v.toLowerCase()?600:400,fontSize:14,cursor:"pointer",fontFamily:FF,transition:"all 0.3s"}}>{v}</button>
            ))}
          </div>
          <div style={{flex:1}}/>
          <div style={{width:520,position:"relative"}}>
            <MI name="search" size={32} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T3,pointerEvents:"none"}}/>
            <input value={srch} onChange={e=>setSrch(e.target.value)} onFocus={()=>{setSf(true);setShowTags(true);}} onBlur={()=>setTimeout(()=>{setSf(false);setShowTags(false);},150)} placeholder="Search projects or tags" style={{width:"100%",boxSizing:"border-box",background:sf?(darkMode?"#2A2A2A":"#FFF"):(darkMode?"#1A1A1A":"#F5F5F5"),border:`1px solid ${sf?(darkMode?"#444":BM):"transparent"}`,borderRadius:22,padding:"7px 16px 7px 52px",color:darkMode?"#FFF":T1,fontSize:14,outline:"none",fontFamily:FF,transition:"all .15s"}}/>
            {sf&&showTags&&(
              <div style={{position:"absolute",top:"100%",left:0,right:0,marginTop:8,background:darkMode?"#1A1A1A":"#FFF",border:`1px solid ${darkMode?"#333":BD}`,borderRadius:12,boxShadow:darkMode?"0 4px 20px rgba(0,0,0,.5)":"0 4px 20px rgba(0,0,0,.1)",zIndex:10,maxHeight:300,overflowY:"auto",transition:"all 0.3s"}}>
                {matchingTags.length>0?(
                  <div style={{padding:8}}>
                    <p style={{margin:"8px 12px 4px",fontSize:11,fontWeight:700,color:T3,textTransform:"uppercase"}}>All Tags</p>
                    {matchingTags.map(t=>(
                      <button key={t} onClick={()=>{setSrch(t);setShowTags(false);}} style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",padding:"10px 12px",fontSize:13,color:darkMode?"#FFF":T1,fontFamily:FF,cursor:"pointer",borderRadius:6,marginBottom:2}} onMouseEnter={e=>e.currentTarget.style.background=darkMode?"#2A2A2A":"#F5F5F5"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <span style={{fontWeight:600}}>#</span>{t}
                      </button>
                    ))}
                  </div>
                ):(
                  <div style={{padding:"16px 12px",textAlign:"center",color:T3,fontSize:13}}>No tags found</div>
                )}
              </div>
            )}
          </div>
          <div style={{flex:1}}/>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            {view==="projects"&&(<BBtn sm onClick={()=>requireAuth(()=>setNewP(true),"new_project")}>+ Project</BBtn>)}
            {view==="explore"&&(<BBtn sm onClick={()=>requireAuth(()=>setUplFeed(true),"new_artifact")}>+ Artifact</BBtn>)}
            {/* Auth user section */}
            {authUser&&profile?(
              <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:4}}>
                <button onClick={()=>setView("profile")} style={{background:"none",border:"none",cursor:"pointer",borderRadius:"50%",padding:0,display:"flex",alignItems:"center"}}><Av user={currentUser} size={32} src={profile.avatar_url}/></button>
                <button onClick={handleSignOut} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:T3,fontFamily:FF,padding:"4px 2px",whiteSpace:"nowrap"}} onMouseEnter={e=>e.currentTarget.style.color=T2} onMouseLeave={e=>e.currentTarget.style.color=T3}>Sign out</button>
              </div>
            ):(
              configured?(
                <button onClick={()=>setShowLogin(true)} style={{background:"transparent",color:T2,border:`1px solid ${BD}`,borderRadius:100,padding:"7px 16px",fontWeight:500,fontSize:13,cursor:"pointer",fontFamily:FF,marginLeft:4}} onMouseEnter={e=>e.currentTarget.style.borderColor=BM} onMouseLeave={e=>e.currentTarget.style.borderColor=BD}>Sign in</button>
              ):(
                <button onClick={()=>setView("profile")} style={{background:"none",border:"none",cursor:"pointer",borderRadius:"50%",padding:0}}><Av user={ME} size={32} src={ME.image}/></button>
              )
            )}
          </div>
        </>)}
        {isMobile&&(<>
          {!searchExp&&(<>
            <button ref={logoRef} onClick={toggleDarkMode} style={{display:"flex",alignItems:"center",justifyContent:"center",width:isMobile?42:28,height:isMobile?42:28,borderRadius:"50%",background:"none",border:"none",cursor:"pointer",padding:0,flexShrink:0,transition:"width 0.3s, height 0.3s"}}>
              <img src="https://cdn.builder.io/api/v1/image/assets%2Fc65332bdb1b641359feb3e4d8ecc47de%2F74e1336a6c56406e884d27bcf1b26ce4?format=webp&width=800&height=1200" alt="The Stash" style={{width:isMobile?42:28,height:isMobile?42:28,borderRadius:"50%",objectFit:"cover",display:"block",transition:"width 0.3s, height 0.3s"}}/>
            </button>
            <div style={{flex:1}}/>
            <div style={{display:"flex",gap:2,background:darkMode?"#2A2A2A":"#F0F0F0",borderRadius:20,padding:3,flexShrink:0,transition:"background 0.3s"}}>
              {["Explore","Projects"].map(v=>(
                <button key={v} onClick={()=>setView(v.toLowerCase())} style={{background:view===v.toLowerCase()?(darkMode?"#333":"#FFF"):"transparent",border:view===v.toLowerCase()?`1px solid ${darkMode?"#444":"#E8E8E8"}`:"1px solid transparent",borderRadius:16,padding:"6px 14px",color:view===v.toLowerCase()?(darkMode?"#FFF":T1):(darkMode?"#AAA":T2),fontWeight:view===v.toLowerCase()?600:400,fontSize:13,cursor:"pointer",fontFamily:FF,transition:"all 0.3s"}}>{v}</button>
              ))}
            </div>
            <div style={{flex:1}}/>
            {view==="explore"&&(<button onClick={()=>requireAuth(()=>setUplFeed(true),"new_artifact")} style={{background:BK,border:"none",borderRadius:100,cursor:"pointer",width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center"}}><MI name="add" size={24} style={{color:"#FFF"}}/></button>)}
            <button onClick={()=>authUser?setView("profile"):setShowLogin(true)} style={{width:34,height:34,borderRadius:"50%",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:8}}><Av user={currentUser} size={28} src={profile?.avatar_url}/></button>
          </>)}
          {searchExp&&(<>
            <div style={{flex:1,position:"relative"}}>
              <MI name="search" size={32} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T3,pointerEvents:"none"}}/>
              <input ref={searchRef} value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search" style={{width:"100%",boxSizing:"border-box",background:"#F5F5F5",border:`1px solid ${BM}`,borderRadius:22,padding:"7px 16px 7px 52px",color:T1,fontSize:14,outline:"none",fontFamily:FF}}/>
            </div>
            <button onClick={()=>{setSearchExp(false);setSrch("");}} style={{width:34,height:34,borderRadius:"50%",background:"#F0F0F0",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T1,fontSize:16,flexShrink:0}}>&#x2715;</button>
          </>)}
        </>)}
      </nav>
      <main style={{maxWidth:1440,margin:"0 auto",padding:"0 28px"}}>
        {view==="explore"&&(<Explore feed={feed} projects={projects} onSave={setSaveIt} onEdit={setEditItem} onDelete={deleteArt} onSearch={t=>setSrch(t)} darkMode={darkMode} cols={winW<=640?1:winW<=1024?2:3}/>)}
        {view==="projects"&&(<Projects projects={filtProj} onOpen={open} onDelete={deleteProj}/>)}
        {view==="profile"&&(<Profile user={currentUser} feed={feed} darkMode={darkMode}/>)}
      </main>
      {showLogin&&(<LoginModal onClose={()=>setShowLogin(false)}/>)}
      {newP&&(<NewProjMdl onClose={()=>setNewP(false)} onCreate={create} isMobile={isMobile}/>)}
      {newF&&(<NewFolderMdl onClose={()=>setNewF(false)} projects={projects} isMobile={isMobile}/>)}
      {uplFeed&&(<NewArtMdl onClose={()=>setUplFeed(false)} onAdd={addToFeed} projects={projects} onCreateProject={(p,cb)=>create({...p,_navigate:false}).then(saved=>{cb&&cb(saved);}).catch(()=>{})} isMobile={isMobile}/>)}
      {uplError&&(
        <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:8,padding:"12px 16px",color:"#DC2626",fontSize:14,fontFamily:FF,zIndex:2000,maxWidth:400,boxShadow:"0 4px 12px rgba(0,0,0,.15)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>{uplError}</span>
            <button onClick={()=>setUplError(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#DC2626",fontSize:20,padding:0,lineHeight:1,marginLeft:16}}>×</button>
          </div>
        </div>
      )}
      {saveIt&&(<SaveMdl art={saveIt} projects={projects} onClose={()=>setSaveIt(null)} onSave={()=>toast("Saved to project")} isMobile={isMobile}/>)}
      {editItem&&(<EditArtMdl art={editItem} onClose={()=>setEditItem(null)} onSave={saveEdit} onDelete={deleteArt} onSaveToProject={addArtToProject} projects={projects} isMobile={isMobile}/>)}
      {isMobile&&!searchExp&&(
        <button onClick={()=>setSearchExp(true)} style={{position:"fixed",bottom:"24px",right:"24px",width:"56px",height:"56px",borderRadius:"50%",background:BK,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",boxShadow:darkMode?"0 4px 12px rgba(0,0,0,.5)":"0 4px 12px rgba(0,0,0,.15)",zIndex:50}}><MI name="search" size={28} style={{color:"#FFF"}}/></button>
      )}
      {isMobile&&searchExp&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"#0D0D0D",zIndex:1000,display:"flex",flexDirection:"column",animation:"slideUp 0.3s ease-out",transition:"background 0.3s",WebkitUserSelect:"none",userSelect:"none"}}>
          <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}html,body{margin:0;padding:0}`}</style>
          <div style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:8,borderBottom:"1px solid #333",background:"#1A1A1A",transition:"all 0.3s",flexShrink:0}}>
            <button onClick={()=>{setSearchExp(false);setSrch("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#999",fontSize:24,padding:0,lineHeight:1,flexShrink:0}}>&#x2190;</button>
            <div style={{flex:1,position:"relative"}}>
              <MI name="search" size={32} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#666",pointerEvents:"none"}}/>
              <input ref={searchRef} value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search projects or tags" style={{width:"100%",boxSizing:"border-box",background:"#262626",border:"1px solid #333",borderRadius:20,padding:"8px 16px 8px 50px",fontSize:16,color:"#E8E8E8",outline:"none",fontFamily:FF,placeholder:"#999"}}/>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:"16px 20px"}}>
            {srch.trim()?(
              <div>
                <p style={{fontSize:11,fontWeight:700,color:"#666",textTransform:"uppercase",margin:"0 0 12px"}}>Matching Tags</p>
                {matchingTags.length>0?(
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {matchingTags.map(t=>(
                      <button key={t} onClick={()=>{setSrch(t);setSearchExp(false);}} style={{display:"inline-flex",alignItems:"center",gap:6,background:"#262626",border:"1px solid #333",borderRadius:20,padding:"8px 14px",fontSize:13,color:"#E8E8E8",cursor:"pointer",fontFamily:FF,fontWeight:500}}>
                        <span>&#x23;</span>{t}
                      </button>
                    ))}
                  </div>
                ):(
                  <p style={{fontSize:13,color:"#666",textAlign:"center",padding:"24px 0"}}>No tags match "{srch}"</p>
                )}
              </div>
            ):(
              <div>
                <p style={{fontSize:11,fontWeight:700,color:"#666",textTransform:"uppercase",margin:"0 0 12px"}}>All Tags</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:24}}>
                  {allTags.slice(0,12).map(t=>(
                    <button key={t} onClick={()=>{setSrch(t);setSearchExp(false);}} style={{display:"inline-flex",alignItems:"center",gap:6,background:"#262626",border:"1px solid #333",borderRadius:20,padding:"8px 14px",fontSize:13,color:"#E8E8E8",cursor:"pointer",fontFamily:FF,fontWeight:500}}>
                      <span>&#x23;</span>{t}
                    </button>
                  ))}
                </div>
                <p style={{fontSize:11,fontWeight:700,color:"#666",textTransform:"uppercase",margin:"0 0 12px"}}>Popular Searches</p>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {["web","mobile","redesign","v2","checkout"].map(s=>(
                    <button key={s} onClick={()=>{setSrch(s);setSearchExp(false);}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",textAlign:"left",background:"#262626",border:"1px solid #333",borderRadius:100,padding:"12px 14px",fontSize:13,color:"#E8E8E8",cursor:"pointer",fontFamily:FF}}>
                      <MI name="search" size={18} style={{color:"#666",flexShrink:0}}/>{s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <Toaster toasts={toasts}/>
    </div>
  );
}
