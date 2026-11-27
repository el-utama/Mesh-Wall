import {$,el,matches} from "./ui.mjs";
import {clampInt} from "./model.mjs";
export function createManagement({control,getDevices,getGroups,refresh,notice,panels}){
function actionButton(label,handler){const b=el("button",label);b.type="button";b.onclick=handler;return b;}
function panelButton(d,mode,label){return actionButton(label,()=>panels.device(d,mode,d.name+" · "+label));}
function editDevice(d,kind){
 const dialog=$("editDialog"),input=$("editInput"),select=$("editSelect"),text=$("editMessage");
 $("editTitle").textContent=kind==="rename"?"Rename "+d.name:"Move "+d.name;
 input.hidden=kind!=="rename";input.required=kind==="rename";input.value=d.name;select.hidden=kind!=="move";select.required=kind==="move";select.replaceChildren();
 if(kind==="move"){for(const g of getGroups().filter(g=>g.mtype===2&&g._id!==d.group)){const o=el("option",String(g.name));o.value=g._id;select.append(o);}}
 text.textContent=kind==="move"?"Moving may change which users have access to this device.":"";dialog.showModal();
 $("editForm").onsubmit=async e=>{e.preventDefault();const value=kind==="rename"?input.value.trim():select.value;if(!value||!getDevices().some(x=>x.id===d.id))return;if(kind==="move"&&!getGroups().some(g=>g._id===value&&g.mtype===2))return;const b=$("editSubmit");b.disabled=true;try{await control.request(kind==="rename"?"changedevice":"changeDeviceMesh",kind==="rename"?{nodeid:d.id,name:value.slice(0,128)}:{nodeids:[d.id],meshid:value});dialog.close();notice("Engine accepted device change.");refresh();}catch{text.textContent="Engine rejected the change or did not respond.";}finally{b.disabled=false;}};
}
function editGroup(g){const dialog=$("editDialog"),input=$("editInput"),select=$("editSelect"),text=$("editMessage");$("editTitle").textContent="Rename group";input.hidden=false;input.required=true;input.value=String(g.name);select.hidden=true;select.required=false;text.textContent="";dialog.showModal();$("editForm").onsubmit=async e=>{e.preventDefault();const value=input.value.trim();if(!value||!getGroups().some(x=>x._id===g._id))return;const b=$("editSubmit");b.disabled=true;try{await control.request("editmesh",{meshid:g._id,meshname:value.slice(0,128)});dialog.close();notice("Engine accepted group change.");refresh();}catch{text.textContent="Engine rejected the change or did not respond.";}finally{b.disabled=false;}};}
$("editCancel").onclick=()=>$("editDialog").close();
function renderDevices(){
 const body=$("deviceRows"),list=getDevices().filter(d=>matches(d,$("deviceSearch").value)&&($("statusFilter").value==="all"||d.online===($("statusFilter").value==="online")));
 body.replaceChildren();$("deviceCount").textContent=list.length+" devices";
 for(const d of list){const row=el("tr");row.append(el("td",d.name),el("td",d.groupName));const status=el("td"),label=el("span",d.online?"Online":"Offline");label.className="status-label "+(d.online?"online":"offline");const dot=el("i");dot.className="dot "+(d.online?"online":"offline");dot.setAttribute("aria-hidden","true");label.prepend(dot);status.append(label);row.append(status,el("td",d.os||"—"));const actions=el("td"),buttons=el("div");buttons.className="row-actions";buttons.append(panelButton(d,11,"Desktop"),panelButton(d,12,"Terminal"),panelButton(d,13,"Files"),panelButton(d,10,"Details"),actionButton("Rename",()=>editDevice(d,"rename")),actionButton("Move",()=>editDevice(d,"move")));actions.append(buttons);row.append(actions);body.append(row);}
 if(!list.length){const row=el("tr"),cell=el("td",control.authenticated?"No matching devices. Enroll a PC or change filters.":"Sign in to see authorized devices.");cell.colSpan=5;cell.className="table-empty";row.append(cell);body.append(row);}
}
function renderGroups(){const list=$("groupList"),select=$("inviteGroup"),previous=select.value;list.replaceChildren();select.replaceChildren();for(const g of getGroups()){const row=el("div");row.className="group-row";row.append(el("strong",String(g.name||"Unnamed group")),el("span",String(getDevices().filter(d=>d.group===g._id).length)+" devices"),actionButton("Rename",()=>editGroup(g)));list.append(row);if(g.mtype===2){const option=el("option",String(g.name));option.value=g._id;select.append(option);}}if([...select.options].some(o=>o.value===previous))select.value=previous;if(!getGroups().length){const empty=el("p","No device groups yet. Create an agent group to begin enrollment.");empty.className="muted";list.append(empty);} $("groupForm").querySelector("button").disabled=!control.authenticated;$("inviteForm").querySelector("button").disabled=!control.authenticated||!select.options.length;}

$("groupForm").onsubmit=async e=>{e.preventDefault();$("groupResult").textContent="Creating…";try{await control.request("createmesh",{meshname:$("groupName").value.trim(),meshtype:2,desc:""});$("groupResult").textContent="Group created";$("groupName").value="";refresh();}catch{$("groupResult").textContent="Failed or not permitted.";}}; 
$("inviteForm").onsubmit=async e=>{e.preventDefault();const out=$("inviteResult");out.textContent="Generating…";try{const group=$("inviteGroup").value;if(!getGroups().some(g=>g._id===group&&g.mtype===2))throw Error("Invalid group");const r=await control.request("createInviteLink",{meshid:group,expire:clampInt($("inviteExpiry").value,1,24,1),flags:0});const u=new URL(r.url,location.href);if(u.origin!==location.origin||u.protocol!=="https:")throw Error("Unexpected origin");const a=el("a","Open enrollment invitation");a.href=u.href;a.target="_blank";a.rel="noopener noreferrer";out.replaceChildren(a);}catch{out.textContent="Unable to create invitation. Check permissions and engine hostname.";}}; 

$("deviceSearch").oninput=renderDevices;$("statusFilter").onchange=renderDevices;
return {renderDevices,renderGroups};
}
