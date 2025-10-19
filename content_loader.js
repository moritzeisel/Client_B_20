(function() {
	if (window.__simplifyLoaderExecuted) return;
	window.__simplifyLoaderExecuted = true;

	function parseIsoOrNull(s) {
		try { return s ? new Date(s) : null; } catch (_) { return null; }
	}
	function isWithinWindow(now, start, end) {
		if (!start || !end) return false;
		return now >= start && now <= end;
	}

	try {
		var start = parseIsoOrNull(typeof POPUP_SPECIAL_START_ISO !== 'undefined' ? POPUP_SPECIAL_START_ISO : null);
		var end   = parseIsoOrNull(typeof POPUP_SPECIAL_END_ISO   !== 'undefined' ? POPUP_SPECIAL_END_ISO   : null);
		var now = new Date();
		var file = isWithinWindow(now, start, end) ? 'content.js' : 'content_default.js';
		try {
			chrome.runtime.sendMessage({ action: 'injectContentScript', file: file }, function() {});
		} catch (_) {}
	} catch (_) {}
})();


