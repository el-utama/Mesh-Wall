import {Control} from "./control.mjs";
import {normalizeNodes} from "./model.mjs";
import {$} from "./ui.mjs";
import {createWall} from "./wall.mjs";
import {createPanels} from "./panels.mjs";
import {createManagement} from "./management.mjs";
import {createAdmin} from "./admin.mjs";
const notice=t=>$("notice").textContent=t;
let user=null,groups=[],devices=[],cookies=null,page="overview",refreshing=false,lastInventory=0;
const descriptions={overview:"Connection and device summary.",wall:"Monitor authorized screens and customize the wall.",devices:"Find and manage enrolled PCs.",groups:"Organize devices and create time-limited invitations.",users:"Review authorized accounts and access.",activity:"Review recent engine events.",settings:"Inspect connection and engine diagnostics."};
const pages={overview:"Overview",wall:"MeshWall",devices:"Devices",groups:"Groups & enrollment",users:"Users & permissions",activity:"Activity",settings:"Settings / diagnostics"};
const control=new Control(onMessage,status=>{
  $("connection").textContent=status;$("connection").dataset.kind=control.authenticated?"online":"offline";
  if(!control.authenticated){wall.stopAll();user=null;cookies=null;devices=[];groups=[];lastInventory=0;admin.clear();$("account").textContent="Not authenticated";$("login").hidden=false;$("logout").hidden=true;if(!panels.isLogin())panels.close();render();notice("Sign in securely using the engine authentication panel. No device access without authentication.");}
});
const panels=createPanels({control,onLoginLoad:()=>{if(!control.authenticated){control.close();control.start();}},onClose:()=>{}});
const wall=createWall({control,getUser:()=>user,getDevices:()=>devices,getCookies:()=>cookies,getLastInventory:()=>lastInventory,isActive:()=>page==="wall",notice,onStats:stats});
const management=createManagement({control,getDevices:()=>devices,getGroups:()=>groups,refresh,notice,panels});
const admin=createAdmin({control,panels});
function onMessage(m){
  if(m.action==="userinfo"){const changed=user?._id!==m.userinfo._id;user=m.userinfo;if(changed)wall.loadLayout();$("account").textContent=String(user.name||user._id);$("login").hidden=true;$("logout").hidden=false;if(panels.isLogin())panels.close();notice("Authenticated. Inventory is loading; streams are opt-in.");refresh();admin.onPage(page);}
  if(m.action==="serverinfo")$("engine").textContent=String(m.serverinfo?.serverVersion||m.serverinfo?.version||"MeshCentral");
  if(m.action==="authcookie"&&typeof m.cookie==="string"&&typeof m.rcookie==="string"){cookies={cookie:m.cookie,rcookie:m.rcookie};wall.schedule();}
  if(m.action==="event"){const action=m.event?.action;if(["changenode","removenode","nodeconnect","meshchange","deletemesh","accountchange","usergroupchange","nodemeshchange","createmesh","addnode"].includes(action)){if(action!=="nodeconnect")wall.stopAll();refresh();}}
  admin.onMessage(m);
}
async function refresh(){
  if(!control.authenticated||refreshing)return;refreshing=true;const session=control.socket;
  try{const g=await control.requestTagged("meshes");if(!Array.isArray(g.meshes))throw Error("Invalid groups");
    const response=await control.request("nodes",{skip:0,limit:100,filter:""});if(control.socket!==session||!control.authenticated)return;
    const result=normalizeNodes(response.nodes,g.meshes);groups=g.meshes;
    if(response.totalcount>100||result.length>100)notice("More than 100 authorized devices exist; this preview displays the first 100.");
    devices=result.slice(0,100);lastInventory=Date.now();if($("notice").textContent==="Authenticated. Inventory is loading; streams are opt-in.")notice("Connected to MeshCentral. Start viewing only authorized devices.");$("lastRefresh").textContent=new Date(lastInventory).toLocaleTimeString();
    wall.reconcile(new Set(devices.filter(d=>d.online).map(d=>d.id)));control.send({action:"authcookie"});render();
  }catch{if(control.socket===session){wall.stopAll();devices=[];groups=[];lastInventory=0;render();notice("Inventory unavailable. All live sessions stopped. Check login, engine version and connectivity.");}}
  finally{refreshing=false;if(control.authenticated&&control.socket!==session)refresh();}
}
function stats(){$("total").textContent=user?devices.length:"—";$("online").textContent=user?devices.filter(d=>d.online).length:"—";$("offline").textContent=user?devices.filter(d=>!d.online).length:"—";$("streams").textContent=wall.count();}
function render(){stats();if(page==="wall")wall.render();if(page==="devices")management.renderDevices();if(page==="groups")management.renderGroups();}
function setPage(p){if(!Object.hasOwn(pages,p))return;if(page==="wall"&&p!=="wall")wall.stopAll();page=p;for(const name of Object.keys(pages))$(name).hidden=name!==p;for(const b of document.querySelectorAll("nav [data-page]")){b.classList.toggle("active",b.dataset.page===p);if(b.dataset.page===p)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");}$("title").textContent=pages[p];$("pageDescription").textContent=descriptions[p];admin.onPage(p);render();}
for(const b of document.querySelectorAll("[data-page]"))b.onclick=()=>setPage(b.dataset.page);
const narrowNav=matchMedia("(max-width:800px)");
const navKey=()=>narrowNav.matches?"meshwall-nav-mobile-collapsed":"meshwall-nav-collapsed";
function navCollapsed(value,persist=true){document.body.classList.toggle("nav-collapsed",value);$("navToggle").setAttribute("aria-expanded",String(!value));$("navToggle").setAttribute("aria-label",value?"Expand navigation":"Collapse navigation");if(persist)try{localStorage.setItem(navKey(),String(value));}catch{}}
function restoreNav(){let value=narrowNav.matches;try{const saved=localStorage.getItem(navKey());if(saved!==null)value=saved==="true";}catch{}navCollapsed(value,false);}
narrowNav.addEventListener("change",restoreNav);restoreNav();$("navToggle").onclick=()=>navCollapsed(!document.body.classList.contains("nav-collapsed"));
$("refresh").onclick=()=>control.authenticated?refresh():control.start();$("login").onclick=e=>{e.preventDefault();panels.signIn();};
$("logout").onclick=()=>{wall.stopAll();panels.close();};$("origin").textContent=location.origin;
document.addEventListener("visibilitychange",()=>{if(document.hidden)wall.stopAll();else refresh();});window.addEventListener("pagehide",()=>{wall.stopAll();panels.close();control.close();});
setInterval(()=>{if(control.authenticated){if(Date.now()-lastInventory>45000)wall.stopAll();refresh();}},15000);setPage("overview");control.start();
