/**
 * Dashboard: capture rings + all charts into one tall PNG for SMS / share sheet / download.
 * Uses html2canvas; chart bitmaps are inlined via toDataURL so Chart.js renders correctly.
 */
(function () {
  'use strict';

  function showStatus(el, msg, isError) {
    if (!el) return;
    if (!msg) {
      el.hidden = true;
      el.textContent = '';
      el.classList.remove('progress-share-status--error');
      return;
    }
    el.hidden = false;
    el.textContent = msg;
    el.classList.toggle('progress-share-status--error', !!isError);
    clearTimeout(el._hideT);
    if (!isError) {
      el._hideT = setTimeout(function () {
        el.hidden = true;
        el.textContent = '';
      }, 10000);
    }
  }

  function downloadBlob(blob) {
    var name = 'calorieat-my-progress.png';
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 3000);
  }

  function patchCloneForScreenshot(doc) {
    var origRoot = document.getElementById('dashboardSection');
    var cloneRoot = doc.getElementById('dashboardSection');
    if (!origRoot || !cloneRoot) return;

    var origList = origRoot.querySelectorAll('canvas');
    var cloneList = cloneRoot.querySelectorAll('canvas');
    for (var i = 0; i < cloneList.length; i++) {
      var oc = origList[i];
      var cc = cloneList[i];
      if (!oc || !cc) continue;
      try {
        var img = doc.createElement('img');
        img.src = oc.toDataURL('image/png');
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        var w = cc.offsetWidth || cc.clientWidth || (cc.width && cc.width > 0 ? cc.width : 0) || 240;
        var h = cc.offsetHeight || cc.clientHeight || (cc.height && cc.height > 0 ? cc.height : 0) || 160;
        img.style.width = (cc.style.width && cc.style.width !== '0px' ? cc.style.width : w + 'px');
        img.style.height = (cc.style.height && cc.style.height !== '0px' ? cc.style.height : h + 'px');
        img.style.maxWidth = '100%';
        img.style.display = 'block';
        cc.parentNode.replaceChild(img, cc);
      } catch (err) {
        /* tainted or unsupported — leave canvas */
      }
    }

    cloneRoot.querySelectorAll('.expand-btn').forEach(function (b) {
      b.remove();
    });
    cloneRoot.querySelectorAll('.chart-hint').forEach(function (h) {
      h.remove();
    });
    cloneRoot.querySelectorAll('.dash-chart-panel__body').forEach(function (b) {
      b.hidden = false;
    });
    cloneRoot.querySelectorAll('.dash-chart-panel__toggle').forEach(function (t) {
      t.setAttribute('aria-expanded', 'true');
    });
    var shareBlock = cloneRoot.querySelector('.progress-share-block');
    if (shareBlock) shareBlock.remove();
  }

  function expandAllDashboardChartPanelsForCapture(root) {
    var panels = root.querySelectorAll('[data-dash-chart-panel]');
    var states = [];
    if (!panels.length) {
      return function noopRestore() {};
    }
    panels.forEach(function (panel, i) {
      var btn = panel.querySelector('.dash-chart-panel__toggle');
      var body = panel.querySelector('.dash-chart-panel__body');
      if (!btn || !body) {
        states[i] = true;
        return;
      }
      states[i] = btn.getAttribute('aria-expanded') === 'true';
      if (!states[i]) {
        body.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        panel.classList.add('dash-chart-panel--open');
      }
    });
    return function restoreDashboardChartPanels() {
      panels.forEach(function (panel, i) {
        var btn = panel.querySelector('.dash-chart-panel__toggle');
        var body = panel.querySelector('.dash-chart-panel__body');
        if (!btn || !body) return;
        if (states[i] === true) return;
        body.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
        panel.classList.remove('dash-chart-panel--open');
      });
      if (typeof window.resizeAllDashboardCharts === 'function') {
        window.resizeAllDashboardCharts();
      }
    };
  }

  function pickScale(scrollH) {
    if (scrollH > 7200) return 1;
    if (scrollH > 4200) return 1.15;
    return Math.min(2, window.devicePixelRatio || 1.5);
  }

  async function captureProgressPng() {
    if (typeof html2canvas !== 'function') {
      return { ok: false, message: "The image tool didn’t load. Check your connection and refresh the page." };
    }
    var root = document.getElementById('dashboardSection');
    if (!root || root.classList.contains('hidden')) {
      return { ok: false, message: 'Open your progress page first, then tap the button again.' };
    }

    root.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    await new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });

    var restorePanels = expandAllDashboardChartPanelsForCapture(root);
    try {
      if (typeof window.resizeAllDashboardCharts === 'function') {
        window.resizeAllDashboardCharts();
      }
      if (typeof window.updateAllDashboardCharts === 'function') {
        window.updateAllDashboardCharts();
      }
      await new Promise(function (resolve) {
        requestAnimationFrame(function () {
          requestAnimationFrame(resolve);
        });
      });
      await new Promise(function (resolve) {
        setTimeout(resolve, 220);
      });

      var w = Math.max(280, root.scrollWidth || 0, root.offsetWidth || 0);
      var h = Math.max(360, root.scrollHeight || 0, root.offsetHeight || 0);
      var scale = pickScale(h);

      var baseOpts = {
        scale: scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#141816',
        scrollX: 0,
        scrollY: 0,
        onclone: patchCloneForScreenshot
      };

      var canvas;
      try {
        canvas = await html2canvas(root, Object.assign({}, baseOpts, {
          width: w,
          height: h,
          windowWidth: w,
          windowHeight: h
        }));
      } catch (err1) {
        try {
          canvas = await html2canvas(root, baseOpts);
        } catch (err2) {
          return {
            ok: false,
            message: 'Something went wrong while capturing the page. Try closing fullscreen charts and retry.'
          };
        }
      }

      return await new Promise(function (resolve) {
        canvas.toBlob(
          function (blob) {
            if (!blob) {
              resolve({ ok: false, message: 'Couldn’t build the image file. Try again in a moment.' });
              return;
            }
            resolve({ ok: true, blob: blob });
          },
          'image/png',
          0.92
        );
      });
    } finally {
      restorePanels();
    }
  }

  async function tryShareOrDownload(blob) {
    var name = 'calorieat-my-progress.png';
    var file = new File([blob], name, { type: 'image/png' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'My CaloriEat progress',
          text: 'Snapshot from CaloriEat — my data stays on my device until I share this image.'
        });
        return 'share';
      } catch (e) {
        if (e && e.name === 'AbortError') return 'cancelled';
      }
    }
    downloadBlob(blob);
    return 'download';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('progressShareBtn');
    var status = document.getElementById('progressShareStatus');
    if (!btn) return;

    btn.addEventListener('click', async function (e) {
      e.preventDefault();
      if (btn.getAttribute('aria-disabled') === 'true') return;
      var orig = btn.textContent;
      btn.setAttribute('aria-disabled', 'true');
      btn.classList.add('progress-share-link--busy');
      btn.textContent = 'Creating image…';
      showStatus(status, 'Putting your rings and charts into one image…');

      var result = await captureProgressPng();
      if (!result.ok) {
        showStatus(status, result.message, true);
        btn.removeAttribute('aria-disabled');
        btn.classList.remove('progress-share-link--busy');
        btn.textContent = orig;
        return;
      }

      showStatus(status, 'Almost done…');
      var how;
      try {
        how = await tryShareOrDownload(result.blob);
      } catch (e) {
        downloadBlob(result.blob);
        how = 'download';
      }

      if (how === 'share') {
        showStatus(
          status,
          'Done! Pick an app (Messages, Mail, Instagram, etc.) to send your progress picture.'
        );
      } else if (how === 'cancelled') {
        showStatus(status, 'No problem—you can tap the link again whenever you want a fresh picture.');
      } else {
        showStatus(
          status,
          'Saved as calorieat-my-progress.png. Open your downloads or Photos and attach it to a text, email, or post.'
        );
      }

      btn.removeAttribute('aria-disabled');
      btn.classList.remove('progress-share-link--busy');
      btn.textContent = orig;
    });
  });
})();
