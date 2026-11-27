// Copy only new MeshWall files into an existing pinned MeshCentral installation.
// Stop the existing service first. Does not change config, credentials, certs, or upstream files.
import {readFile,mkdir,copyFile,stat} from "node:fs/promises";
import {constants} from "node:fs";
import {resolve,dirname,join} from "node:path";
import {fileURLToPath} from "node:url";
const target=process.argv[2];if(!target)throw Error("Usage: node installers/adopt.mjs /path/to/meshcentral-install-root");
const root=resolve(target),source=fileURLToPath(new URL("../apps/web/public/",import.meta.url));
const version=JSON.parse(await readFile(join(root,"node_modules/meshcentral/package.json"),"utf8")).version;
if(version!=="1.3.2")throw Error("Expected MeshCentral 1.3.2. Check compatibility first.");
if(!(await stat(join(root,"meshcentral-data"))).isDirectory())throw Error("Existing meshcentral-data required.");
const dest=join(root,"meshcentral-web/public");
const paths=["meshwall.html","meshwall/app.mjs","meshwall/control.mjs","meshwall/desktop.mjs","meshwall/model.mjs","meshwall/style.css"];
for(const name of paths){try{await stat(join(dest,name));throw Error("Existing file: "+name+"; back up and review before replacing.");}catch(e){if(e.code!=="ENOENT")throw e;}}
for(const name of paths){await mkdir(dirname(join(dest,name)),{recursive:true});await copyFile(join(source,name),join(dest,name),constants.COPYFILE_EXCL);}
console.log("Copied MeshWall alpha without changing upstream configuration. Restart engine, open HTTPS /meshwall.html, and sign in. Verify permissions and consent policies.");
