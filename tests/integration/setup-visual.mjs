// Actual local setup HTTP server with injected fake preflight/install callbacks.
// No privileged installer, Tailscale, MeshCentral agent or real credentials are used.
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {mkdir} from "node:fs/promises";
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

