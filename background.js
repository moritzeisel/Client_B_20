const INGEST_SERVER_URL = 'https://simplify.informatik.tu-freiberg.de';

// System blacklist
const SYSTEM_BLACKLIST = [
  // E-Mail & Produktivität
  '*gmail.com*',
  '*mail.yahoo.com*',
  '*outlook.com*',
  '*hotmail.com*',
  '*icloud.com*',
  '*drive.google.com*',
  '*docs.google.com*',
  '*sheets.google.com*',
  '*slides.google.com*',
  '*dropbox.com*',
  '*onedrive.com*',
  '*box.com*',

  // Streaming & Medien
  '*youtube.com*',
  '*netflix.com*',
  '*hulu.com*',
  '*disney*',
  '*primevideo.com*',
  '*twitch.tv*',
  '*vimeo.com*',
  '*spotify.com*',
  '*soundcloud.com*',

  // Cloud-Management & Developer-Konsolen
  '*aws.amazon.com*',
  '*console.aws.amazon.com*',
  '*cloud.google.com*',
  '*console.cloud.google.com*',
  '*azure.com*',
  '*heroku.com*',
  '*digitalocean.com*',

  // Team-Tools & Video-Meetings
  '*slack.com*',
  '*teams.microsoft.com*',
  '*zoom.us*',
  '*meet.google.com*',
  '*skype.com*',
  '*webex.com*',

  // Banken & Finanzdienstleister 
  '*bankofamerica.*',
  '*chase.com*',
  '*wellsfargo.com*',
  '*citibank.com*',
  '*hsbc.com*',
  '*barclays.*',
  '*ing.com*',
  '*ubs.com*',
  '*amex.com*',
  '*visa.com*',
  '*mastercard.com*',
  '*robinhood.com*',
  '*etrade.com*',
  '*tdameritrade.com*',
  '*schwab.com*',
  '*deutschebank.de*',
  '*commerzbank.de*',
  '*postbank.de*',
  '*deutsche-kreditbank.de*',
  '*dkb.de*',
  '*ing.de*',
  '*comdirect.de*',
  '*n26.com*',
  '*targobank.de*',
  '*hypovereinsbank.de*',
  '*sparda.de*',
  '*sparkasse.de*',
  '*volksbank.de*',
  '*raiffeisenbank.de*',
  '*bbbank.de*',
  '*bnpparibas.com*',
  '*credit-suisse.com*',
  '*societegenerale.com*',
  '*intesa-sanpaolo.com*',
  '*uni-credit.de*',
  '*santander.com*',
  '*llyodbank.com*',
  '*rbs.co.uk*',    
  '*fidor.de*',
  '*solarisbank.com*',
  '*raisin.com*',
  '*weltsparen.de*',
  '*traderepublic.com*',
  '*flatex.de*',
  '*degiro.de*',
  '*scalablecapital.com*',
  '*nuri.com*',       
  '*bunq.com*',   
  '*giropay.de*',
  '*paydirekt.de*',
  '*sofort.com*',
  '*klarna.com*',
  '*trustly.com*',
  '*skrill.com*',
  '*neteller.com*',
  '*sumup.com*',
  '*wirecard.com*', 
  '*smava.de*',
  '*auxmoney.com*',
  '*finanzcheck.de*',
  '*check24.de*',
  '*kredit.de*',
  '*hypoport.de*', 
  '*deposit‐solutions.de*',
  '*bitcoin.de*',
  '*bitpanda.com*',
  '*bisonapp.com*', 
  '*luno.com*',
  '*finanztip.de*',
  '*verivox.de*',

  // VPN & Sicherheit
  '*nordvpn.com*',
  '*expressvpn.com*',
  '*protonvpn.com*',
  '*surfshark.com*',
  '*cyberghostvpn.com*',

  // Adult Content
  '*porn*',

  // Other
  '.*google\.com/search.*',
  '*limesurvey*'
];

function isUrlBlacklisted(url, blacklist) {
  if (!url || !blacklist || blacklist.length === 0) return false;
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const fullUrl = urlObj.href;
    
    return blacklist.some(pattern => {
      if (pattern === fullUrl) return true; 
      
      if (pattern === domain) return true; 
      
      if (pattern.startsWith('*.') && domain.endsWith(pattern.slice(1))) return true; 
      
      if (pattern.endsWith('.*') && domain.startsWith(pattern.slice(0, -1))) return true; 
      
       
      if (pattern.startsWith('*') && pattern.endsWith('*')) {
        const cleanPattern = pattern.slice(1, -1); 
        return domain.includes(cleanPattern);
      }
      
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(fullUrl);
      }
      
      return false;
    });
  } catch (error) {
    console.error('Error checking blacklist for URL:', url, error);
    return false;
  }
}

async function getBlacklist() {
  try {
    const result = await chrome.storage.local.get(['blacklist']);
    const userBlacklist = result.blacklist || [];
    
    const combinedBlacklist = [...userBlacklist, ...SYSTEM_BLACKLIST];
    return combinedBlacklist;
  } catch (error) {
    console.error('Error getting blacklist:', error);
    return [...SYSTEM_BLACKLIST];
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    const DEFAULT_BLACKLIST = [
    ];
    
    chrome.storage.local.set({
      isEnabled: true,
      settings: {
        notifications: true
      },
      blacklist: DEFAULT_BLACKLIST
    }, () => {
      chrome.storage.sync.set({ autoStart: true }, () => {
        chrome.tabs.create({ url: 'onboarding-login.html' });
      });
    });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('Browser started, checking auto-start setting');
  
  try {
    const autoStartResult = await chrome.storage.sync.get(['autoStart']);
    const autoStart = Object.prototype.hasOwnProperty.call(autoStartResult, 'autoStart') ? autoStartResult.autoStart : true;
    
    const enabledResult = await chrome.storage.local.get(['isEnabled']);
    const currentEnabled = enabledResult.isEnabled !== false; 
    
    console.log('Auto-start setting:', autoStart, 'Current enabled:', currentEnabled);
    
    if (autoStart && !currentEnabled) {
      console.log('Auto-start enabled - activating extension');
      await chrome.storage.local.set({ isEnabled: true });
      
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'extensionStateChanged',
          isEnabled: true
        }).catch(() => {
        });
      });
    } else if (!autoStart && currentEnabled) {
      console.log('Auto-start disabled - deactivating extension');
      await chrome.storage.local.set({ isEnabled: false });
      
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'extensionStateChanged',
          isEnabled: false
        }).catch(() => {
        });
      });
    } else if (autoStart) {
      console.log('Auto-start enabled but extension already active');
    } else {
      console.log('Auto-start disabled and extension already inactive');
    }
  } catch (error) {
    console.error('Error checking auto-start setting:', error);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.action) {
    case 'injectContentScript':
      try {
        const file = request && request.file;
        if (!file) { sendResponse({ success: false, error: 'No file specified' }); return true; }
        if (!sender || !sender.tab || !sender.tab.id) { sendResponse({ success: false, error: 'No sender tab' }); return true; }
        chrome.scripting.executeScript({
          target: { tabId: sender.tab.id },
          files: ['config.js', file]
        }, () => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true });
          }
        });
      } catch (e) {
        sendResponse({ success: false, error: e?.message || 'Injection failed' });
      }
      return true;
    case 'appendRawEvent':
      try {
        const record = request.record;
        if (!record) {
          sendResponse({ success: false, error: 'No record provided' });
          return true;
        }
        chrome.storage.local.get(['rawDataEvents'], (res) => {
          const arr = res.rawDataEvents || [];
          arr.push(record);
          chrome.storage.local.set({ rawDataEvents: arr }, () => {
            sendResponse({ success: true });
            // trigger flush when backlog is large
            try { maybeTriggerImmediateFlush(); } catch (_) {}
          });
        });
      } catch (e) {
        console.error('appendRawEvent failed:', e);
        sendResponse({ success: false, error: e?.message || 'Unknown error' });
      }
      return true;
    case 'getData':
      chrome.storage.local.get(['isEnabled', 'settings'], (result) => {
        sendResponse(result);
      });
      return true; 
      
    case 'updateSettings':
      chrome.storage.local.set({ settings: request.settings }, () => {
        sendResponse({ success: true });
      });
      return true;
      
    case 'toggleExtension':
      chrome.storage.local.get(['isEnabled'], (result) => {
        const newState = !result.isEnabled;
        chrome.storage.local.set({ isEnabled: newState }, () => {
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              chrome.tabs.sendMessage(tab.id, {
                action: 'extensionStateChanged',
                isEnabled: newState
              }).catch(() => {
              });
            });
          });
          sendResponse({ isEnabled: newState });
        });
      });
      return true;
      
    case 'checkBlacklist':
      (async () => {
        try {
          const blacklist = await getBlacklist();
          const isBlacklisted = isUrlBlacklisted(request.url, blacklist);
          sendResponse({ isBlacklisted, blacklist });
        } catch (error) {
          console.error('Error checking blacklist:', error);
          sendResponse({ isBlacklisted: false, error: error.message });
        }
      })();
      return true;
      
    case 'getBlacklist':
      (async () => {
        try {
          const blacklist = await getBlacklist();
          sendResponse({ blacklist });
        } catch (error) {
          console.error('Error getting blacklist:', error);
          sendResponse({ error: error.message });
        }
      })();
      return true;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'rawEventPort') return;
  port.onMessage.addListener((msg) => {
    if (!msg || msg.type !== 'appendRawEvent' || !msg.record) return;
    try {
      chrome.storage.local.get(['rawDataEvents'], (res) => {
        const arr = res.rawDataEvents || [];
        arr.push(msg.record);
        chrome.storage.local.set({ rawDataEvents: arr }, () => {
          try { port.postMessage({ type: 'appendRawEventAck' }); } catch (_) {}
          try { maybeTriggerImmediateFlush(); } catch (_) {}
        });
      });
    } catch (e) {
      console.error('Port appendRawEvent failed:', e);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
  }
});

chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.id);
}); 

function uuidv4() {
  if (crypto && crypto.getRandomValues) {
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    buf[6] = (buf[6] & 0x0f) | 0x40;
    buf[8] = (buf[8] & 0x3f) | 0x80;
    const hex = [...buf].map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

let flushInFlight = false;
let nextAllowedFlushTs = 0; // for backoff on 429

function maybeTriggerImmediateFlush() {
  chrome.storage.local.get(['rawDataEvents', 'experienceSamplingResponses'], (res) => {
    const raw = res.rawDataEvents || [];
    const esm = res.experienceSamplingResponses || [];
    const total = raw.length + esm.length;
    if (total >= 2000) {
      flushPendingBatches();
    }
  });
}

async function flushPendingBatches() {
  if (flushInFlight) return;
  const now = Date.now();
  if (now < nextAllowedFlushTs) return;
  flushInFlight = true;
  try {
    // Load data and api/user keys
    const store = await new Promise(resolve => chrome.storage.local.get(['rawDataEvents', 'experienceSamplingResponses', 'userId', 'simplifyApiKey'], resolve));
    const raw = store.rawDataEvents || [];
    const esm = store.experienceSamplingResponses || [];
    const total = raw.length + esm.length;
    if (total === 0) return;
    const userId = store.userId || null;
    const apiKey = store.simplifyApiKey || null;
    if (!apiKey) {
      console.warn('No API key available for ingestion; skipping flush');
      return;
    }
    const combined = [];
    // Simple concat; priority order does not matter
    esm.forEach(e => combined.push({ source: 'esm', event: e }));
    raw.forEach(e => combined.push({ source: 'raw', event: e }));

    // Send in chunks of 2000
    let idx = 0;
    while (idx < combined.length) {
      const slice = combined.slice(idx, idx + 2000);
      const batchId = uuidv4();
      const idemKey = uuidv4();
      // Map to server event shape and ensure required fields
      const events = slice.map(w => {
        const ev = { ...w.event };
        if (!ev.user_id && userId) ev.user_id = userId;
        if (!ev.timestamp) ev.timestamp = new Date().toISOString();
        if (!ev.event_id) ev.event_id = uuidv4();
        return ev;
      });

      const body = JSON.stringify({ batch_id: batchId, events });
      let resp;
      try {
        resp = await fetch(`${INGEST_SERVER_URL}/ingest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
            'Idempotency-Key': idemKey
          },
          body
        });
      } catch (e) {
        console.warn('Ingestion network error, will retry later:', e);
        return; 
      }
      if (resp.status === 200) {
        let sentEsm = 0, sentRaw = 0;
        slice.forEach(w => { if (w.source === 'esm') sentEsm++; else sentRaw++; });
        await new Promise(resolve => {
          chrome.storage.local.get(['rawDataEvents', 'experienceSamplingResponses'], (cur) => {
            const newEsm = (cur.experienceSamplingResponses || []).slice(sentEsm);
            const newRaw = (cur.rawDataEvents || []).slice(sentRaw);
            chrome.storage.local.set({ experienceSamplingResponses: newEsm, rawDataEvents: newRaw }, resolve);
          });
        });
        idx += slice.length;
        await new Promise(r => setTimeout(r, 200));
      } else if (resp.status === 429) {
        const ra = parseInt(resp.headers.get('Retry-After') || '60', 10);
        nextAllowedFlushTs = Date.now() + (isNaN(ra) ? 60000 : ra * 1000);
        console.warn('Rate limited. Retry after seconds:', ra);
        return;
      } else {
        console.error('Ingestion failed with status', resp.status);
        return;
      }
    }
  } finally {
    flushInFlight = false;
  }
}

setInterval(() => { try { flushPendingBatches(); } catch (e) { console.error(e); } }, 10 * 60 * 1000);
setTimeout(() => { try { flushPendingBatches(); } catch (e) { console.error(e); } }, 15000);