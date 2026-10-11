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
})();
