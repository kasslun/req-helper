export default function (dom) {
  if (typeof dom === 'string') {
    dom = document.querySelector(dom);
  }
  dom.classList.add('logs');
  return log => {
    log = log?.toString() || String(log);
    const date = new Date();
    let child = document.createElement('div');
    child.classList.add('logs-item')
    child.innerHTML = `<span>➜ ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ${date.getMilliseconds()}</span>${log}`
    dom.appendChild(child);
    dom.scrollTop = 999999999
    return newLog => {
      child.innerHTML = `<span>➜ ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ${date.getMilliseconds()}</span>${log} ${newLog}`
      dom.scrollTop = 999999999
    }
  }
}