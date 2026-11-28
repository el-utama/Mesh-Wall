const $=id=>document.getElementById(id);
const token=location.hash.slice(1);
history.replaceState(null,"",location.pathname);
const labels={
 en:{title:"Maintenance center",intro:"Inspect the default fresh installation even when MeshCentral is not running. No changes are made here.",heading:"Run diagnosis",language:"Language",service:"Registered service name",hint:"Linux: meshwall-engine.service. Windows: use the actual service name in Service Manager.",run:"Run diagnosis",empty:"Enter the registered service name.",loading:"Checking local installation…",review:"Review needed",ready:"Checks observed — verify login and devices separately",renewal:"Certificate renewal review",error:"Diagnosis unavailable or invalid service name. Check the local terminal and reopen the session if expired.",token:"Missing one-time token. Reopen the exact local URL.",next:"Recommended next step",guide:"Local guide:",evidence:"Observed checks",copy:"Copy safe report",copied:"Safe report copied.",copyError:"Clipboard unavailable. Use doctor plan --json in the local terminal.",footer:"Read-only guidance, not authorization to repair. Use the reviewed local CLI and confirm downtime before any changes. Login, backup integrity and device access require separate verification."},
 id:{title:"Pusat pemeliharaan",intro:"Periksa instalasi baru bawaan meskipun MeshCentral tidak berjalan. Tidak ada perubahan di sini.",heading:"Jalankan diagnosis",language:"Bahasa",service:"Nama service terdaftar",hint:"Linux: meshwall-engine.service. Windows: gunakan nama service aktual di Service Manager.",run:"Jalankan diagnosis",empty:"Masukkan nama service terdaftar.",loading:"Memeriksa instalasi lokal…",review:"Perlu ditinjau",ready:"Pemeriksaan teramati — verifikasi login dan perangkat secara terpisah",renewal:"Tinjau pembaruan sertifikat",error:"Diagnosis tidak tersedia atau nama service tidak valid. Periksa terminal lokal dan buka ulang sesi jika kedaluwarsa.",token:"Token sekali pakai tidak tersedia. Buka kembali URL lokal yang benar.",next:"Langkah berikutnya",guide:"Panduan lokal:",evidence:"Hasil pemeriksaan",copy:"Salin laporan aman",copied:"Laporan aman disalin.",copyError:"Clipboard tidak tersedia. Gunakan doctor plan --json di terminal lokal.",footer:"Panduan hanya baca, bukan izin perbaikan. Gunakan CLI lokal yang ditinjau dan konfirmasi downtime sebelum perubahan. Verifikasi login, integritas backup dan akses perangkat secara terpisah."}
};
let language="en",status=/^[a-f0-9]{64}$/.test(token)?"empty":"token",report=null,pending=false;
const fields={title:"title",intro:"intro","check-heading":"heading","language-label":"language","service-label":"service",hint:"hint",run:"run","next-heading":"next","guide-label":"guide","evidence-label":"evidence",copy:"copy",footer:"footer"};
function render(){
 const l=labels[language];document.documentElement.lang=language;
 for(const [id,key] of Object.entries(fields))$("maintenance-"+id).textContent=l[key];
 $("maintenance-status").textContent=l[status];
 $("maintenance-run").disabled=pending||status==="token";
 $("maintenance-service").disabled=pending;
 $("maintenance-result").hidden=!report;
 if(report){
  $("maintenance-next").textContent=language==="id"?report.next.idText:report.next.en;
  $("maintenance-guide").textContent=report.next.guide;
  const rows=Object.entries(report.observed).map(([code,state])=>{
   const row=document.createElement("div");row.className="row";
   const term=document.createElement("dt"),value=document.createElement("dd");
   term.textContent=code;value.textContent=state;row.append(term,value);return row;
  });$("maintenance-evidence").replaceChildren(...rows);
 }
}
$("maintenance-language").onchange=()=>{language=$("maintenance-language").value==="id"?"id":"en";$("maintenance-copy-status").textContent="";render();};
$("maintenance-service").oninput=()=>{report=null;status=status==="token"?"token":"empty";$("maintenance-copy-status").textContent="";render();};
$("maintenance-form").onsubmit=async event=>{
 event.preventDefault();if(pending||status==="token")return;
 pending=true;report=null;status="loading";$("maintenance-copy-status").textContent="";render();
 try{
  const response=await fetch("/api/maintenance/plan",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({serviceName:$("maintenance-service").value}),cache:"no-store"});
  if(!response.ok)throw Error("request");
  const result=await response.json();
  if(!result.next||!result.observed||!["checks-observed","needs-review","renewal-review"].includes(result.status))throw Error("invalid");
  report=result;status=result.status==="checks-observed"?"ready":result.status==="renewal-review"?"renewal":"review";
 }catch{status="error";}
 finally{pending=false;render();}
};
$("maintenance-copy").onclick=async()=>{
 if(!report)return;
 try{await navigator.clipboard.writeText(JSON.stringify(report,null,2));$("maintenance-copy-status").textContent=labels[language].copied;}
 catch{$("maintenance-copy-status").textContent=labels[language].copyError;}
};
render();
