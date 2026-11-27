// Same-origin MeshCentral control channel; no credentials persisted.
export class Control {
  constructor(onMessage,onStatus){
    this.onMessage=onMessage;this.onStatus=onStatus;this.socket=null;
    this.authenticated=false;this.pending=new Map();this.seq=0;
    this.connectTimer=null;this.ping=null;
  }
  start(){
    if(location.protocol!=="https:"){this.onStatus("HTTPS required");return;}
    if(this.socket&&this.socket.readyState<=1)return;
    if(this.socket)this.finish(this.socket);
    const u=new URL("./control.ashx",location.href);u.protocol="wss:";
    const ws=new WebSocket(u);this.socket=ws;
    this.connectTimer=setTimeout(()=>{if(this.socket===ws&&!this.authenticated)this.close("network");},12000);
    ws.onmessage=e=>{
      if(this.socket!==ws)return;
      let m;try{m=JSON.parse(e.data)}catch{return}
      if(!m||typeof m.action!=="string")return;
      if(m.action==="ping"){this.send({action:"pong"});return;}
      if(m.action==="close"){this.close("revoked");return;}
      if(m.action==="userinfo"&&m.userinfo?._id){this.authenticated=true;clearTimeout(this.connectTimer);this.onStatus("Authenticated");}
      const key=this.pending.has(m.responseid)?m.responseid:m.tag,p=this.pending.get(key);
      if(p&&p.action===m.action){this.pending.delete(key);clearTimeout(p.timer);if(m.result&&m.result!=="ok")p.reject(Error("Engine rejected "+m.action));else p.resolve(m);}
      if(this.authenticated)this.onMessage(m);
    };
    ws.onclose=e=>this.finish(ws,e?.code===1008||e?.code===4001||e?.code===4003?"revoked":"network");
    ws.onerror=()=>{if(this.socket===ws)this.close("network");};
    this.ping=setInterval(()=>this.send({action:"ping"}),25000);
  }
  finish(ws,reason="network"){
    if(this.socket!==ws)return;
    this.socket=null;this.authenticated=false;clearTimeout(this.connectTimer);clearInterval(this.ping);this.connectTimer=this.ping=null;
    for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error("Disconnected"));}
    this.pending.clear();this.onStatus("Disconnected — sign in or retry",reason);
  }
  send(m){
    if(this.socket?.readyState===1&&(this.authenticated||m.action==="ping"||m.action==="pong")){try{this.socket.send(JSON.stringify(m));return true;}catch{}}
    return false;
  }
  request(action,fields={},tagged=false){
    return new Promise((resolve,reject)=>{
      const id="mw-"+(++this.seq);
      if(!this.authenticated){reject(Error("Not authenticated"));return;}
      const timer=setTimeout(()=>{this.pending.delete(id);reject(Error("Timed out: "+action));},12000);
      this.pending.set(id,{action,resolve,reject,timer});
      if(!this.send({...fields,action,responseid:id,...(tagged?{tag:id}:{})})){clearTimeout(timer);this.pending.delete(id);reject(Error("Disconnected"));}
    });
  }
  requestTagged(action,fields={}){return this.request(action,fields,true);}
  close(reason="manual"){const ws=this.socket;if(!ws)return;this.finish(ws,reason);try{ws.close();}catch{}}
}
