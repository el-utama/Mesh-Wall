import {el} from "./ui.mjs";
export function tileState(text){
 if(text.startsWith("Live"))return ["live","Live","Viewing only"];
 if(text.startsWith("Disconnected")||text.startsWith("No session")||text.startsWith("Renderer error"))return ["error","Error","Session ended"];
 if(text==="Offline")return ["offline","Offline","Agent offline"];
 if(text==="Stopped")return ["stopped","Stopped","Viewing stopped"];
 if(text==="Ready")return ["ready","Ready","Select to view"];
 if(text==="Queued")return ["connecting","Queued","Waiting for slot"];
 if(text.startsWith("Connected"))return ["connecting","Waiting","Waiting for screen"];
 return ["connecting","Connecting","Awaiting consent"];
}
export function buildTile(d,{select,reorder,resize,getDims,getCellWidth}){
 const root=el("article");root.className="tile";root.dataset.deviceId=d.id;
 const head=el("div");head.className="tile-head";head.draggable=true;
 head.addEventListener("dragstart",e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",d.id);});
 head.onclick=()=>select(d.id);
 root.addEventListener("dragover",e=>{e.preventDefault();e.dataTransfer.dropEffect="move";});
 root.addEventListener("drop",e=>{e.preventDefault();reorder(e.dataTransfer.getData("text/plain"),d.id);});
 const name=el("strong",d.name);name.className="tile-name";name.title=d.name;
 const state=el("span");state.className="tile-state";head.append(name,state);
 const screen=el("button");screen.type="button";screen.className="screen";screen.setAttribute("aria-label","Select "+d.name+" screen");screen.setAttribute("aria-pressed","false");screen.onclick=()=>select(d.id);
 const canvas=el("canvas");canvas.width=320;canvas.height=180;canvas.setAttribute("aria-hidden","true");
 const empty=el("span");empty.className="screen-empty";empty.setAttribute("aria-hidden","true");const icon=el("span");icon.className="monitor-icon";const message=el("span");empty.append(icon,message);screen.append(canvas,empty);
 const handle=el("span");handle.className="resize";handle.title="Drag to resize; keyboard controls in selected device panel";handle.setAttribute("aria-hidden","true");
 handle.onpointerdown=e=>{e.preventDefault();handle.setPointerCapture(e.pointerId);const x=e.clientX,y=e.clientY,initial={...getDims(d.id)},unit=getCellWidth(),row=Math.max(58,root.clientHeight/initial.rows);select(d.id);handle.onpointermove=m=>resize(d.id,initial.cols+Math.round((m.clientX-x)/unit),initial.rows+Math.round((m.clientY-y)/row));handle.onpointerup=handle.onpointercancel=()=>{handle.onpointermove=null;};};
 root.append(head,screen,handle);
 return {root,name,state,screen,canvas,message,displays:{},display:null,lastDraw:0};
}
export function paintTile(t,d,text,selected,focused){
 const [kind,short,message]=tileState(text);
 t.root.dataset.state=kind;t.root.classList.toggle("selected",selected);t.root.classList.toggle("focus",focused);
 t.name.textContent=d.name;t.name.title=d.name;t.state.textContent=short;t.state.title=text;t.message.textContent=message;
 t.screen.setAttribute("aria-label","Select "+d.name+" screen, "+text);t.screen.setAttribute("aria-pressed",String(selected));
}
