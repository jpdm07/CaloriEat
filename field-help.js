/**
 * Toggles expandable help panels next to form labels (.ce-help-trigger).
 */
(function () {
  function setPanel(btn, open) {
    var id = btn.getAttribute('aria-controls');
    if (!id) return;
    var panel = document.getElementById(id);
    if (!panel) return;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.hidden = !open;
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.ce-help-trigger');
    if (!btn) return;
    e.preventDefault();
    var open = btn.getAttribute('aria-expanded') !== 'true';
    setPanel(btn, open);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.ce-help-trigger[aria-expanded="true"]').forEach(function (btn) {
      setPanel(btn, false);
    });
  });
})();
