// Official MeshCentral functional panels, same origin only. Never intercept login credentials.
import {$,el} from "./ui.mjs";
export function createPanels({control,onLoginLoad,onClose}){
 const dialog=$("panelDialog"),frame=$("panelFrame"),label=$("panelTitle"),fallback=$("panelFallback");let login=false;
 function close(){if(dialog.open)dialog.close();else clear();}
 function clear(){login=false;frame.removeAttribute("src");frame.src="about:blank";fallback.removeAttribute("href");onClose?.();}
 dialog.addEventListener("close",()=>{if(!dialog.open)clear();});
 $("closePanel").onclick=close;
 frame.addEventListener("load",()=>{if(login&&dialog.open)onLoginLoad?.();});
 function open(url,title,{auth=false}={}){
   const u=new URL(url,location.href);if(u.origin!==location.origin||u.protocol!=="https:")throw Error("Cross-origin panel rejected");
   login=auth;label.textContent=title;fallback.href=u.href;if(!dialog.open)dialog.showModal();frame.src=u.href;
 }
 function device(d,mode,title){const url=new URL("./",location.href);url.searchParams.set("node",d.id.split("/")[2]);url.searchParams.set("viewmode",String(mode));url.searchParams.set("hide","63");open(url,title);}
 function section(mode,title){const url=new URL("./",location.href);url.searchParams.set("viewmode",String(mode));url.searchParams.set("hide","63");open(url,title);}
 function signIn(){open(new URL("./",location.href),"Sign in securely",{auth:true});}
 return {open,device,section,signIn,close,isLogin:()=>login&&dialog.open};
}
