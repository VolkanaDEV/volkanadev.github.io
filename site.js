/* VolkanaDEV site behaviour.
   One external file so every page can run a Content-Security-Policy without
   'unsafe-inline' in script-src. Nothing third-party is loaded; nothing is
   sent anywhere from the browser. */
(function () {
  'use strict';

  /* ---- navigation: the pull tab opens the sidebar, the button opens the drawer ---- */
  var tab = document.getElementById('navTab');
  if (tab) {
    tab.addEventListener('click', function () {
      document.body.classList.toggle('nav-hidden');
    });
  }
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      toggle.classList.toggle('open');
      var links = document.querySelector('.nav-links');
      if (links) links.classList.toggle('open');
    });
  }

  /* ---- contact form: pick a category, then open a prefilled message ----
     The message is composed here and handed to the reader's own mail client.
     Nothing is submitted to us from the page. */
  function toggleFields() {
    var sel = document.getElementById('inquiryType');
    if (!sel) return;
    var type = sel.value;
    ['consumer', 'corporate', 'government', 'general'].forEach(function (k) {
      var box = document.getElementById(k + '-fields');
      if (box) box.classList.remove('active');
    });
    if (type) {
      var chosen = document.getElementById(type + '-fields');
      if (chosen) chosen.classList.add('active');
    }
  }

  function val(id) {
    var e = document.getElementById(id);
    return e ? e.value : '';
  }

  function buildEmail() {
    var type = val('inquiryType');
    if (!type) { alert('Please select a category first.'); return false; }

    var isPublic = 'n', isCorpo = 'n', isGov = 'n';
    var emailFrom = '', infoBox = '', extra = '';

    if (type === 'consumer') {
      isPublic = 'y';
      emailFrom = val('consumerEmail') || 'not provided';
      infoBox = val('consumerUse');
      extra = 'Name: ' + (val('consumerName') || 'not provided');
    } else if (type === 'corporate') {
      isCorpo = 'y';
      emailFrom = val('corpEmail') || 'not provided';
      infoBox = val('corpUse');
      extra = 'Company: ' + (val('corpName') || 'not provided') +
              '\nRepresentative: ' + (val('corpRep') || 'not provided');
    } else if (type === 'government') {
      isGov = 'y';
      emailFrom = val('govEmail') || 'not provided';
      infoBox = val('govScope');
      extra = 'Entity: ' + (val('govEntity') || 'not provided') +
              '\nRepresentative: ' + (val('govRep') || 'not provided') +
              '\nAddress: ' + (val('govAddress') || 'not provided') +
              '\nCarve-Out: ' + (val('govCarveout') || 'standard');
    } else if (type === 'general') {
      emailFrom = val('generalEmail') || 'not provided';
      infoBox = val('generalMessage');
      extra = 'Name: ' + (val('generalName') || 'not provided');
    }

    var subject = 'VolkanaDEV Contact: ' + type.toUpperCase();
    var body = 'Email from: ' + emailFrom +
               '\nIs public: ' + isPublic +
               '\nIs corpo: ' + isCorpo +
               '\nIs gov: ' + isGov +
               '\n\nInfo:\n' + (infoBox || 'No additional info provided') +
               '\n\nExtra:\n' + extra;
    var mailto = 'mailto:volkanadev@protonmail.com?subject=' +
                 encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    window.location.href = mailto;
    return false;
  }

  var sel = document.getElementById('inquiryType');
  if (sel) sel.addEventListener('change', toggleFields);
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      buildEmail();
    });
  }

  /* ---- Early Access sign-up: opens a pre-filled email, nothing is stored on the site ---- */
  var signup = document.getElementById('eaSignup');
  if (signup) {
    signup.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('eaEmail');
      var note = document.getElementById('eaNote');
      var email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        signup.classList.add('bad');
        if (note) note.textContent = 'That email doesn\'t look right. Try again?';
        input.focus();
        return;
      }
      signup.classList.remove('bad');
      window.location.href = 'mailto:volkanadev@protonmail.com' +
        '?subject=' + encodeURIComponent('Early Access sign-up') +
        '&body=' + encodeURIComponent('Please add me to Early Access: ' + email);
      if (note) note.textContent = 'Your email app should open. Hit send and you\'re on the list. Invites are sent November 28.';
    });
  }

  /* ---- Early Access countdown: 28 November 2026, 00:00 EST ---- */
  var days = document.getElementById('ea-days');
  if (days) {
    var target = new Date('2026-11-28T05:00:00Z').getTime();
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
    var tick = function () {
      var diff = target - Date.now();
      if (diff < 0) diff = 0;
      set('ea-days', Math.floor(diff / 86400000));
      set('ea-hours', pad(Math.floor(diff % 86400000 / 3600000)));
      set('ea-mins', pad(Math.floor(diff % 3600000 / 60000)));
      set('ea-secs', pad(Math.floor(diff % 60000 / 1000)));
    };
    tick();
    setInterval(tick, 1000);
  }
  /* ---- settle: stats roll in like reels, headings and cards settle into place ----
     Text is in the page as written; this only animates it. Skipped entirely
     for reduced motion or without IntersectionObserver. */
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!still && 'IntersectionObserver' in window) {
    var css = document.createElement('style');
    css.textContent =
      '.reel{display:inline-block;height:1.1em;line-height:1.1em;overflow:hidden;vertical-align:bottom}' +
      '.reel>span{display:block;transform:translateY(0);transition:transform 1.3s cubic-bezier(.2,.85,.3,1.12)}' +
      '.reel>span>i{display:block;height:1.1em;font-style:normal}' +
      '.sw{white-space:nowrap}' +
      '.sc{display:inline-block;opacity:0;transform:translateY(.35em);filter:blur(3px);color:var(--accent);' +
        'transition:opacity .35s ease,transform .45s cubic-bezier(.2,.85,.3,1.1),filter .35s ease,color .6s ease .2s}' +
      '.settled .sc{opacity:1;transform:none;filter:none;color:inherit}' +
      '.rise{opacity:0;transform:translateY(18px);transition:opacity .6s ease,transform .7s cubic-bezier(.2,.85,.3,1)}' +
      '.rise.settled{opacity:1;transform:none}';
    document.head.appendChild(css);

    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        seen.unobserve(el);
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          el.classList.add('settled');
          if (el.classList.contains('rise')) setTimeout(function () {
            el.classList.remove('rise', 'settled'); el.style.transitionDelay = '';
          }, 1600);
          el.querySelectorAll('.reel>span').forEach(function (strip) {
            strip.style.transform = 'translateY(-' + strip.getAttribute('data-to') + 'em)';
          });
        }); });
      });
    }, { threshold: 0.35 });

    /* stats: every digit becomes a reel that spins down to its value */
    document.querySelectorAll('.stat-num').forEach(function (num, n) {
      var text = num.textContent;
      num.setAttribute('aria-label', text);
      num.textContent = '';
      var k = 0;
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (ch < '0' || ch > '9') { num.appendChild(document.createTextNode(ch)); continue; }
        var reel = document.createElement('span');
        reel.className = 'reel';
        reel.setAttribute('aria-hidden', 'true');
        var strip = document.createElement('span');
        var spins = 2 + k;
        for (var r = 0; r <= spins; r++) for (var d = 0; d < 10; d++) {
          var g = document.createElement('i'); g.textContent = d; strip.appendChild(g);
        }
        strip.setAttribute('data-to', (spins * 10 + (+ch)) * 1.1);
        strip.style.transitionDelay = (n * 0.12 + k * 0.08) + 's';
        reel.appendChild(strip);
        num.appendChild(reel);
        k++;
      }
      seen.observe(num);
    });

    /* headings: letters settle in one after another, red, then cool to white */
    document.querySelectorAll('h3.one-line').forEach(function (h) {
      var text = h.textContent;
      h.setAttribute('aria-label', text);
      h.textContent = '';
      var idx = 0;
      text.split(/(\s+)/).forEach(function (word) {
        if (/^\s+$/.test(word) || !word) { h.appendChild(document.createTextNode(word)); return; }
        var w = document.createElement('span');
        w.className = 'sw';
        w.setAttribute('aria-hidden', 'true');
        for (var i = 0; i < word.length; i++) {
          var c = document.createElement('span');
          c.className = 'sc';
          c.textContent = word[i];
          c.style.transitionDelay = (idx++ * 0.018) + 's';
          w.appendChild(c);
        }
        h.appendChild(w);
      });
      seen.observe(h);
    });

    /* cards rise in, one after another */
    document.querySelectorAll('.panel-grid').forEach(function (grid) {
      grid.querySelectorAll('.card').forEach(function (card, i) {
        card.classList.add('rise');
        card.style.transitionDelay = (0.25 + i * 0.12) + 's';
        seen.observe(card);
      });
    });
  }

})();
