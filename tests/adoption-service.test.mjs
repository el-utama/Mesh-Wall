import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {existsSync} from "node:fs";
import {mkdtemp,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,win32} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";
import {inspectAdoptionService} from "../installers/support/adoption-service.mjs";

const linuxRoot="/srv/Mesh Lab";
const unit="meshcentral.service";
const linuxEvidence={
  fields:{Id:unit,LoadState:"loaded",NeedDaemonReload:"no",ActiveState:"inactive",MainPID:"0",User:"mesh",WorkingDirectory:linuxRoot},
  commands:[["/usr/bin/node",["/usr/bin/node",linuxRoot+"/node_modules/meshcentral"]]]
};
const inspectLinux=(evidence,name=unit)=>inspectAdoptionService(linuxRoot,name,{platform:"linux",read:async()=>evidence});

test("systemd inspection requires the exact typed launch without path overrides",async()=>{
  assert.deepEqual(await inspectLinux(linuxEvidence),{status:"verified",name:unit,state:"stopped",account:"mesh"});
  const active={...linuxEvidence.fields,ActiveState:"active",MainPID:"42"};
  assert.equal((await inspectLinux({...linuxEvidence,fields:active})).state,"running");
  assert.equal((await inspectLinux({...linuxEvidence,fields:{...active,ActiveState:"deactivating"}})).state,"transitioning");
  assert.equal((await inspectLinux({...linuxEvidence,commands:[["/usr/bin/node",["/usr/bin/node","/srv/Mesh Lab other/node_modules/meshcentral"]]]})).status,"mismatch");
  const overrides=[
    {...linuxEvidence,commands:[["/usr/bin/node",[...linuxEvidence.commands[0][1],"--datapath","/srv/other"]]]},
    {...linuxEvidence,fields:{...active,RootImage:"/srv/image"}},
    {...linuxEvidence,fields:{...active,EnvironmentFiles:"/srv/env"}},
    {...linuxEvidence,fields:{...active,Environment:"NODE_OPTIONS=fixture-secret"}},
    {...linuxEvidence,fields:{...active,NeedDaemonReload:"yes"}}
  ];
  for(const evidence of overrides)assert.deepEqual(await inspectLinux(evidence),{status:"unsupported"});
  assert.equal((await inspectLinux(null)).status,"missing");
  assert.equal((await inspectLinux(linuxEvidence,"--fixture.service")).status,"invalid");
  assert.deepEqual(await inspectAdoptionService(linuxRoot,unit,{platform:"linux",read:async()=>{throw Error("fixture-secret");}}),{status:"unavailable"});
});

test("native systemd service lookup reads typed metadata and rejects an unrelated daemon",{
  skip:process.platform!=="linux"||!existsSync("/run/systemd/system")
},async()=>{
  assert.deepEqual(await inspectAdoptionService(linuxRoot,"systemd-journald.service"),{status:"unsupported"});
});

const windowsRoot=String.raw`C:\Program Data\MeshCentral`;
const engine=win32.join(windowsRoot,"node_modules","meshcentral");
const windowsEvidence={
  Name:"meshcentral",PathName:'"'+win32.join(engine,"daemon","meshcentral.exe")+'"',
  StartName:String.raw`NT AUTHORITY\LocalService`,State:"Running",ProcessId:44,
  Launch:{
    Executable:String.raw`C:\Program Files\nodejs\node.exe`,WorkingDirectory:windowsRoot,
    Args:[win32.join(engine,"node_modules","node-windows","lib","wrapper.js"),
      "--file",win32.join(engine,"winservice.js"),"--log","MeshCentral wrapper","--grow","0.5"]
  }
};
const inspectWindows=evidence=>inspectAdoptionService(windowsRoot,"MeshCentral",{platform:"win32",read:async()=>evidence});

test("Windows inspection matches the registered WinSW executable and its intended engine script",async()=>{
  assert.deepEqual(await inspectWindows(windowsEvidence),{status:"verified",name:"meshcentral",state:"running",account:windowsEvidence.StartName});
  assert.equal((await inspectWindows({...windowsEvidence,State:"Stopped",ProcessId:0})).state,"stopped");
  assert.equal((await inspectWindows({...windowsEvidence,State:"Stop Pending",ProcessId:44})).state,"transitioning");
  assert.deepEqual(await inspectWindows({...windowsEvidence,PathName:String.raw`C:\Elsewhere\meshcentral.exe`}),{status:"mismatch"});
  assert.deepEqual(await inspectWindows({...windowsEvidence,PathName:windowsEvidence.PathName+" custom"}),{status:"unsupported"});
  assert.deepEqual(await inspectWindows({...windowsEvidence,Launch:{...windowsEvidence.Launch,Unexpected:true}}),{status:"unsupported"});
  const changed=[...windowsEvidence.Launch.Args];
  changed[2]=String.raw`C:\Elsewhere\winservice.js`;
  assert.deepEqual(await inspectWindows({...windowsEvidence,Launch:{...windowsEvidence.Launch,Args:changed}}),{status:"unsupported"});
});

test("native Windows adapter reads CIM and parses WinSW XML without resolving a DTD",{skip:process.platform!=="win32"},async()=>{
  const result=await inspectAdoptionService(windowsRoot,"EventLog");
  assert.ok(["mismatch","unsupported"].includes(result.status),"Expected a native CIM result for the system EventLog service");
  const dir=await mkdtemp(join(tmpdir(),"mw-winsw-"));
  const xml=join(dir,"fixture.xml");
  const powershell=join(process.env.SystemRoot,"System32","WindowsPowerShell","v1.0","powershell.exe");
  const script=fileURLToPath(new URL("../installers/windows/inspect-adoption-service.ps1",import.meta.url));
  const read=()=>execFileSync(powershell,["-NoProfile","-NonInteractive","-Command",
    '$ErrorActionPreference="Stop"; . $env:MW_WINSW_PARSER; Read-MeshWallWinSW $env:MW_WINSW_XML | ConvertTo-Json -Compress'
  ],{env:{...process.env,MW_WINSW_PARSER:script,MW_WINSW_XML:xml},encoding:"utf8",timeout:10000,windowsHide:true,stdio:["ignore","pipe","pipe"]});
  try{
    await writeFile(xml,"<service><executable>node.exe</executable><argument>wrapper.js</argument><argument>--file</argument><argument>winservice.js</argument></service>");
    assert.deepEqual(JSON.parse(read()).Args,["wrapper.js","--file","winservice.js"]);
    await writeFile(xml,"<!DOCTYPE service [<!ENTITY entry 'fixture'>]><service><executable>&entry;</executable></service>");
    assert.throws(read,error=>error.status!==0);
  }finally{await rm(dir,{recursive:true,force:true});}
});
