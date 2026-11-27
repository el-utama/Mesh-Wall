// Same-origin MeshCentral control channel; no passwords or tokens in storage.
export class Control {
  constructor(onMessage,onStatus){this.onMessage=onMessage;this.onStatus=onStatus;this.socket=null;this.authenticated=false;this.pending=new Map();this.seq=0;}
  start(){
    if(location.protocol!=="https:"){this.onStatus("HTTPS required");return;}
    if(this.socket&&this.socket.readyState<=1)return;
    const u=new URL("./control.ashx",location.href);u.protocol="wss:";
    const ws=new WebSocket(u);this.socket=ws;
    const timeout=setTimeout(()=>{if(!this.authenticated)ws.close();},12000);
    ws.onmessage=e=>{if(this.socket!==ws)return;let m;try{m=JSON.parse(e.data)}catch{return}
      if(!m||typeof m.action!=="string")return;
      if(m.action==="ping"){this.send({action:"pong"});return;}
      if(m.action==="close"){ws.close();return;}
      if(m.action==="userinfo"&&m.userinfo?._id){this.authenticated=true;clearTimeout(timeout);this.onStatus("Authenticated");}
      const p=this.pending.get(m.responseid);if(p&&p.action===m.action){this.pending.delete(m.responseid);clearTimeout(p.timer);if(m.result&&m.result!=="ok")p.reject(Error("Engine rejected "+m.action));else p.resolve(m);}
      if(this.authenticated)this.onMessage(m);
    };
    ws.onclose=()=>{clearTimeout(timeout);if(this.socket!==ws)return;clearInterval(this.ping);this.authenticated=false;for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error("Disconnected"));}this.pending.clear();this.onStatus("Disconnected — sign in or retry");};
    ws.onerror=()=>{if(ws.readyState<=1)ws.close();};
    this.ping=setInterval(()=>this.send({action:"ping"}),25000);
  }
  send(m){if(this.socket?.readyState===1&&(this.authenticated||m.action==="ping"||m.action==="pong")){this.socket.send(JSON.stringify(m));return true;}return false;}
  request(action,fields={}){return new Promise((resolve,reject)=>{const id="mw-"+(++this.seq);if(!this.authenticated){reject(Error("Not authenticated"));return;}const timer=setTimeout(()=>{this.pending.delete(id);reject(Error("Timed out: "+action));},12000);this.pending.set(id,{action,resolve,reject,timer});if(!this.send({...fields,action,responseid:id})){clearTimeout(timer);this.pending.delete(id);reject(Error("Disconnected"));}});}
  close(){this.socket?.close();}
}
