import test from "node:test";
import assert from "node:assert/strict";
import {Control} from "../apps/web/public/meshwall/control.mjs";
test("control authenticates only on userinfo; correlates requests and clears pending on close",async()=>{
 const states=[],messages=[];let socket;
 globalThis.location={protocol:"https:",href:"https://lab.example.ts.net/meshwall.html"};
 globalThis.WebSocket=class{constructor(url){this.url=String(url);this.readyState=1;this.sent=[];socket=this;}send(s){this.sent.push(JSON.parse(s));}close(){if(this.readyState===3)return;this.readyState=3;this.onclose?.();}emit(m){this.onmessage({data:JSON.stringify(m)});}};
 const c=new Control(m=>messages.push(m),s=>states.push(s));
 try{c.start();assert.equal(socket.url,"wss://lab.example.ts.net/control.ashx");assert.equal(c.send({action:"nodes"}),false);socket.emit({action:"userinfo",userinfo:{_id:"user//lab"}});assert.equal(c.authenticated,true);const req=c.request("nodes");const sent=socket.sent.at(-1);socket.emit({action:"wrong",responseid:sent.responseid});assert.equal(c.pending.size,1);socket.emit({action:"nodes",responseid:sent.responseid,nodes:{}});assert.deepEqual((await req).nodes,{});const pending=c.request("createmesh");c.close();await assert.rejects(pending,/Disconnected/);assert.equal(c.pending.size,0);assert.equal(c.authenticated,false);}finally{c.close();delete globalThis.WebSocket;delete globalThis.location;}
});
test("control rejects non-HTTPS",()=>{globalThis.location={protocol:"http:",href:"http://lab/meshwall.html"};let state;try{new Control(()=>{},s=>state=s).start();assert.equal(state,"HTTPS required");}finally{delete globalThis.location;}});
