import fs from "node:fs";
const data=JSON.parse(fs.readFileSync(new URL("../language-data/arl-language.json", import.meta.url),"utf8"));
for(const [k,v] of Object.entries(data.categories)) console.log(`${k}: ${v.length}`);
console.log(`indent open: ${data.indentation.open.length}`);
console.log(`indent close: ${data.indentation.close.length}`);
console.log(`indent branches: ${data.indentation.sameLevelBranch.length}`);
