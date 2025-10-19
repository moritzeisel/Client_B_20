const defaultOptions = {
    autoStart: false
};

const DEFAULT_BLACKLIST = [

];



const saveOptionsBtn = document.getElementById('saveOptions');
const resetOptionsBtn = document.getElementById('resetOptions');
const statusMessage = document.getElementById('statusMessage');

const blacklistInput = document.getElementById('blacklistInput');
const addToBlacklistBtn = document.getElementById('addToBlacklist');
const blacklistItems = document.getElementById('blacklistItems');
const resetBlacklistBtn = document.getElementById('resetBlacklist');
const exportBlacklistBtn = document.getElementById('exportBlacklist');
const importBlacklistBtn = document.getElementById('importBlacklist');
const exportDataCsvBtn = document.getElementById('exportDataCsv');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Options page initialized');
    
    await loadOptions();
    
    await loadBlacklist();
    
    setupEventListeners();
    
    showStatusMessage('Optionen geladen', 'success');
});

async function loadOptions() {
    try {
        const result = await chrome.storage.sync.get(defaultOptions);
        
        Object.keys(defaultOptions).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = result[key] || defaultOptions[key];
                } else {
                    element.value = result[key] || defaultOptions[key];
                }
            }
        });
        
        console.log('Options loaded:', result);
    } catch (error) {
        console.error('Error loading options:', error);
        showStatusMessage('Error loading options', 'error');
    }
}

async function saveOptions() {
    try {
        const originalText = saveOptionsBtn ? saveOptionsBtn.textContent : '';
        if (saveOptionsBtn) {
            saveOptionsBtn.disabled = true;
            saveOptionsBtn.textContent = 'Speichern…';
        }
        const options = {};
        
        Object.keys(defaultOptions).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    options[key] = element.checked;
                } else {
                    options[key] = element.value;
                }
            }
        });
        
        await chrome.storage.sync.set(options);
        
        await chrome.runtime.sendMessage({
            action: 'optionsUpdated',
            options: options
        });
        
        console.log('Options saved:', options);
        showStatusMessage('Einstellungen gespeichert', 'success');
        if (saveOptionsBtn) {
            saveOptionsBtn.textContent = 'Gespeichert ✓';
            setTimeout(() => {
                saveOptionsBtn.textContent = originalText || 'Einstellungen speichern';
                saveOptionsBtn.disabled = false;
            }, 1200);
        }
        
    } catch (error) {
        console.error('Error saving options:', error);
        showStatusMessage('Fehler beim Speichern der Einstellungen', 'error');
        if (saveOptionsBtn) {
            saveOptionsBtn.textContent = 'Fehler';
            setTimeout(() => {
                saveOptionsBtn.textContent = 'Einstellungen speichern';
                saveOptionsBtn.disabled = false;
            }, 1500);
        }
    }
}

async function resetOptions() {
    try {
        Object.keys(defaultOptions).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = defaultOptions[key];
                } else {
                    element.value = defaultOptions[key];
                }
            }
        });
        
        await chrome.storage.sync.set(defaultOptions);
        
        console.log('Options reset to defaults');
        showStatusMessage('Options reset to defaults', 'success');
        
    } catch (error) {
        console.error('Error resetting options:', error);
        showStatusMessage('Error resetting options', 'error');
    }
}






async function loadBlacklist() {
    try {
        const result = await chrome.storage.local.get(['blacklist']);
        const userBlacklist = result.blacklist || DEFAULT_BLACKLIST;
        
        displayBlacklist(userBlacklist);
        return userBlacklist;
    } catch (error) {
        console.error('Error loading blacklist:', error);
        showStatusMessage('Error loading blacklist', 'error');
        return DEFAULT_BLACKLIST;
    }
}

async function saveBlacklist(blacklist) {
    try {
        await chrome.storage.local.set({ blacklist: blacklist });
        console.log('Blacklist saved:', blacklist);
        showStatusMessage('Blacklist saved successfully', 'success');
    } catch (error) {
        console.error('Error saving blacklist:', error);
        showStatusMessage('Error saving blacklist', 'error');
    }
}

function displayBlacklist(blacklist) {
    blacklistItems.innerHTML = '';
    
    if (blacklist.length === 0) {
        blacklistItems.innerHTML = '<div style="color: #888; font-style: italic;">No items in blacklist</div>';
        return;
    }
    
    blacklist.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'blacklist-item user-item';
        
        itemDiv.innerHTML = `
            <span>${item}</span>
            <button class="remove-btn" style="background: #f44336; color: white; border: none; border-radius: 3px; padding: 2px 6px; font-size: 12px; cursor: pointer;">×</button>
        `;
        
        itemDiv.addEventListener('mouseenter', () => {
            itemDiv.style.backgroundColor = '';
        });
        
        itemDiv.addEventListener('mouseleave', () => {
            itemDiv.style.backgroundColor = '';
        });
        
        itemDiv.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                removeFromBlacklist(index);
            }
        });
        
        blacklistItems.appendChild(itemDiv);
    });
}

async function addToBlacklist() {
    const value = blacklistInput.value.trim();
    if (!value) {
        showStatusMessage('Please enter a URL or pattern', 'error');
        return;
    }
    
    try {
        const result = await chrome.storage.local.get(['blacklist']);
        const blacklist = result.blacklist || DEFAULT_BLACKLIST;
        
        if (blacklist.includes(value)) {
            showStatusMessage('Item already exists in blacklist', 'error');
            return;
        }
        

        
        blacklist.push(value);
        await saveBlacklist(blacklist);
        displayBlacklist(blacklist);
        blacklistInput.value = '';
        showStatusMessage('Item added to blacklist', 'success');
        
    } catch (error) {
        console.error('Error adding to blacklist:', error);
        showStatusMessage('Error adding to blacklist', 'error');
    }
}

async function removeFromBlacklist(index) {
    try {
        const result = await chrome.storage.local.get(['blacklist']);
        const blacklist = result.blacklist || DEFAULT_BLACKLIST;
        
        blacklist.splice(index, 1);
        await saveBlacklist(blacklist);
        displayBlacklist(blacklist);
        
    } catch (error) {
        console.error('Error removing from blacklist:', error);
        showStatusMessage('Error removing from blacklist', 'error');
    }
}

async function resetBlacklist() {
    try {
        await saveBlacklist(DEFAULT_BLACKLIST);
        displayBlacklist(DEFAULT_BLACKLIST);
        showStatusMessage('Blacklist reset to defaults', 'success');
    } catch (error) {
        console.error('Error resetting blacklist:', error);
        showStatusMessage('Error resetting blacklist', 'error');
    }
}

function exportBlacklist() {
    try {
        chrome.storage.local.get(['blacklist'], (result) => {
            const blacklist = result.blacklist || DEFAULT_BLACKLIST;
            
            const exportData = {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                type: 'blacklist',
                blacklist: blacklist
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `blacklist-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showStatusMessage('Blacklist exported successfully', 'success');
        });
    } catch (error) {
        console.error('Error exporting blacklist:', error);
        showStatusMessage('Error exporting blacklist', 'error');
    }
}

function importBlacklist() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const importData = JSON.parse(text);
                
                if (!importData.blacklist || importData.type !== 'blacklist') {
                    throw new Error('Invalid blacklist file format');
                }
                
                await saveBlacklist(importData.blacklist);
                displayBlacklist(importData.blacklist);
                showStatusMessage('Blacklist imported successfully', 'success');
                
            } catch (error) {
                console.error('Error importing blacklist:', error);
                showStatusMessage('Error importing blacklist: Invalid file format', 'error');
            }
        });
        
        input.click();
    } catch (error) {
        console.error('Error setting up blacklist import:', error);
        showStatusMessage('Error setting up blacklist import', 'error');
    }
}

function setupEventListeners() {
    saveOptionsBtn.addEventListener('click', saveOptions);
    
    resetOptionsBtn.addEventListener('click', resetOptions);
    
    addToBlacklistBtn.addEventListener('click', addToBlacklist);
    resetBlacklistBtn.addEventListener('click', resetBlacklist);
    exportBlacklistBtn.addEventListener('click', exportBlacklist);
    importBlacklistBtn.addEventListener('click', importBlacklist);
    if (exportDataCsvBtn) exportDataCsvBtn.addEventListener('click', exportCollectedDataCsv);
    
    blacklistInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addToBlacklist();
        }
    });
    
    const autoSaveInputs = document.querySelectorAll('input, select, textarea');
    autoSaveInputs.forEach(input => {
        input.addEventListener('change', () => {
            clearTimeout(input.autoSaveTimeout);
            input.autoSaveTimeout = setTimeout(() => {
                saveOptions();
            }, 1000);
        });
    });
}
function escapeCsvValue(value) {
    if (value == null) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function toCsv(rows) {
    if (!rows || rows.length === 0) return '';
    const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r)))).sort();
    const lines = [];
    lines.push(headers.map(h => escapeCsvValue(h)).join(','));
    for (const row of rows) {
        const line = headers.map(h => escapeCsvValue(row[h]));
        lines.push(line.join(','));
    }
    return lines.join('\n');
}

function exportCollectedDataCsv() {
    try {
        chrome.storage.local.get(['experienceSamplingResponses', 'rawDataEvents'], (res) => {
            const esm = res.experienceSamplingResponses || [];
            const raw = res.rawDataEvents || [];
            console.log('Export requested. Counts:', { esm: esm.length, raw: raw.length });
            if ((esm.length + raw.length) === 0) {
                showStatusMessage('Keine Daten vorhanden – nichts zu exportieren', 'info');
                return;
            }
            const flattenedEsm = esm.map(e => {
                const flat = { ...e };
                if (flat.answers && typeof flat.answers === 'object' && !Array.isArray(flat.answers)) {
                    Object.entries(flat.answers).forEach(([k, v]) => {
                        flat['answers_' + k] = v;
                    });
                    delete flat.answers;
                }
                if (Array.isArray(flat.answers)) {
                    flat.answers = flat.answers.join(' | ');
                }
                if (flat.base_url_hash == null && flat.page_url_hash != null) {
                    flat.base_url_hash = flat.page_url_hash;
                }
                if (Object.prototype.hasOwnProperty.call(flat, 'api_key')) {
                    delete flat.api_key;
                }
                return flat;
            });
            const merged = [
                ...flattenedEsm.map(r => ({ dataset: 'esm', ...r })),
                ...raw.map(r => ({ dataset: 'raw', ...r }))
            ];
            const csv = toCsv(merged);
            const bom = '\uFEFF';
            const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `simplify-data-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            chrome.storage.local.set({ experienceSamplingResponses: [], rawDataEvents: [] }, () => {
                showStatusMessage(`Daten exportiert (${merged.length} Zeilen) und lokal gelöscht`, 'success');
            });
        });
    } catch (error) {
        console.error('Error exporting collected data:', error);
        showStatusMessage('Fehler beim Exportieren der Daten', 'error');
    }
}

function showStatusMessage(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 5000);
}

function validateOptions(options) {
    const errors = [];
    
    
    return errors;
}



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Options page received message:', request);
    
    switch (request.action) {
        case 'getOptions':
            const options = {};
            Object.keys(defaultOptions).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        options[key] = element.checked;
                    } else {
                        options[key] = element.value;
                    }
                }
            });
            sendResponse(options);
            break;
            
        case 'updateOptions':
            if (request.options) {
                Object.keys(request.options).forEach(key => {
                    const element = document.getElementById(key);
                    if (element && defaultOptions.hasOwnProperty(key)) {
                        if (element.type === 'checkbox') {
                            element.checked = request.options[key];
                        } else {
                            element.value = request.options[key];
                        }
                    }
                });
                saveOptions();
            }
            break;
    }
});

window.addEventListener('beforeunload', () => {
    saveOptions();
}); 