(function () {
  var stage = document.getElementById('stage');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var cur = document.getElementById('cur');
  var tot = document.getElementById('tot');
  var bar = document.getElementById('bar');
  var ov = document.getElementById('overview');
  var ovGrid = document.getElementById('ovGrid');
  var idx = -1;
  var W = 1600, H = 900;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  tot.textContent = pad(slides.length);

  // 순차 등장 딜레이
  slides.forEach(function (s) {
    s.querySelectorAll('[data-a]').forEach(function (el, i) { el.style.setProperty('--d', i); });
  });

  function fit() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var sc = Math.min(vw / W, (vh - 40) / H);
    stage.style.transform = 'translate(-50%,-50%) scale(' + sc + ')';
  }

  function countUp(s) {
    s.querySelectorAll('[data-count]').forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      var t0 = null, dur = 1200;
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        var v = to * e;
        el.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString('ko-KR');
        if (p < 1) requestAnimationFrame(step);
      }
      el.textContent = '0';
      setTimeout(function () { requestAnimationFrame(step); }, 450);
      setTimeout(function () { el.textContent = dec ? to.toFixed(dec) : to.toLocaleString('ko-KR'); }, 2000);
    });
  }

  function go(n) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === idx) return;
    slides.forEach(function (s, i) {
      s.classList.toggle('active', i === n);
      s.classList.toggle('before', i < n);
      if (i !== n) s.querySelectorAll('video').forEach(function (v) { v.pause(); });
    });
    var s = slides[n];
    s.querySelectorAll('video[autoplay]').forEach(function (v) { v.play().catch(function () {}); });
    countUp(s);
    idx = n;
    cur.textContent = pad(n + 1);
    bar.style.width = ((n + 1) / slides.length * 100) + '%';
    if (history.replaceState) history.replaceState(null, '', '#' + (n + 1));
    ovGrid.querySelectorAll('button').forEach(function (b, i) { b.classList.toggle('on', i === n); });
  }

  // 전체 보기
  slides.forEach(function (s, i) {
    var b = document.createElement('button');
    var em = document.createElement('em'); em.textContent = pad(i + 1);
    var sp = document.createElement('span'); sp.textContent = s.getAttribute('data-title') || '';
    b.appendChild(em); b.appendChild(sp);
    b.addEventListener('click', function () { closeOv(); go(i); });
    ovGrid.appendChild(b);
  });
  function openOv() { ov.hidden = false; }
  function closeOv() { ov.hidden = true; }
  document.getElementById('menuBtn').addEventListener('click', openOv);
  document.getElementById('ovClose').addEventListener('click', closeOv);

  document.getElementById('prev').addEventListener('click', function () { go(idx - 1); });
  document.getElementById('next').addEventListener('click', function () { go(idx + 1); });
  document.querySelectorAll('[data-go]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); go(parseInt(b.getAttribute('data-go'), 10)); });
  });

  document.addEventListener('keydown', function (e) {
    if (!ov.hidden) { if (e.key === 'Escape') closeOv(); return; }
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].indexOf(e.key) > -1) { e.preventDefault(); go(idx + 1); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].indexOf(e.key) > -1) { e.preventDefault(); go(idx - 1); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(slides.length - 1);
  });

  // 스와이프
  var sx = null, sy = null;
  document.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(idx + (dx < 0 ? 1 : -1));
    sx = null;
  });

  // 휠
  var lock = 0;
  document.addEventListener('wheel', function (e) {
    if (!ov.hidden) return;
    var now = Date.now();
    if (now - lock < 900 || Math.abs(e.deltaY) < 30) return;
    lock = now; go(idx + (e.deltaY > 0 ? 1 : -1));
  }, { passive: true });

  window.addEventListener('resize', fit);
  window.addEventListener('hashchange', function () {
    var n = parseInt(location.hash.slice(1), 10);
    if (n) go(n - 1);
  });
  fit();
  var start = parseInt(location.hash.slice(1), 10);
  go(start ? start - 1 : 0);
})();
