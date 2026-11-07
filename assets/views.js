/* 조회수 (메인·상세 공통)
   - 같은 브라우저에서 같은 글은 24시간에 한 번만 셉니다 (새로고침·반복 방문 제한)
   - API 주소가 비어 있으면 조회수 기능 전체가 조용히 꺼집니다 */
(function () {
  var API = "https://ai-trend-views.read1191.workers.dev";
  var WINDOW = 24 * 60 * 60 * 1000;
  var map = null, pending = null;

  function idOf(url) {
    var m = String(url || "").match(/(posts|insights|papers)\/[^\/?#]+\.html/);
    return m ? m[0] : null;
  }
  function seen(id) {
    try { var t = +localStorage.getItem("view:" + id); return t > 0 && Date.now() - t < WINDOW; } catch (e) { return false; }
  }
  function mark(id) {
    try { localStorage.setItem("view:" + id, String(Date.now())); } catch (e) {}
  }

  // 이 브라우저에서 마지막으로 받은 글별 숫자 (서버 응답이 캐시돼 늦게 와도 줄어 보이지 않게)
  function localN(id) {
    try { return +localStorage.getItem("viewc:" + id) || 0; } catch (e) { return 0; }
  }
  function saveN(id, n) {
    try { localStorage.setItem("viewc:" + id, String(n)); } catch (e) {}
  }

  // force: 이미 받아 둔 값이 있어도 서버에서 새로 받습니다
  function all(force) {
    if (!API) return Promise.resolve({});
    if (map && !force) return Promise.resolve(map);
    if (pending) return pending;
    pending = fetch(API + "/views", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; })
      .then(function (m) { map = m || {}; pending = null; return map; });
    return pending;
  }

  // 글을 읽었을 때 호출. 24시간 안에 이미 셌으면 숫자만 가져옵니다. 결과: 조회수(숫자) 또는 null
  function hit(url) {
    var id = idOf(url);
    if (!API || !id) return Promise.resolve(null);
    if (seen(id)) return all().then(function () { return count(url); });
    mark(id);
    return fetch(API + "/hit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id })
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (res) {
        if (!res) return all().then(function (m) { return m[id] || 0; });
        if (map) map[id] = res.views;
        saveN(id, res.views);
        return res.views;
      });
  }

  function count(url) {
    var id = idOf(url);
    if (!id) return 0;
    return Math.max(map ? map[id] || 0 : 0, localN(id));
  }

  function fmt(n) { return Number(n || 0).toLocaleString("ko-KR"); }

  window.Views = { enabled: !!API, all: all, hit: hit, count: count, fmt: fmt, idOf: idOf };
})();
