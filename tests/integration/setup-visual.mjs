// Actual local setup HTTP server with injected fake preflight/install callbacks.
// No privileged installer, Tailscale, MeshCentral agent or real credentials are used.
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {mkdir,mkdtemp,readFile,readdir,realpath,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {chromium} from "playwright";
import {createSetupServer} from "../../installers/linux/setup.mjs";
const token=randomBytes(32).toString("hex"),out="visual-evidence";await mkdir(out,{recursive:true});
let ok=false,calls=0;
const server=createSetupServer({token,discover:async()=>[],preflight:()=>({ready:ok,checks:[{name:"Node architecture",ok:true,detail:"arm64 (synthetic)"},{name:"Node runtime",ok:true,detail:"22.21.1 (synthetic)"},{name:"Tailscale login and MagicDNS",ok,detail:ok?"Running (synthetic)":"Sign in first (synthetic)"}],note:"UI TEST FIXTURE — no privileged install or real network checks."}),install:async(_,update)=>{calls++;update("verification");return "https://fixture.example.ts.net:8443/meshwall.html";}});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on("pageerror",e=>errors.push(e.message));
async function snap(name){await page.screenshot({path:join(out,name+".jpg"),type:"jpeg",quality:75,animations:"disabled"});}
try{
 await page.goto("http://127.0.0.1:"+server.address().port+"/#"+token);
 await page.waitForFunction(()=>document.querySelector("#status")?.textContent.includes("Resolve"));
 assert.ok(await page.locator("#start").isDisabled());assert.match(await page.locator("#helpCode").textContent(),/MW-PREFLIGHT/);assert.equal(await page.evaluate(()=>location.hash),"");
 await snap("setup-blocked");ok=true;await page.locator("#check").click();
 await page.waitForFunction(()=>!document.querySelector("#start")?.disabled);
 assert.equal(await page.locator(".steps [aria-current]").textContent(),"02 · Administrator");
 for(const [width,height] of [[1920,1080],[1440,900],[1280,720],[768,1024],[390,844]]){await page.setViewportSize({width,height});const sizes=await page.evaluate(()=>[document.documentElement.clientWidth,document.documentElement.scrollWidth]);assert.ok(sizes[1]<=sizes[0]+1,"Setup overflow at "+width);await snap("setup-"+width);}
 await page.locator("#user").fill("fixtureadmin");const password="Fixture-"+randomBytes(20).toString("hex");
 await page.locator("#pass").fill(password);await page.locator("#confirm").fill(password);await page.locator("#authorized").check();await page.locator("#start").click();
 await page.locator("#result a").waitFor({timeout:10000});assert.match(await page.locator("#helpCode").textContent(),/MW-READY/);assert.equal(calls,1);assert.equal(await page.locator("#pass").inputValue(),"");assert.equal(await page.locator("#confirm").inputValue(),"");assert.ok(await page.locator("#start").isDisabled());assert.deepEqual(errors,[]);
 console.log("PASS: setup browser blocked/ready state, 5 viewport checks, one synthetic installation, cleared credentials and verified-result link.");
 // Representative mobile screenshot only after clearing dummy credentials.
 await page.evaluate(()=>{document.querySelector("#note").textContent="UI TEST FIXTURE — synthetic setup completion; no real server installed.";window.scrollTo(0,0);});
 const jpg=await page.screenshot({type:"jpeg",quality:40});const b64=jpg.toString("base64");for(let i=0;i<b64.length;i+=3000)console.log("MW_SETUP_VISUAL "+b64.slice(i,i+3000));
}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
// Failure-state browser fixture, separate one-time wizard.
const failureToken=randomBytes(32).toString("hex");
const failure=createSetupServer({token:failureToken,discover:async()=>[],preflight:()=>({ready:true,checks:[],note:"UI TEST FIXTURE"}),install:async(_,update)=>{update("service");throw Error("fixture failure");}});
await new Promise(r=>failure.listen(0,"127.0.0.1",r));
const failureBrowser=await chromium.launch({headless:true});
try{const p=await failureBrowser.newPage({viewport:{width:390,height:844}});await p.goto("http://127.0.0.1:"+failure.address().port+"/#"+failureToken);await p.waitForFunction(()=>!document.querySelector("#start").disabled);await p.locator("#pass").fill("Fixture-Long-Password");await p.locator("#confirm").fill("Fixture-Long-Password");await p.locator("#authorized").check();await p.locator("#start").click();await p.waitForFunction(()=>document.querySelector("#helpCode").textContent.includes("MW-SERVICE"));assert.match(await p.locator("#helpNext").textContent(),/Preserve/);assert.ok(await p.locator("#start").isDisabled());assert.equal(await p.locator("#pass").inputValue(),"");const widths=await p.evaluate(()=>[document.documentElement.clientWidth,document.documentElement.scrollWidth]);assert.ok(widths[1]<=widths[0]+1);await p.screenshot({path:join(out,"setup-failure.jpg"),fullPage:true,type:"jpeg",quality:75});console.log("PASS: failure guidance and blocked repeat install on mobile fixture");}finally{await failureBrowser.close();failure.closeAllConnections();await new Promise(r=>failure.close(r));}


// Use a disposable npm layout and actual read-only preview, with no service or credentials.
const adoptionToken=randomBytes(32).toString("hex");
const base=await mkdtemp(join(await realpath(tmpdir()),"mw-adoption-visual-"));
const root=join(base,"already installed MeshCentral");
const backupParent=join(base,"private backup");
const packageDir=join(root,"node_modules","meshcentral");
const dataDir=join(root,"meshcentral-data");
const config=join(dataDir,"config.json");
await mkdir(packageDir,{recursive:true});
await mkdir(dataDir);
await mkdir(backupParent);
await writeFile(join(packageDir,"package.json"),'{"name":"meshcentral","version":"1.3.2"}');
await writeFile(config,"{}");
let detected=false;
const adoptionServer=createSetupServer({
 token:adoptionToken,
 discover:async()=>detected?[{root,version:"1.3.2",compatible:true}]:[],
 preflight:()=>({ready:true,checks:[],note:"UI TEST FIXTURE — disposable local files; no service will run."}),
 install:async()=>assert.fail("Existing candidate must block installation")
});
await new Promise(resolve=>adoptionServer.listen(0,"127.0.0.1",resolve));
const adoptionBrowser=await chromium.launch({headless:true});
try{
 const page=await adoptionBrowser.newPage({viewport:{width:1440,height:900}});
 const errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.goto("http://127.0.0.1:"+adoptionServer.address().port+"/#"+adoptionToken);
 await page.waitForFunction(()=>!document.querySelector("#preview").disabled);
 await page.getByText("Review existing MeshCentral",{exact:true}).click();
 await page.locator("#root").fill("relative-fixture");
 await page.locator("#root").press("Enter");
 await page.getByText(/MW-ADOPT-ROOT/).waitFor();
 assert.ok(await page.locator("#adoption-review").isHidden());
 assert.ok(await page.locator("#start").isEnabled());
 await page.locator("#root").fill(root);
 await page.locator("#root").press("Enter");
 await page.getByText(/Read-only preview ready/).waitFor();
 assert.equal(await page.locator("#preview-files li").count(),14);
 assert.ok(await page.locator("#administrator").isHidden());
 assert.ok(await page.locator("#fresh-steps").isHidden());
 assert.ok(await page.locator("#backup-form").isHidden());
 const filesDisclosure = page.locator("#file-summary");
 await filesDisclosure.click();
 assert.ok(await page.locator("#preview-files").isVisible());
 await filesDisclosure.click();
 await page.locator("#service-confirmed").focus();
 await page.keyboard.press("Space");
 await page.locator("#backup-parent").fill(root);
 await page.locator("#backup-parent").press("Enter");
 await page.getByText(/MW-ADOPT-BACKUP/).waitFor();
 assert.ok(await page.locator("#handoff").isHidden());
 await page.locator("#backup-parent").fill(backupParent);
 await page.locator("#backup-parent").press("Enter");
 await page.locator("#handoff").waitFor();
 assert.match(await page.locator("#service-guide").textContent(),process.platform==="win32"?/Get-CimInstance/:/systemctl/);
 assert.match(await page.locator("#handoff").textContent(),/verify original login/i);
 for(const [width,height] of [[1920,1080],[1440,900],[1280,720],[768,1024],[390,844]]){
  await page.setViewportSize({width,height});
  const dimensions=await page.evaluate(()=>[document.documentElement.clientWidth,document.documentElement.scrollWidth]);
  assert.ok(dimensions[1]<=dimensions[0]+1,"Adoption overflow at "+width);
  await page.screenshot({path:join(out,"setup-adoption-"+width+".jpg"),fullPage:true,type:"jpeg",quality:75});
 }
 await page.locator("#backup-parent").fill(root);
 assert.ok(await page.locator("#handoff").isHidden());
 await page.locator("#root").fill(root+"-changed");
 assert.ok(await page.locator("#adoption-review").isHidden());
 detected=true;
 await page.locator("#check").click();
 await page.locator("#candidates button").click();
 assert.equal(await page.locator("#root").inputValue(),root);
 assert.equal(await page.locator("#root").evaluate(field=>field===document.activeElement),true);
 await mkdir(join(root,"meshcentral-web","public"),{recursive:true});
 const collision=join(root,"meshcentral-web","public","meshwall.html");
 await writeFile(collision,"original fixture");
 await page.locator("#preview").click();
 await page.getByText(/MW-ADOPT-COLLISION/).waitFor();
 assert.ok(await page.locator("#adoption-review").isHidden());
 assert.ok(await page.locator("#start").isDisabled());
 assert.equal(await readFile(collision,"utf8"),"original fixture");
 assert.equal(await readFile(config,"utf8"),"{}");
 assert.deepEqual(await readdir(backupParent),[]);
 assert.deepEqual(errors,[]);
 await page.screenshot({path:join(out,"setup-adoption-blocked.jpg"),fullPage:true,type:"jpeg",quality:75});
 console.log("PASS: guided adoption browser flow, keyboard, manual/discovered paths, protected backup choices and collision, five viewport checks; filesystem fixture only.");
}finally{
 await adoptionBrowser.close();
 adoptionServer.closeAllConnections();
 await new Promise(resolve=>adoptionServer.close(resolve));
 await rm(base,{recursive:true,force:true});
}
