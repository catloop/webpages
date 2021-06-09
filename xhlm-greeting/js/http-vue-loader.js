!function(t,e){"object"==typeof module&&"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define([],e):t.httpVueLoader=e()}(this,function(){"use strict";var t=0;function o(t,e){this.component=t,this.elt=e}function s(t,e){this.component=t,this.elt=e,this.module={exports:{}}}function r(t,e){this.component=t,this.elt=e}function n(t){this.name=t,this.template=null,this.script=null,this.styles=[],this._scopeId=""}function e(t){return t}function u(t){var e=t.match(/(.*?)([^/]+?)\/?(\.vue)?(\?.*|#.*|$)/);return{name:e[2],url:e[1]+e[2]+(void 0===e[3]?"/index.vue":e[3])+e[4]}}function l(t,e){return"./"===e.substr(0,2)||"../"===e.substr(0,3)?t+e:e}function c(t,e){var n=u(t);return c.load(n.url,e)}return o.prototype={withBase:function(t){var e;if(this.component.baseURI){(e=document.createElement("base")).href=this.component.baseURI;var n=this.component.getHead();n.insertBefore(e,n.firstChild)}t.call(this),e&&this.component.getHead().removeChild(e)},scopeStyles:function(r,u){function e(){for(var t=r.sheet,e=t.cssRules,n=0;n<e.length;++n){var i=e[n];if(1===i.type){var o=[];i.selectorText.split(/\s*,\s*/).forEach(function(t){o.push(u+" "+t);var e=t.match(/([^ :]+)(.+)?/);o.push(e[1]+u+(e[2]||""))});var s=o.join(",")+i.cssText.substr(i.selectorText.length);t.deleteRule(n),t.insertRule(s,n)}}}try{e()}catch(t){if(t instanceof DOMException&&t.code===DOMException.INVALID_ACCESS_ERR)return r.sheet.disabled=!0,void r.addEventListener("load",function t(){r.removeEventListener("load",t),setTimeout(function(){e(),r.sheet.disabled=!1})});throw t}},compile:function(){var t=null!==this.template,e=this.elt.hasAttribute("scoped");if(e){if(!t)return;this.elt.removeAttribute("scoped")}return this.withBase(function(){this.component.getHead().appendChild(this.elt)}),e&&this.scopeStyles(this.elt,"["+this.component.getScopeId()+"]"),Promise.resolve()},getContent:function(){return this.elt.textContent},setContent:function(t){this.withBase(function(){this.elt.textContent=t})}},s.prototype={getContent:function(){return this.elt.textContent},setContent:function(t){this.elt.textContent=t},compile:function(t){var e=function(t){return c.require(l(this.component.baseURI,t))}.bind(this),n=function(t,e){return c(l(this.component.baseURI,t),e)}.bind(this);try{Function("exports","require","httpVueLoader","module",this.getContent()).call(this.module.exports,this.module.exports,e,n,this.module)}catch(t){if(!("lineNumber"in t))return Promise.reject(t);var i=responseText.replace(/\r?\n/g,"\n"),o=i.substr(0,i.indexOf(script)).split("\n").length+t.lineNumber-1;throw new t.constructor(t.message,url,o)}return Promise.resolve(this.module.exports).then(c.scriptExportsHandler.bind(this)).then(function(t){this.module.exports=t}.bind(this))}},r.prototype={getContent:function(){return this.elt.innerHTML},setContent:function(t){this.elt.innerHTML=t},getRootElt:function(){var t=this.elt.content||this.elt;if("firstElementChild"in t)return t.firstElementChild;for(t=t.firstChild;null!==t;t=t.nextSibling)if(t.nodeType===Node.ELEMENT_NODE)return t;return null},compile:function(){return Promise.resolve()}},n.prototype={getHead:function(){return document.head||document.getElementsByTagName("head")[0]},getScopeId:function(){return""===this._scopeId&&(this._scopeId="data-s-"+(t++).toString(36),this.template.getRootElt().setAttribute(this._scopeId,"")),this._scopeId},load:function(i){return c.httpRequest(i).then(function(t){this.baseURI=i.substr(0,i.lastIndexOf("/")+1);var e=document.implementation.createHTMLDocument("");e.body.innerHTML=(this.baseURI?'<base href="'+this.baseURI+'">':"")+t;for(var n=e.body.firstChild;n;n=n.nextSibling)switch(n.nodeName){case"TEMPLATE":this.template=new r(this,n);break;case"SCRIPT":this.script=new s(this,n);break;case"STYLE":this.styles.push(new o(this,n))}return this}.bind(this))},_normalizeSection:function(n){return(null!==n&&n.elt.hasAttribute("src")?c.httpRequest(n.elt.getAttribute("src")).then(function(t){return n.elt.removeAttribute("src"),t}):Promise.resolve(null)).then(function(t){if(null!==n&&n.elt.hasAttribute("lang")){var e=n.elt.getAttribute("lang");return n.elt.removeAttribute("lang"),c.langProcessor[e.toLowerCase()].call(this,null===t?n.getContent():t)}return t}.bind(this)).then(function(t){null!==t&&n.setContent(t)})},normalize:function(){return Promise.all(Array.prototype.concat(this._normalizeSection(this.template),this._normalizeSection(this.script),this.styles.map(this._normalizeSection))).then(function(){return this}.bind(this))},compile:function(){return Promise.all(Array.prototype.concat(this.template&&this.template.compile(),this.script&&this.script.compile(),this.styles.map(function(t){return t.compile()}))).then(function(){return this}.bind(this))}},c.load=function(t,e){return function(){return new n(e).load(t).then(function(t){return t.normalize()}).then(function(t){return t.compile()}).then(function(t){var e=null!==t.script?t.script.module.exports:{};return null!==t.template&&(e.template=t.template.getContent()),void 0===e.name&&void 0!==t.name&&(e.name=t.name),e._baseURI=t.baseURI,e})}},c.register=function(t,e){var n=u(e);t.component(n.name,c.load(n.url))},c.install=function(o){o.mixin({beforeCreate:function(){var t=this.$options.components;for(var e in t)if("string"==typeof t[e]&&"url:"===t[e].substr(0,4)){var n=u(t[e].substr(4)),i="_baseURI"in this.$options?l(this.$options._baseURI,n.url):n.url;isNaN(e)?t[e]=c.load(i,e):t[e]=o.component(n.name,c.load(i,n.name))}}})},c.require=function(t){return window[t]},c.httpRequest=function(i){return new Promise(function(t,e){var n=new XMLHttpRequest;n.open("GET",i),n.responseType="text",n.onreadystatechange=function(){4===n.readyState&&(200<=n.status&&n.status<300?t(n.responseText):e(n.status))},n.send(null)})},c.langProcessor={html:e,js:e,css:e},c.scriptExportsHandler=e,c});