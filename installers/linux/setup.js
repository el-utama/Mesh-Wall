"use strict";
const $=id=>document.getElementById(id);
const token=location.hash.slice(1);
history.replaceState(null,"",location.pathname);
let ready=false,busy=false,timer;
async function api(path,body){const r=await fetch(path,{method:body?"POST":"GET",headers:{Authorization:"Bearer "+token,...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined,cache:"no-store"});const x=await r.json();if(!r.ok)throw Error(x.error||"Request failed");return x;}
function message(s){$("status").textContent=s;}
async function preflight(){try{const p=await api("/api/preflight");$("checks").replaceChildren();for(const c of p.checks){const row=document.createElement("div");row.className="row";const name=document.createElement("strong"),detail=document.createElement("span");name.textContent=c.name;detail.textContent=(c.ok?"✓ ":"✗ ")+c.detail;row.append(name,detail);$("checks").append(row);}$("note").textContent=p.note;ready=p.ready;$("start").disabled=!ready||busy;}catch(e){message(e.message);}}
async function poll(){try{const s=await api("/api/status");message(s.message+" ("+s.stage+")");if(s.status==="complete"){clearInterval(timer);const a=document.createElement("a");a.href=s.url;a.textContent="Open MeshWall";a.rel="noopener noreferrer";a.target="_blank";$("result").replaceChildren(a);}if(s.status==="failed"){clearInterval(timer);}}catch(e){clearInterval(timer);message("Setup connection unavailable: "+e.message);}}
$("check").onclick=preflight;
$("setup").onsubmit=async e=>{e.preventDefault();if(!ready||busy)return;busy=true;$("start").disabled=true;try{await api("/api/install",{username:$("user").value,password:$("pass").value,confirmation:$("confirm").value,authorized:$("authorized").checked});$("pass").value="";$("confirm").value="";timer=setInterval(poll,1500);poll();}catch(e){busy=false;$("start").disabled=!ready;message(e.message);}};
if(!/^[a-f0-9]{64}$/.test(token)){message("Missing one-time token. Reopen the exact URL printed in the local terminal.");$("check").disabled=true;}else preflight();
