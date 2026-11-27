export const $=id=>document.getElementById(id);
export function el(tag,text){const node=document.createElement(tag);if(text!=null)node.textContent=text;return node;}
export function matches(d,term){return (d.name+" "+d.groupName+" "+d.os).toLowerCase().includes(term.toLowerCase());}
