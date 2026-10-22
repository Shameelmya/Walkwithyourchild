(function () {
  var log = document.getElementById('log');
  var kept = [];
  function line(s) { log.textContent += s + '\n'; }
  var ua = navigator.userAgent;
  line((/Chrome\/(\d+)/.exec(ua) || [, '?'])[0] + ' · ' + (/SamsungBrowser/.test(ua) ? 'Samsung Internet · ' : '') + (matchMedia('(display-mode: standalone)').matches ? 'app' : 'tab'));
  if (!('speechSynthesis' in window)) { line('No speech in this browser.'); return; }
  function voices() { return speechSynthesis.getVoices(); }
  setTimeout(function () { var v = voices(); line(v.length + ' voices. ' + v.filter(function (x) { return /^(en|ml|kn)/i.test(x.lang); }).map(function (x) { return x.name + ' [' + x.lang + (x.localService ? '' : ' ☁') + ']'; }).join(', ')); }, 600);
  var TEXT = { en: 'I want some water.', ml: 'എനിക്ക് വെള്ളം വേണം.', kn: 'ನನಗೆ ನೀರು ಬೇಕು.', plain: 'Hello. This is a test.' };
  function run(k) {
    var u = new SpeechSynthesisUtterance(TEXT[k]);
    if (k !== 'plain') u.lang = k + '-IN';
    var t0 = Date.now();
    u.onstart = function () { line(k + ': started (' + (Date.now() - t0) + ' ms)'); };
    u.onend = function () { line(k + ': finished ✓'); };
    u.onerror = function (e) { line(k + ': ERROR ' + e.error); };
    kept.push(u);
    if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
    speechSynthesis.speak(u);
    line(k + ': asked to speak…');
  }
  document.querySelectorAll('button[data-t]').forEach(function (b) { b.addEventListener('click', function () { run(b.getAttribute('data-t')); }); });
  document.getElementById('copy').addEventListener('click', function () { try { navigator.clipboard.writeText(log.textContent); line('(copied)'); } catch (e) { /* */ } });
})();
