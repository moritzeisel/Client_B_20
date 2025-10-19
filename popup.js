
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const toggleExtensionBtn = document.getElementById('toggleExtension');
const getPageInfoBtn = document.getElementById('getPageInfo');
const blockCurrentPageBtn = document.getElementById('blockCurrentPage');

const openOptionsLink = document.getElementById('openOptions');
const openHelpLink = document.getElementById('openHelp');

let extensionState = {
    isEnabled: true,
    isBlacklisted: false
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup initialized');
    await loadExtensionState();
    setupEventListeners();
    updateUI();
});

async function loadExtensionState() {
    try {
        const result = await chrome.storage.local.get(['isEnabled', 'settings']);
        extensionState.isEnabled = result.isEnabled !== false;
        
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
            const response = await chrome.runtime.sendMessage({
                action: 'checkBlacklist',
                url: tab.url
            });
            extensionState.isBlacklisted = response.isBlacklisted || false;
        }
    } catch (error) {
        console.error('Error loading extension state:', error);
    }
}


function setupEventListeners() {
    if (toggleExtensionBtn) toggleExtensionBtn.addEventListener('click', async () => {
        try {
            if (extensionState.isBlacklisted) {
                showNotification('Diese Seite ist blockiert. Ändern Sie die Einstellungen, um die Erweiterung zu aktivieren.', 'info');
                return;
            }
            
            const response = await chrome.runtime.sendMessage({ action: 'toggleExtension' });
            if (response && response.isEnabled !== undefined) {
                extensionState.isEnabled = response.isEnabled;
                updateUI();
                showNotification(extensionState.isEnabled ? 'Extension enabled' : 'Extension disabled');

                try {
                    const timestamp = new Date().toISOString();
                    let page_url_hash = null;
                    try {
                        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                        if (activeTab && activeTab.url) {
                            const domain = new URL(activeTab.url).hostname;
                            page_url_hash = await hashBaseDomain(domain);
                        }
                    } catch (_) {}
                    chrome.storage.local.get(['userId', 'rawDataEvents'], (res) => {
                        const user_id = res.userId || null;
                        const arr = res.rawDataEvents || [];
                        const record = {
                            user_id,
                            event_type: 'extensionStateChange',
                            timestamp,
                            extension_state: extensionState.isEnabled,
                            study_group: (typeof computeStudyState === 'function') ? computeStudyState() : 'deactivated',
                            schema_version: '1.0'
                        };
                        if (page_url_hash) record.page_url_hash = page_url_hash;
                        console.log('Extension state change raw event to be stored:', record);
                        arr.push(record);
                        chrome.storage.local.set({ rawDataEvents: arr });
                    });
                } catch (e) {
                    console.error('Failed to store extension state change raw event:', e);
                }

                if (!extensionState.isEnabled) {
                    try {
                        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                        if (tab) {
                            await chrome.tabs.sendMessage(tab.id, { action: 'esmShowDisableExtension' });
                        }
                    } catch (e) {
                        console.error('Failed to trigger ESM disableExtension:', e);
                    }
                }
            }
        } catch (error) {
            console.error('Error toggling extension:', error);
            showNotification('Keine Abschnitte zum umschalten gefunden.', 'error');
        }
    });

    if (getPageInfoBtn) getPageInfoBtn.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleAllParagraphs' });
                if (response && response.success) {
                    showNotification(response.message, 'success');
                } else {
                    showNotification('No simplified paragraphs found on this page', 'info');
                }
            }
        } catch (error) {
            console.error('Error toggling paragraphs:', error);
            showNotification('Error toggling paragraphs', 'error');
        }
    });

    if (blockCurrentPageBtn) blockCurrentPageBtn.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url) {
                const check = await chrome.runtime.sendMessage({ action: 'checkBlacklist', url: tab.url });
                const urlObj = new URL(tab.url);
                const domain = urlObj.hostname;
                if (check && check.isBlacklisted) {
                    showNotification('Diese Seite ist bereits blockiert', 'info');
                    return;
                }

                const res = await chrome.storage.local.get(['blacklist']);
                const userList = Array.isArray(res.blacklist) ? res.blacklist : [];
                if (userList.includes(domain)) {
                    showNotification('Diese Seite ist bereits blockiert', 'info');
                    return;
                }
                const updated = [...userList, domain];
                await chrome.storage.local.set({ blacklist: updated });

                extensionState.isBlacklisted = true;
                updateUI();
                showNotification('Seite erfolgreich zur Blacklist hinzugefügt', 'success');

                try {
                    const timestamp = new Date().toISOString();
                    const page_url_hash = await hashBaseDomain(domain);
                    chrome.storage.local.get(['userId', 'rawDataEvents'], (r) => {
                        const user_id = r.userId || null;
                        const arr = r.rawDataEvents || [];
                        const record = {
                            user_id,
                            event_type: 'blockSite',
                            timestamp,
                            page_url_hash,
                            study_group: (typeof computeStudyState === 'function') ? computeStudyState() : 'deactivated',
                            schema_version: '1.0'
                        };
                        console.log('Block site raw event to be stored:', record);
                        arr.push(record);
                        chrome.storage.local.set({ rawDataEvents: arr });
                    });
                } catch (e) {
                    console.error('Failed to store block site raw event:', e);
                }
            }
        } catch (error) {
            console.error('Error blocking current page:', error);
            showNotification('Fehler beim Blockieren der Seite', 'error');
        }
    });

    if (openOptionsLink) {
        openOptionsLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.runtime.openOptionsPage();
        });
    }

    if (openHelpLink) {
        openHelpLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: 'help.html' });
        });
    }
}

function updateUI() {
    if (extensionState.isBlacklisted) {
        statusIndicator.classList.remove('disabled');
        statusIndicator.style.background = '#f44336'; 
        statusText.textContent = 'Blocked';
        toggleExtensionBtn.innerHTML = '<span class="btn-text">Seite ist blockiert</span>';
    } else if (extensionState.isEnabled) {
        statusIndicator.classList.remove('disabled');
        statusIndicator.style.background = '#4caf50'; 
        statusText.textContent = 'Aktiv';
        toggleExtensionBtn.innerHTML = '<span class="btn-text">Erweiterung Deaktivieren</span>';
    } else {
        statusIndicator.classList.add('disabled');
        statusIndicator.style.background = '#f44336'; 
        statusText.textContent = 'Inaktiv';
        toggleExtensionBtn.innerHTML = '<span class="btn-text">Erweiterung Aktivieren</span>';
    }
}

function showNotification(message, type = 'info') {
    if (!document.body) {
        console.log('Document body not available, skipping notification:', message);
        return;
    }

    try {
        const notification = document.createElement('div');
        if (!notification) {
            console.log('Could not create notification element');
            return;
        }

        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            animation: slideIn 0.3s ease;
        `;

        switch (type) {
            case 'success':
                notification.style.background = '#4caf50';
                break;
            case 'error':
                notification.style.background = '#f44336';
                break;
            case 'warning':
                notification.style.background = '#ff9800';
                break;
            default:
                notification.style.background = '#4285f4';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification && notification.style) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification && notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

async function hashBaseDomain(domain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(domain);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Popup received message:', request);
    
    switch (request.action) {

    }
});

window.addEventListener('focus', async () => {
    await loadExtensionState();
    updateUI();
}); 