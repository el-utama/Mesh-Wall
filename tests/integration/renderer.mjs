// Real upstream renderer, generated JPEG data, fake transport. No remote device/agent.
export async function checkRenderer(page){
 await page.evaluate(async()=>{
  const {createDesktop}=await import(new URL("meshwall/desktop.mjs",location.href).href);
  const original=globalThis.CreateAgentRedirect,canvas=document.createElement("canvas"),fixture=document.createElement("canvas");
  canvas.width=320;canvas.height=180;fixture.width=32;fixture.height=24;
  const fc=fixture.getContext("2d");fc.fillStyle="#3d8a5c";fc.fillRect(0,0,32,24);
  const jpeg=Uint8Array.from(atob(fixture.toDataURL("image/jpeg",.95).split(",")[1]),c=>c.charCodeAt(0));
  const tile=new Uint8Array(jpeg.length+8);tile.set([0,3,tile.length>>8,tile.length&255,0,0,0,0]);tile.set(jpeg,8);
  const size=new Uint8Array([0,7,0,8,0,32,0,24]);const ctx=canvas.getContext("2d"),draw=ctx.drawImage;
  let renderer,relay;
  globalThis.CreateAgentRedirect=(_,m)=>{renderer=m;relay={send(){},Start(){m.xxStateChange(3);relay.onStateChanged(relay,3);},Stop(){m.xxStateChange(0);relay.onStateChanged?.(relay,0);}};m.parent=relay;return relay;};
  try{
   for(let i=0;i<3;i++){
    let frames=0;
    const session=createDesktop({control:{authenticated:true},device:{id:"node//fixture"},canvas,cookies:{cookie:"fixture",rcookie:"fixture"},profile:"eco",onState:()=>{},onDisplays:()=>{},onFrame:()=>frames++});
    try{
     if(frames!==0||!renderer.stopInput)throw Error("Unexpected live state or remote input");
     renderer.ProcessBinaryCommand(7,size.length,size);
     renderer.ProcessBinaryCommand(3,tile.length,tile);
     const deadline=Date.now()+5000;while(frames===0&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));
     if(!frames||!session.firstFrame)throw Error("Upstream did not decode fixture JPEG");
     const p=ctx.getImageData(4,4,1,1).data;
     if(p[1]<100||p[1]<=p[0]||p[3]!==255)throw Error("Fixture image was not drawn");
    }finally{session.stop();}
    if(ctx.drawImage!==draw||ctx.getImageData(4,4,1,1).data[3]!==0)throw Error("Canvas not released/cleared");
   }
  }finally{globalThis.CreateAgentRedirect=original;}
 });
 console.log("PASS: real MeshCentral browser renderer decodes generated JPEG frames and releases canvas on repeated sessions; fake transport, no live agent.");
}
