export function normalizeNodes(payload,groups=[]){if(!payload||typeof payload!=="object"||Array.isArray(payload))throw Error("Invalid device response");const names=new Map(groups.map(g=>[g._id,g.name]));const seen=new Set();const out=[];for(const [group,nodes] of Object.entries(payload)){if(!Array.isArray(nodes))throw Error("Invalid device group response");for(const n of nodes){if(typeof n?._id!=="string"||!/^node\/[^/]*\/[A-Za-z0-9@$+_=-]+$/.test(n._id)||seen.has(n._id))continue;seen.add(n._id);out.push({id:n._id,name:String(n.name||n.rname||"Unnamed PC"),group,groupName:String(names.get(group)||"Unknown group"),online:!!(Number(n.conn)&1),os:String(n.osdesc||"")});}}return out.sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));}

export function clampInt(v,min,max,fallback){const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.trunc(n))):fallback;}

export function sanitizeLayout(raw){const data=raw&&typeof raw==="object"?raw:{};const order=Array.isArray(data.order)?[...new Set(data.order.filter(x=>typeof x==="string"&&x.startsWith("node/")))].slice(0,100):[];const sizes=Object.create(null);for(const id of order){const s=data.sizes?.[id];sizes[id]={cols:clampInt(s?.cols,1,10,1),rows:clampInt(s?.rows,1,6,1)};}return {columns:clampInt(data.columns,1,10,4),order,sizes};}

export function orderedDevices(devices,layout){const byId=new Map(devices.map(d=>[d.id,d]));const out=[];for(const id of layout.order){if(byId.has(id)){out.push(byId.get(id));byId.delete(id);}}return out.concat([...byId.values()]).slice(0,100);}

export function nextSessions(devices,requested,active,limit){return devices.filter(d=>d.online&&requested.has(d.id)&&!active.has(d.id)).slice(0,Math.max(0,clampInt(limit,1,100,4)-active.size)).map(d=>d.id);}

export function qualityProfile(profile,focus=false){if(focus)return {quality:55,scale:768,interval:100};return ({eco:{quality:25,scale:256,interval:500},balanced:{quality:40,scale:384,interval:250},high:{quality:55,scale:640,interval:125}})[profile]||{quality:25,scale:256,interval:500};}

// Reconnect only the authenticated control channel, never a remote desktop session.
export function controlRetryDelay(attempt){return Number.isInteger(attempt)&&attempt>=0&&attempt<5?1000*2**attempt:null;}
