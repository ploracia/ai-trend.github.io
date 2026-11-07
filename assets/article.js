/* 상세 페이지 공통 스크립트 (뉴스·이슈·논문)
   글 본문은 건드리지 않고, 헤더 메뉴·2단 레이아웃·오른쪽 사이드바(목차, 글 정보, 태그, 관련 글)를 만들어 붙입니다. */
(function () {
  var root = document.documentElement;
  try { var saved = localStorage.getItem("theme"); if (saved) root.setAttribute("data-theme", saved); } catch (e) {}

  var path = location.pathname;
  var kind = /\/insights\//.test(path) ? "insights" : /\/papers\//.test(path) ? "papers" : "news";
  // 메인 페이지와 같은 메뉴·하위 탭
  var SECTIONS = {
    news: { label: "뉴스", list: "../#today", all: "#archive", crumb: "← 오늘의 TOP3 뉴스", related: "오늘의 다른 뉴스",
      tabs: [["../#today", "오늘의 TOP3"], ["../#archive", "지난 뉴스"]] },
    insights: { label: "인사이트", list: "../#insights", all: "#insights/all", crumb: "← 인사이트 목록", related: "다른 인사이트",
      tabs: [["../#insights", "오늘의 인사이트"], ["../#insights/all", "모든 인사이트"]] },
    papers: { label: "논문", list: "../#papers", all: "#papers/all", crumb: "← 논문 목록", related: "다른 논문",
      tabs: [["../#papers", "오늘의 논문"], ["../#papers/all", "지난 논문"]] }
  };
  var SECTION = SECTIONS[kind];

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // 1) 헤더: 로고 | 뉴스·이슈·논문 메뉴 | 검색·테마 버튼 (메인과 같은 모양)
  var header = document.querySelector("header.site");
  var inner = header && header.querySelector(".in");
  if (inner) {
    var tabs = [["news", "../#today", "뉴스"], ["insights", "../#insights", "인사이트"], ["papers", "../#papers", "논문"], ["compare", "../#compare", "비교"], ["glossary", "../#glossary", "용어집"]];
    inner.innerHTML =
      '<a class="logo" href="../"><span class="logo-mark">AI</span><span class="logo-txt">AI 비밀 레시피</span></a>' +
      '<form class="hsearch" role="search"><select aria-label="검색 범위"><option value="all">전체</option><option value="news">뉴스</option><option value="insights">인사이트</option><option value="papers">논문</option></select><input type="search" placeholder="검색어를 입력하세요" aria-label="검색어" enterkeyhint="search" /></form>' +
      '<div class="tools"><button class="theme-btn" type="button" aria-label="테마 전환"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg></button></div>';
    // 메뉴는 헤더 둘째 줄
    var navRow = el("div", "nav-row", '<nav class="gnb" aria-label="주 메뉴">' + tabs.map(function (t) {
      return '<a href="' + t[1] + '"' + (t[0] === kind ? ' aria-current="page"' : "") + ">" + t[2] + "</a>";
    }).join("") + "</nav>");
    header.appendChild(navRow);
    // PC: 메뉴 줄을 마우스로 누른 채 드래그하면 좌우 스크롤 (모바일은 터치 스크롤)
    (function () {
      var bar = navRow.querySelector(".gnb"), down = false, moved = false, sx = 0, sl = 0;
      bar.addEventListener("pointerdown", function (e) {
        if (e.pointerType !== "mouse" || bar.scrollWidth <= bar.clientWidth) return;
        down = true; moved = false; sx = e.clientX; sl = bar.scrollLeft;
      });
      window.addEventListener("pointermove", function (e) {
        if (!down) return;
        var dx = e.clientX - sx;
        if (!moved && Math.abs(dx) > 4) { moved = true; bar.classList.add("dragging"); }
        if (moved) bar.scrollLeft = sl - dx;
      });
      window.addEventListener("pointerup", function () { if (down) { down = false; bar.classList.remove("dragging"); } });
      bar.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    })();
    inner.querySelector(".hsearch").addEventListener("submit", function (e) {
      e.preventDefault();
      var q = this.querySelector("input").value.trim();
      var scope = this.querySelector("select").value;
      location.href = "../#search/" + (scope !== "all" ? "in:" + scope + "/" : "") + encodeURIComponent(q);
    });

    // 하위 탭 (상세 글은 '오늘'과 '전체' 둘 다에 속하므로 어느 것도 선택 표시하지 않음)
    var sub = el("div", "subwrap", '<nav class="subtabs" aria-label="하위 메뉴">' + SECTION.tabs.map(function (t) {
      return '<a href="' + t[0] + '">' + t[1] + "</a>";
    }).join("") + "</nav>");
    header.parentNode.insertBefore(sub, header.nextSibling);

    inner.querySelector(".theme-btn").addEventListener("click", function () {
      var dark = root.getAttribute("data-theme")
        ? root.getAttribute("data-theme") === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
      var next = dark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // 푸터: 메인과 같은 모양
  var foot = document.querySelector("body > footer");
  if (foot) {
    foot.innerHTML = '<div class="in"><span>© ' + new Date().getFullYear() + ' AI 비밀 레시피</span>' +
      '<a href="' + SECTION.list + '">' + esc(SECTION.label) + ' 목록</a>' +
      '<a href="../#changelog">변경 이력</a></div>';
  }

  // 공유 버튼: 오른쪽 아래에 띄우고, 누르면 이 글 주소를 복사
  (function () {
    var s = document.createElement("script");
    s.src = "../assets/share.js?v=20261023c";
    s.onload = function () { if (window.Share) Share.toggle(true); };
    document.head.appendChild(s);
  })();

  // 업데이트 알림 팝업 (새 버전이 나왔을 때 한 번만)
  (function () {
    var s = document.createElement("script");
    s.src = "../assets/changelog.js?v=20261023b";
    document.head.appendChild(s);
  })();

  var article = document.querySelector("body > article");
  if (!article) return;

  // 2) 2단 레이아웃
  var page = el("div", "page");
  article.parentNode.insertBefore(page, article);
  page.appendChild(article);
  var side = el("aside", "side");
  side.setAttribute("aria-label", "글 정보");
  page.appendChild(side);

  // 글 위 라벨(오늘의 뉴스 N위 · 오늘의 논문 등)은 보이지 않게
  Array.prototype.forEach.call(article.querySelectorAll(".eyebrow"), function (e) { e.parentNode.removeChild(e); });

  // 3) 글 머리: 목록으로 돌아가는 링크
  var crumb = el("a", "crumb", esc(SECTION.crumb));
  crumb.href = SECTION.list;
  article.insertBefore(crumb, article.firstChild);

  // 4) 목차: 본문의 h2로 만듭니다
  var heads = Array.prototype.slice.call(article.querySelectorAll("h2[id]"));
  if (heads.length) {
    var toc = el("section", "side-toc");
    toc.innerHTML = "<h3>목차</h3><ol>" + heads.map(function (h, i) {
      var no = h.querySelector(".no");
      var text = h.textContent.replace(no ? no.textContent : "", "").trim();
      return '<li><a href="#' + esc(h.id) + '">' + (i + 1) + ". " + esc(text) + "</a></li>";
    }).join("") + "</ol>";
    side.appendChild(toc);

    var links = toc.querySelectorAll("a");
    var mark = function () {
      var cur = 0;
      for (var i = 0; i < heads.length; i++) {
        if (heads[i].getBoundingClientRect().top < 160) cur = i;
      }
      for (var j = 0; j < links.length; j++) links[j].classList.toggle("on", j === cur);
    };
    window.addEventListener("scroll", mark, { passive: true });
    mark();
  }

  // 5) 글 정보: byline·eyebrow에서 읽어 옵니다
  var byline = article.querySelector(".byline");
  // 본문 글 정보 줄에는 사이트 이름을 보이지 않음 (예전 글·새 글 모두)
  if (byline) Array.prototype.forEach.call(byline.querySelectorAll("span"), function (s) {
    if (s.textContent.trim() === "AI 비밀 레시피") { s.remove(); return; }
    var f = s.firstChild; // "게시 2026.10.22 …" → "2026.10.22 …"
    if (f && f.nodeType === 3 && /^\s*게시\s*$/.test(f.nodeValue) && s.querySelector("time")) f.remove();
  });
  var eyebrow = article.querySelector(".eyebrow");
  var time = byline && byline.querySelector("time");
  var rows = [];
  rows.push(["구분", '<a href="' + SECTION.list + '">' + esc(SECTION.label) + "</a>"]);
  if (time) rows.push(["게시", esc(time.textContent.trim())]);
  if (eyebrow) {
    var rank = eyebrow.textContent.match(/(\d+)위/);
    if (rank) rows.push(["순위", "오늘의 뉴스 " + rank[1] + "위"]);
    var parts = eyebrow.textContent.split("·").map(function (s) { return s.trim(); });
    if (kind !== "news" && parts.length >= 3 && parts[2]) rows.push(["분류", esc(parts[2])]);
  }
  var tags = [];
  if (byline) {
    Array.prototype.forEach.call(byline.querySelectorAll("span"), function (s) {
      var t = s.textContent.trim();
      var m = t.match(/읽는 시간\s*(.+)/);
      if (m) rows.push(["읽는 시간", esc(m[1])]);
      var o = t.match(/^원문\s+(.+)/);
      if (o) rows.push(["원문", esc(o[1])]);
      if (t.charAt(0) === "#") t.split(/\s+/).forEach(function (x) { if (x.charAt(0) === "#" && x.length > 1) tags.push(x.slice(1)); });
    });
  }
  var sources = article.querySelectorAll(".refs li").length;
  if (sources) rows.push(["참고", "자료 " + sources + "개"]);
  var info = el("section", "side-info");
  info.innerHTML = "<h3>글 정보</h3><dl>" + rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("") + "</dl>";
  side.appendChild(info);

  // 5-1) 조회수: views.js를 불러와 이 글을 한 번 세고(24시간 중복 제외) 글 정보에 표시
  (function () {
    var s = document.createElement("script");
    s.src = "../assets/views.js?v=20261022c";
    s.onload = function () {
      if (!window.Views || !Views.enabled) return;
      var dl = info.querySelector("dl");
      var dt = el("dt", null, "조회"), dd = el("dd", "vcount", "…");
      dl.insertBefore(dd, dl.children[4] || null);
      dl.insertBefore(dt, dd);
      // 제목 아래 글 정보 줄(게시 시각 옆)에도 표시 — 휴대폰에서는 사이드바가 본문 아래로 내려가므로
      var bspan = null;
      if (byline) {
        bspan = el("span", "views", "조회 …");
        var after = time && time.closest("span");
        byline.insertBefore(bspan, after && after.parentNode === byline ? after.nextSibling : null);
      }
      Views.hit(location.pathname).then(function (n) {
        if (n == null) { dt.remove(); dd.remove(); if (bspan) bspan.remove(); return; }
        dd.textContent = Views.fmt(n) + "회";
        if (bspan) bspan.textContent = "조회 " + Views.fmt(n);
      });
    };
    document.head.appendChild(s);
  })();

  // 6) 태그: 뉴스는 byline의 #태그, 이슈는 나라·기업 칩
  var catLinks = article.querySelectorAll(".cats a");
  if (tags.length || catLinks.length) {
    var tagBox = el("section", "side-tags");
    var chips = tags.length
      ? tags.map(function (t) { return '<a href="../?tag=' + encodeURIComponent(t) + '#archive">' + esc(t) + "</a>"; }).join("")
      : Array.prototype.map.call(catLinks, function (a) { return '<a href="' + esc(a.getAttribute("href")) + '">' + esc(a.textContent) + "</a>"; }).join("");
    tagBox.innerHTML = "<h3>" + (tags.length ? "관련 태그" : "관련 나라·기업") + '</h3><div class="side-chips">' + chips + "</div>";
    side.appendChild(tagBox);
  }

  // 7) 관련 글: 본문 아래 '오늘의 다른 뉴스'를 사이드바로 옮깁니다
  var related = document.querySelector("section.related");
  if (related) {
    var items = related.querySelectorAll(".related-list a");
    if (items.length) {
      var rel = el("section", "side-related");
      var title = related.querySelector("h2");
      rel.innerHTML = "<h3>" + esc(title ? title.textContent : SECTION.related) + '</h3><div class="list"></div>';
      var list = rel.querySelector(".list");
      Array.prototype.forEach.call(items, function (a) { list.appendChild(a); });
      side.appendChild(rel);
      related.parentNode.removeChild(related);
    }
  }
})();
