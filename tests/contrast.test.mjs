import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
function luminance(hex){const [r,g,b]=hex.match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return 0.2126*r+0.7152*g+0.0722*b;}
function ratio(a,b){const [x,y]=[luminance(a),luminance(b)].sort((a,b)=>b-a);return (x+0.05)/(y+0.05);}
for(const path of ["apps/web/public/meshwall/style.css","installers/setup/setup.css"]){test("palette contrast: "+path,()=>{const css=readFileSync(path,"utf8"),tokens=Object.fromEntries([...css.matchAll(/--([a-z-]+):#([a-f0-9]{6})\b/gi)].map(m=>[m[1],m[2]]));for(const [foreground,background,target] of [["text","panel",4.5],["muted","panel",4.5],["accent","panel",4.5],["accent-ink","accent",4.5],["control","raised",3],["control","panel",3]]){assert.ok(tokens[foreground]&&tokens[background],"Missing design token");assert.ok(ratio(tokens[foreground],tokens[background])>=target,foreground+" / "+background+" below "+target);}});}
