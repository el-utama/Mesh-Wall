// Pinned MeshCentral 1.3.2 account operations. Server remains the authority.
export const VIEWER_RIGHTS=8|256|512|1024|2048|4194304|8388608;
export function mayManageAccounts(user){return !!user&&((Number(user.siteadmin)>>>0)&2)!==0;}
export function isStandardAccount(user){return !!user&&Number(user.siteadmin||0)===0&&typeof user._id==="string"&&user._id.startsWith("user/");}
export function newAccount(username,password,confirmation){
 if(!/^[a-zA-Z][a-zA-Z0-9_.-]{2,31}$/.test(username))throw Error("Use 3–32 letters, numbers or ._- starting with a letter.");
 if(typeof password!=="string"||password.length<16||password.length>128||!/[a-zA-Z]/.test(password)||/[\r\n\u0000]/.test(password)||password!==confirmation)throw Error("Use matching 16–128 character passwords containing a letter.");
 return {username,pass:password,siteadmin:0,resetNextLogin:true};
}
export function viewerGrant(actor,target,group,remove=false){
 if(!mayManageAccounts(actor)||!isStandardAccount(target)||actor._id===target._id||group?.mtype!==2||typeof group._id!=="string"||group._id.split("/")[1]!==target._id.split("/")[1])throw Error("Choose a standard account and authorized agent group in the same domain.");
 // Never silently replace a broader direct membership or an unknown existing role.
 const current=target.links?.[group._id];
 if(remove?Number(current?.rights)!==VIEWER_RIGHTS:current!=null)throw Error("Existing membership differs; use advanced rights management.");
 return {meshid:group._id,userids:[target._id],meshadmin:VIEWER_RIGHTS,...(remove?{remove:true}:{})};
}
