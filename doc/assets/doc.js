import hljs from "./highlight/highlight.min.js";
import './highlight/languages/css.min.js';
import './highlight/languages/javascript.min.js';
import './highlight/languages/json.min.js';
import './highlight/languages/typescript.min.js';
import './highlight/languages/xml.min.js';
import './highlight/languages/shell.min.js';

import './marked.js';
hljs.highlightAll();

const rDemo = /\[demo]\([^)]+\.html\)/g;
const rUrl = /\((.+)\)/;
/**
 * @param selector
 * @param url
 * @param exampleUrl
 */
export function md(selector, url) {
  fetch(url).then(response => {
    response.text().then(text => {
      const el = document.querySelector(selector);

      // demo
      let exampleMatch = text.match(rDemo);
      if (exampleMatch) {
        text = text.replace(rDemo, '');
      }

      let html =  window.marked(text);

      if (exampleMatch) {
        exampleMatch.forEach(item => {
          html += `<iframe src="${item.match(rUrl)[1]}" class="demo"></iframe>`
        })
      }

      el.innerHTML = html;
      el.querySelectorAll('pre code').forEach(item => hljs.highlightElement(item));

      if (exampleMatch) {
        el.querySelectorAll('iframe').forEach(item => {
          item.contentWindow.addEventListener('load', () => {
            item.style.height = item.contentDocument.documentElement.offsetHeight + 'px'
          })
        })
      }
    })
  })
}