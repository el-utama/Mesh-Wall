import {readdir} from "node:fs/promises";import {join} from "node:path";import {execFileSync} from "node:child_process";
async function walk(path){for(const entry of await readdir(path,{withFileTypes:true})){const p=join(path,entry.name);if(entry.isDirectory())await walk(p);else if(/\.(mjs|js)$/.test(p))execFileSync(process.execPath,["--check",p],{stdio:"inherit"});}}
for(const path of ["apps","installers","scripts","tests"])await walk(path);
