import {mkdir,readFile,writeFile,copyFile,readdir} from 'node:fs/promises';
import {dirname} from 'node:path';
const {version}=JSON.parse(await readFile('package.json','utf8'));
const base=`release/chizAmbi-${version}`;
async function copy(source,target){await mkdir(dirname(target),{recursive:true});let data=await readFile(source);if(source.endsWith('.js'))data=Buffer.from(data.toString().replace(/^\/\/# sourceMappingURL=.*$/gm,''));await writeFile(target,data);}
const manifest=JSON.parse(await readFile('dist/manifest.json','utf8'));
const install=['manifest.json','popup.html','styles/popup.css','styles/content.css','scripts/content.js','scripts/popup.js','LICENSE','THIRD_PARTY_NOTICES.md',...Object.values(manifest.icons)];
for(const file of install)await copy(`dist/${file}`,`${base}/extension/${file}`);
const source=['README.md','LICENSE','THIRD_PARTY_NOTICES.md','package.json','package-lock.json','rollup.config.js','scripts/package.mjs','scripts/demo-server.mjs','scripts/release.mjs','src/popup.html','src/styles/chizambi.scss','src/styles/popup.css',...Object.values(manifest.icons).map(p=>`src/${p}`),...['projector-webgl.js','projector-2d.js','projector-shadow.js','generic.js','errors/ambient-light-error.js'].map(p=>`src/scripts/libs/${p}`)];
for(const dir of ['src/scripts/chizambi','tests'])for(const name of await readdir(dir))if(name.endsWith('.js'))source.push(`${dir}/${name}`);
for(const file of source)await copy(file,`${base}/source/${file}`);
await writeFile(`${base}/source/.gitignore`,'node_modules/\ndist/\nrelease/\n.env*\n*.log\n');
console.log(base);
