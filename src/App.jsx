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

const BG="#FFF",PG="#F5F5F5",BD="#E8E8E8",BM="#D0D0D0";
const T1="#0D0D0D",T2="#6B6B6B",T3="#ABABAB",BK="#0D0D0D";
const FF="'Geist','DM Sans',-apple-system,sans-serif";
const GR=["linear-gradient(135deg,#0d1117,#1a472a)","linear-gradient(135deg,#1a0030,#6b21a8)","linear-gradient(135deg,#1c1c1c,#f97316)","linear-gradient(160deg,#0f172a,#1e40af)","linear-gradient(135deg,#0a0a0a,#dc2626)","linear-gradient(135deg,#111827,#059669)","linear-gradient(135deg,#1c1917,#d97706)","linear-gradient(160deg,#0f0f23,#7c3aed)","linear-gradient(135deg,#0c1a0c,#16a34a)","linear-gradient(135deg,#1e1b4b,#a78bfa)"];
const USERS=[{id:1,name:"Dennis O'Neil",title:"Senior Product Designer",initials:"DO"},{id:2,name:"Maria Chen",title:"Lead UX Designer",initials:"MC"},{id:3,name:"Jake Torres",title:"Principal Designer",initials:"JT"}];
const ME=USERS[0];
const VPS={"Desktop (1512x900)":{w:1512,h:900},"Laptop (1280x800)":{w:1280,h:800},"Mobile (390x844)":{w:390,h:844},"Tablet (768x1024)":{w:768,h:1024}};
const FOLDERS=[{id:1,name:"Product Design",count:8},{id:2,name:"Brand & Marketing",count:5},{id:3,name:"Research",count:3},{id:4,name:"Documentation",count:6},{id:5,name:"Archive",count:15}];
const a=(id,n,t,g)=>({id,name:n,type:t,thumb:g,src:null,viewport:null});
const SPROJ=[
  {id:1,name:"Website Redesign",folder:1,artifactCount:4,thumbs:[GR[0],GR[1],GR[2],GR[3]],
   pages:[{id:"p1",label:"2",name:"Discovery"},{id:"p2",label:"3",name:"Concepts"},{id:"p3",label:"4",name:"Visual"},{id:"p4",label:"5",name:"Prototype"},{id:"p5",label:"6",name:"Handoff"}],
   rows:["R1","PDP","R2","R3"],
   artifacts:{p1:[a("a1","Logo Animation","image",GR[0]),a("a2","Promo Video","image",GR[1]),a("a3","Hero Banner","image",GR[2]),a("a4","Mobile Mockup","image",GR[3])],p2:[a("a5","shop-routing","figma",GR[4]),a("a6","type-to-image","image",GR[5]),a("a7","Home Z Index B","image",GR[6]),a("a8","shop-search","figma",GR[7])],p3:[a("a9","UI Kit v1","figma",GR[8]),a("a10","Color System","image",GR[9])],p4:[a("a11","Prototype v1","website",GR[0])],p5:[a("a12","Handoff Doc","file",GR[1])]}},
  {id:2,name:"Mobile App",folder:1,artifactCount:2,thumbs:[GR[4],GR[5]],pages:[{id:"p1",label:"1",name:"Research"},{id:"p2",label:"2",name:"Design"}],rows:["R1","R2"],artifacts:{p1:[a("b1","User Flows","figma",GR[4])],p2:[a("b2","Hi-fi Screens","image",GR[5])]}},
  {id:3,name:"Brand Refresh",folder:2,artifactCount:1,thumbs:[GR[6]],pages:[{id:"p1",label:"1",name:"Assets"}],rows:["Brand"],artifacts:{p1:[a("c1","Logo System","image",GR[6])]}},
  {id:4,name:"API Integration",folder:1,artifactCount:2,thumbs:[GR[7],GR[8]],pages:[{id:"p1",label:"1",name:"Specs"},{id:"p2",label:"2",name:"Docs"}],rows:["R1"],artifacts:{p1:[a("d1","Flow Diagram","figma",GR[7])],p2:[a("d2","API Docs","website",GR[8])]}},
  {id:5,name:"User Portal",folder:1,artifactCount:5,thumbs:[GR[9],GR[0],GR[1],GR[2]],pages:[{id:"p1",label:"1",name:"Research"},{id:"p2",label:"2",name:"Design"},{id:"p3",label:"3",name:"Dev"}],rows:["R1","R2","R3"],artifacts:{p1:[a("e1","Research Deck","file",GR[9]),a("e2","Interview Clips","image",GR[0])],p2:[a("e3","Wireframes","figma",GR[1]),a("e4","Visual Design","figma",GR[2])],p3:[a("e5","Spec Sheet","file",GR[3])]}},
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

function Av({user,size=32}){
  const bg=["#EBF5FB","#F0EBFB","#FBF0EB","#EBFBF0","#FBEBF0"],fg=["#1A6FA8","#6B21A8","#C2410C","#065F46","#9D174D"],i=(user.id-1)%5;
  return (<div style={{width:size,height:size,borderRadius:"50%",background:bg[i],display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.34,fontWeight:700,color:fg[i],flexShrink:0,userSelect:"none"}}>{user.initials}</div>);
}
function Bdg({type}){
  const L={figma:"Figma",website:"URL",file:"File",image:"Image",video:"Video",pdf:"PDF",gif:"GIF"};
  return (<span style={{fontSize:10,fontWeight:600,color:T2,background:"#F0F0F0",padding:"2px 7px",borderRadius:4,letterSpacing:"0.04em",textTransform:"uppercase"}}>{L[type]||"Media"}</span>);
}
function BBtn({children,onClick,disabled,fw,sm}){
  return (<button onClick={onClick} disabled={disabled} style={{background:disabled?"#E0E0E0":BK,color:disabled?T3:"#FFF",border:"none",borderRadius:10,padding:sm?"9px 20px":"13px 24px",fontWeight:600,fontSize:sm?13:15,cursor:disabled?"default":"pointer",width:fw?"100%":"auto",fontFamily:FF}}>{children}</button>);
}
function GBtn({children,onClick,sm}){
  return (<button onClick={onClick} style={{background:"transparent",color:T1,border:`1px solid ${BM}`,borderRadius:10,padding:sm?"8px 18px":"12px 22px",fontWeight:500,fontSize:sm?13:15,cursor:"pointer",fontFamily:FF}}>{children}</button>);
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
function Mdl({title,onClose,children,w=520}){
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:24}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#FFF",borderRadius:20,width:"100%",maxWidth:w,padding:"28px 28px 24px",boxShadow:"0 20px 60px rgba(0,0,0,.18)",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
          <span style={{fontSize:18,fontWeight:700,color:T1,fontFamily:FF}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:T3,fontSize:22,lineHeight:1,padding:4}}>&#x2715;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Thumb({art,h=220,onClick}){
  const [fl,setFl]=useState(false);
  if((art.type==="image"||art.type==="gif")&&art.src){
    if(art.isMobile) return (
      <div onClick={onClick} style={{cursor:"pointer"}}>
        <PhoneShell>
          <img src={art.src} alt={art.name} style={{width:"100%",display:"block",maxHeight:480,objectFit:"cover"}}/>
        </PhoneShell>
      </div>
    );
    return (<div onClick={onClick} style={{height:h,borderRadius:12,overflow:"hidden",border:`1px solid ${BD}`,cursor:"pointer"}}><img src={art.src} alt={art.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/></div>);
  }
  if(art.type==="video"&&art.src){
    if(art.isMobile) return (
      <div onClick={onClick} style={{cursor:"pointer"}}>
        <PhoneShell bg="#000">
          <video src={art.src} style={{width:"100%",display:"block",maxHeight:480,objectFit:"cover"}} muted loop playsInline autoPlay/>
        </PhoneShell>
      </div>
    );
    return (
      <div onClick={onClick} style={{height:h,borderRadius:12,overflow:"hidden",border:`1px solid ${BD}`,cursor:"pointer",background:"#000",position:"relative"}}>
        <video src={art.src} style={{width:"100%",height:"100%",objectFit:"cover"}} muted loop playsInline/>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:"rgba(255,255,255,.85)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>&#x25B6;</div>
        </div>
      </div>
    );
  }
  if(art.type==="pdf"&&art.src){
    return (<div onClick={onClick} style={{height:h,borderRadius:12,border:`1px solid ${BD}`,cursor:"pointer",background:"#F8F8F8",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}><span style={{fontSize:40}}>&#x1F4C4;</span><span style={{fontSize:12,color:T2,fontFamily:FF,maxWidth:"90%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{art.name}</span></div>);
  }
  if(art.type==="figma"&&art.src){
    return (
      <div style={{height:h,borderRadius:12,overflow:"hidden",border:`1px solid ${BD}`,position:"relative",background:"#F5F5F5"}}>
        {!fl&&(<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,background:"#F5F5F5",zIndex:1}}><span style={{fontSize:28,opacity:.5}}>&#x2736;</span><span style={{fontSize:12,color:T2,fontFamily:FF}}>Loading Figma...</span></div>)}
        <iframe src={art.src} title={art.name} style={{width:"100%",height:"100%",border:"none"}} onLoad={()=>setFl(true)} allowFullScreen/>
      </div>
    );
  }
  if(art.type==="website"&&art.src){
    if(art.isMobile) return (
      <div onClick={onClick} style={{cursor:"pointer"}}>
        <PhoneShell bg="#FFF">
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

function LBox({art,onClose}){
  useEffect(()=>{
    const fn=e=>{if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",fn);
    return ()=>window.removeEventListener("keydown",fn);
  },[onClose]);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:32}}>
      <button onClick={onClose} style={{position:"absolute",top:20,right:24,background:"none",border:"none",color:"#FFF",fontSize:28,cursor:"pointer"}}>&#x2715;</button>
      <div onClick={e=>e.stopPropagation()} style={{maxWidth:"90vw",maxHeight:"90vh",borderRadius:12,overflow:"hidden",background:"#111"}}>
        {(art.type==="image"||art.type==="gif")&&art.src&&(<img src={art.src} alt={art.name} style={{maxWidth:"90vw",maxHeight:"90vh",objectFit:"contain",display:"block"}}/>)}
        {art.type==="video"&&art.src&&(<video src={art.src} controls autoPlay style={{maxWidth:"90vw",maxHeight:"90vh",display:"block"}}/>)}
        {(art.type==="pdf"||art.type==="figma"||art.type==="website")&&art.src&&(<iframe src={art.src} title={art.name} allowFullScreen style={{width:"80vw",height:"85vh",border:"none",display:"block"}}/>)}
        {!art.src&&(<div style={{width:560,height:340,background:art.thumb||GR[0],display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"rgba(255,255,255,.4)",fontSize:13,fontFamily:FF}}>Seed data placeholder - upload a real file</span></div>)}
      </div>
      <div style={{position:"absolute",bottom:20,left:"50%",transform:"translateX(-50%)"}}>
        <span style={{color:"rgba(255,255,255,.55)",fontSize:13,fontFamily:FF}}>{art.name}</span>
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

function NewArtMdl({onClose,onAdd}){
  const [tab,setTab]=useState("file");
  const [drag,setDrag]=useState(false);
  const [q,setQ]=useState([]);
  const [upl,setUpl]=useState(false);
  const [fu,setFu]=useState(""); const [fn,setFn]=useState(""); const [fd,setFd]=useState("");
  const [su,setSu]=useState(""); const [sn,setSn]=useState(""); const [sd,setSd]=useState("");
  const [vp,setVp]=useState("Desktop (1512x900)");
  const ref=useRef();

  const proc=useCallback(async raw=>{
    const list=Array.from(raw);
    for(const f of list){
      if(isImg(f)||isVid(f)||isPdf(f)){
        try{f._prev=await toURL(f);}catch(e){}
        if(isImg(f)&&f._prev){
          await new Promise(res=>{
            const img=new Image();
            img.onload=()=>{f._iw=img.naturalWidth;f._ih=img.naturalHeight;res();};
            img.onerror=res;
            img.src=f._prev;
          });
        }
        if(isVid(f)&&f._prev){
          await new Promise(res=>{
            const v=document.createElement("video");
            v.onloadedmetadata=()=>{f._iw=v.videoWidth;f._ih=v.videoHeight;res();};
            v.onerror=res;
            v.src=f._prev;
          });
        }
      }
    }
    setQ(list);setUpl(true);
  },[]);

  const done=useCallback(async()=>{
    const arts=[];
    for(const f of q){
      let t="file";
      if(f.type==="image/gif") t="gif";
      else if(isImg(f)) t="image";
      else if(isVid(f)) t="video";
      else if(isPdf(f)) t="pdf";
      const isMobile=f._iw&&f._ih?(f._ih/f._iw>1.3):false;
      arts.push({id:uid(),name:f.name.replace(/\.[^.]+$/,""),type:t,src:f._prev||null,thumb:GR[Math.floor(Math.random()*GR.length)],viewport:null,isMobile});
    }
    onAdd(arts);onClose();
  },[q,onAdd,onClose]);

  if(upl) return (<UplProg files={q} onDone={done}/>);

  const tabs=[{id:"file",icon:"^",label:"File"},{id:"figma",icon:"*",label:"Figma"},{id:"website",icon:"+",label:"Website"}];

  return (
    <Mdl title="New Artifact" onClose={onClose} w={520}>
      <div style={{display:"flex",gap:8,marginBottom:24,background:"#F5F5F5",borderRadius:12,padding:4}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:tab===t.id?"#FFF":"transparent",border:tab===t.id?`1px solid ${BD}`:"1px solid transparent",borderRadius:9,padding:"9px 0",cursor:"pointer",color:tab===t.id?T1:T2,fontWeight:600,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:7,fontFamily:FF}}>
            <span>{t.icon}</span>{t.label}
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
            style={{border:`1.5px dashed ${drag?BK:BM}`,borderRadius:14,padding:"44px 24px",textAlign:"center",marginBottom:20,background:drag?"#F5F5F5":"#FAFAFA",cursor:"pointer",transition:"all .15s"}}>
            <input ref={ref} type="file" multiple accept="image/*,video/*,.pdf,.gif" style={{display:"none"}} onChange={e=>{if(e.target.files.length)proc(e.target.files);}}/>
            <div style={{fontSize:28,marginBottom:12,color:T3}}>&#x2191;</div>
            <p style={{color:T1,fontWeight:600,margin:"0 0 6px",fontSize:15}}>{drag?"Drop files here":"Drag and drop files here"}</p>
            <p style={{color:T1,fontSize:14,margin:"0 0 10px",textDecoration:"underline"}}>or browse files</p>
            <p style={{color:T3,fontSize:12,margin:0}}>Images, videos, GIFs, and PDFs supported</p>
          </div>
          <BBtn fw disabled>Add Artifact</BBtn>
        </>
      )}

      {tab==="figma" && (
        <div style={{display:"flex",flexDirection:"column",gap:16,marginBottom:24}}>
          <Fld label="Figma URL"><TIn af ph="https://www.figma.com/design/..." val={fu} set={v=>{setFu(v);if(!fn)setFn(v.split("/").filter(Boolean).pop()||"");}} /></Fld>
          <Fld label="Name"><TIn ph="Frame or file name" val={fn} set={setFn}/></Fld>
          <Fld label="Description (optional)"><TIn ph="Add a description..." val={fd} set={setFd} multi/></Fld>
          <div style={{background:"#FFFBEB",border:"1px solid #F0D060",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#7A6000",fontFamily:FF,lineHeight:1.5}}>
            Paste any Figma file, frame, or prototype link. The file must be set to "Anyone with the link can view" in Figma share settings.
          </div>
          <BBtn fw disabled={!fu.trim()} onClick={()=>{onAdd([{id:uid(),name:fn||fu,type:"figma",src:figEmbed(fu),thumb:GR[1],viewport:null}]);onClose();}}>Add Figma Artifact</BBtn>
        </div>
      )}

      {tab==="website" && (
        <div style={{display:"flex",flexDirection:"column",gap:16,marginBottom:24}}>
          <Fld label="URL">
            <div style={{position:"relative"}}>
              <TIn af ph="https://weedmaps.com" val={su} set={v=>{setSu(v);if(!sn)setSn(v.replace(/https?:\/\//,"").split("/")[0]);}}/>
              <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"#F0F0F0",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:700,color:T2}}>Quick</span>
            </div>
          </Fld>
          <Fld label="Viewport"><TSel val={vp} set={setVp} opts={Object.keys(VPS)}/></Fld>
          <Fld label="Name"><TIn ph="weedmaps.com" val={sn} set={setSn}/></Fld>
          <Fld label="Description (optional)"><TIn ph="Add a description..." val={sd} set={setSd} multi/></Fld>
          <BBtn fw disabled={!su.trim()} onClick={()=>{onAdd([{id:uid(),name:sn||su,type:"website",src:ensureHttp(su),thumb:GR[3],viewport:vp,isMobile:vp.includes("390")||vp.includes("Mobile")}]);onClose();}}>Add Website Artifact</BBtn>
        </div>
      )}
    </Mdl>
  );
}

function NewProjMdl({onClose,onCreate}){
  const [nm,setNm]=useState(""); const [ds,setDs]=useState(""); const [fl,setFl]=useState(1);
  return (
    <Mdl title="New Project" onClose={onClose} w={480}>
      <div style={{display:"flex",flexDirection:"column",gap:16,marginBottom:24}}>
        <Fld label="Project Name"><TIn af ph="e.g. Search Redesign" val={nm} set={setNm}/></Fld>
        <Fld label="Description (optional)"><TIn ph="What is this project about?" val={ds} set={setDs} multi/></Fld>
        <Fld label="Folder"><TSel val={fl} set={v=>setFl(Number(v))} opts={FOLDERS.map(f=>({v:f.id,l:f.name}))}/></Fld>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <GBtn sm onClick={onClose}>Cancel</GBtn>
        <BBtn disabled={!nm.trim()} onClick={()=>{onCreate({name:nm.trim(),desc:ds,folder:fl,artifactCount:0,pages:[{id:"p1",label:"1",name:"Page 1"}],thumbs:[],artifacts:{p1:[]},rows:["R1"]});onClose();}}>Create Project</BBtn>
      </div>
    </Mdl>
  );
}

function NewFolderMdl({onClose,projects}){
  const [nm,setNm]=useState(""); const [ds,setDs]=useState(""); const [srch,setSrch]=useState("");
  const fp=projects.filter(p=>p.name.toLowerCase().includes(srch.toLowerCase()));
  return (
    <Mdl title="New Folder" onClose={onClose} w={600}>
      <div style={{display:"flex",gap:20,marginBottom:24}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:16}}>
          <Fld label="Folder Name"><TIn af ph="e.g. Q3 Initiatives" val={nm} set={setNm}/></Fld>
          <Fld label="Description"><TIn ph="What goes in this folder?" val={ds} set={setDs} multi/></Fld>
        </div>
        <div style={{flex:1}}>
          <label style={{fontSize:13,color:T2,display:"block",marginBottom:8,fontWeight:500}}>Add Projects</label>
          <div style={{border:`1px solid ${BD}`,borderRadius:10,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",padding:"0 12px",borderBottom:`1px solid ${BD}`}}>
              <span style={{color:T3,fontSize:14}}>&#x2315;</span>
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

function PubMdl({art,onClose}){
  const [nm,setNm]=useState(art?art.name:""); const [ds,setDs]=useState(""); const [done,setDone]=useState(false);
  if(done){
    return (
      <Mdl title="" onClose={onClose} w={400}>
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
    <Mdl title="Publish to Feed" onClose={onClose} w={480}>
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

function SaveMdl({art,projects,onClose}){
  const [pj,setPj]=useState(projects[0]?projects[0].id:1); const [pg,setPg]=useState("p1");
  const proj=projects.find(x=>x.id===pj)||projects[0];
  return (
    <Mdl title="Save to Project" onClose={onClose} w={420}>
      <div style={{display:"flex",flexDirection:"column",gap:16,marginBottom:24}}>
        <Fld label="Project"><TSel val={pj} set={v=>{setPj(Number(v));setPg("p1");}} opts={projects.map(p=>({v:p.id,l:p.name}))}/></Fld>
        <Fld label="Page"><TSel val={pg} set={setPg} opts={(proj?proj.pages:[]).map(p=>({v:p.id,l:p.name}))}/></Fld>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <GBtn onClick={onClose}>Cancel</GBtn>
        <BBtn onClick={onClose}>Save</BBtn>
      </div>
    </Mdl>
  );
}

function ArtTile({art,onPublish,onSave,onOpen}){
  const [hov,setHov]=useState(false); const [menu,setMenu]=useState(false);
  return (
    <div style={{position:"relative"}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>{setHov(false);setMenu(false);}}>
      <Thumb art={art} onClick={()=>onOpen(art)}/>
      {hov&&(
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6}}>
          <button onClick={e=>{e.stopPropagation();onSave(art);}} style={{background:"rgba(255,255,255,.94)",border:`1px solid ${BM}`,borderRadius:8,padding:"6px 12px",color:T1,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FF}}>Save</button>
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
          <button onClick={()=>setMenu(false)} onMouseEnter={e=>e.currentTarget.style.background="#FEF2F2"} onMouseLeave={e=>e.currentTarget.style.background="none"} style={{display:"block",width:"100%",background:"none",border:"none",padding:"10px 16px",color:"#DC2626",fontSize:14,textAlign:"left",cursor:"pointer",fontFamily:FF}}>Delete</button>
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
function PhoneShell({children,bg="#000"}){
  // iPhone 17: 393×852pt logical → 2.168:1 ratio. Screen width 220px → minHeight 477px.
  return (
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",
                 background:"#E8E8E8",padding:"18px 22px 24px"}}>
      <div style={{position:"relative",width:220}}>
        <div style={{
          background:"#1C1C1E",borderRadius:48,padding:"12px 8px",
          boxShadow:"0 0 0 1.5px #0A0A0A, inset 0 0 0 1px #333",
          position:"relative",
        }}>
          {/* Dynamic Island — iPhone 17 pill */}
          <div style={{
            position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",
            width:72,height:20,background:"#000",borderRadius:10,zIndex:10,
          }}/>
          {/* Screen — minHeight enforces iPhone 17 proportions */}
          <div style={{
            borderRadius:38,overflow:"hidden",
            background:bg,
            position:"relative",
            minHeight:477,
          }}>
            {children}
          </div>
          {/* Side buttons */}
          <div style={{position:"absolute",left:-4,top:"18%",width:4,height:26,background:"#333",borderRadius:"2px 0 0 2px"}}/>
          <div style={{position:"absolute",left:-4,top:"28%",width:4,height:48,background:"#333",borderRadius:"2px 0 0 2px"}}/>
          <div style={{position:"absolute",left:-4,top:"42%",width:4,height:48,background:"#333",borderRadius:"2px 0 0 2px"}}/>
          <div style={{position:"absolute",right:-4,top:"28%",width:4,height:68,background:"#333",borderRadius:"0 2px 2px 0"}}/>
        </div>
      </div>
    </div>
  );
}

function ExploreCard({item,onSave,onOpen}){
  const [hov,setHov]=useState(false);
  const [ifErr,setIfErr]=useState(false);
  const isMock=item.type==="mockup"&&item.mock;
  const isMobile=item.isMobile===true;

  // Timeout to detect iframe load failure (X-Frame-Options blocking)
  const ifRef=useRef();
  useEffect(()=>{
    if(isMobileWebsite&&ifRef.current&&!ifErr){
      const t=setTimeout(()=>setIfErr(true),3000);
      return ()=>clearTimeout(t);
    }
  },[isMobileWebsite,ifErr]);

  // For mobile website viewport, render scaled iframe inside phone shell
  const isMobileWebsite=item.type==="website"&&item.src&&isMobile;
  const isMobileMedia=(item.type==="image"||item.type==="gif"||item.type==="video")&&item.src&&isMobile;

  return (
    <div
      style={{breakInside:"avoid",marginBottom:16,borderRadius:12,overflow:"hidden",
              position:"relative",cursor:"pointer",background:"#EBEBEB"}}
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
        <PhoneShell>
          {(item.type==="image"||item.type==="gif") && (
            <img src={item.src} alt={item.name}
              style={{width:"100%",display:"block",maxHeight:480,objectFit:"cover"}}/>
          )}
          {item.type==="video" && (
            <video src={item.src} style={{width:"100%",display:"block",maxHeight:480,objectFit:"cover"}}
              muted loop playsInline autoPlay/>
          )}
        </PhoneShell>
      )}
      {isMobileWebsite && (
        <PhoneShell bg="#FFF">
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
      {!isMock&&!isMobileMedia&&!isMobileWebsite && (
        <Thumb art={item} h={320}/>
      )}
      {hov&&(
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.1)",
                     display:"flex",alignItems:"flex-start",justifyContent:"flex-end",padding:10}}>
          <button
            onClick={e=>{e.stopPropagation();onSave(item);}}
            style={{background:"rgba(255,255,255,.96)",border:"none",borderRadius:8,
                    padding:"6px 14px",color:T1,fontSize:12,fontWeight:600,
                    cursor:"pointer",fontFamily:FF}}
          >Save</button>
        </div>
      )}
    </div>
  );
}

function Explore({feed,projects,onSave}){
  const [lb,setLb]=useState(null);
  return (
    <div style={{padding:"16px 0"}}>
      <div style={{columns:"4 270px",gap:16}}>
        {feed.map(item=>(
          <ExploreCard key={item.id} item={item} onSave={onSave} onOpen={setLb}/>
        ))}
      </div>
      {lb&&(<LBox art={lb} onClose={()=>setLb(null)}/>)}
    </div>
  );
}

function ProjCard({project,onOpen}){
  const [hov,setHov]=useState(false);
  const mock=DMOCKS[(project.id-1)%DMOCKS.length];
  const pad=mock.device==="iphone"?"20px 28px 20px":mock.device==="ipad"?"14px 12px":"10px 8px";
  const bg=mock.device==="iphone"?"#F0F0F0":mock.device==="ipad"?"#EAEAEA":"#E6E6E6";
  return (
    <div style={{breakInside:"avoid",marginBottom:16,borderRadius:12,overflow:"hidden",position:"relative",cursor:"pointer",background:"#EBEBEB"}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={()=>onOpen(project)}>
      <div style={{padding:pad,background:bg}}>
        <MockSVG mock={mock}/>
      </div>
      {hov&&(
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:14}}>
          <p style={{margin:"0 0 2px",fontWeight:700,fontSize:14,color:"#FFF",fontFamily:FF}}>{project.name}</p>
          <p style={{margin:0,fontSize:12,color:"rgba(255,255,255,.7)",fontFamily:FF}}>{project.artifactCount} artifact{project.artifactCount!==1?"s":""}</p>
        </div>
      )}
    </div>
  );
}

function Projects({projects,onOpen}){
  return (
    <div style={{padding:"16px 0"}}>
      <div style={{display:"flex",gap:12,flexWrap:"nowrap",overflowX:"auto",marginBottom:24,paddingBottom:4}}>
        {FOLDERS.map(f=>(
          <div key={f.id} style={{background:"#FFF",border:`1px solid ${BD}`,borderRadius:12,padding:"14px 20px",minWidth:140,flexShrink:0,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#F0F0F0";e.currentTarget.style.borderColor=BM;}} onMouseLeave={e=>{e.currentTarget.style.background="#FFF";e.currentTarget.style.borderColor=BD;}}>
            <div>
              <p style={{margin:"0 0 2px",fontWeight:600,fontSize:13,color:T1,fontFamily:FF}}>{f.name}</p>
              <p style={{margin:0,fontSize:11,color:T3,fontFamily:FF}}>{f.count} projects</p>
            </div>
            <span style={{color:T3,fontSize:16}}>&#x2192;</span>
          </div>
        ))}
      </div>
      <div style={{columns:"5 200px",gap:16}}>
        {projects.map(p=>(<ProjCard key={p.id} project={p} onOpen={onOpen}/>))}
      </div>
    </div>
  );
}

function ProjDetail({project,projects,onBack}){
  const [ap,setAp]=useState(project.pages[0].id);
  const [arts,setArts]=useState(project.artifacts);
  const [pages,setPages]=useState(project.pages);
  const [showNew,setShowNew]=useState(false);
  const [pub,setPub]=useState(null);
  const [save,setSave]=useState(null);
  const [lb,setLb]=useState(null);

  const pa=arts[ap]||[];

  const addArts=list=>{
    setArts(prev=>({...prev,[ap]:[...(prev[ap]||[]),...list]}));
  };

  const addPage=()=>{
    const id="pg"+uid();
    const num=pages.length+1;
    const np={id,label:String(num),name:"Page "+num};
    setPages(prev=>[...prev,np]);
    setArts(prev=>({...prev,[id]:[]}));
    setAp(id);
  };

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:PG,fontFamily:FF}}>
      <div style={{background:"#FFF",borderBottom:`1px solid ${BD}`,display:"flex",alignItems:"center",padding:"0 24px",height:54,flexShrink:0,position:"relative"}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:T2,fontSize:22,marginRight:12,padding:0}}>&#x2190;</button>
        <span style={{fontSize:16,fontWeight:700,color:T1}}>{project.name}</span>
        <div style={{position:"absolute",left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",gap:6}}>
          {pages.map(pg=>(
            <button key={pg.id} onClick={()=>setAp(pg.id)} style={{background:ap===pg.id?BK:"transparent",border:`1px solid ${ap===pg.id?BK:BM}`,borderRadius:20,cursor:"pointer",fontFamily:FF,padding:ap===pg.id?"5px 14px":"0",width:ap===pg.id?"auto":28,height:28,color:ap===pg.id?"#FFF":T2,fontWeight:ap===pg.id?700:500,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
              {ap===pg.id?`${pg.label}  ${pg.name}`:pg.label}
            </button>
          ))}
          <button onClick={addPage} style={{width:28,height:28,borderRadius:"50%",background:BK,border:"none",color:"#FFF",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:8}}>
          <GBtn sm onClick={()=>{}}>Share</GBtn>
          <BBtn sm onClick={()=>setShowNew(true)}>+ New Artifact</BBtn>
        </div>
      </div>
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{width:88,padding:"20px 0 20px 20px",borderRight:`1px solid ${BD}`,background:"#FFF",flexShrink:0,display:"flex",flexDirection:"column",gap:4}}>
          {project.rows.map(r=>(
            <div key={r} style={{fontSize:13,color:T3,fontWeight:600,padding:"8px 10px 8px 0",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.color=T1} onMouseLeave={e=>e.currentTarget.style.color=T3}>{r}</div>
          ))}
        </div>
        <div style={{flex:1,overflowX:"auto",padding:"20px 28px"}}>
          {pa.length===0 ? (
            <div style={{height:"100%",minHeight:260,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
              <div style={{fontSize:48,color:BM}}>&#x25FB;</div>
              <p style={{margin:0,fontSize:15,color:T3,fontFamily:FF}}>No artifacts yet on this page</p>
              <BBtn onClick={()=>setShowNew(true)}>+ Add First Artifact</BBtn>
            </div>
          ) : (
            <div style={{display:"flex",gap:20,minWidth:"max-content"}}>
              {pa.map(art=>(
                <div key={art.id} style={{width:280,flexShrink:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,minHeight:22}}>
                    <span style={{fontSize:12,color:T3,fontWeight:500,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{art.name}</span>
                    <Bdg type={art.type}/>
                  </div>
                  <ArtTile art={art} onPublish={setPub} onSave={setSave} onOpen={setLb}/>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showNew&&(<NewArtMdl onClose={()=>setShowNew(false)} onAdd={addArts}/>)}
      {pub&&(<PubMdl art={pub} onClose={()=>setPub(null)}/>)}
      {save&&(<SaveMdl art={save} projects={projects} onClose={()=>setSave(null)}/>)}
      {lb&&(<LBox art={lb} onClose={()=>setLb(null)}/>)}
    </div>
  );
}

function Profile({user,feed}){
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
        {uf.map(item=>(<ExploreCard key={item.id} item={item} onSave={()=>{}} onOpen={()=>{}}/>))}
      </div>
    </div>
  );
}

export default function App(){
  const [view,setView]=useState("explore");
  const [proj,setProj]=useState(null);
  const [projects,setProjects]=useState(SPROJ);
  const [feed,setFeed]=useState(SFEED);
  const [srch,setSrch]=useState(""); const [sf,setSf]=useState(false);
  const [newP,setNewP]=useState(false); const [newF,setNewF]=useState(false);
  const [uplFeed,setUplFeed]=useState(false);
  const [saveIt,setSaveIt]=useState(null);
  const [isMobile,setIsMobile]=useState(()=>window.innerWidth<=640);
  const [mobileMenu,setMobileMenu]=useState(false);
  const [searchExp,setSearchExp]=useState(false);
  const searchRef=useRef(null);
  useEffect(()=>{
    const onResize=()=>setIsMobile(window.innerWidth<=640);
    window.addEventListener("resize",onResize);
    return()=>window.removeEventListener("resize",onResize);
  },[]);
  useEffect(()=>{
    if(searchExp&&searchRef.current)searchRef.current.focus();
  },[searchExp]);

  if(view==="project"&&proj){
    return (<ProjDetail project={proj} projects={projects} onBack={()=>setView("projects")}/>);
  }

  const open=p=>{setProj(p);setView("project");};
  const create=p=>{
    const n={...p,id:Date.now(),thumbs:[]};
    setProjects(prev=>[...prev,n]);
    open(n);
  };
  const addToFeed=arts=>{
    const items=arts.map(a=>({...a,user:ME,id:"upl"+uid()}));
    setFeed(prev=>[...items,...prev]);
  };
  const filtProj=projects.filter(p=>!srch||p.name.toLowerCase().includes(srch.toLowerCase()));

  return (
    <div style={{minHeight:"100vh",background:PG,fontFamily:FF}}>
      <nav style={{background:"#FFF",borderBottom:`1px solid ${BD}`,display:"flex",alignItems:"center",gap:12,padding:"0 20px",height:52,position:"sticky",top:0,zIndex:100}}>
        {!isMobile&&(<>
          <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0,marginRight:4}}>
            <img src="https://cdn.builder.io/api/v1/image/assets%2Fc65332bdb1b641359feb3e4d8ecc47de%2F74e1336a6c56406e884d27bcf1b26ce4?format=webp&width=800&height=1200" alt="The Stash" style={{width:28,height:28,borderRadius:"50%",objectFit:"cover",display:"block"}}/>
            <span style={{fontFamily:FF,fontWeight:800,fontSize:15,letterSpacing:".04em",color:T1,textTransform:"uppercase"}}>The Stash</span>
          </div>
          <div style={{display:"flex",gap:2,background:"#F0F0F0",borderRadius:20,padding:3}}>
            {["Explore","Projects"].map(v=>(
              <button key={v} onClick={()=>setView(v.toLowerCase())} style={{background:view===v.toLowerCase()?"#FFF":"transparent",border:view===v.toLowerCase()?`1px solid ${BD}`:"1px solid transparent",borderRadius:16,padding:"6px 18px",color:view===v.toLowerCase()?T1:T2,fontWeight:view===v.toLowerCase()?600:400,fontSize:14,cursor:"pointer",fontFamily:FF}}>{v}</button>
            ))}
          </div>
          <div style={{flex:1,maxWidth:520,margin:"0 auto",position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T3,fontSize:16,pointerEvents:"none"}}>&#x2315;</span>
            <input value={srch} onChange={e=>setSrch(e.target.value)} onFocus={()=>setSf(true)} onBlur={()=>setSf(false)} placeholder="Search" style={{width:"100%",boxSizing:"border-box",background:sf?"#FFF":"#F5F5F5",border:`1px solid ${sf?BM:"transparent"}`,borderRadius:22,padding:"7px 16px 7px 36px",color:T1,fontSize:14,outline:"none",fontFamily:FF,transition:"all .15s"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            {view==="projects"&&(<><GBtn sm onClick={()=>setNewF(true)}>New Folder</GBtn><BBtn sm onClick={()=>setNewP(true)}>+ New Project</BBtn></>)}
            {view==="explore"&&(<BBtn sm onClick={()=>setUplFeed(true)}>Upload</BBtn>)}
            <button onClick={()=>setView("profile")} style={{background:"none",border:"none",cursor:"pointer",borderRadius:"50%",padding:0}}><Av user={ME} size={32}/></button>
            <button style={{background:"none",border:`1px solid ${BD}`,borderRadius:8,width:32,height:32,cursor:"pointer",color:T2,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>&#x2699;</button>
          </div>
        </>)}
        {isMobile&&(<>
          {!searchExp&&(<>
            <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
              <img src="https://cdn.builder.io/api/v1/image/assets%2Fc65332bdb1b641359feb3e4d8ecc47de%2F74e1336a6c56406e884d27bcf1b26ce4?format=webp&width=800&height=1200" alt="The Stash" style={{width:28,height:28,borderRadius:"50%",objectFit:"cover",display:"block"}}/>
              <span style={{fontFamily:FF,fontWeight:800,fontSize:15,letterSpacing:".04em",color:T1,textTransform:"uppercase"}}>The Stash</span>
            </div>
            <div style={{flex:1}}/>
            <button onClick={()=>setSearchExp(true)} style={{width:34,height:34,borderRadius:"50%",background:"#F0F0F0",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T2,fontSize:22,flexShrink:0}}>&#x2315;</button>
            <button onClick={()=>setUplFeed(true)} style={{width:34,height:34,borderRadius:"50%",background:BK,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",fontSize:22,lineHeight:1,flexShrink:0}}>+</button>
            <div style={{position:"relative",flexShrink:0}}>
              <button onClick={()=>setMobileMenu(v=>!v)} style={{width:34,height:34,borderRadius:"50%",background:"#F0F0F0",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T1,fontSize:18}}>&#x22EF;</button>
              {mobileMenu&&(<div onClick={()=>setMobileMenu(false)} style={{position:"fixed",inset:0,zIndex:199}}/>)}
              {mobileMenu&&(
                <div style={{position:"absolute",top:42,right:0,background:"#FFF",border:`1px solid ${BD}`,borderRadius:12,boxShadow:"0 4px 20px rgba(0,0,0,.1)",minWidth:160,zIndex:200,overflow:"hidden"}}>
                  {["Explore","Projects"].map(v=>(
                    <button key={v} onClick={()=>{setView(v.toLowerCase());setMobileMenu(false);}} style={{display:"block",width:"100%",textAlign:"left",background:view===v.toLowerCase()?"#F5F5F5":"transparent",border:"none",padding:"12px 16px",fontSize:15,fontFamily:FF,color:view===v.toLowerCase()?T1:T2,fontWeight:view===v.toLowerCase()?600:400,cursor:"pointer"}}>{v}</button>
                  ))}
                  <div style={{height:1,background:BD,margin:"4px 0"}}/>
                  <button onClick={()=>{setView("profile");setMobileMenu(false);}} style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",padding:"12px 16px",fontSize:15,fontFamily:FF,color:T2,cursor:"pointer"}}>Profile</button>
                </div>
              )}
            </div>
          </>)}
          {searchExp&&(<>
            <div style={{flex:1,position:"relative"}}>
              <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T3,fontSize:16,pointerEvents:"none"}}>&#x2315;</span>
              <input ref={searchRef} value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search" style={{width:"100%",boxSizing:"border-box",background:"#F5F5F5",border:`1px solid ${BM}`,borderRadius:22,padding:"7px 16px 7px 36px",color:T1,fontSize:14,outline:"none",fontFamily:FF}}/>
            </div>
            <button onClick={()=>{setSearchExp(false);setSrch("");}} style={{width:34,height:34,borderRadius:"50%",background:"#F0F0F0",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T1,fontSize:16,flexShrink:0}}>&#x2715;</button>
          </>)}
        </>)}
      </nav>
      <main style={{maxWidth:1440,margin:"0 auto",padding:"0 28px"}}>
        {view==="explore"&&(<Explore feed={feed} projects={projects} onSave={setSaveIt}/>)}
        {view==="projects"&&(<Projects projects={filtProj} onOpen={open}/>)}
        {view==="profile"&&(<Profile user={ME} feed={feed}/>)}
      </main>
      {newP&&(<NewProjMdl onClose={()=>setNewP(false)} onCreate={create}/>)}
      {newF&&(<NewFolderMdl onClose={()=>setNewF(false)} projects={projects}/>)}
      {uplFeed&&(<NewArtMdl onClose={()=>setUplFeed(false)} onAdd={addToFeed}/>)}
      {saveIt&&(<SaveMdl art={saveIt} projects={projects} onClose={()=>setSaveIt(null)}/>)}
    </div>
  );
}
