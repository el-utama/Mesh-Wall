import {connectAdoption} from "/setup-adoption.js";

const $ = id => document.getElementById(id);
const token = location.hash.slice(1);
history.replaceState(null,"",location.pathname);
let ready = false;
let existing = false;
let busy = false;
let timer;

async function api(path,body) {
  const response = await fetch(path,{
    method:body?"POST":"GET",
    headers:{Authorization:"Bearer "+token,...(body?{"Content-Type":"application/json"}:{})},
    body:body?JSON.stringify(body):undefined,
    cache:"no-store"
  });
  const data = await response.json();
  if(!response.ok)throw Object.assign(Error(data.error||"Request failed"),{detail:data});
  return data;
}

function help(guidance) {
  if(!guidance)return;
  $("helpCode").textContent = guidance.code+" · "+guidance.title;
  $("helpCheck").textContent = guidance.check;
  $("helpNext").textContent = guidance.next;
}
function message(value) { $("status").textContent = value; }
function stage(index) {
  for(const [i,item] of [...document.querySelectorAll(".steps li")].entries()){
    item.classList.toggle("done",i<index);
    if(i===index)item.setAttribute("aria-current","step");
    else item.removeAttribute("aria-current");
  }
}

function setFreshAvailability() {
  $("fresh-steps").hidden=existing;
  $("administrator").hidden = existing;
  $("start").disabled = !ready || existing || busy;
  if(existing) {
    $("pass").value = "";
    $("confirm").value = "";
    $("result-heading").textContent = "Adoption help and recovery";
    stage(0);
    message("Fresh installation blocked. Review the existing MeshCentral installation above.");
  }
}
const adoption = connectAdoption({api,help,onCandidate:()=>{
  existing = true;
  $("discovery").textContent = "An existing installation was found. Fresh installation is blocked for this wizard session.";
  setFreshAvailability();
}});

function showChecks(results) {
  $("checks").replaceChildren(...results.checks.map(check=>{
    const row = document.createElement("div");
    row.className = "row";
    const name = document.createElement("strong");
    const detail = document.createElement("span");
    name.textContent = check.name;
    detail.textContent = (check.ok?"✓ ":"✗ ")+check.detail;
    row.append(name,detail);
    return row;
  }));
  $("note").textContent = results.note;
}

async function preflight() {
  if(busy)return;
  ready = false;
  $("start").disabled = true;
  $("check").disabled = true;
  stage(0);
  const [checks,discovery] = await Promise.allSettled([api("/api/preflight"),api("/api/discovery")]);
  if(discovery.status==="fulfilled"){
    const data = discovery.value;
    existing ||= data.existingCandidate===true;
    adoption.showDiscovery({...data,existingCandidate:existing});
  }else{
    adoption.showDiscovery({candidates:[],existingCandidate:existing});
    $("discovery").textContent = "Automatic discovery is unavailable. Enter the installation directory to review it.";
    $("adoption").open = true;
  }
  if(checks.status==="fulfilled"){
    showChecks(checks.value);
    help(existing ? discovery.value?.help : checks.value.help);
    ready = checks.value.ready===true && discovery.status==="fulfilled";
    stage(ready?1:0);
    message(ready?"Compatibility checks passed. Configure the administrator.":"Resolve the compatibility checks before continuing.");
  }else{
    $("checks").replaceChildren();
    $("note").textContent = "";
    message(checks.reason.message);
  }
  setFreshAvailability();
  $("check").disabled = busy;
}

async function poll() {
  try {
    const result = await api("/api/status");
    message(result.message+" ("+result.stage+")");
    help(result.help);
    if(result.status==="complete"){
      stage(3);
      clearInterval(timer);
      const link = document.createElement("a");
      link.href = result.url;
      link.textContent = "Open MeshWall";
      link.rel = "noopener noreferrer";
      link.target = "_blank";
      $("result").replaceChildren(link);
    }
    if(result.status==="failed"){
      stage(2);
      clearInterval(timer);
    }
  } catch(error) {
    clearInterval(timer);
    message("Setup connection unavailable. Check the local terminal before retrying.");
  }
}

$("support").onclick = async()=>{
  try {
    const report = await api("/api/support");
    await navigator.clipboard.writeText(JSON.stringify(report,null,2));
    $("supportStatus").textContent = "Safe report copied. It excludes raw logs, paths and credentials.";
  } catch {
    $("supportStatus").textContent = "Copy unavailable. Run node scripts/doctor.mjs in the local terminal.";
  }
};
$("check").onclick = preflight;
$("setup").onsubmit = async event=>{
  event.preventDefault();
  if(!ready||existing||busy)return;
  busy = true;
  $("start").disabled = true;
  $("check").disabled = true;
  adoption.setAvailable(false);
  stage(2);
  try {
    await api("/api/install",{
      username:$("user").value,
      password:$("pass").value,
      confirmation:$("confirm").value,
      authorized:$("authorized").checked
    });
    timer = setInterval(poll,1500);
    poll();
  } catch(error) {
    busy = false;
    ready = false;
    $("check").disabled = false;
    adoption.setAvailable(true);
    stage(0);
    message(error.message);
  } finally {
    $("pass").value = "";
    $("confirm").value = "";
  }
};
if(!/^[a-f0-9]{64}$/.test(token)){
  message("Missing one-time token. Reopen the exact URL printed in the local terminal.");
  $("check").disabled = true;
  adoption.setAvailable(false);
}else{
  preflight();
}
