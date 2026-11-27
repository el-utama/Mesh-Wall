import {createDesktop} from "./desktop.mjs";
import {sanitizeLayout,orderedDevices,nextSessions,clampInt} from "./model.mjs";
import {$,el,matches} from "./ui.mjs";
import {buildTile,paintTile} from "./tile-view.mjs";
export function createWall({control,getUser,getDevices,getCookies,getLastInventory,isActive,notice,onStats}){
 let layout=sanitizeLayout({}),focus=null,selected=null,queueTimer=null,effective=4;
 const active=new Map(),requested=new Set(),tiles=new Map(),states=new Map(),grid=$("grid"),workspace=grid.parentElement;
 let presets=[{name:"Default",layout:sanitizeLayout({})}],current="Default";
 const key=()=>getUser()?"meshwall-presets-v2:"+getUser()._id:null;
 const limit=()=>clampInt($("limit").value,1,100,4);
 const visible=()=>orderedDevices(getDevices(),layout).filter(d=>matches(d,$("wallSearch").value)&&(!$("wallGroup").value||d.group===$("wallGroup").value)&&($("wallStatus").value==="all"||d.online===($("wallStatus").value==="online")));
 const dims=id=>layout.sizes[id]||{cols:1,rows:1};
 const device=id=>getDevices().find(d=>d.id===id);
 const stateOf=d=>!d.online?"Offline":states.get(d.id)||"Ready";
 function refreshPresets(){const s=$("preset");s.replaceChildren();for(const p of presets){const o=el("option",p.name);o.value=p.name;s.append(o);}s.value=current;$("presetName").value=current;}
 function loadLayout(){
  let raw;try{raw=JSON.parse(localStorage.getItem(key())||"null");}catch{}
  if(raw&&Array.isArray(raw.presets)){const seen=new Set();presets=raw.presets.filter(p=>typeof p?.name==="string"&&p.name.trim()&&p.name.length<=40&&!seen.has(p.name)&&(seen.add(p.name),true)).slice(0,10).map(p=>({name:p.name,layout:sanitizeLayout(p.layout)}));}
  else{let legacy;try{legacy=JSON.parse(localStorage.getItem("meshwall-layout-v1:"+getUser()._id)||"{}");}catch{}presets=[{name:"Default",layout:sanitizeLayout(legacy)}];}
  if(!presets.length)presets=[{name:"Default",layout:sanitizeLayout({})}];
  current=presets.some(p=>p.name===raw?.current)?raw.current:presets[0].name;applyPreset();refreshPresets();
 }
 function persist(){if(!key())return false;try{localStorage.setItem(key(),JSON.stringify({current,presets}));return true;}catch{notice("Unable to save layout.");return false;}}
 function saveLayout(){if(!key())return;const name=$("presetName").value.trim().slice(0,40)||current;if(!presets.some(p=>p.name===name)&&presets.length>=10){notice("Maximum 10 saved layouts. Delete one first.");return;}const entry={name,layout:sanitizeLayout(layout)},idx=presets.findIndex(p=>p.name===name);if(idx>=0)presets[idx]=entry;else presets.push(entry);current=name;if(persist())notice("Layout saved locally for this account.");refreshPresets();$("layoutOptions").open=false;}
 function applyPreset(){layout=sanitizeLayout(presets.find(p=>p.name===current)?.layout);setFocus(null);$("columns").value=layout.columns;}
 function setFocus(id){const old=focus;focus=id;if(old&&old!==id)active.get(old)?.quality($("quality").value,false);if(id)active.get(id)?.quality($("quality").value,true);}
 function select(id){if(!tiles.has(id))return;selected=id;workspace.classList.add("has-inspector");renderWall();if(matchMedia("(max-width:800px)").matches)$("tileInspector").scrollIntoView({block:"nearest"});}
 function closeInspector(){const t=tiles.get(selected);selected=null;setFocus(null);workspace.classList.remove("has-inspector");renderWall();t?.screen.focus({preventScroll:true});}
 function geometry(){
  if(!isActive()||grid.clientWidth<=0)return;
  effective=Math.max(1,Math.min(layout.columns,Math.floor((grid.clientWidth+8)/108)));
  grid.style.setProperty("--visible-cols",effective);grid.classList.toggle("dense",effective>=6);
  $("effectiveColumns").textContent=effective===layout.columns?effective+" columns":effective+" / "+layout.columns+" columns · responsive";
  for(const [id,t] of tiles){const s=dims(id);t.root.style.setProperty("--w",Math.min(s.cols,effective));t.root.style.setProperty("--h",s.rows);}
 }
 const observer=new ResizeObserver(geometry);observer.observe(grid);
 function updateSummary(){const ds=visible();$("wallCount").textContent=ds.length+" devices · "+ds.filter(d=>d.online).length+" online";$("wallSessions").textContent=active.size+" active · "+Math.max(0,requested.size-active.size)+" queued";$("startAll").disabled=!control.authenticated||!ds.some(d=>d.online&&!requested.has(d.id))||requested.size>=limit();$("stopAll").disabled=requested.size===0&&active.size===0;}
 function updateInspector(){
  const d=device(selected),t=tiles.get(selected);
  if(!d||!t){$("selectedControls").hidden=true;return;}
  $("selectedName").textContent=d.name;$("selectedGroup").textContent=d.groupName+" · "+(d.online?"Agent online":"Agent offline");$("selectedControls").hidden=false;
  $("selectedState").textContent=stateOf(d);$("selectedLast").textContent=t.lastDraw?"Last drawn "+new Date(t.lastDraw).toLocaleTimeString()+(Date.now()-t.lastDraw>30000?" · no recent screen change":""):"No frame received";
  $("selectedStart").textContent=requested.has(d.id)?"Stop viewing":"Start viewing";$("selectedStart").disabled=!control.authenticated||!d.online||(!requested.has(d.id)&&requested.size>=limit());
  const s=$("selectedMonitor"),entries=Object.entries(t.displays);
  const signature=JSON.stringify(entries);if(s.dataset.signature!==signature){s.replaceChildren();if(!entries.length)s.append(el("option","No display list"));else for(const [value,label] of entries){const o=el("option",String(label));o.value=value;s.append(o);}s.dataset.signature=signature;}
  if(t.display!=null)s.value=String(t.display);s.disabled=!active.has(d.id)||!entries.length;
  $("selectedFocus").textContent=focus===d.id?"Exit focus":"Focus";$("selectedFocus").setAttribute("aria-pressed",String(focus===d.id));
  const size=dims(d.id);for(const [name,value] of [["selectedWidth",size.cols],["selectedHeight",size.rows]])if(document.activeElement!==$(name))$(name).value=value;
  $("selectedWidth").max=layout.columns;const ds=visible(),idx=ds.findIndex(x=>x.id===d.id);$("selectedEarlier").disabled=idx<=0;$("selectedLater").disabled=idx<0||idx>=ds.length-1;
 }
 function paint(id){const d=device(id),t=tiles.get(id);if(d&&t)paintTile(t,d,stateOf(d),selected===id,focus===id);}
 function setState(id,text){states.set(id,text);paint(id);if(selected===id)updateInspector();updateSummary();}
 function startOne(id){const d=device(id);if(!control.authenticated||!d?.online)return;if(requested.has(id)){stopOne(id);return;}if(requested.size>=limit()){notice("Session limit reached. Stop a session or raise the tested limit.");return;}const t=tiles.get(id);if(t){t.lastDraw=0;t.displays={};t.display=null;}requested.add(id);setState(id,"Queued");control.send({action:"authcookie"});schedule();}
 function stopOne(id){requested.delete(id);const s=active.get(id);active.delete(id);s?.stop();const t=tiles.get(id);if(t){t.lastDraw=0;t.displays={};t.display=null;}setState(id,device(id)?.online?"Stopped":"Offline");onStats();schedule();}
 function stopAll(){clearTimeout(queueTimer);queueTimer=null;const ending=new Set([...requested,...active.keys()]);requested.clear();for(const s of active.values())s.stop();active.clear();for(const id of ending){const t=tiles.get(id);if(t){t.lastDraw=0;t.displays={};t.display=null;}states.set(id,device(id)?.online?"Stopped":"Offline");paint(id);}updateInspector();updateSummary();onStats();}
 function reconcile(valid){for(const id of [...requested])if(!valid.has(id))stopOne(id);}
 function schedule(){
  if(queueTimer||!isActive()||!control.authenticated||!getCookies()||Date.now()-getLastInventory()>45000||document.hidden)return;
  queueTimer=setTimeout(()=>{queueTimer=null;if(!isActive()||!control.authenticated||!getCookies()||Date.now()-getLastInventory()>45000||document.hidden)return;const id=nextSessions(visible(),requested,new Set(active.keys()),limit())[0];if(!id)return;const t=tiles.get(id),d=device(id);if(!t||!d){requested.delete(id);schedule();return;}
   try{const s=createDesktop({control,device:d,canvas:t.canvas,cookies:getCookies(),profile:$("quality").value,focused:focus===id,onState:text=>{if(text.startsWith("Disconnected")||text.startsWith("No session")){requested.delete(id);active.delete(id);t.lastDraw=0;t.displays={};t.display=null;onStats();schedule();}setState(id,text);},onDisplays:(ds,value)=>{t.displays=ds||{};t.display=value;if(selected===id)updateInspector();},onFrame:()=>{t.lastDraw=Date.now();if(states.get(id)!=="Live · view only")setState(id,"Live · view only");else if(selected===id)updateInspector();}});if(!s.stopped){active.set(id,s);if(!states.get(id)?.startsWith("Live"))setState(id,"Connecting / awaiting consent");}else requested.delete(id);}
   catch{requested.delete(id);setState(id,"Renderer error — retry");}onStats();updateSummary();schedule();
  },300);
 }
 function reorder(from,to){if(!from||from===to)return;const ids=orderedDevices(getDevices(),layout).map(d=>d.id),a=ids.indexOf(from),b=ids.indexOf(to);if(a<0||b<0)return;ids.splice(a,1);ids.splice(b,0,from);layout.order=ids;renderWall();}
 function size(id,cols,rows){if(!tiles.has(id))return;layout.sizes[id]={cols:clampInt(cols,1,layout.columns,1),rows:clampInt(rows,1,6,1)};if(!layout.order.includes(id))layout.order=orderedDevices(getDevices(),layout).map(d=>d.id);geometry();updateInspector();}
 function refreshGroups(){const s=$("wallGroup"),old=s.value,groups=new Map(getDevices().map(d=>[d.group,d.groupName])),sig=JSON.stringify([...groups]);if(s.dataset.signature===sig)return;s.replaceChildren();const all=el("option","All groups");all.value="";s.append(all);for(const [id,name] of groups){const o=el("option",name);o.value=id;s.append(o);}s.value=groups.has(old)?old:"";s.dataset.signature=sig;}
 function renderWall(){
  refreshGroups();const list=visible(),ids=new Set(list.map(d=>d.id));
  if(selected&&!ids.has(selected)){selected=null;setFocus(null);workspace.classList.remove("has-inspector");}
  for(const [id,t] of tiles){if(!ids.has(id)){stopOne(id);t.root.remove();tiles.delete(id);states.delete(id);}}
  grid.querySelector("#emptyWall")?.remove();
  for(const [pos,d] of list.entries()){let t=tiles.get(d.id);if(!t){t=buildTile(d,{select,reorder,resize:size,getDims:dims,getCellWidth:()=>Math.max(1,grid.clientWidth/effective)});tiles.set(d.id,t);}paint(d.id);if(grid.children[pos]!==t.root)grid.insertBefore(t.root,grid.children[pos]||null);}
  if(!list.length){const empty=el("div");empty.id="emptyWall";empty.className="empty-state";empty.append(el("strong",getUser()?"No matching devices":"Sign in to view devices"),el("span",getUser()?"Enroll an authorized PC or adjust the filters.":"Your inventory is protected by MeshCentral authentication."));grid.append(empty);}
  geometry();updateInspector();updateSummary();schedule();
 }
 $("preset").onchange=()=>{const p=presets.find(x=>x.name===$("preset").value);if(!p)return;current=p.name;applyPreset();refreshPresets();renderWall();persist();};
 $("deletePreset").onclick=()=>{if(!getUser()||!confirm("Delete saved layout "+current+"?"))return;presets=presets.filter(p=>p.name!==current);if(!presets.length)presets=[{name:"Default",layout:sanitizeLayout({})}];current=presets[0].name;applyPreset();refreshPresets();renderWall();persist();};
 $("columns").onchange=()=>{layout.columns=clampInt($("columns").value,1,10,4);$("columns").value=layout.columns;geometry();updateInspector();};
 $("quality").onchange=()=>{for(const [id,s] of active)s.quality($("quality").value,focus===id);};
 $("limit").onchange=()=>{const n=limit();$("limit").value=n;for(const id of [...requested].slice(n))stopOne(id);updateSummary();updateInspector();schedule();};
 $("startAll").onclick=()=>{if(!control.authenticated)return;const eligible=visible().filter(d=>d.online&&!requested.has(d.id));const count=Math.min(eligible.length,limit()-requested.size);if(count<=0||!confirm("Start view-only monitoring of "+count+" authorized PCs? Local consent policies still apply."))return;for(const d of eligible.slice(0,count)){const t=tiles.get(d.id);if(t){t.lastDraw=0;t.displays={};t.display=null;}requested.add(d.id);setState(d.id,"Queued");}control.send({action:"authcookie"});schedule();};
 $("wallFullscreen").onclick=async()=>{const section=$("wall");try{if(document.fullscreenElement===section)await document.exitFullscreen();else if(section.requestFullscreen)await section.requestFullscreen();else notice("Fullscreen unavailable in this browser.");}catch{notice("Fullscreen unavailable in this browser.");}};
 document.addEventListener("fullscreenchange",()=>{const full=document.fullscreenElement===$("wall");$("wallFullscreen").textContent=full?"Exit full wall":"Full wall";$("wallFullscreen").setAttribute("aria-pressed",String(full));geometry();});
 $("stopAll").onclick=stopAll;$("save").onclick=saveLayout;$("reset").onclick=()=>{if(confirm("Reset the current layout?")){layout=sanitizeLayout({});$("columns").value=layout.columns;setFocus(null);renderWall();notice("Layout reset. Save to keep the change.");}};
 $("wallSearch").oninput=renderWall;$("wallGroup").onchange=renderWall;$("wallStatus").onchange=renderWall;
 $("inspectorClose").onclick=closeInspector;$("selectedStart").onclick=()=>startOne(selected);
 $("selectedFocus").onclick=()=>{setFocus(focus===selected?null:selected);renderWall();if(focus)tiles.get(focus)?.root.scrollIntoView({block:"nearest"});};
 $("selectedFullscreen").onclick=()=>{const root=tiles.get(selected)?.root;if(!root?.requestFullscreen){notice("Fullscreen unavailable");return;}root.requestFullscreen().catch(()=>notice("Fullscreen unavailable"));};
 $("selectedMonitor").onchange=()=>{const t=tiles.get(selected);if(t){t.display=$("selectedMonitor").value;active.get(selected)?.display(t.display);}};
 $("selectedWidth").onchange=()=>{size(selected,$("selectedWidth").value,dims(selected).rows);$("selectedWidth").value=dims(selected).cols;};
 $("selectedHeight").onchange=()=>{size(selected,dims(selected).cols,$("selectedHeight").value);$("selectedHeight").value=dims(selected).rows;};
 function move(delta){const list=visible(),i=list.findIndex(d=>d.id===selected);if(i>=0&&list[i+delta])reorder(selected,list[i+delta].id);}
 $("selectedEarlier").onclick=()=>move(-1);$("selectedLater").onclick=()=>move(1);
 return {render:renderWall,stopAll,reconcile,schedule,loadLayout,count:()=>active.size};
}
