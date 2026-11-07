/* 업데이트 알림 팝업 (메인·상세 공통)
   - 브라우저에 마지막으로 본 버전을 저장해 두고, 새 버전이 나오면 그 버전 팝업을 한 번만 띄웁니다.
   - 처음 온 사람에게는 띄우지 않고 현재 버전만 기록합니다.
   - 여러 버전을 건너뛰고 온 사람에게는 못 본 버전들을 한 팝업에 모아 보여 줍니다.
   - 이력 내용은 changelog.json (최신 버전이 맨 위) */
(function () {
  var KEY = "changelog:seen";
  // 팝업 기능이 생기기 전(1.4.0까지) 다녀간 사람은 1.4.0을 본 것으로 칩니다
  var BEFORE_POPUP = "1.4.0";
  var base = /\/(posts|insights|papers)\//.test(location.pathname) ? "../" : "./";

  function cmp(a, b) {
    var x = String(a).split("."), y = String(b).split(".");
    for (var i = 0; i < 3; i++) {
      var d = (+x[i] || 0) - (+y[i] || 0);
      if (d) return d;
    }
    return 0;
  }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  // 예전에 다녀간 흔적이 있는지: 테마 설정, 또는 이번 방문 전에 남은 글 조회 기록(10분 이상 지난 것)
  function visitedBefore() {
    try {
      if (localStorage.getItem("theme")) return true;
      var old = Date.now() - 10 * 60 * 1000;
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf("view:") === 0 && +localStorage.getItem(k) < old) return true;
      }
    } catch (e) {}
    return false;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtDate(d) { return String(d || "").replace(/-/g, "."); }

  var CSS =
    ".cl-back{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px;animation:clFade .18s ease}" +
    ".cl-box{width:100%;max-width:420px;max-height:min(80vh,560px);display:flex;flex-direction:column;background:var(--surface,#fff);color:var(--text,#111);border:1px solid var(--line,#e5e7eb);border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,.25);font-family:inherit;line-height:1.6;word-break:keep-all}" +
    ".cl-head{padding:22px 22px 10px}" +
    ".cl-head small{display:block;font-size:12.5px;font-weight:700;color:var(--accent,#2563eb)}" +
    ".cl-head h2{margin:2px 0 0;font-size:19px;letter-spacing:-.015em}" +
    ".cl-body{padding:4px 22px 6px;overflow-y:auto}" +
    ".cl-ver{padding:12px 0;border-top:1px solid var(--line,#e5e7eb)}" +
    ".cl-ver:first-child{border-top:0}" +
    ".cl-ver h3{margin:0 0 6px;font-size:14px;display:flex;align-items:baseline;gap:8px}" +
    ".cl-ver h3 span{font-size:12.5px;font-weight:400;color:var(--muted,#6b7280);font-variant-numeric:tabular-nums}" +
    ".cl-ver ul{margin:0;padding-left:18px;font-size:14px}" +
    ".cl-ver li{margin:2px 0}" +
    ".cl-foot{display:flex;gap:8px;padding:14px 22px 20px}" +
    ".cl-foot a,.cl-foot button{flex:1;height:42px;border-radius:10px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none}" +
    ".cl-foot a{border:1px solid var(--line,#e5e7eb);background:var(--surface,#fff);color:var(--text,#111)}" +
    ".cl-foot button{border:0;background:var(--accent,#2563eb);color:#fff}" +
    "@keyframes clFade{from{opacity:0}to{opacity:1}}";

  function show(list) {
    if (!document.getElementById("clCss")) {
      var st = document.createElement("style");
      st.id = "clCss";
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    var back = document.createElement("div");
    back.className = "cl-back";
    back.innerHTML =
      '<div class="cl-box" role="alertdialog" aria-modal="true" aria-labelledby="clTitle">' +
        '<div class="cl-head"><small>업데이트 소식</small><h2 id="clTitle">사이트가 이렇게 바뀌었어요</h2></div>' +
        '<div class="cl-body">' + list.map(function (v) {
          return '<section class="cl-ver"><h3>v' + esc(v.version) + "<span>" + esc(fmtDate(v.date)) + "</span></h3><ul>" +
            (v.items || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></section>";
        }).join("") + "</div>" +
        '<div class="cl-foot"><a href="' + base + '#changelog">변경 이력 전체</a><button type="button">확인</button></div>' +
      "</div>";
    // 바깥 영역 클릭이나 Esc로는 닫히지 않고, 아래 버튼(확인·변경 이력 전체)으로만 닫힘
    function close() { if (back.parentNode) back.parentNode.removeChild(back); }
    back.addEventListener("click", function (e) {
      if (e.target.closest(".cl-foot button") || e.target.closest(".cl-foot a")) close();
    });
    document.body.appendChild(back);
    back.querySelector("button").focus();
  }

  function run() {
    fetch(base + "changelog.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .catch(function () { return []; })
      .then(function (arr) {
        if (!Array.isArray(arr) || !arr.length) return;
        arr = arr.slice().sort(function (a, b) { return cmp(b.version, a.version); });
        var latest = arr[0].version;
        var seen = get(KEY);
        if (!seen) {
          if (!visitedBefore()) { set(KEY, latest); return; } // 처음 온 사람: 기록만
          seen = BEFORE_POPUP;
        }
        if (cmp(latest, seen) <= 0) return;
        // 띄우는 순간 기록해 두어, 닫지 않고 다른 페이지로 가도 다시 뜨지 않게
        set(KEY, latest);
        show(arr.filter(function (v) { return cmp(v.version, seen) > 0; }).slice(0, 5));
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
