// Default content script: No simplification, but ESM for B-week
// after some uptime and recent activity.

(function() {
	let pageStartTimestamp = Date.now();
	let lastMouseActivityTimestamp = 0;

	// -------- Config (override in-page via window.__esmDefaultConfig = { ... }) --------
	const DEFAULT_ESM_CONFIG = {
		ENABLED: true,
		UPTIME_MS: 45000,               // wait time before eligible =45000
		RECENT_ACTIVITY_MS: 10000,      // must have user activity within this window =10000
		RANDOM_PROB: 1.0,               // 1.0 = always when eligible; 0.1 = 10%
		MAX_PER_DAY: 3,                 // per-day cap =3
		DELAY_MINUTES: [0, 10, 20, 40, 60], // progressive delays between shows in a day =[0, 10, 20, 40, 60]
		AUTO_REMOVE_MS: 360 * 1000      // auto close popup after this time =360 * 1000
	};
	const ESM_CONFIG = (typeof window !== 'undefined' && window.__esmDefaultConfig && typeof window.__esmDefaultConfig === 'object')
		? { ...DEFAULT_ESM_CONFIG, ...window.__esmDefaultConfig }
		: DEFAULT_ESM_CONFIG;

	function markActivity() {
		lastMouseActivityTimestamp = Date.now();
	}

	function scheduleSurveyTrigger() {
		setTimeout(() => {
			try { maybeTriggerSiteSurvey(); } catch (e) { console.error(e); }
		}, ESM_CONFIG.UPTIME_MS);
	}

	function canShowESMSiteSurvey() {
		return new Promise((resolve) => {
			chrome.storage.local.get(['esmSiteSurveyThrottle'], (result) => {
				const now = Date.now();
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const todayMidnight = today.getTime();
				let throttle = result.esmSiteSurveyThrottle || { lastShown: 0, count: 0, lastReset: 0 };
				if (!throttle.lastReset || throttle.lastReset < todayMidnight) {
					throttle = { lastShown: 0, count: 0, lastReset: todayMidnight };
				}
				if (throttle.count >= ESM_CONFIG.MAX_PER_DAY) {
					resolve(false);
					return;
				}
				const d = ESM_CONFIG.DELAY_MINUTES;
				const requiredDelay = (d[throttle.count] || d[d.length - 1]) * 60 * 1000;
				if (now - throttle.lastShown < requiredDelay) {
					resolve(false);
					return;
				}
				throttle.lastShown = now;
				throttle.count += 1;
				chrome.storage.local.set({ esmSiteSurveyThrottle: throttle }, () => resolve(true));
			});
		});
	}

	async function maybeTriggerSiteSurvey() {
		const now = Date.now();
		if (!ESM_CONFIG.ENABLED) return;
		if (now - pageStartTimestamp < ESM_CONFIG.UPTIME_MS) return; // uptime gate
		if (now - lastMouseActivityTimestamp > ESM_CONFIG.RECENT_ACTIVITY_MS) return; // recent activity gate
		if (Math.random() >= ESM_CONFIG.RANDOM_PROB) return; // probability gate
		if (!(await canShowESMSiteSurvey())) return; // daily throttle
		await showESMSiteSurvey();
	}

	async function showESMSiteSurvey() {
		const existing = document.getElementById('esm-popup');
		if (existing) existing.remove();

		const popup = document.createElement('div');
		popup.id = 'esm-popup';
		popup.className = 'experience-sampling-popup';
		popup.setAttribute('data-simplify-ui', '1');

		const closeBtn = document.createElement('button');
		closeBtn.textContent = '✕';
		closeBtn.setAttribute('aria-label', 'Popup schließen');
		closeBtn.className = 'experience-sampling-close-btn';
		closeBtn.addEventListener('click', () => popup.remove());
		popup.appendChild(closeBtn);

		const form = document.createElement('form');
		form.style.marginTop = '8px';

		// Likert helper
		const renderLikert = (labelText) => {
			const block = document.createElement('div');
			block.style.marginBottom = '14px';
			const qLabel = document.createElement('div');
			qLabel.textContent = labelText;
			qLabel.style.fontWeight = 'bold';
			qLabel.style.marginBottom = '6px';
			block.appendChild(qLabel);
			const likertDiv = document.createElement('div');
			likertDiv.className = 'experience-sampling-likert';
			const left = document.createElement('span');
			left.className = 'experience-sampling-likert-label';
			left.textContent = 'stimme überhaupt nicht zu';
			likertDiv.appendChild(left);
			const radios = [];
			const name = `likert-${Math.random().toString(36).slice(2)}`;
			for (let i = 1; i <= 5; i++) {
				const rl = document.createElement('label');
				rl.className = 'experience-sampling-likert-radio-label';
				const r = document.createElement('input');
				r.type = 'radio';
				r.name = name;
				r.value = String(i);
				rl.appendChild(r);
				rl.appendChild(document.createTextNode(String(i)));
				likertDiv.appendChild(rl);
				radios.push(r);
			}
			const right = document.createElement('span');
			right.className = 'experience-sampling-likert-label';
			right.textContent = 'stimme voll und ganz zu';
			likertDiv.appendChild(right);
			block.appendChild(likertDiv);
			return { block, radios };
		};

		const likert = renderLikert('Die Texte auf dieser Webseite sind gut verständlich.');
		form.appendChild(likert.block);

		// Topic selection
		const topicBlock = document.createElement('div');
		topicBlock.style.marginTop = '8px';
		const topicLabel = document.createElement('div');
		topicLabel.textContent = 'Welchem Themenbereich würden Sie diese Webseite am ehesten zuordnen?';
		topicLabel.style.fontWeight = 'bold';
		topicLabel.style.marginBottom = '6px';
		topicBlock.appendChild(topicLabel);
		const topics = [
			'Nachrichten / Journalismus',
			'Bildung / Wissen',
			'Unterhaltung / Lifestyle',
			'Technik / IT',
			'Wirtschaft / Finanzen',
			'Kunst / Kultur / Design',
			'Wissenschaft / Forschung',
			'Gesundheit / Medizin',
			'Politik / Gesellschaft',
			'Reisen / Freizeit',
			'E-Commerce / Shopping',
			'Sonstiges'
		];
		const topicRadios = [];
		topics.forEach((t, idx) => {
			const label = document.createElement('label');
			label.style.display = 'block';
			label.style.marginBottom = '6px';
			const r = document.createElement('input');
			r.type = 'radio';
			r.name = 'topic';
			r.value = t;
			if (idx === 0) r.tabIndex = 0;
			label.appendChild(r);
			label.appendChild(document.createTextNode(t));
			topicBlock.appendChild(label);
			topicRadios.push(r);
		});
		form.appendChild(topicBlock);

		const submitBtn = document.createElement('button');
		submitBtn.type = 'submit';
		submitBtn.textContent = 'Submit';
		submitBtn.style.marginTop = '12px';
		submitBtn.style.background = '#4285f4';
		submitBtn.style.color = '#fff';
		submitBtn.style.border = 'none';
		submitBtn.style.borderRadius = '4px';
		submitBtn.style.padding = '8px 18px';
		submitBtn.style.fontSize = '15px';
		submitBtn.style.cursor = 'pointer';
		form.appendChild(submitBtn);

		const isValid = () => (
			likert.radios.some(r => r.checked) &&
			topicRadios.some(r => r.checked)
		);
		const updateSubmit = () => { submitBtn.disabled = !isValid(); };
		[...likert.radios, ...topicRadios].forEach(r => r.addEventListener('change', updateSubmit));
		updateSubmit();

		form.addEventListener('submit', async (e) => {
			e.preventDefault();
			if (!isValid()) return;
			const understandable = likert.radios.find(r => r.checked)?.value;
			const topic = topicRadios.find(r => r.checked)?.value || null;

			chrome.storage.local.get(['userId', 'experienceSamplingResponses'], async (result) => {
				const userId = result.userId || null;
				const eventType = 'siteSurvey';
				const timestamp = new Date().toISOString();
				const url = new URL(window.location.href);
				const baseDomain = url.hostname;
				const pageUrlHash = await hashBaseDomain(baseDomain);
				const sessionId = getOrCreateSessionId();
				const siteSessionIdLocal = siteSessionId;
				const siteLanguage = getSiteLanguage();
				const responseObj = {
					user_id: userId,
					event_type: eventType,
					timestamp,
					answers: {
						understandableOverall: understandable,
						topic
					},
					page_url_hash: pageUrlHash,
					session_id: sessionId,
					site_session_id: siteSessionIdLocal,
					study_group: (typeof computeStudyState === 'function') ? computeStudyState() : 'deactivated'
				};
				const arr = result.experienceSamplingResponses || [];
				arr.push(responseObj);
				chrome.storage.local.set({ experienceSamplingResponses: arr });
			});

			popup.remove();
		});

		popup.appendChild(form);
		document.body.appendChild(popup);
		setTimeout(() => { if (popup && popup.parentNode) popup.remove(); }, ESM_CONFIG.AUTO_REMOVE_MS);
	}

	// -------- Site close raw event (subset fields; no altered_* in default) --------
	async function emitSiteCloseRawEventOnce() {
		if (window.__siteCloseEmitted) return;
		window.__siteCloseEmitted = true;
		try {
			const user_id = (await new Promise(resolve => chrome.storage.local.get(['userId'], r => resolve(r.userId || null)))) || null;
			const event_type = 'siteClose';
			const timestamp = new Date().toISOString();
			const baseDomain = window.location.hostname;
			const page_url_hash = await hashBaseDomain(baseDomain);
			const session_id = getOrCreateSessionId();
			const site_session_id = (typeof window !== 'undefined' && window.siteSessionId) ? window.siteSessionId : siteSessionId;
			let language = (document.documentElement.getAttribute('lang') || '').trim();
			if (!language) {
				const metaLang = document.querySelector('meta[http-equiv="content-language" i]')?.getAttribute('content') || document.querySelector('meta[name="language" i]')?.getAttribute('content') || '';
				language = (metaLang || navigator.language || '').trim();
			}
			language = language.toLowerCase();
			const text = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
			const words_total = text ? text.split(' ').length : 0;
			const scroll_depth_percent = (() => {
				const scrollable_length_px = document.documentElement.scrollHeight - window.innerHeight;
				return scrollable_length_px > 0 ? Math.min(maxScrollPx / (scrollable_length_px + window.innerHeight), 1) : 1;
			})();
			const record = {
				user_id,
				event_type,
				timestamp,
				session_id,
				site_session_id,
				page_url_hash,
				words_total,
				scroll_depth_percent,
				active_reading_time_ms: 0,
				study_group: (typeof computeStudyState === 'function') ? computeStudyState() : 'deactivated',
				schema_version: '1.0'
			};
			persistRawEvent(record);
		} catch (e) {
			try { persistRawEvent({ event_type: 'siteClose', timestamp: new Date().toISOString(), schema_version: '1.0' }); } catch (_) {}
		}
	}

	function persistRawEvent(record) {
		try {
			if (!window.__rawEventPort) {
				try { window.__rawEventPort = chrome.runtime.connect({ name: 'rawEventPort' }); } catch (_) {}
			}
			if (window.__rawEventPort) {
				try { window.__rawEventPort.postMessage({ type: 'appendRawEvent', record }); return; } catch (_) {}
			}
			chrome.runtime.sendMessage({ action: 'appendRawEvent', record }, (resp) => {
				if (!resp || resp.success !== true) {
					chrome.storage.local.get(['rawDataEvents'], (res) => {
						const arr = res.rawDataEvents || [];
						arr.push(record);
						chrome.storage.local.set({ rawDataEvents: arr });
					});
				}
			});
		} catch (e) {
			chrome.storage.local.get(['rawDataEvents'], (res) => {
				const arr = res.rawDataEvents || [];
				arr.push(record);
				chrome.storage.local.set({ rawDataEvents: arr });
			});
		}
	}

	let maxScrollPx = window.scrollY + window.innerHeight;
	function updateMaxScroll() {
		const current = window.scrollY + window.innerHeight;
		if (current > maxScrollPx) maxScrollPx = current;
	}
	window.addEventListener('scroll', updateMaxScroll);
	window.addEventListener('resize', updateMaxScroll);
	updateMaxScroll();

	window.addEventListener('pagehide', () => { emitSiteCloseRawEventOnce(); });
	window.addEventListener('beforeunload', () => { emitSiteCloseRawEventOnce(); });
	window.addEventListener('unload', () => { emitSiteCloseRawEventOnce(); });
	try { document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') emitSiteCloseRawEventOnce(); }); } catch (_) {}

	async function hashBaseDomain(domain) {
		const encoder = new TextEncoder();
		const data = encoder.encode(domain);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
	}

	function getSiteLanguage() {
		let language = (document.documentElement.getAttribute('lang') || '').trim();
		if (!language) {
			const metaLang = document.querySelector('meta[http-equiv="content-language" i]')?.getAttribute('content') || document.querySelector('meta[name="language" i]')?.getAttribute('content') || '';
			language = (metaLang || navigator.language || '').trim();
		}
		return language.toLowerCase();
	}

	function getOrCreateSessionId() {
		const hostname = window.location.hostname;
		const stored = window.sessionStorage.getItem('rollingSession');
		let data = null;
		try { data = stored ? JSON.parse(stored) : null; } catch (_) { data = null; }
		const now = Date.now();
		const needsNew = !data || data.hostname !== hostname || (now - (data.lastActivityTs || 0)) > (30 * 60 * 1000);
		if (needsNew) {
			const newId = (crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));
			const newData = { session_id: newId, hostname, lastActivityTs: now };
			window.sessionStorage.setItem('rollingSession', JSON.stringify(newData));
			return newId;
		}
		return data.session_id;
	}

	const siteSessionId = (crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));
	try { window.siteSessionId = siteSessionId; } catch (_) {}

	window.addEventListener('mousemove', markActivity, { passive: true });
	window.addEventListener('scroll', markActivity, { passive: true });
	window.addEventListener('keydown', markActivity, { passive: true });
	window.addEventListener('click', markActivity, { passive: true });
	window.addEventListener('touchstart', markActivity, { passive: true });

	scheduleSurveyTrigger();
})();



