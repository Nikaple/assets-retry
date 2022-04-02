!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t=t||self).assetsRetry=e()}(this,function(){"use strict";function B(t){return t}function l(){}function t(t){for(var e=Object.getPrototypeOf||function(t){return t.__proto__},n=Object.keys(t);e(t);)n=n.concat(Object.keys(e(t))),t=e(t);return n.filter(function(t){return"constructor"!==t})}function r(t,e){try{return"function"==typeof t[e]}catch(t){return!1}}function d(t){return Array.isArray(t)?t.reduce(function(t,e,n,r){return t[e]=r[(n+1)%r.length],t},{}):t}var e,n,o,y="retryTimes",h="succeeded",p="failed",v="maxRetryCount",g="onRetry",m="onSuccess",b="onFail",E="domain",u="styleImageNoImportant",O="_assetsRetryProxy",j="_assetsRetryOnerror",a="script",f="link",w="data-assets-retry-hooked",A="data-assets-retry-ignore",k="data-retry-id",s=window,L=window.document,i=s.HTMLElement,R=s.HTMLScriptElement,c=s.HTMLStyleElement,S=s.HTMLLinkElement,q=s.HTMLImageElement,z=Object.prototype.hasOwnProperty,T=function(t,e,n){var r=t.indexOf(e);return-1===r?t:t.substring(0,r)+n+t.substring(r+e.length)},x=function(t){return[].slice.call(t)},F=function(e,t,n,r){void 0===n&&(n=l);var o,r=(r=void 0===r?!1:r)||e.defer||e.async;if("loading"===L.readyState&&!/Edge|MSIE|rv:/i.test(navigator.userAgent)&&!r)return r=M(),o=e.outerHTML.replace(/data-retry-id="[^"]+"/,"").replace(/src=(?:"[^"]+"|.+)([ >])/,k+"="+r+' src="'+t+'"$1'),L.write(o),void((o=L.querySelector("script["+k+'="'+r+'"]'))&&(o.onload=n));var i=L.createElement(a),r=(Object.keys(R.prototype).forEach(function(t){if("src"!==t&&e[t]&&"object"!=typeof e[t])try{i[t]=e[t]}catch(t){}}),i.src=t,i.onload=e.onload,i.onerror=e.onerror,i.setAttribute(k,M()),e.getAttribute("nonce"));r&&i.setAttribute("nonce",r),L.getElementsByTagName("head")[0].appendChild(i)},I=function(e){try{return e.rules}catch(t){try{return e.cssRules}catch(t){return null}}},Z=function(e,t,n){var r=L.createElement(f);Object.keys(S.prototype).forEach(function(t){if("href"!==t&&e[t]&&"object"!=typeof e[t])try{r[t]=e[t]}catch(t){}}),r.href=t,r.onload=n||e.onload,r.onerror=e.onerror,r.setAttribute(k,M()),L.getElementsByTagName("head")[0].appendChild(r)},$=function(t){return t?t instanceof i?[t.nodeName,t.src,t.href,t.getAttribute(k)].join(";"):"not_supported":"null"},M=function(){return Math.random().toString(36).slice(2)},N=function(t){return t instanceof R||t instanceof q?t.src:t instanceof S?t.href:""},_={},D=function(t,e){return t.substr(t.indexOf(e)+e.length,t.length)},H=function(e,t){return Object.keys(t).filter(function(t){return-1<e.indexOf(t)}).sort(function(t,e){return e.length-t.length})[0]},P=function(t,e){var n,t=C(t,e),e=t[0],t=t[1];return e?(_[e]=_[e]||((n={})[y]=0,n[p]=[],n[h]=[],n),[t,_[e]]):[]},C=function(t,e){e=H(t,e);return e?[D(t,e),e]:["",""]};try{n=function(){for(var t=0,e=0,n=arguments.length;e<n;e++)t+=arguments[e].length;for(var r=Array(t),o=0,e=0;e<n;e++)for(var i=arguments[e],c=0,a=i.length;c<a;c++,o++)r[o]=i[c];return r}(t(R.prototype),t(S.prototype)),o={},n.forEach(function(t){o[t]=!0}),e=Object.keys(o)}catch(t){}function G(a,t){var u=t[v],f=d(t[E]),s=t[g];return e.reduce(function(t,n){var e=r(R.prototype,n);return t[n]=e?{value:function(){return a[O][n].apply(a[O],arguments)}}:{set:function(e){var c=a[O];return"onerror"===n?(a[j]=e,void(c.onerror=function(r){if("string"!=typeof r){r.stopPropagation&&r.stopPropagation();var t=function(){return t=a[j],e=c,n=r,"function"!=typeof t?null:t.call(e,n);var t,e,n},e=N(c),n=P(e,f),o=n[0],n=n[1],i=c.hasAttribute(A);if(!o||!n||i)return t();i=T(e,o,f[o]),o=s(i,e,n);if(null===o)return t();if("string"!=typeof o)throw new Error("a string should be returned in `onRetry` function");n[y]<=u?c instanceof R?F(c,o,l,!0):c instanceof S&&Z(c,o):t()}})):"onload"===n?(a._assetsRetryOnload=e,void(a[O].onload=function(t){e&&!e._called&&(e._called=!0,e.call(a[O],t))})):void(c[n]=e)},get:function(){return a[O][n]}},t},{})}var J=function(i){var c=L.createElement;L.createElement=function(t,e){return t===a||t===f?(n=c.call(L,t),r=i,n.setAttribute(w,"true"),(o={})[O]=n,o[j]=l,o=G(n=o,r),Object.defineProperties(n,o),n.onload=l,n.onerror=l,n):c.call(L,t,e);var n,r,o}},K=function(n){Object.keys(n).filter(function(t){return r(n,t)}).forEach(function(t){var e=n[t];n[t]=function(){var t=[].slice.call(arguments).map(function(t){return t&&(z.call(t,O)?t[O]:t)});return e.apply(this,t)}})};var Q={};function U(c){function a(t){if(t){var t=t.target||t.srcElement,e=N(t);if(e){var n=P(e,l),r=n[0],n=n[1],o=t instanceof HTMLElement&&t.hasAttribute(A);if(n&&r&&!o){o=$(t);if(!Q[o]){Q[o]=!0,n[y]++,n[p].push(e);o=n[y]>c[v];if(o&&t instanceof HTMLElement&&t.hasAttribute(k)&&(i=C(e,l)[0],s(i)),l[r]&&!o){var i=l[r],o=T(e,r,i),r=u(o,e,n);if(null!==r){if("string"!=typeof r)throw new Error("a string should be returned in `onRetry` function");t instanceof R&&!t.getAttribute(w)&&t.src?F(t,r):t instanceof S&&!t.getAttribute(w)&&t.href?Z(t,r):t instanceof q&&t.src&&(t.setAttribute(k,M()),t.src=r)}}}}}}}var u=c[g],f=c[m],s=c[b],l=c[E];L.addEventListener("error",a,!0),L.addEventListener("load",function(t){var e,n,r,o,i,c;t&&(e=t.target||t.srcElement,(n=N(e))&&((i=P(n,l))[0],r=i[1],o=C(n,l)[0],i=function(){r&&r[h].push(n),f(o)},e instanceof S?L.styleSheets&&(c=x(L.styleSheets).filter(function(t){return t.href===e.href})[0],null!==(c=I(c))&&(0===c.length?a(t):i())):i()))},!0)}var V={},W=[],X=function(t,y){var e=["backgroundImage","borderImage","listStyleImage"];t.forEach(function(l){var d,t=I(l);null!==t&&((d=x(t)).forEach(function(s){e.forEach(function(t){var e=s,n=l,r=d,o=y,i=o[E],c=o[g],a=e.style&&e.style[t];if(a&&!/^url\(["']?data:/.test(a)){var a=a.match(/^url\(["']?(.+?)["']?\)/)||[],u=(a[0],a[1]);if(u){var f=H(u,i);if(f&&i[f]){a=Object.keys(i).map(function(t){t=T(u,f,t);return'url("'+c(t,u,null)+'")'}).join(","),i=e.selectorText+("{ "+t.replace(/([a-z])([A-Z])/g,function(t,e,n){return e+"-"+n.toLowerCase()})+": "+a+" "+(o.styleImageNoImportant?"":"!important"))+"; }";try{n.insertRule(i,r.length)}catch(t){n.insertRule(i,0)}}}}})}),l.href&&(V[l.href]=!0),l.ownerNode instanceof c&&W.push(l.ownerNode))})},Y=function(t,e){return x(t).filter(function(t){return!!I(t)&&(t.href?!V[t.href]&&!!H(t.href,e):!((t=t.ownerNode)instanceof c&&-1<W.indexOf(t)))})};return function(t){var e,n,r,o;void 0===t&&(t={});try{if("object"!=typeof t[E])throw new Error("opts.domain cannot be non-object.");var i=[v,g,m,b,E,u],c=Object.keys(t).filter(function(t){return-1===i.indexOf(t)});if(0<c.length)throw new Error("option name: "+c.join(", ")+" is not valid.");(e={})[v]=t[v]||3,e[g]=t[g]||B,e[m]=t[m]||l,e[b]=t[b]||l,e[E]=d(t[E]),e[u]=t[u]||!1;var a=e;return J(a),"undefined"!=typeof Node&&K(Node.prototype),"undefined"!=typeof Element&&K(Element.prototype),U(a),n=a,r=L.styleSheets,o=n[E],r&&setInterval(function(){var t=Y(L.styleSheets,o);0<t.length&&X(t,n)},250),_}catch(t){s.console&&console.error("[assetsRetry] error captured",t)}}});
//# sourceMappingURL=assets-retry.umd.js.map
