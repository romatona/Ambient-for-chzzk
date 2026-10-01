let backend;
export function useStorage(value) { backend=value; }
export function subscribe(callback) {
  if (backend) return ()=>{};
  const listener=(changes,area)=>{if(area==='local')callback(changes);};
  chrome.storage.onChanged.addListener(listener);
  return ()=>chrome.storage.onChanged.removeListener(listener);
}
export const storage = {
  async get(key=null) {
    const values=await (backend || chrome.storage.local).get(key);
    return key ? values[key] : values;
  },
  async set(key,value) { await (backend || chrome.storage.local).set({[key]:value}); },
  async setMany(values) { await (backend || chrome.storage.local).set(values); },
};
