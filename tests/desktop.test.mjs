import test from "node:test";
import assert from "node:assert/strict";
import {createDesktop} from "../apps/web/public/meshwall/desktop.mjs";
test("view-only renderer reports live only after drawing, stops and validates display",()=>{
  globalThis.location={host:"lab.example.ts.net:8443",href:"https://lab.example.ts.net:8443/meshwall.html"};
  const calls=[],states=[],frames=[];
  const ctx={drawImage(){calls.push("draw")},clearRect(){calls.push("clear")}};
  const canvas={width:320,height:180,getContext(){return ctx}};
  let m,r;
  globalThis.CreateAgentRemoteDesktop=()=>m={Canvas:ctx,GetDisplayNumbers(){calls.push("monitors")},SetDisplay(n){calls.push(n)},SendCompressionLevel(...a){calls.push(a)},displays:{1:"Display 1"}};
  globalThis.CreateAgentRedirect=()=>r={Start(id){calls.push(id)},Stop(){calls.push("stop")}};
  const s=createDesktop({control:{authenticated:true},device:{id:"node//a"},canvas,cookies:{cookie:"test",rcookie:"test"},profile:"eco",onState:x=>states.push(x),onDisplays:()=>{},onFrame:()=>frames.push("frame")});
  try{assert.equal(m.stopInput,true);assert.equal(r.attemptWebRTC,false);assert.equal(m.FrameRateTimer,500);r.onStateChanged(r,3);assert.equal(frames.length,0);ctx.drawImage({});assert.equal(frames.length,1);s.display(2);assert.ok(!calls.includes(2));s.display(1);assert.ok(calls.includes(1));s.quality("balanced");assert.ok(calls.some(Array.isArray));s.stop();ctx.drawImage({});assert.equal(frames.length,1);assert.equal(s.stopped,true);assert.ok(calls.includes("stop"));}finally{s.stop();delete globalThis.CreateAgentRemoteDesktop;delete globalThis.CreateAgentRedirect;delete globalThis.location;}
});
test("renderer rejects missing credentials",()=>{globalThis.CreateAgentRemoteDesktop=()=>{};globalThis.CreateAgentRedirect=()=>{};try{assert.throws(()=>createDesktop({control:{authenticated:false}}),/Authenticated relay/)}finally{delete globalThis.CreateAgentRemoteDesktop;delete globalThis.CreateAgentRedirect;}});

test("repeated sessions release the canvas hook and clear stale pixels",()=>{
 globalThis.location={host:"lab.example.ts.net:8443",href:"https://lab.example.ts.net:8443/meshwall.html"};
 let frames=0,clears=0,m,r;const draw=function(){},ctx={drawImage:draw,clearRect(){clears++;}},canvas={width:320,height:180,getContext:()=>ctx};
 globalThis.CreateAgentRemoteDesktop=()=>m={Canvas:ctx,GetDisplayNumbers(){},PendingOperations:[]};
 globalThis.CreateAgentRedirect=()=>r={Start(){},Stop(){}};
 const make=()=>createDesktop({control:{authenticated:true},device:{id:"node//a"},canvas,cookies:{cookie:"test",rcookie:"test"},profile:"eco",onState:()=>{},onDisplays:()=>{},onFrame:()=>frames++});
 try{for(let i=0;i<20;i++){const s=make();r.onStateChanged(r,3);ctx.drawImage({});const stale=ctx.drawImage;s.stop();assert.equal(ctx.drawImage,draw);assert.equal(m.Canvas,null);stale({});assert.equal(frames,i+1);}
 const s=make();r.onStateChanged(r,3);r.onStateChanged(r,0);assert.equal(s.stopped,true);assert.equal(ctx.drawImage,draw);assert.equal(clears,21);
 }finally{delete globalThis.location;delete globalThis.CreateAgentRemoteDesktop;delete globalThis.CreateAgentRedirect;}
});
