import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
const run=(...args)=>execFileSync(process.execPath,["installers/linux/config.mjs",...args],{encoding:"utf8",stdio:["ignore","pipe","pipe"]});
test("config uses Tailscale IP and TLS; disallows open signup and enforces consent",()=>{const c=JSON.parse(run("host.example.ts.net","100.64.0.1","8443"));assert.equal(c.settings.portBind,"100.64.0.1");assert.equal(c.settings.redirPort,0);assert.equal(c.settings.mpsPort,0);assert.equal(c.settings.allowFraming,false);assert.equal(c.domains[""].newAccounts,false);assert.equal(c.domains[""].userConsentFlags.desktopprompt,true);assert.equal(c.domains[""].localSessionRecording,false);assert.notEqual(c.settings.sessionKey,JSON.parse(run("host.example.ts.net","100.64.0.1","8443")).settings.sessionKey);});
test("config refuses public addresses, non-tailnet names and invalid ports",()=>{for(const a of [["host.example.ts.net","0.0.0.0","8443"],["evil.example.com","100.64.0.1","8443"],["host.example.ts.net","100.64.0.1","80"],["host.example.ts.net","100.64.999.1","8443"]])assert.throws(()=>run(...a));});
