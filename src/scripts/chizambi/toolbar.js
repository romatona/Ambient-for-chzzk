import icon from './toolbar-icon';

export function createToolbar(toggle,doc=document){
  let button;
  function clear(){button?.remove();button=null;}
  function sync(enabled,active){
    if(!active){clear();return;}
    const bar=doc.querySelector('.pzp-pc__bottom-buttons-right');
    if(!bar){clear();return;}
    if(!button){
      button=doc.createElement('button');
      button.type='button';
      button.className='chizambi-toolbar-button pzp-pc__setting-button pzp-button pzp-pc-ui-button';
      button.setAttribute('aria-label','영화모드 (G)');
      const tooltip=doc.createElement('span');
      tooltip.className='pzp-button__tooltip pzp-button__tooltip--top';
      tooltip.textContent='영화모드 (G)';
      const image=doc.createElement('img');image.src=icon;image.alt='';image.draggable=false;
      button.append(tooltip,image);
      button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();toggle();});
      button.addEventListener('dblclick',event=>{event.preventDefault();event.stopPropagation();});
    }
    if(button.parentElement!==bar)bar.prepend(button);
    button.setAttribute('aria-pressed',String(enabled));
  }
  return {sync,clear};
}
