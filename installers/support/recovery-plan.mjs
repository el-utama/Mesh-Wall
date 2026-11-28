// Local read-only planner. Selects a single next step; never dispatches a maintenance command.
import {lstat} from "node:fs/promises";
import {join} from "node:path";
import {diagnoseFresh} from "./diagnose.mjs";
import {diagnoseHealth} from "./health.mjs";
import {diagnoseConfigTLS} from "./config-tls.mjs";
import {freshServiceTarget} from "../../scripts/maintenance/service-control.mjs";
const advice={
 unavailable:["Diagnosis unavailable. Check operator permissions and review the local installation.","Diagnosis tidak tersedia. Periksa izin operator dan instalasi lokal."],
 root:["Confirm the actual absolute installation root using doctor discover. Preserve partial files.","Pastikan direktori instalasi absolut yang benar melalui doctor discover. Pertahankan file parsial."],
 lock:["Inspect maintenance lock, pending jobs and recovery directories. Do not clear the lock or start the service blindly.","Periksa maintenance lock, operasi tertunda dan direktori pemulihan. Jangan hapus lock atau memulai service sembarangan."],
 adoption:["Use adoption status and the adoption recovery guide. Do not run fresh-install repair on this root.","Gunakan adoption status dan panduan pemulihan adopsi. Jangan gunakan perbaikan instalasi baru pada direktori ini."],
 target:["This is not the supported default fresh service target. Identify the actual registered service and use the custom/adoption guide.","Target bukan service instalasi baru bawaan yang didukung. Identifikasi service terdaftar dan ikuti panduan konfigurasi khusus/adopsi."],
 package:["Review the pinned package and installation history. Do not reinstall over existing data.","Periksa paket versi terkunci dan riwayat instalasi. Jangan instal ulang menimpa data yang ada."],
 service:["Inspect the actual service registration and logs. Do not start, stop or repair an unidentified service.","Periksa registrasi service dan log aktual. Jangan mulai, hentikan atau perbaiki service yang belum teridentifikasi."],
 busy:["Wait for the authorized operation to settle; inspect service state and rerun the planner.","Periksa hingga operasi terotorisasi selesai; cek status service dan jalankan planner kembali."],
 config:["Preserve configuration and identity. Review a verified backup and the fresh policy findings before any change.","Pertahankan konfigurasi dan identitas. Tinjau backup terverifikasi serta temuan kebijakan sebelum perubahan."],
 endpoint:["Review the configured private endpoint and actual Tailscale interface; no public or insecure fallback.","Periksa endpoint privat dan antarmuka Tailscale aktual; jangan gunakan akses publik atau TLS tidak aman."],
 tls:["Review certificate/key findings and the authorized TLS recovery guide. Preserve existing material and backup; never disable verification.","Periksa temuan sertifikat/key dan panduan pemulihan TLS terotorisasi. Pertahankan material dan backup; jangan nonaktifkan verifikasi."],
 ui:["Review missing UI against the exact reviewed release. If it qualifies, use the documented guarded repair with a verified backup and confirmed stopped service.","Periksa UI yang hilang terhadap rilis yang sama. Jika memenuhi syarat, ikuti guarded repair dengan backup terverifikasi dan service dipastikan berhenti."],
 uiReview:["Inspect unsafe or unreadable UI files locally. Do not overwrite unknown or modified files.","Periksa file UI tidak aman atau tidak terbaca secara lokal. Jangan timpa file yang tidak dikenal atau dimodifikasi."],
 stopped:["Review local logs, ensure the maintenance window is authorized and no other process uses the root, then consider the documented start command.","Tinjau log lokal, pastikan waktu pemeliharaan diizinkan dan tidak ada proses lain menggunakan direktori, lalu pertimbangkan perintah start terdokumentasi."],
 https:["Inspect HTTPS findings, private bind, TLS trust and service logs. Do not retry or restart automatically.","Periksa temuan HTTPS, bind privat, kepercayaan TLS dan log service. Jangan mengulang atau restart otomatis."],
 renewal:["Plan authorized TLS renewal. Confirm HTTPS, authenticated login and an authorized device separately.","Rencanakan pembaruan TLS terotorisasi. Verifikasi HTTPS, login dan perangkat yang diizinkan secara terpisah."],
 ready:["Observed checks match. Verify authenticated login and an authorized device, then use the documented backup procedure before maintenance.","Pemeriksaan yang diamati sesuai. Verifikasi login dan perangkat yang diizinkan, lalu ikuti prosedur backup sebelum pemeliharaan."]
};
const docs={unavailable:"docs/SELF-SUPPORT.md",root:"docs/SELF-SUPPORT.md",lock:"docs/OPERATIONS.md",adoption:"docs/ADOPTION.md",target:"docs/ADOPTION.md",package:"docs/QUICKSTART-ALPHA.md",service:"docs/OPERATIONS.md",busy:"docs/OPERATIONS.md",config:"docs/OPERATIONS.md",endpoint:"docs/TROUBLESHOOTING.md",tls:"docs/OPERATIONS.md",ui:"docs/OPERATIONS.md",uiReview:"docs/OPERATIONS.md",stopped:"docs/OPERATIONS.md",https:"docs/TROUBLESHOOTING.md",renewal:"docs/OPERATIONS.md",ready:"docs/OPERATIONS.md"};
const codes=["MW-DIAG-ROOT","MW-DIAG-LOCK","MW-DIAG-PACKAGE","MW-DIAG-CONFIG","MW-DIAG-CERT","MW-DIAG-KEY","MW-DIAG-UI","MW-DIAG-APP","MW-DIAG-SERVICE","MW-DIAG-HTTPS","MW-CONFIG-POLICY","MW-CONFIG-ENDPOINT","MW-TLS-LEAF"];
const states=new Set(["present","clear","blocked","missing","unsafe","unavailable","empty","oversized","invalid-root","invalid-json","invalid-package","invalid-config","unsupported-version","invalid","mismatch","unsupported","stopped","transitioning","running","skipped","invalid-endpoint","not-local","timeout","refused","tls","http-status","unexpected-page","reachable","custom-review","baseline-mismatch","baseline-matches","endpoint-present","invalid-certificate","invalid-key","hostname-mismatch","key-mismatch","not-yet-valid","expired","renew-soon","leaf-key-match"]);
function state(report,code){
 const hits=Array.isArray(report?.findings)?report.findings.filter(x=>x?.code===code):[];
 return hits.length===1&&states.has(hits[0].state)?hits[0].state:"unavailable";
}
function result(next,observed){
 const [en,id]=advice[next];
 return {format:1,mode:"read-only",scope:"default-fresh-recovery-plan",status:next==="ready"?"checks-observed":next==="renewal"?"renewal-review":"needs-review",next:{id:next,en,idText:id,guide:docs[next]},observed,note:"This plan is not authorization or a repair command. Evidence is a point-in-time observation, not proof of exclusive process ownership, backup validity, full schema, login or device readiness."};
}
async function adoption(root){
 try{await lstat(join(root,".meshwall-adoption"));return true;}catch(e){if(e.code==="ENOENT")return false;throw e;}
}
export async function recoveryPlan(root,name,{files=diagnoseFresh,config=diagnoseConfigTLS,health=diagnoseHealth,hasAdoption=adoption,target=freshServiceTarget}={}){
 const observed={};
 const put=(r,selected)=>{for(const code of selected)observed[code]=state(r,code);};
 try{
  const first=await files(root);
  put(first,codes.slice(0,8));
  if(observed["MW-DIAG-ROOT"]!=="present")return result("root",observed);
  if(observed["MW-DIAG-LOCK"]!=="clear")return result("lock",observed);
  if(await hasAdoption(root))return result("adoption",observed);
  if(!target(root,name))return result("target",observed);
  if(observed["MW-DIAG-PACKAGE"]!=="present")return result("package",observed);
  const policy=await config(root);
  put(policy,codes.slice(10));
  const live=await health(root,name);
  // Fresh health performs a second file check. A new lock/root or changed file observation wins.
  const prior=JSON.stringify(observed);
  put(live,codes.slice(0,10));
  if(observed["MW-DIAG-ROOT"]!=="present")return result("root",observed);
  if(observed["MW-DIAG-LOCK"]!=="clear")return result("lock",observed);
  if(await hasAdoption(root))return result("adoption",observed);
  if(observed["MW-DIAG-PACKAGE"]!=="present")return result("package",observed);
  const previous=JSON.parse(prior);
  if(codes.slice(0,8).some(code=>observed[code]!==previous[code]))return result("unavailable",observed);
  const service=observed["MW-DIAG-SERVICE"];
  if(service==="transitioning")return result("busy",observed);
  if(!["running","stopped"].includes(service))return result("service",observed);
  if(observed["MW-DIAG-CONFIG"]!=="present"||observed["MW-CONFIG-POLICY"]!=="baseline-matches")return result("config",observed);
  if(observed["MW-CONFIG-ENDPOINT"]!=="endpoint-present")return result("endpoint",observed);
  const leaf=observed["MW-TLS-LEAF"];
  if(observed["MW-DIAG-CERT"]!=="present"||observed["MW-DIAG-KEY"]!=="present"||!["leaf-key-match","renew-soon"].includes(leaf))return result("tls",observed);
  const ui=[observed["MW-DIAG-UI"],observed["MW-DIAG-APP"]];
  if(ui.some(s=>!["present","missing"].includes(s)))return result("uiReview",observed);
  if(ui.includes("missing"))return result("ui",observed);
  if(service==="stopped")return result("stopped",observed);
  if(observed["MW-DIAG-HTTPS"]!=="reachable"||live.status!=="page-reachable")return result("https",observed);
  return result(leaf==="renew-soon"?"renewal":"ready",observed);
 }catch{return result("unavailable",observed);}
}
export function formatRecoveryPlan(report,lang="en"){
 const id=lang==="id";
 return ["MeshWall — "+(id?"Rencana Pemulihan Lokal":"Local Recovery Plan"),(id?"Status: ":"Status: ")+report.status,
 ...Object.entries(report.observed).map(([code,state])=>code+": "+state),"",
 (id?"Langkah berikutnya: ":"Next step: ")+(id?report.next.idText:report.next.en),
 (id?"Panduan lokal: ":"Local guide: ")+report.next.guide,
 id?"Hanya diagnosis. Bukan izin atau eksekusi perbaikan. Verifikasi backup, login dan perangkat secara terpisah.":report.note].join("\n");
}
