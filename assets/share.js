/* 공유 버튼 (오른쪽 아래 떠 있는 버튼)
   누르면 메뉴가 열립니다.
   - 링크 복사: 지금 보고 있는 글(또는 비교 탭) 주소를 클립보드에 복사
   - 글 전체 캡처: 글 전체를 길게 한 장의 PNG로 만들어 휴대폰은 공유 시트, PC는 파일로 저장
   글 상세 페이지: article.js가 불러와 바로 보여 줌
   메인(index.html): 비교 탭·오늘의 인사이트·오늘의 논문에서 Share.toggle(true)로 보여 줌 */
(function () {
  if (window.Share) return;

  var scriptBase = (function () {
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/[^/]*$/, "") : "assets/";
  })();

  var I_LINK = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>';
  var I_SHARE = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>';
  var I_CAM = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/></svg>';

  var wrap = document.createElement("div");
  wrap.className = "share-wrap";
  wrap.hidden = true;
  wrap.innerHTML =
    '<div class="share-menu" role="menu" hidden>' +
      '<button type="button" role="menuitem" data-act="link">' + I_LINK.replace(/20/g, "18") + "<span>링크 복사</span></button>" +
      '<button type="button" role="menuitem" data-act="shot">' + I_CAM + "<span>글 전체 캡처</span></button>" +
    "</div>" +
    '<button type="button" class="share-fab" aria-label="공유" aria-haspopup="menu" aria-expanded="false" title="공유">' + I_SHARE + "</button>";
  var btn = wrap.querySelector(".share-fab");
  var menu = wrap.querySelector(".share-menu");

  var toast = document.createElement("div");
  toast.className = "share-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  // 공유할 주소와 캡처할 부분 (페이지마다 바꿔 끼움)
  var urlFor = function () { return location.origin + location.pathname; };
  var targetFor = function () { return document.querySelector("body > .page > article, body > article"); };

  // ---------- 메뉴 ----------
  function openMenu(on) {
    menu.hidden = !on;
    btn.setAttribute("aria-expanded", on ? "true" : "false");
    wrap.classList.toggle("open", on);
    if (on) menu.querySelector("button").focus({ preventScroll: true });
  }
  btn.addEventListener("click", function () { openMenu(menu.hidden); });
  document.addEventListener("click", function (e) { if (!menu.hidden && !wrap.contains(e.target)) openMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { openMenu(false); btn.focus(); } });
  menu.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-act]");
    if (!b) return;
    openMenu(false);
    if (b.dataset.act === "link") copyLink(); else capture();
  });

  // ---------- 알림 ----------
  var timer = null;
  function say(msg, opts) {
    opts = opts || {};
    toast.innerHTML = "";
    toast.appendChild(document.createTextNode(msg));
    if (opts.action) {
      var a = document.createElement("button");
      a.type = "button";
      a.textContent = opts.action[0];
      a.addEventListener("click", function () { toast.classList.remove("on"); opts.action[1](); });
      toast.appendChild(a);
    }
    toast.classList.toggle("has-action", !!opts.action);
    toast.classList.add("on");
    clearTimeout(timer);
    if (!opts.stay) timer = setTimeout(function () { toast.classList.remove("on"); }, opts.action ? 6000 : 1800);
  }

  // ---------- 링크 복사 ----------
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    ta.remove();
    return ok;
  }
  function copyLink() {
    var text = urlFor();
    var p = navigator.clipboard && window.isSecureContext
      ? navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallbackCopy(text); })
      : Promise.resolve(fallbackCopy(text));
    p.then(function (ok) { say(ok ? "링크를 복사했어요" : "복사하지 못했어요. 주소창의 주소를 복사해 주세요"); });
  }

  // ---------- 글 전체 캡처 ----------
  var libP = null;
  function loadLib() {
    if (window.htmlToImage) return Promise.resolve(window.htmlToImage);
    return libP || (libP = new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = scriptBase + "vendor/html-to-image.js?v=1.11.13";
      s.onload = function () { window.htmlToImage ? res(window.htmlToImage) : rej(new Error("lib")); };
      s.onerror = function () { libP = null; rej(new Error("lib")); };
      document.head.appendChild(s);
    }));
  }

  // 글꼴: 캡처 그림 안에서도 Pretendard가 보이도록, 실제로 쓰인 굵기만 골라 넣음 (전부 넣으면 너무 무거움)
  var FONT_BASE = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff2/Pretendard-";
  var FONT_NAMES = { 100: "Thin", 200: "ExtraLight", 300: "Light", 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold", 900: "Black" };
  var fontCache = {};
  function fontData(w) {
    if (fontCache[w]) return fontCache[w];
    return (fontCache[w] = fetch(FONT_BASE + FONT_NAMES[w] + ".woff2", { mode: "cors" })
      .then(function (r) { if (!r.ok) throw 0; return r.blob(); })
      .then(function (b) {
        return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = function () { res(null); }; fr.readAsDataURL(b); });
      })
      .catch(function () { delete fontCache[w]; return null; }));
  }
  function fontCss(node) {
    var used = {};
    var els = [node].concat(Array.prototype.slice.call(node.querySelectorAll("*"), 0, 4000));
    els.forEach(function (e) {
      var w = Math.round((parseInt(getComputedStyle(e).fontWeight, 10) || 400) / 100) * 100;
      used[Math.min(900, Math.max(100, w))] = 1;
    });
    return Promise.all(Object.keys(used).map(function (w) {
      return fontData(w).then(function (d) {
        return d ? '@font-face{font-family:"Pretendard";font-weight:' + w + ';font-style:normal;src:url(' + d + ') format("woff2");}' : "";
      });
    })).then(function (list) { return list.join("\n"); });
  }

  function slug() {
    var m = location.pathname.match(/([^/]+)\.html$/);
    return m ? m[1] : "ai-secret-recipe";
  }
  var shotName = function () { return slug(); };

  // 안에서 따로 스크롤되는 상자(비교 표 등)는 캡처하는 동안 펼쳐서 전체가 찍히게 함
  function unfold(node) {
    var saved = [];
    Array.prototype.forEach.call(node.querySelectorAll("*"), function (e) {
      if (e.scrollWidth <= e.clientWidth + 1 && e.scrollHeight <= e.clientHeight + 1) return;
      var cs = getComputedStyle(e);
      if (!/(auto|scroll|hidden)/.test(cs.overflowX + cs.overflowY)) return;
      saved.push([e, e.getAttribute("style")]);
      e.style.overflow = "visible";
      e.style.maxHeight = "none";
      e.style.height = "auto";
      if (e.scrollWidth > e.clientWidth + 1) { e.style.maxWidth = "none"; e.style.width = e.scrollWidth + "px"; }
    });
    return function () {
      saved.forEach(function (x) { if (x[1] == null) x[0].removeAttribute("style"); else x[0].setAttribute("style", x[1]); });
      saved = [];
    };
  }

  var busy = false;
  function capture() {
    if (busy) return;
    var node = targetFor();
    if (!node) { say("캡처할 내용을 찾지 못했어요"); return; }
    busy = true;
    say("글 전체를 캡처하는 중…", { stay: true });
    var root = getComputedStyle(document.documentElement);
    var bg = getComputedStyle(document.body).backgroundColor || "#ffffff";
    var restore = unfold(node);
    var w = Math.max(node.offsetWidth, node.scrollWidth), h = node.scrollHeight;
    var pad = w < 500 ? 20 : 40, footH = 44;
    var W = w + pad * 2, H = h + pad * 2 + footH;
    // 아주 긴 글도 브라우저가 그릴 수 있는 크기 안으로 (휴대폰은 한 변 16384px·전체 약 1,600만 화소가 한계)
    var ratio = Math.max(0.5, Math.min(2, 16000 / H, Math.sqrt(16000000 / (W * H))));

    Promise.all([loadLib(), fontCss(node)]).then(function (r) {
      var lib = r[0];
      return lib.toCanvas(node, {
        pixelRatio: ratio,
        backgroundColor: bg,
        width: w,
        height: h,
        fontEmbedCSS: r[1],
        imagePlaceholder: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        filter: function (n) {
          return !(n.classList && (n.classList.contains("crumb") || n.classList.contains("standalone") || n.classList.contains("share-wrap")));
        }
      });
    }).then(function (inner) {
      // 여백과 맨 아래 주소 한 줄을 붙여 한 장으로
      var c = document.createElement("canvas");
      c.width = Math.round(W * ratio);
      c.height = Math.round(H * ratio);
      var g = c.getContext("2d");
      g.fillStyle = bg;
      g.fillRect(0, 0, c.width, c.height);
      g.drawImage(inner, Math.round(pad * ratio), Math.round(pad * ratio), Math.round(w * ratio), Math.round(h * ratio));
      g.fillStyle = root.getPropertyValue("--line").trim() || "#e5e7eb";
      g.fillRect(Math.round(pad * ratio), Math.round((H - footH) * ratio), Math.round(w * ratio), Math.max(1, Math.round(ratio)));
      g.fillStyle = root.getPropertyValue("--muted").trim() || "#6b7280";
      g.font = "500 " + 13 * ratio + 'px "Pretendard", -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      g.textBaseline = "middle";
      var url = urlFor().replace(/^https?:\/\//, "");
      var maxW = w * ratio;
      while (url.length > 10 && g.measureText(url).width > maxW) url = url.slice(0, -2);
      if (url !== urlFor().replace(/^https?:\/\//, "")) url = url.slice(0, -1) + "…";
      g.fillText(url, Math.round(pad * ratio), Math.round((H - footH / 2 - pad / 4) * ratio));
      return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(new Error("blob")); }, "image/png"); });
    }).then(function (blob) {
      restore();
      busy = false;
      deliver(blob, shotName() + ".png");
    }).catch(function (e) {
      restore();
      busy = false;
      if (window.console) console.warn("capture failed", e);
      say("캡처하지 못했어요. 잠시 뒤 다시 해 주세요");
    });
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }

  // 휴대폰: 공유 시트(카톡·사진 저장 등) / PC: 파일로 저장
  function deliver(blob, name) {
    var touch = window.matchMedia && matchMedia("(pointer: coarse)").matches;
    var file = null;
    try { file = new File([blob], name, { type: "image/png" }); } catch (e) {}
    var canShare = touch && file && navigator.canShare && navigator.canShare({ files: [file] });
    if (!canShare) {
      download(blob, name);
      say("캡처 이미지를 저장했어요");
      return;
    }
    var share = function () {
      return navigator.share({ files: [file], title: document.title });
    };
    toast.classList.remove("on");
    share().catch(function (e) {
      if (e && e.name === "AbortError") return; // 사용자가 닫음
      // 캡처하는 동안 시간이 지나 브라우저가 공유를 막은 경우: 한 번 더 누르면 열림
      say("캡처가 끝났어요", { action: ["공유·저장", function () {
        share().catch(function (err) { if (!err || err.name !== "AbortError") download(blob, name); });
      }] });
    });
  }

  function mount() {
    document.body.appendChild(wrap);
    document.body.appendChild(toast);
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  window.Share = {
    toggle: function (on) { wrap.hidden = !on; if (!on) { openMenu(false); if (!busy) toast.classList.remove("on"); } },
    setUrl: function (fn) { urlFor = fn; },
    setTarget: function (fn) { targetFor = fn; },
    setName: function (fn) { shotName = fn; }
  };
})();
