import { defaults, normalizeSettings, ranges } from './model';
import { storage } from './storage';
import { presets, presetKeys, presetValues, validPreset } from './presets';
const status=document.getElementById('status');
document.getElementById('directions').innerHTML=Object.entries({directionTopEnabled:'위',directionRightEnabled:'오른쪽',directionBottomEnabled:'아래',directionLeftEnabled:'왼쪽'}).map(([key,label])=>`<label class="row" for="${key}">${label}<span class="switch"><input id="${key}" type="checkbox"><i></i></span></label>`).join('');
document.getElementById('sliders').innerHTML=Object.entries({brightness:'밝기',blur2:'흐림',spread:'퍼짐',fadeInDuration:'페이드인 시간'}).map(([key,label])=>`<label class="range" for="${key}"><span>${label}<output id="${key}-value"></output></span><input id="${key}" type="range" min="${ranges[key][0]}" max="${ranges[key][1]}" step="${key==='fadeInDuration'?.1:1}"></label>`).join('');
function renderValue(key,value){const output=document.getElementById(`${key}-value`);if(output)output.textContent=key==='fadeInDuration'?(value===0?'꺼짐':`${value.toFixed(1)}초`):`${value}%`;if(key==='theme')document.documentElement.dataset.theme=value;}
async function init(){
  const saved=await storage.get();
  const settings=normalizeSettings(saved);
  let userPreset=validPreset(saved['user-preset-1'])?presetValues(saved['user-preset-1']):null;
  let queue=Promise.resolve();
  const updateUser=()=>{document.getElementById('preset-user').disabled=!userPreset;document.getElementById('preset-user-values').textContent=userPreset?presetKeys.map(key=>userPreset[key]).join(' · '):'저장된 값 없음';};
  const applyPreset=value=>{
    for(const key of presetKeys){settings[key]=value[key];document.getElementById(key).value=value[key];renderValue(key,value[key]);}
    status.textContent='적용 중…';
    queue=queue.then(()=>storage.setMany(Object.fromEntries(presetKeys.map(key=>['setting-'+key,value[key]])))).then(()=>{status.textContent='프리셋 적용됨';}).catch(()=>{status.textContent='저장 실패 · 다시 시도해 주세요.';});
  };
  presets.forEach((value,index)=>document.getElementById(`preset-${index+1}`).addEventListener('click',()=>applyPreset(value)));
  document.getElementById('preset-user').addEventListener('click',()=>{if(userPreset)applyPreset(userPreset);});
  document.getElementById('preset-save').addEventListener('click',()=>{
    const value=presetValues(settings);
    queue=queue.then(()=>storage.set('user-preset-1',value)).then(()=>{userPreset=value;updateUser();status.textContent='유저 프리셋 1 저장됨';}).catch(()=>{status.textContent='프리셋 저장 실패';});
  });
  updateUser();
  for(const input of document.querySelectorAll('input,select')){
    const key=input.id;if(input.type==='checkbox')input.checked=settings[key];else input.value=settings[key];renderValue(key,settings[key]);
    const save=()=>{
      const value=input.type==='checkbox'?input.checked:input.type==='range'?Number(input.value):input.value;
      settings[key]=value;
      renderValue(key,value);status.textContent='저장 중…';
      queue=queue.then(()=>storage.set(`setting-${key}`,value)).then(()=>{status.textContent='저장됨';}).catch(()=>{status.textContent='저장 실패 · 확장을 다시 열어 주세요.';});
    };
    input.addEventListener('input',save);
    if(input.type==='range'){
      input.title='더블클릭하면 기본값으로 복원';
      input.setAttribute('aria-describedby','reset-hint');
      input.addEventListener('dblclick',event=>{
        event.preventDefault();
        input.value=defaults[key];
        save();
      });
    }
  }
  status.textContent='설정 준비됨';
}
init().catch(()=>{status.textContent='설정을 불러오지 못했어요.';});
