/**
 * req-helper
 * By kasslun@gmail.com
 *
 * @license MIT License.
 * Documentation https://kasslun.github.io/req-helper.doc/
 * The Req Helper is an ajax, fetch and other interface request help library. It provides some functions to reduce the
 * number of HTTP requests. Proxy functions are used to control the sending frequency of requests and cache responses.
 * It is applicable to client-side JavaScript (such as Browser, React Native, Electron) and server-side Node environment.
 */
import cache from "./cache";
import deResend from "./deResend";
import latest from "./latest";
import packing from "./packing";
import polling from "./polling";
export { cache, deResend, latest, packing, polling };
