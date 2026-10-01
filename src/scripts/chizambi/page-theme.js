// Theme only the surrounding page surfaces; never resize the player or recolor chat names.
export function createPageTheme(doc=document) {
  const marked=new Set();
  function clear(){
    doc.documentElement.removeAttribute('data-chizambi-page');
    for(const node of marked)node.removeAttribute('data-chizambi-surface');
    marked.clear();
  }
  function apply(video){
    const main=video.closest('main');
    if(!main){clear();return;}
    const next=new Set();
    // Player wrappers also paint black behind contain-mode letterboxing.
    for(let node=video.parentElement||main;node&&node!==doc.body;node=node.parentElement)next.add(node);
    for(const node of marked)if(!next.has(node)){node.removeAttribute('data-chizambi-surface');marked.delete(node);}
    for(const node of next)if(!marked.has(node)){node.setAttribute('data-chizambi-surface','');marked.add(node);}
    if(!doc.documentElement.hasAttribute('data-chizambi-page'))doc.documentElement.setAttribute('data-chizambi-page','');
  }
  return {apply,clear};
}
