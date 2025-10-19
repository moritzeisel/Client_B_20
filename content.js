let processedElements = new WeakSet();

let paragraphObserver = null;

const ACCEPTED_INLINE_TAGS = [
    'B', 'STRONG', 'I', 'EM', 'U', 'SPAN', 'MARK', 'SMALL', 'SUB', 'SUP', 'S', 'DEL', 'CODE', 'KBD', 'SAMP', 'ABBR', 'CITE', 'DFN', 'VAR', 'BR'
];

const ENABLE_DIV_CANDIDATES = true;

const SILENCE_CONTENT_LOGS = true;
if (SILENCE_CONTENT_LOGS && typeof console !== 'undefined') {
    try {
        console.log = () => {};
        console.info = () => {};
        console.debug = () => {};
    } catch (_) {}
}

function setupParagraphObserver() {
    if (paragraphObserver) {
        paragraphObserver.disconnect();
    }
    paragraphObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                if (
                    shouldAcceptPlainPTag(element, true) ||
                    shouldAcceptPWithInlineFormatting(element, true) ||
                    shouldAcceptFigcaptionWithInlineFormatting(element, true) ||
                    shouldAcceptLiWithInlineFormatting(element, true) ||
                    shouldAcceptTdWithInlineFormatting(element, true) ||
                    (ENABLE_DIV_CANDIDATES && (
                        shouldAcceptPlainDivTag(element, true) ||
                        shouldAcceptDivWithInlineFormatting(element, true)
                    ))
                ) {
                    processFoundParagraphs([element]);
                }
                observer.unobserve(element);
            }
        });
    }, {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // consider visible if at least 10% in viewport
    });
}

function findTextParagraphs() {
    const paragraphs = [];
    const pElements = document.querySelectorAll('p');
    pElements.forEach(element => {
        if (!processedElements.has(element) && shouldAcceptPlainPTag(element, false)) {
            paragraphs.push(element);
        } else if (!processedElements.has(element) && shouldAcceptPWithInlineFormatting(element, false)) {
            paragraphs.push(element);
        }
    });
    const figcaptions = document.querySelectorAll('figcaption');
    figcaptions.forEach(element => {
        if (!processedElements.has(element) && shouldAcceptFigcaptionWithInlineFormatting(element, false)) {
            paragraphs.push(element);
        }
    });
    const liElements = document.querySelectorAll('li');
    liElements.forEach(element => {
        if (!processedElements.has(element) && shouldAcceptLiWithInlineFormatting(element, false)) {
            paragraphs.push(element);
        }
    });
    const tdElements = document.querySelectorAll('td');
    tdElements.forEach(element => {
        if (!processedElements.has(element) && shouldAcceptTdWithInlineFormatting(element, false)) {
            paragraphs.push(element);
        }
    });
    if (ENABLE_DIV_CANDIDATES) {
        const divElements = document.querySelectorAll('div');
        divElements.forEach(element => {
            if (!processedElements.has(element) && shouldAcceptPlainDivTag(element, false)) {
                paragraphs.push(element);
            } else if (!processedElements.has(element) && shouldAcceptDivWithInlineFormatting(element, false)) {
                paragraphs.push(element);
            }
        });
    }
    return paragraphs;
}

function shouldAcceptPlainPTag(element, skipVisibilityCheck) {
    if (isInsideSimplifyUi(element)) return false;
    if (processedElements.has(element)) return false;
    if (element.tagName !== 'P') return false;
    if (element.children.length > 0) return false;
    const text = element.textContent || '';
    const alphabeticCount = countAlphabeticCharacters(text);
    if (alphabeticCount < 50) return false;
    if (!skipVisibilityCheck) return true;
    processedElements.add(element);
    return true;
}

function shouldAcceptPWithInlineFormatting(element, skipVisibilityCheck) {
    if (isInsideSimplifyUi(element)) {
        return false;
    }
    if (processedElements.has(element)) {
        return false;
    }
    if (element.tagName !== 'P') {
        return false;
    }
    if (element.children.length === 0) {
        return false;
    }
    if (!allChildrenAreInline(element)) {
        return false;
    }
    const text = element.textContent || '';
    const alphabeticCount = countAlphabeticCharacters(text);
    if (alphabeticCount < 50) {
        return false;
    }
    if (!skipVisibilityCheck) {
        return true;
    }
    processedElements.add(element);
    return true;
}

function shouldAcceptFigcaptionWithInlineFormatting(element, skipVisibilityCheck) {
    if (isInsideSimplifyUi(element)) {
        return false;
    }
    if (processedElements.has(element)) {
        return false;
    }
    if (element.tagName !== 'FIGCAPTION') {
        return false;
    }
    if (!allChildrenAreInline(element)) {
        return false;
    }
    const text = element.textContent || '';
    const alphabeticCount = countAlphabeticCharacters(text);
    if (alphabeticCount < 50) {
        return false;
    }
    if (!skipVisibilityCheck) {
        return true;
    }
    processedElements.add(element);
    return true;
}

function shouldAcceptLiWithInlineFormatting(element, skipVisibilityCheck) {
    if (isInsideSimplifyUi(element)) {
        return false;
    }
    if (processedElements.has(element)) {
        return false;
    }
    if (element.tagName !== 'LI') {
        return false;
    }
    if (!allChildrenAreInline(element)) {
        return false;
    }
    const text = element.textContent || '';
    const alphabeticCount = countAlphabeticCharacters(text);
    if (alphabeticCount < 50) {
        return false;
    }
    if (!skipVisibilityCheck) {
        return true;
    }
    processedElements.add(element);
    return true;
}

function shouldAcceptTdWithInlineFormatting(element, skipVisibilityCheck) {
    if (isInsideSimplifyUi(element)) {
        return false;
    }
    if (processedElements.has(element)) {
        return false;
    }
    if (element.tagName !== 'TD') {
        return false;
    }
    if (!allChildrenAreInline(element)) {
        return false;
    }
    const text = element.textContent || '';
    const alphabeticCount = countAlphabeticCharacters(text);
    if (alphabeticCount < 50) {
        return false;
    }
    if (!skipVisibilityCheck) {
        return true;
    }
    processedElements.add(element);
    return true;
}

function shouldAcceptPlainDivTag(element, skipVisibilityCheck) {
    if (isInsideSimplifyUi(element)) return false;
    if (processedElements.has(element)) return false;
    if (element.tagName !== 'DIV') return false;
    if (element.children.length > 0) return false;
    const text = element.textContent || '';
    const alphabeticCount = countAlphabeticCharacters(text);
    if (alphabeticCount < 50) return false;
    if (!skipVisibilityCheck) return true;
    processedElements.add(element);
    return true;
}

function shouldAcceptDivWithInlineFormatting(element, skipVisibilityCheck) {
    if (isInsideSimplifyUi(element)) {
        return false;
    }
    if (processedElements.has(element)) {
        return false;
    }
    if (element.tagName !== 'DIV') {
        return false;
    }
    if (element.children.length === 0) {
        return false;
    }
    if (!allChildrenAreInline(element)) {
        return false;
    }
    const text = element.textContent || '';
    const alphabeticCount = countAlphabeticCharacters(text);
    if (alphabeticCount < 50) {
        return false;
    }
    if (!skipVisibilityCheck) {
        return true;
    }
    processedElements.add(element);
    return true;
}

function isInsideSimplifyUi(element) {
    try {
        return Boolean(
            element.closest('#esm-popup, .experience-sampling-popup, .gutter-popup, [data-simplify-ui="1"]')
        );
    } catch (_) {
        return false;
    }
}
function allChildrenAreInline(node) {
    for (let child of node.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            if (!ACCEPTED_INLINE_TAGS.includes(child.tagName)) {
                return false;
            }
            if (!allChildrenAreInline(child)) {
                return false;
            }
        } else if (child.nodeType !== Node.TEXT_NODE) {
            return false;
        }
    }
    return true;
}

function countAlphabeticCharacters(text) {
    const matches = text.match(/[A-Za-zÀ-ÿ]/g);
    return matches ? matches.length : 0;
}

function findTextParagraphsInNode(node) {
    const paragraphs = [];
    if (!(node instanceof Element)) return paragraphs;
    const pElements = node.querySelectorAll('p');
    pElements.forEach(element => {
        if (!processedElements.has(element) && shouldAcceptPlainPTag(element, false)) {
            paragraphs.push(element);
        } else if (!processedElements.has(element) && shouldAcceptPWithInlineFormatting(element, false)) {
            paragraphs.push(element);
        }
    });
    const figcaptions = node.querySelectorAll('figcaption');
    figcaptions.forEach(element => {
        if (!processedElements.has(element) && shouldAcceptFigcaptionWithInlineFormatting(element, false)) {
            paragraphs.push(element);
        }
    });
    const liElements = node.querySelectorAll('li');
    liElements.forEach(element => {
        if (!processedElements.has(element) && shouldAcceptLiWithInlineFormatting(element, false)) {
            paragraphs.push(element);
        }
    });
    const tdElements = node.querySelectorAll('td');
    tdElements.forEach(element => {
        if (!processedElements.has(element) && shouldAcceptTdWithInlineFormatting(element, false)) {
            paragraphs.push(element);
        }
    });
    if (ENABLE_DIV_CANDIDATES) {
        const divElements = node.querySelectorAll('div');
        divElements.forEach(element => {
            if (!processedElements.has(element) && shouldAcceptPlainDivTag(element, false)) {
                paragraphs.push(element);
            } else if (!processedElements.has(element) && shouldAcceptDivWithInlineFormatting(element, false)) {
                paragraphs.push(element);
            }
        });
    }
    if (node.tagName === 'P' && !processedElements.has(node)) {
        if (shouldAcceptPlainPTag(node, false) || shouldAcceptPWithInlineFormatting(node, false)) {
            paragraphs.push(node);
        }
    }
    if (node.tagName === 'FIGCAPTION' && !processedElements.has(node)) {
        if (shouldAcceptFigcaptionWithInlineFormatting(node, false)) {
            paragraphs.push(node);
        }
    }
    if (node.tagName === 'LI' && !processedElements.has(node)) {
        if (shouldAcceptLiWithInlineFormatting(node, false)) {
            paragraphs.push(node);
        }
    }
    if (node.tagName === 'TD' && !processedElements.has(node)) {
        if (shouldAcceptTdWithInlineFormatting(node, false)) {
            paragraphs.push(node);
        }
    }
    if (ENABLE_DIV_CANDIDATES) {
        if (node.tagName === 'DIV' && !processedElements.has(node)) {
            if (shouldAcceptPlainDivTag(node, false) || shouldAcceptDivWithInlineFormatting(node, false)) {
                paragraphs.push(node);
            }
        }
    }
    return paragraphs;
}

function resetProcessedElements() {
    processedElements = new WeakSet();
}

let isEnabled = true;
let settings = {};
let simplifyApiKey = null;

let elementTracker = new Map();
let nextElementId = 1;
let suppressESM = false; 
let pageStartTs = Date.now();
let lastMouseMoveTs = 0;
let lastActivityTs = Date.now();
let lastActiveTickTs = Date.now();
let activeReadingTimeMs = 0;
let toggleCountSite = 0;
let siteCloseEmitted = false;
let suppressToggleEventLog = false; 
let pageUrlHashCached = null; 

const INACTIVITY_THRESHOLD_MS = 30000; // 30s of inactivity pauses active time accum
const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 min

const ICON_SIMPLIFIED = `<svg width="18" height="18" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="#000" stroke-width="2" fill="#fff"/><circle cx="10" cy="16" r="6" fill="#000"/></svg>`;
const ICON_ORIGINAL = `<svg width="18" height="18" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="#000" stroke-width="2" fill="#fff"/><circle cx="22" cy="16" r="6" fill="#000"/></svg>`;

function initialize() {
    checkBlacklistAndInitialize();
}

async function checkBlacklistAndInitialize() {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'checkBlacklist',
            url: window.location.href
        });
        
        if (response.isBlacklisted) {
            console.log('Current page is blacklisted, extension disabled for this page');
            return;
        }
        
        chrome.storage.local.get(['isEnabled', 'settings', 'simplifyApiKey'], (result) => {
            isEnabled = result.isEnabled !== false;
            settings = result.settings || {};
            simplifyApiKey = result.simplifyApiKey || null;
            
            if (isEnabled) {
                initializeTextProcessing();
            }
            try {
                const baseDomain = window.location.hostname;
                hashBaseDomain(baseDomain).then((h) => { pageUrlHashCached = h; }).catch(() => { pageUrlHashCached = null; });
            } catch (_) { pageUrlHashCached = null; }
        });
    } catch (error) {
        console.error('Error checking blacklist:', error);
        chrome.storage.local.get(['isEnabled', 'settings', 'simplifyApiKey'], (result) => {
            isEnabled = result.isEnabled !== false;
            settings = result.settings || {};
            simplifyApiKey = result.simplifyApiKey || null;
            
            if (isEnabled) {
                initializeTextProcessing();
            }
        });
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {
            case 'extensionStateChanged':
                isEnabled = request.isEnabled;
                if (isEnabled) {
                    checkBlacklistAndInitialize();
                } else {
                    cleanupTextProcessing();
                }
                sendResponse({ success: true });
                break;
            case 'getPageInfo':
                sendResponse({
                    url: window.location.href,
                    title: document.title,
                    domain: window.location.hostname
                });
                break;
            case 'toggleAllParagraphs':
                const result = toggleAllSimplifiedParagraphs();
                sendResponse(result);
                break;
            case 'checkBlacklistStatus':
                (async () => {
                    try {
                        const response = await chrome.runtime.sendMessage({
                            action: 'checkBlacklist',
                            url: window.location.href
                        });
                        sendResponse(response);
                    } catch (error) {
                        sendResponse({ isBlacklisted: false, error: error.message });
                    }
                })();
                return true;
            case 'esmShowDisableExtension':
                (async () => {
                    try {
                        await showESMPopupForDisableExtension();
                        sendResponse({ success: true });
                    } catch (e) {
                        sendResponse({ success: false, error: e?.message });
                    }
                })();
                return true;
            default:
                sendResponse({ error: 'Unknown action' });
        }
    });
}

function initializeTextProcessing() {
    setupParagraphObserver();
    const foundParagraphs = findTextParagraphs();
    foundParagraphs.forEach(element => {
        paragraphObserver.observe(element);
    });
    const markActivity = () => { 
        lastMouseMoveTs = Date.now(); 
        lastActivityTs = Date.now();
        updateSessionActivityTimestamp();
    };
    window.addEventListener('mousemove', markActivity, { passive: true });
    window.addEventListener('scroll', markActivity, { passive: true });
    window.addEventListener('keydown', markActivity, { passive: true });
    window.addEventListener('click', markActivity, { passive: true });
    window.addEventListener('touchstart', markActivity, { passive: true });

    setInterval(() => {
        const now = Date.now();
        const delta = now - lastActiveTickTs;
        lastActiveTickTs = now;
        const visible = document.visibilityState === 'visible';
        const recentlyActive = now - lastActivityTs <= INACTIVITY_THRESHOLD_MS;
        if (visible && recentlyActive) {
            activeReadingTimeMs += delta;
        }
    }, 1000);

    window.addEventListener('pagehide', () => { emitSiteCloseRawEventOnce(); });
    window.addEventListener('beforeunload', () => { emitSiteCloseRawEventOnce(); });
    window.addEventListener('unload', () => { emitSiteCloseRawEventOnce(); });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') emitSiteCloseRawEventOnce();
        if (document.visibilityState === 'visible') updateSessionActivityTimestamp();
    });
    setTimeout(() => { try { maybeTriggerSiteSurvey(); } catch (e) { console.error(e); } }, 45000);
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    handleNewContent(node);
                }
            });
        });
    });
    observer.observe(document, { subtree: true, childList: true });
}

function processFoundParagraphs(paragraphs) {
    paragraphs.forEach(element => {
        const elementId = `simplify-${nextElementId++}`;
        
        elementTracker.set(elementId, {
            element: element,
            originalText: element.textContent,
            simplifiedText: null,
            isSimplified: false,
            id: elementId
        });
        
        sendForSimplification(elementId, element.textContent);
    });
}

function handleNewContent(addedNode) {
    const newParagraphs = findTextParagraphsInNode(addedNode);
    newParagraphs.forEach(element => {
        paragraphObserver.observe(element);
    });
}

function removeEmojisAndNonText(text) {
    return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
}

async function sendForSimplification(elementId, content) {
    if (!simplifyApiKey) {
        console.log('No API key available for simplification');
        return;
    }
    
    let cleanContent = removeEmojisAndNonText(content);

    if (!cleanContent || cleanContent.trim().length === 0) {
        return;
    }
    
    if (cleanContent.length > 10000) {
        console.warn('Content too long, truncating:', elementId);
        cleanContent = cleanContent.substring(0, 10000);
    }
    
    try {
        const response = await fetch(`${SERVER_URL}/simplify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': simplifyApiKey
            },
            body: JSON.stringify({ id: elementId, text: cleanContent, level: 3 })
        });
        
        const data = await response.json();
        
        if (data.error) {
            console.error('Simplification error:', data.error);
            return;
        }
        
        let simplifiedText = null;
        if (Array.isArray(data) && data[0] && data[0].simplified) {
            simplifiedText = data[0].simplified;
        }
        
        if (simplifiedText) {
            handleSimplificationResponse(elementId, simplifiedText);
        } else {
            console.warn('No simplified text in response:', elementId);
        }
        
    } catch (error) {
        console.error('Simplification request failed:', error);
    }
}

function handleSimplificationResponse(elementId, simplifiedText) {
    const tracker = elementTracker.get(elementId);
    if (!tracker) {
        return;
    }
    
    tracker.simplifiedText = simplifiedText;
    
    if (tracker.element && tracker.element.isConnected) {
        tracker.element.classList.add('simplified-paragraph');
        tracker.element.textContent = simplifiedText;
        tracker.isSimplified = true;
        
        const toggleButton = document.createElement('button');
        toggleButton.className = 'simplified-paragraph-toggle';
        toggleButton.setAttribute('aria-label', 'Toggle between original and simplified text');
        toggleButton.setAttribute('tabindex', '0');
        
        tracker.toggleButton = toggleButton;
        tracker.popup = null;
        
        toggleButton.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleParagraph(tracker);
        });
        
        toggleButton.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleParagraph(tracker);
            }
        });
        
        tracker.element.appendChild(toggleButton);
        try { maybeTriggerSiteSurvey(); } catch (e) { console.error(e); }
    } else {
        console.warn('Element no longer in DOM:', elementId);
    }
}



function toggleParagraph(tracker) {
    if (tracker.isSimplified) {
        tracker.element.textContent = tracker.originalText;
        tracker.isSimplified = false;
        toggleCountSite += 1;
        if (tracker.toggleButton) {
            tracker.toggleButton.remove();
            tracker.toggleButton = null;
        }
        if (tracker.popup) {
            tracker.popup.remove();
            tracker.popup = null;
        }
        
        const greyToggleButton = document.createElement('button');
        greyToggleButton.className = 'original-paragraph-toggle';
        greyToggleButton.setAttribute('aria-label', 'Switch to simplified text');
        greyToggleButton.setAttribute('tabindex', '0');
        

        
        greyToggleButton.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleParagraph(tracker);
        });
        
        greyToggleButton.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleParagraph(tracker);
            }
        });
        
        tracker.toggleButton = greyToggleButton;
        tracker.popup = null;
        tracker.element.appendChild(greyToggleButton);

        if (!suppressESM) {
            try {
                showESMPopupForToggleOriginal();
            } catch (err) {
                console.error('ESM popup failed:', err);
            }
        }

        if (!suppressToggleEventLog) {
            emitToggleRawEvent(tracker, 'simplified', 'original');
        }
    } else {
        tracker.element.textContent = tracker.simplifiedText;
        tracker.isSimplified = true;
        toggleCountSite += 1;
        if (tracker.toggleButton) {
            tracker.toggleButton.remove();
            tracker.toggleButton = null;
        }
        if (tracker.popup) {
            tracker.popup.remove();
            tracker.popup = null;
        }
        
        const blueToggleButton = document.createElement('button');
        blueToggleButton.className = 'simplified-paragraph-toggle';
        blueToggleButton.setAttribute('aria-label', 'Switch to original text');
        blueToggleButton.setAttribute('tabindex', '0');

        blueToggleButton.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleParagraph(tracker);
        });
        
        blueToggleButton.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleParagraph(tracker);
            }
        });
        
        tracker.toggleButton = blueToggleButton;
        tracker.popup = null;
        tracker.element.appendChild(blueToggleButton);

        if (!suppressToggleEventLog) {
            emitToggleRawEvent(tracker, 'original', 'simplified');
        }
    }
    
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleAllSimplifiedParagraphs() {
    const simplifiedTrackers = Array.from(elementTracker.values()).filter(tracker => 
        tracker.simplifiedText && tracker.element && tracker.element.isConnected
    );
    
    if (simplifiedTrackers.length === 0) {
        return { success: false, message: 'No simplified paragraphs found on this page' };
    }
    
    const simplifiedCount = simplifiedTrackers.filter(tracker => tracker.isSimplified).length;
    const originalCount = simplifiedTrackers.length - simplifiedCount;
    
    const targetState = simplifiedCount >= originalCount ? false : true;
    const targetText = targetState ? 'simplified' : 'original';
    const fromView = simplifiedCount >= originalCount ? 'simplified' : 'original';
    const toView = targetText;
    
    suppressESM = true;
    suppressToggleEventLog = true;
    try {
        simplifiedTrackers.forEach(tracker => {
            if (tracker.isSimplified !== targetState) {
                toggleParagraph(tracker);
            }
        });
    } finally {
        suppressESM = false;
        suppressToggleEventLog = false;
    }
    emitToggleAllRawEvent(fromView, toView);
    
    return { 
        success: true, 
        message: `Switched all paragraphs to ${targetText} text (${simplifiedTrackers.length} paragraphs affected)`
    };
}
async function emitToggleAllRawEvent(fromView, toView) {
    try {
        const session_id = getOrCreateSessionId();
        const site_session_id = typeof window !== 'undefined' && window.siteSessionId ? window.siteSessionId : siteSessionId;
        const timestamp = new Date().toISOString();
        const user_id = await new Promise(resolve => chrome.storage.local.get(['userId'], r => resolve(r.userId || null)));
        const record = {
            user_id,
            event_type: 'toggleAllParagraphs',
            timestamp,
            session_id,
            site_session_id,
            from_view: fromView,
            to_view: toView,
            study_group: (typeof computeStudyState === 'function') ? computeStudyState() : 'deactivated',
            schema_version: '1.0'
        };
        console.log('Toggle-all raw event to be stored:', record);
        persistRawEvent(record);
    } catch (e) {
        console.error('Failed to emit toggle-all raw event:', e);
    }
}

function cleanupTextProcessing() {
    resetProcessedElements();
    elementTracker.clear();
    nextElementId = 1;
    if (paragraphObserver) {
        paragraphObserver.disconnect();
        paragraphObserver = null;
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

const ESM_MAX_PER_DAY = 5; // global cap ( 5 in prod)
const ESM_DELAY_MINUTES = [0, 10, 20, 40, 60]; // progressive delays (was [0,10,20,40,60])
const ESM_SITE_SURVEY_MAX_PER_DAY = 3; // site survey independent cap

async function canShowESMPopup() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['esmThrottle'], (result) => {
            const now = Date.now();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayMidnight = today.getTime();
            let data = result.esmThrottle || { lastShown: 0, count: 0, lastReset: 0 };

            if (!data.lastReset || data.lastReset < todayMidnight) {
                data = { lastShown: 0, count: 0, lastReset: todayMidnight };
            }

            if (data.count >= ESM_MAX_PER_DAY) {
                resolve(false);
                return;
            }

            const requiredDelay = (ESM_DELAY_MINUTES[data.count] || ESM_DELAY_MINUTES[ESM_DELAY_MINUTES.length - 1]) * 60 * 1000;
            if (now - data.lastShown < requiredDelay) {
                resolve(false);
                return;
            }

            data.lastShown = now;
            data.count += 1;
            chrome.storage.local.set({ esmThrottle: data }, () => resolve(true));
        });
    });
}

async function showESMPopupForToggleOriginal() {
    const canShow = await canShowESMPopup();
    if (!canShow) return;

    // remove existing ESM popup
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

    const questionDiv = document.createElement('div');
    questionDiv.className = 'experience-sampling-popup-message';
    questionDiv.textContent = 'Warum haben Sie sich bei diesem Abschnitt den Originaltext anzeigen lassen?';
    popup.appendChild(questionDiv);

    const form = document.createElement('form');
    form.style.marginTop = '16px';

    const answers = [
        'Ich will die Funktionen der Browsererweiterung ausprobieren.',
        'Ich will überprüfen, ob der Text korrekt umformuliert wurde.',
        'Ich bin mit dem Ergebnis der Vereinfachung unzufrieden.',
        'Etwas in dem Text war unverständlich.',
        'Es ist ein technisches Problem aufgetreten.',
        'Ich finde die Umformulierung nicht nützlich.',
        'Aus Versehen'
    ];

    const checkboxes = [];
    answers.forEach((labelText, idx) => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.marginBottom = '8px';
        label.style.cursor = 'pointer';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = labelText;
        checkbox.style.marginRight = '8px';
        if (idx === 0) checkbox.tabIndex = 0;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(labelText));
        form.appendChild(label);
        checkboxes.push(checkbox);
    });

    const freeTextLabel = document.createElement('label');
    freeTextLabel.style.display = 'block';
    freeTextLabel.style.marginTop = '8px';
    const freeTextCheckbox = document.createElement('input');
    freeTextCheckbox.type = 'checkbox';
    freeTextCheckbox.value = '__free_text__';
    freeTextCheckbox.style.marginRight = '8px';
    const freeTextInput = document.createElement('input');
    freeTextInput.type = 'text';
    freeTextInput.placeholder = 'Anderes (bitte angeben)';
    freeTextInput.style.marginLeft = '4px';
    freeTextInput.style.width = '60%';
    freeTextInput.addEventListener('input', () => {
        if (freeTextInput.value.trim().length > 0) {
            freeTextCheckbox.checked = true;
        }
    });
    freeTextCheckbox.addEventListener('change', () => {
        if (freeTextCheckbox.checked) {
            freeTextInput.focus();
        }
    });
    freeTextLabel.appendChild(freeTextCheckbox);
    freeTextLabel.appendChild(freeTextInput);
    form.appendChild(freeTextLabel);

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

    const hasAnyChecked = () => checkboxes.some(cb => cb.checked) || (freeTextCheckbox.checked && freeTextInput.value.trim().length > 0);
    const updateSubmitState = () => { submitBtn.disabled = !hasAnyChecked(); };
    checkboxes.forEach(cb => cb.addEventListener('change', updateSubmitState));
    freeTextCheckbox.addEventListener('change', updateSubmitState);
    freeTextInput.addEventListener('input', updateSubmitState);
    updateSubmitState();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!hasAnyChecked()) return;
        const chosen = checkboxes.filter(cb => cb.checked).map(cb => cb.value);
        let freeText = null;
        if (freeTextCheckbox.checked && freeTextInput.value.trim().length > 0) {
            freeText = freeTextInput.value.trim();
        }

        chrome.storage.local.get(['userId', 'experienceSamplingResponses'], async (result) => {
            const user_id = result.userId || null;
            const event_type = 'toggleSingleToOriginal';
            const timestamp = new Date().toISOString();
            const url = new URL(window.location.href);
            const baseDomain = url.hostname;
            const page_url_hash = await hashBaseDomain(baseDomain);
            const session_id = getOrCreateSessionId();
            const site_session_id = siteSessionId;
            const site_language = getSiteLanguage();
            const responseObj = {
                user_id,
                event_type,
                timestamp,
                answers: chosen,
                free_text: freeText,
                base_url_hash: page_url_hash,
                session_id,
                site_session_id,
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

    setTimeout(() => { if (popup && popup.parentNode) popup.remove(); }, 360 * 1000);
}

async function showESMPopupForDisableExtension() {
    const canShow = await canShowESMPopup();
    if (!canShow) return;

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

    const questionDiv = document.createElement('div');
    questionDiv.className = 'experience-sampling-popup-message';
    questionDiv.textContent = 'Warum haben Sie die Erweiterung deaktiviert?';
    popup.appendChild(questionDiv);

    const form = document.createElement('form');
    form.style.marginTop = '16px';

    const answers = [
        'Ich brauche sie auf dieser Seite nicht.',
        'Ich möchte sie für die nächste Zeit nicht nutzen.',
        'Ich finde sie störend.',
        'Ich möchte lieber Originaltexte lesen.'
    ];

    const checkboxes = [];
    answers.forEach((labelText, idx) => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.marginBottom = '8px';
        label.style.cursor = 'pointer';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = labelText;
        checkbox.style.marginRight = '8px';
        if (idx === 0) checkbox.tabIndex = 0;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(labelText));
        form.appendChild(label);
        checkboxes.push(checkbox);
    });

    const freeTextLabel = document.createElement('label');
    freeTextLabel.style.display = 'block';
    freeTextLabel.style.marginTop = '8px';
    const freeTextCheckbox = document.createElement('input');
    freeTextCheckbox.type = 'checkbox';
    freeTextCheckbox.value = '__free_text__';
    freeTextCheckbox.style.marginRight = '8px';
    const freeTextInput = document.createElement('input');
    freeTextInput.type = 'text';
    freeTextInput.placeholder = 'Anderes (bitte angeben)';
    freeTextInput.style.marginLeft = '4px';
    freeTextInput.style.width = '60%';
    freeTextInput.addEventListener('input', () => {
        if (freeTextInput.value.trim().length > 0) {
            freeTextCheckbox.checked = true;
        }
    });
    freeTextCheckbox.addEventListener('change', () => {
        if (freeTextCheckbox.checked) {
            freeTextInput.focus();
        }
    });
    freeTextLabel.appendChild(freeTextCheckbox);
    freeTextLabel.appendChild(freeTextInput);
    form.appendChild(freeTextLabel);

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

    const hasAnyChecked = () => checkboxes.some(cb => cb.checked) || (freeTextCheckbox.checked && freeTextInput.value.trim().length > 0);
    const updateSubmitState = () => { submitBtn.disabled = !hasAnyChecked(); };
    checkboxes.forEach(cb => cb.addEventListener('change', updateSubmitState));
    freeTextCheckbox.addEventListener('change', updateSubmitState);
    freeTextInput.addEventListener('input', updateSubmitState);
    updateSubmitState();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!hasAnyChecked()) return;
        const chosen = checkboxes.filter(cb => cb.checked).map(cb => cb.value);
        let freeText = null;
        if (freeTextCheckbox.checked && freeTextInput.value.trim().length > 0) {
            freeText = freeTextInput.value.trim();
        }

        chrome.storage.local.get(['userId', 'experienceSamplingResponses'], async (result) => {
            const user_id = result.userId || null;
            const event_type = 'disableExtension';
            const timestamp = new Date().toISOString();
            const url = new URL(window.location.href);
            const baseDomain = url.hostname;
            const page_url_hash = await hashBaseDomain(baseDomain);
            const session_id = getOrCreateSessionId();
            const site_session_id = siteSessionId;
            const site_language = getSiteLanguage();
            const responseObj = {
                user_id,
                event_type,
                timestamp,
                answers: chosen,
                free_text: freeText,
                base_url_hash: page_url_hash,
                session_id,
                site_session_id,
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

    setTimeout(() => { if (popup && popup.parentNode) popup.remove(); }, 360 * 1000);
}

async function maybeTriggerSiteSurvey() {
    const now = Date.now();
    if (now - pageStartTs < 45000) return;
    if (now - lastMouseMoveTs > 10000) return;
    const alteredCount = Array.from(elementTracker.values()).filter(t => t.simplifiedText != null).length;
    if (alteredCount < 5) return;
    if (Math.random() >= 0.1) return;
    const canShow = await canShowESMSiteSurvey();
    if (!canShow) return;
    await showESMSiteSurvey();
}

function canShowESMSiteSurvey() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['esmSiteSurveyThrottle'], (result) => {
            const now = Date.now();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayMidnight = today.getTime();
            let data = result.esmSiteSurveyThrottle || { lastShown: 0, count: 0, lastReset: 0 };
            if (!data.lastReset || data.lastReset < todayMidnight) {
                data = { lastShown: 0, count: 0, lastReset: todayMidnight };
            }
            if (data.count >= ESM_SITE_SURVEY_MAX_PER_DAY) {
                resolve(false);
                return;
            }
            const requiredDelay = (ESM_DELAY_MINUTES[data.count] || ESM_DELAY_MINUTES[ESM_DELAY_MINUTES.length - 1]) * 60 * 1000;
            if (now - data.lastShown < requiredDelay) {
                resolve(false);
                return;
            }
            data.lastShown = now;
            data.count += 1;
            chrome.storage.local.set({ esmSiteSurveyThrottle: data }, () => resolve(true));
        });
    });
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

    // likert helper
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

    const likert1 = renderLikert('Die Texte auf dieser Webseite sind auch ohne Nutzung der Erweiterung gut verständlich.');
    const likert2 = renderLikert('Die durch die Erweiterung umformulierten Texte auf dieser Webseite sind gut verständlich.');
    const likert3 = renderLikert('Ich empfinde die Erweiterung auf dieser Webseite als hilfreich.');
    form.appendChild(likert1.block);
    form.appendChild(likert2.block);
    form.appendChild(likert3.block);

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
        [likert1, likert2, likert3].every(l => l.radios.some(r => r.checked)) &&
        topicRadios.some(r => r.checked)
    );
    const updateSubmit = () => { submitBtn.disabled = !isValid(); };
    [...likert1.radios, ...likert2.radios, ...likert3.radios, ...topicRadios].forEach(r => r.addEventListener('change', updateSubmit));
    updateSubmit();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isValid()) return;
        const v1 = likert1.radios.find(r => r.checked)?.value;
        const v2 = likert2.radios.find(r => r.checked)?.value;
        const v3 = likert3.radios.find(r => r.checked)?.value;
        const topic = topicRadios.find(r => r.checked)?.value || null;

        chrome.storage.local.get(['userId', 'experienceSamplingResponses'], async (result) => {
            const user_id = result.userId || null;
            const event_type = 'siteSurvey';
            const timestamp = new Date().toISOString();
            const url = new URL(window.location.href);
            const baseDomain = url.hostname;
            const page_url_hash = await hashBaseDomain(baseDomain);
            const session_id = getOrCreateSessionId();
            const site_session_id = siteSessionId;
            const site_language = getSiteLanguage();
            const responseObj = {
                user_id,
                event_type,
                timestamp,
                answers: {
                    understandableWithout: v1,
                    understandableWith: v2,
                    helpful: v3,
                    topic
                },
                page_url_hash,
                base_url_hash: page_url_hash,
                session_id,
                site_session_id,
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
    setTimeout(() => { if (popup && popup.parentNode) popup.remove(); }, 360 * 1000);
}

// raw data: site close event
async function emitSiteCloseRawEventOnce() {
    if (siteCloseEmitted) return;
    siteCloseEmitted = true;

    try {
        const user_id = (await new Promise(resolve => chrome.storage.local.get(['userId'], r => resolve(r.userId || null)))) || null;
        const event_type = 'siteClose';
        const timestamp = new Date().toISOString();
        const baseDomain = window.location.hostname;
        const page_url_hash = pageUrlHashCached || null;
        const session_id = getOrCreateSessionId();
        const site_session_id = typeof window !== 'undefined' && window.siteSessionId ? window.siteSessionId : siteSessionId;
        const extension_state = isEnabled !== false;

        // language detection
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

        const trackers = Array.from(elementTracker.values());
        const alteredTrackers = trackers.filter(t => t.simplifiedText != null);
        const altered_paragraphs_count = alteredTrackers.length;
        const countWords = (s) => (s || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
        const altered_words_ever = alteredTrackers.reduce((sum, t) => sum + countWords(t.originalText), 0);
        const percent_altered_words_ever = words_total > 0 ? altered_words_ever / words_total : 0;

        const record = {
            user_id,
            event_type,
            timestamp,
            session_id,
            site_session_id,
            extension_state,
            page_url_hash,
            words_total,
            scroll_depth_percent,
            active_reading_time_ms: activeReadingTimeMs,
            toggles_count: toggleCountSite,
            altered_paragraphs_count,
            altered_words_ever,
            percent_altered_words_ever,
            study_group: (typeof computeStudyState === 'function') ? computeStudyState() : 'deactivated',
            schema_version: '1.0'
        };

        console.log('Site close raw event to be stored:', record);

        persistRawEvent(record);
    } catch (e) {
        console.error('Failed to emit siteClose raw event:', e);
    }
}

async function emitToggleRawEvent(tracker, fromView, toView) {
    try {
        const wordCount = (s) => (s || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
        const session_id = getOrCreateSessionId();
        const site_session_id = typeof window !== 'undefined' && window.siteSessionId ? window.siteSessionId : siteSessionId;
        const timestamp = new Date().toISOString();
        const url = new URL(window.location.href);
        const baseDomain = url.hostname;
        const page_url_hash = await hashBaseDomain(baseDomain);
        const extension_state = await new Promise(resolve => chrome.storage.local.get(['isEnabled'], r => resolve(r.isEnabled !== false)));
        const user_id = await new Promise(resolve => chrome.storage.local.get(['userId'], r => resolve(r.userId || null)));
        const record = {
            user_id,
            event_type: 'toggleParagraph',
            timestamp,
            session_id,
            site_session_id,
            page_url_hash,
            extension_state,
            from_view: fromView,
            to_view: toView,
            wordcount_simplified: wordCount(tracker.simplifiedText),
            wordcount_original: wordCount(tracker.originalText),
            study_group: (typeof computeStudyState === 'function') ? computeStudyState() : 'deactivated',
            schema_version: '1.0'
        };
        console.log('Toggle raw event to be stored:', record);
        persistRawEvent(record);
    } catch (e) {
        console.error('Failed to emit toggle raw event:', e);
    }
}

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
    const needsNew = !data || data.hostname !== hostname || (now - (data.lastActivityTs || 0)) > SESSION_IDLE_TIMEOUT_MS;
    if (needsNew) {
        const newId = (crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16)));
        const newData = { session_id: newId, hostname, lastActivityTs: now };
        window.sessionStorage.setItem('rollingSession', JSON.stringify(newData));
        return newId;
    }
    return data.session_id;
}

function updateSessionActivityTimestamp() {
    try {
        const stored = window.sessionStorage.getItem('rollingSession');
        if (!stored) return;
        const data = JSON.parse(stored);
        data.lastActivityTs = Date.now();
        window.sessionStorage.setItem('rollingSession', JSON.stringify(data));
    } catch (_) {}
}

const siteSessionId = (crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16)));
try { window.siteSessionId = siteSessionId; } catch (_) {}

let maxScrollPx = window.scrollY + window.innerHeight;
let lastScrollHeight = document.documentElement.scrollHeight;
function updateMaxScroll() {
    const current = window.scrollY + window.innerHeight;
    if (current > maxScrollPx) maxScrollPx = current;
    lastScrollHeight = document.documentElement.scrollHeight;
}
window.addEventListener('scroll', updateMaxScroll);
window.addEventListener('resize', updateMaxScroll);
updateMaxScroll();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
} 