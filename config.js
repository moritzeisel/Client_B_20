const SERVER_URL = 'https://simplify.informatik.tu-freiberg.de'; 

const POPUP_SPECIAL_START_ISO = '2025-10-17T00:00:00+02:00';
const POPUP_SPECIAL_END_ISO   = '2025-10-23T00:00:00+02:00';

(function() {
	function computeStudyState() {
		try {
			const start = new Date(POPUP_SPECIAL_START_ISO);
			const end = new Date(POPUP_SPECIAL_END_ISO);
			if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'deactivated';
			const now = new Date();
			return (now >= start && now <= end) ? 'activated' : 'deactivated';
		} catch (_) {
			return 'deactivated';
		}
	}
	try { window.computeStudyState = computeStudyState; } catch (_) {}
})();