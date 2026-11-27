// Browser-only fixture: no enrolled devices, no actual remote sessions, no real credentials.
import assert from "node:assert/strict";
import {readFile,mkdir} from "node:fs/promises";
import {resolve,join} from "node:path";
import {chromium} from "playwright";
const origin="https://meshwall.test",folder=resolve(process.argv[2]||"apps/web/public"),out=resolve(process.argv[3]||"visual-evidence"),baseline=process.argv.includes("--baseline");
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}});
const page=await context.newPage(),errors=[];
page.on("pageerror",e=>errors.push(e.message));
let count=100;
const group={_id:"mesh//lab",name:"Synthetic lab",mtype:2};
const groups=[group,{_id:"mesh//aux",name:"Synthetic auxiliary",mtype:2}];
const inventory=()=>Object.fromEntries(groups.map((g,j)=>[g._id,Array.from({length:count},(_,i)=>i).filter(i=>i%2===j).map(i=>({_id:"node//fixture"+String(i).padStart(3,"0"),name:"PC-"+String(i+1).padStart(3,"0"),conn:i%5===4?0:1,osdesc:"Synthetic OS"}))]));
await page.route(origin+"/**",async route=>{
 const u=new URL(route.request().url());
 if(u.pathname.startsWith("/scripts/"))return route.fulfill({contentType:"text/javascript",body:"// synthetic UI fixture, no engine assets"});
 const path=u.pathname==="/"?"/meshwall.html":u.pathname;
 if(!/^\/(meshwall\.html|meshwall\/[a-z.-]+\.(mjs|css))$/.test(path))return route.fulfill({status:404,body:"Not found"});
 try{const body=await readFile(join(folder,path));return route.fulfill({body,contentType:path.endsWith(".html")?"text/html":path.endsWith(".css")?"text/css":"text/javascript"});}catch{return route.fulfill({status:404,body:"Not found"});}
});
await page.routeWebSocket("wss://meshwall.test/control.ashx",ws=>{
 const send=m=>ws.send(JSON.stringify(m));
 ws.onMessage(raw=>{const m=JSON.parse(String(raw));if(m.action==="meshes")send({action:"meshes",meshes:groups,tag:m.tag,responseid:m.responseid});if(m.action==="nodes")send({action:"nodes",nodes:inventory(),totalcount:count,responseid:m.responseid});if(m.action==="authcookie")send({action:"authcookie",cookie:"fixture-not-real",rcookie:"fixture-not-real"});if(m.action==="ping")send({action:"pong"});if(m.action==="users")send({action:"users",tag:m.tag,users:[{_id:"user//fixture",name:"Synthetic admin",siteadmin:4294967295,emailVerified:true},{_id:"user//viewer",name:"Synthetic viewer",siteadmin:0}]});if(m.action==="events")send({action:"events",tag:m.tag,events:[{time:0,action:"fixture",username:"Synthetic admin",msg:"Synthetic example event"}]});if(m.action==="serverstats"&&m.interval>0)send({action:"serverstats",totalmem:2147483648,availablemem:1073741824,cpuavg:[0.15,0.1,0.05]});});
 setTimeout(()=>send({action:"userinfo",userinfo:{_id:"user//fixture",name:"Synthetic fixture",siteadmin:4294967295}}),10);
});
async function navigate(name){const target=page.locator('nav [data-page="'+name+'"]');const wasHidden=!(await target.isVisible());if(wasHidden)await page.locator("#navToggle").click();await target.click();if(wasHidden)await page.locator("#navToggle").click();}
async function ready(n){count=n;await page.goto(origin+"/meshwall.html");await page.waitForFunction(n=>document.querySelector("#total")?.textContent===String(n),n,{timeout:15000});await navigate("wall");await page.locator("#notice").evaluate(e=>e.textContent="UI TEST FIXTURE · synthetic devices only · no agents or live streams");}
async function columns(n){await page.locator("#columns").fill(String(n));await page.locator("#columns").press("Tab");}
async function labelFixture(){await page.locator("#notice").evaluate(e=>e.textContent="UI TEST FIXTURE · synthetic devices only · no agents or live streams");}
async function snap(name){await labelFixture();await page.screenshot({path:join(out,name+".jpg"),type:"jpeg",quality:78,animations:"disabled"});}
async function noOverflow(label){const v=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));assert.ok(v.scroll<=v.width+1,label+" document overflow "+JSON.stringify(v));}
async function tileCheck(n,label){assert.equal(await page.locator(".tile").count(),n);await noOverflow(label);const issues=await page.locator(".tile").evaluateAll(ts=>ts.filter(t=>{const r=t.getBoundingClientRect(),s=t.querySelector(".screen").getBoundingClientRect();return r.width<90||s.width<80||s.height<35||s.right>r.right+1||s.bottom>r.bottom+1;}).map(t=>t.dataset.deviceId));assert.deepEqual(issues,[],label+" clipped tiles");}
try{
 if(baseline){await ready(100);await columns(10);await snap("before-1440-wall");const jpg=await page.screenshot({type:"jpeg",quality:30});const b64=jpg.toString("base64");for(let i=0;i<b64.length;i+=3000)console.log("MW_VISUAL_BEFORE "+b64.slice(i,i+3000));console.log("Baseline screenshot captured (no pass asserted).");}
 else{
  const views=[[1920,1080],[1440,900],[1280,720],[768,1024],[390,844]];
  for(const [width,height] of views){
   await page.setViewportSize({width,height});await ready(100);await columns(10);
   await page.waitForTimeout(100);if(width<=800){assert.equal(await page.locator("#navToggle").getAttribute("aria-expanded"),"false");assert.ok(await page.locator("#logout").isVisible(),"Compact navigation must preserve account action");}await tileCheck(100,width+"x"+height);await snap("wall-"+width+"x"+height);
   await navigate("overview");await noOverflow("overview "+width);await snap("overview-"+width);
   await navigate("devices");await noOverflow("devices "+width);assert.equal(await page.locator("#deviceRows tr").count(),100);if(width===1440||width===390){for(const section of ["groups","users","activity","settings"]){await navigate(section);if(section==="users")await page.locator("#userRows tr").waitFor();if(section==="activity")await page.locator("#eventRows tr").waitFor();await noOverflow(section+" "+width);await snap(section+"-"+width);if(section==="users"){await page.locator("#createAccount").click();await page.locator("#accountDialog").waitFor({state:"visible"});await noOverflow("account dialog "+width);await snap("account-dialog-"+width);if(width===390){const jpg=await page.screenshot({type:"jpeg",quality:40});const b64=jpg.toString("base64");for(let i=0;i<b64.length;i+=3000)console.log("MW_ACCOUNT_MOBILE "+b64.slice(i,i+3000));}await page.keyboard.press("Escape");assert.equal(await page.locator("#accountDialog").isVisible(),false);assert.equal(await page.locator("#createAccount").evaluate(e=>e===document.activeElement),true);}}}
  }
  await page.setViewportSize({width:1440,height:900});
  for(const n of [1,4,16,50,100]){await ready(n);await columns(n<=4?2:n===16?4:10);await tileCheck(n,"density "+n);await snap("density-"+n);}
  const first=page.locator(".tile").first(),firstId=await first.getAttribute("data-device-id");
  await first.locator(".screen").focus();await page.keyboard.press("Enter");await page.locator("#selectedControls").waitFor({state:"visible"});
  assert.equal(await page.locator("#selectedName").textContent(),"PC-001");
  await page.locator("#selectedWidth").fill("2");await page.locator("#selectedWidth").press("Tab");assert.equal(await first.evaluate(e=>e.style.getPropertyValue("--w")),"2");
  await page.locator("#selectedLater").click();assert.notEqual(await page.locator(".tile").first().getAttribute("data-device-id"),firstId);
  await page.locator("#selectedEarlier").click();assert.equal(await page.locator(".tile").first().getAttribute("data-device-id"),firstId);
  await page.locator("#selectedFocus").click();assert.equal(await page.locator(".tile.focus").count(),1);await page.locator("#selectedFocus").click();
  await snap("inspector");
  await page.locator("#inspectorClose").click();assert.equal(await page.locator("#tileInspector").isVisible(),false);assert.equal(await page.locator(".tile .screen").first().evaluate(e=>e===document.activeElement),true);
  await page.locator("#wallStatus").selectOption("offline");assert.equal(await page.locator(".tile").count(),20);
  await page.locator(".tile .screen").first().click();assert.equal(await page.locator("#selectedStart").isDisabled(),true);await page.locator("#inspectorClose").click();
  await page.locator("#wallStatus").selectOption("all");await page.locator("#wallGroup").selectOption("mesh//aux");assert.equal(await page.locator(".tile").count(),50);
  await page.locator("#wallGroup").selectOption("");await page.locator("#wallSearch").fill("not-found");await page.locator("#emptyWall").waitFor();await snap("empty-filter");await page.locator("#wallSearch").clear();
  await page.locator("#layoutOptions summary").click();await page.locator("#presetName").fill("Fixture layout");await page.locator("#save").click();await page.reload();await page.waitForFunction(()=>document.querySelector("#total")?.textContent==="100");await navigate("wall");assert.equal(await page.locator("#preset").inputValue(),"Fixture layout");
  assert.equal(await page.locator("#streams").textContent(),"0");assert.deepEqual(errors,[]);
  console.log("PASS: 5 viewports, 5 density levels, no page overflow/clipping, filters, keyboard selection, resize/reorder, focus, offline disabled, preset persistence. Synthetic fixture; zero live streams.");
  // Small representative screenshot bytes in CI log for visual review; fixture only.
  async function logVisual(name,width,height,cols){await page.setViewportSize({width,height});await columns(cols);await page.waitForTimeout(120);await labelFixture();const jpg=await page.screenshot({type:"jpeg",quality:40});const b64=jpg.toString("base64");for(let i=0;i<b64.length;i+=3000)console.log("MW_VISUAL_"+name+" "+b64.slice(i,i+3000));}
  if(await page.evaluate(()=>document.fullscreenEnabled)){await page.locator("#wallFullscreen").click();await page.waitForFunction(()=>document.fullscreenElement?.id==="wall");await page.locator("#wallFullscreen").click();await page.waitForFunction(()=>!document.fullscreenElement);}
  await logVisual("DESKTOP",1200,760,4);
  await logVisual("DENSE",1440,900,10);
  await logVisual("MOBILE",390,844,10);
 }
}finally{await browser.close();}
