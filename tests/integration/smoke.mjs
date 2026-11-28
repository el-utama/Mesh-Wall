// Isolated loopback integration; does not enroll devices or contact a real tailnet.
import assert from "node:assert/strict";
import {mkdtemp,mkdir,writeFile,cp,rm,readFile,realpath} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve,dirname,basename,relative} from "node:path";
import {randomBytes} from "node:crypto";
import {spawn,execFileSync} from "node:child_process";
import {chromium} from "playwright";
import {backup,verify,restore} from "../../scripts/maintenance/lib.mjs";
import {adopt,adoptionStatus,rollbackAdoption} from "../../installers/adoption.mjs";
import {checkRenderer} from "./renderer.mjs";
const root=await mkdtemp(join(tmpdir(),"meshwall-smoke-"));
const engine=join(root,"node_modules/meshcentral");
const port=18443,origin="https://localhost:"+port;
const password="Lab-"+randomBytes(20).toString("hex");
let server,browser,backupParent,adoptionBackup;
let logs="";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function stopEngine(){if(!server||server.exitCode!==null||server.signalCode!==null)return;const exited=new Promise(r=>server.once("exit",r));if(process.platform==="win32"){server.stdin.end();}else server.kill("SIGTERM");await Promise.race([exited,sleep(5000)]);if(server.exitCode===null&&server.signalCode===null){server.kill("SIGKILL");await exited;}}
function startEngine(){server=spawn(process.execPath,[engine,"--launch"],{cwd:root,stdio:["pipe","pipe","pipe"]});for(const stream of [server.stdout,server.stderr])stream.on("data",d=>{logs=(logs+d.toString()).slice(-12000)});}
async function readyPage(page,path="/meshwall.html"){for(let i=0;i<90;i++){if(server.exitCode!==null||server.signalCode!==null)throw Error("Engine exited");try{const r=await page.goto(origin+path,{timeout:3000,waitUntil:"domcontentloaded"});if(r?.ok())return;}catch{}await sleep(1000);}throw Error("Expected HTTPS page must be served by real MeshCentral: "+path);}
try {
  const npmArgs=["install","--prefix",root,"--omit=dev","--no-audit","--no-fund","meshcentral@1.3.2"];
  if(process.env.npm_execpath)execFileSync(process.execPath,[process.env.npm_execpath,...npmArgs],{stdio:"inherit",timeout:180000});
  else if(process.platform==="win32")throw Error("Run via npm run integration on Windows");
  else execFileSync("npm",npmArgs,{stdio:"inherit",timeout:180000});
  const pkg=JSON.parse(await readFile(join(engine,"package.json"),"utf8"));
  assert.equal(pkg.version,"1.3.2");
  const data=join(root,"meshcentral-data");await mkdir(data);
  await mkdir(join(root,"meshcentral-web/public"),{recursive:true});
  await writeFile(join(root,"meshcentral-web/public/original-custom.html"),"original custom content");
  const config={settings:{cert:"localhost",port,portBind:"127.0.0.1",redirPort:0,mpsPort:0,exactPorts:true,WANonly:true,selfUpdate:false,sessionKey:randomBytes(48).toString("hex")},domains:{"":{title:"MeshWall lab",newAccounts:false,localSessionRecording:false,userConsentFlags:{desktopprompt:true,desktopnotify:true}}}};
  await writeFile(join(data,"config.json"),JSON.stringify(config),{mode:0o600});
  const cli=(args,env={})=>execFileSync(process.execPath,[engine,...args],{cwd:root,env:{...process.env,...env},encoding:"utf8",timeout:90000});
  assert.match(cli(["--createaccount","labadmin"],{meshcentral_pass:password}),/^Done\./m);
  assert.match(cli(["--adminaccount","labadmin"]),/^Done\./m);
  adoptionBackup=await mkdtemp(join(tmpdir(),"meshwall-adoption-smoke-"));
  const adoption=await adopt(root,resolve("apps/web/public"),adoptionBackup);await verify(adoption.snapshot);assert.equal((await adoptionStatus(root)).state,"complete");assert.equal(await readFile(join(root,"meshcentral-web/public/original-custom.html"),"utf8"),"original custom content");
  console.log("PASS: existing engine offline adoption with verified backup; original custom file retained.");
  startEngine();
  browser=await chromium.launch({headless:true});
  // Only the disposable loopback fixture uses an upstream self-signed cert.
  // This does not change certificate verification in app code or installer.
  const context=await browser.newContext({ignoreHTTPSErrors:true});
  const page=await context.newPage();const appErrors=[];
  page.on("pageerror",e=>appErrors.push(e.message));
  await readyPage(page);
  await page.waitForFunction(()=>document.getElementById("connection")?.textContent.includes("Disconnected"),{},{timeout:20000});
  assert.equal(await page.locator("#total").textContent(),"—","Unauthenticated inventory must be hidden");
  await page.locator("#login").click();
  const login=page.frameLocator("#panelFrame");
  await login.locator("#username").fill("labadmin");await login.locator("#password").fill(password);
  await login.locator("#loginButton").click();
  await page.waitForFunction(()=>document.getElementById("connection")?.textContent==="Authenticated",{},{timeout:20000});
  await page.waitForFunction(()=>document.getElementById("total")?.textContent==="0",{},{timeout:20000});
  await page.locator("#panelDialog").waitFor({state:"hidden",timeout:20000});
  await page.locator('nav [data-page="groups"]').click();
  await page.locator("#groupName").fill("Authorized lab group");
  await page.locator("#groupForm button").click();
  await page.waitForFunction(()=>document.getElementById("groupResult")?.textContent==="Group created",{},{timeout:20000});
  await page.waitForFunction(()=>Array.from(document.getElementById("inviteGroup")?.options||[]).some(o=>o.textContent==="Authorized lab group"),{},{timeout:20000});
  await page.locator("#inviteGroup").selectOption({label:"Authorized lab group"});
  await page.locator("#inviteForm button").click();
  await page.locator("#inviteResult a").waitFor({timeout:20000});
  const href=await page.locator("#inviteResult a").getAttribute("href");
  assert.ok(href?.startsWith(origin+"/agentinvite?"),"Invitation must be same-origin");
  await page.locator("#groupList button").first().click();await page.locator("#editInput").fill("Renamed lab group");await page.locator("#editSubmit").click();await page.waitForFunction(()=>document.getElementById("groupList").textContent.includes("Renamed lab group"),{},{timeout:20000});
  await page.locator('nav [data-page="users"]').click();await page.waitForFunction(()=>document.getElementById("userRows").textContent.includes("labadmin"),{},{timeout:20000});
  await page.locator("#createAccount").click();await page.locator("#newUsername").fill("labviewer");const viewerPassword="Viewer-"+randomBytes(20).toString("hex");await page.locator("#newPassword").fill(viewerPassword);await page.locator("#confirmPassword").fill(viewerPassword);await page.locator("#accountSubmit").click();await page.waitForFunction(()=>document.querySelector("#userRows")?.textContent.includes("labviewer"));await page.locator("#accountDialog").waitFor({state:"hidden"});await page.waitForFunction(()=>!document.querySelector("#createAccount")?.disabled);
  await page.locator("#grantAccount").selectOption({label:"labviewer"});await page.locator("#grantGroup").selectOption({label:"Renamed lab group"});
  page.once("dialog",d=>d.accept());await page.locator("#grantSubmit").click();await page.waitForFunction(()=>document.querySelector("#accountResult")?.textContent==="Direct view-only membership verified.");
  page.once("dialog",d=>d.accept());await page.locator("#revokeSubmit").click();await page.waitForFunction(()=>document.querySelector("#accountResult")?.textContent==="Direct membership removed.");
  console.log("PASS: native account creation and verified direct group grant/revoke against real engine.");
  await page.locator('nav [data-page="activity"]').click();await page.waitForFunction(()=>document.getElementById("eventStatus").textContent.includes("recent authorized events"),{},{timeout:20000});
  await page.locator('nav [data-page="wall"]').click();
  await page.locator("#columns").fill("10");await page.locator("#columns").press("Tab");
  await page.locator("#layoutOptions summary").click();await page.locator("#presetName").fill("Ten columns");await page.locator("#save").click();
  await page.reload({waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.getElementById("connection")?.textContent==="Authenticated",{},{timeout:20000});
  await page.locator('nav [data-page="wall"]').click();
  assert.equal(await page.locator("#columns").inputValue(),"10");assert.equal(await page.locator("#preset").inputValue(),"Ten columns");
  assert.equal(await page.locator("#streams").textContent(),"0");
  await checkRenderer(page);
  assert.equal(appErrors.length,0,"Browser JavaScript errors: "+appErrors.join("; "));
  console.log("PASS: real MeshCentral static serving, unauthenticated denial, embedded login, inventory, create/rename group, invitation, users, events and persisted preset; no agent or desktop stream tested.");
  // Real offline backup: close browsers, stop the single --launch process, snapshot, change state, restore.
  await context.close();await stopEngine();
  backupParent=await mkdtemp(join(tmpdir(),"meshwall-backup-smoke-"));
  const snapshot=await backup(root,backupParent);await verify(snapshot);
  // Verify adoption rollback before restore changes the original hard-link identities.
  assert.deepEqual(await rollbackAdoption(root),{removed:14});
  assert.equal((await adoptionStatus(root)).state,"rolled-back");
  startEngine();
  const native=await browser.newContext({ignoreHTTPSErrors:true});
  const nativePage=await native.newPage();
  await readyPage(nativePage,"/");
  await nativePage.locator("#username").fill("labadmin");
  await nativePage.locator("#password").fill(password);
  await nativePage.locator("#loginButton").click();
  await nativePage.locator('#logoutControl, [data-action="logout"]').first().waitFor({timeout:20000,state:"attached"});
  assert.equal((await native.request.get(origin+"/meshwall.html")).status(),404);
  assert.equal(await (await native.request.get(origin+"/original-custom.html")).text(),"original custom content");
  await native.close();await stopEngine();
  console.log("PASS: adoption rollback, engine restart, native login and original custom file; MeshWall path removed.");
  assert.match(cli(["--createaccount","afterbackup"],{meshcentral_pass:"Lab-"+randomBytes(20).toString("hex")}),/^Done\./m);
  const recovery=await restore(root,snapshot);
  assert.equal(relative(await realpath(root),dirname(await realpath(recovery))),"","Recovery must be an immediate child of the canonical installation root");
  assert.match(basename(recovery),/^meshwall-recovery-/);
  startEngine();
  const restored=await browser.newContext({ignoreHTTPSErrors:true});
  const after=await restored.newPage();await readyPage(after);
  await after.waitForFunction(()=>document.querySelector("#connection")?.textContent.includes("Disconnected"));
  await after.locator("#login").click();const auth=after.frameLocator("#panelFrame");
  await auth.locator("#username").fill("labadmin");await auth.locator("#password").fill(password);await auth.locator("#loginButton").click();
  await after.waitForFunction(()=>document.querySelector("#connection")?.textContent==="Authenticated",{},{timeout:20000});
  await after.locator('nav [data-page="groups"]').click();
  await after.waitForFunction(()=>document.querySelector("#groupList")?.textContent.includes("Renamed lab group"));
  await after.locator('nav [data-page="users"]').click();
  await after.waitForFunction(()=>document.querySelector("#userRows")?.textContent.includes("labadmin"));
  assert.ok(!(await after.locator("#userRows").textContent()).includes("afterbackup"));
  await restored.close();
  console.log("PASS: real stopped MeshCentral backup, checksum verification, restore, restart, original login/group retained, post-backup account removed.");

} catch(e) {
  // Do not print URLs, session cookies, credentials or upstream logs.
  console.error("Integration failed:",String(e.message).replaceAll(password,"[redacted]"));
  console.error("Engine state:",server?.exitCode??"running or not started","startup log bytes:",logs.length);
  process.exitCode=1;
} finally{
  await browser?.close();
  await stopEngine();
  if(adoptionBackup)await rm(adoptionBackup,{recursive:true,force:true});
  if(backupParent)await rm(backupParent,{recursive:true,force:true});
  await rm(root,{recursive:true,force:true,maxRetries:5,retryDelay:300});
}
