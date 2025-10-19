(function() {
  function parseIsoOrNull(s) {
    try { return s ? new Date(s) : null; } catch (_) { return null; }
  }
  function isWithinWindow(now, start, end) {
    if (!start || !end) return false;
    return now >= start && now <= end;
  }
  document.addEventListener('DOMContentLoaded', function() {
    var start = parseIsoOrNull(typeof POPUP_SPECIAL_START_ISO !== 'undefined' ? POPUP_SPECIAL_START_ISO : null);
    var end   = parseIsoOrNull(typeof POPUP_SPECIAL_END_ISO   !== 'undefined' ? POPUP_SPECIAL_END_ISO   : null);
    var now = new Date();
    var target = isWithinWindow(now, start, end) ? 'popup.html' : 'popup_default.html';
    window.location.replace(target);
  });
})();


