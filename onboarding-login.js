document.addEventListener('DOMContentLoaded', () => {
    const oneTimeKeyHiddenInput = document.getElementById('oneTimeKey');
    const keySegmentInputs = [
        document.getElementById('oneTimeKey1'),
        document.getElementById('oneTimeKey2'),
        document.getElementById('oneTimeKey3')
    ].filter(Boolean);
    const userIdInput = document.getElementById('userId');
    const goBackBtn = document.getElementById('goBackBtn');
    const finishBtn = document.getElementById('finishBtn');
    const errorMessage = document.getElementById('errorMessage');
    const toggleKeyVisibilityBtn = document.getElementById('toggleKeyVisibility');

    let isLoading = false;

    function sanitizeKeyPart(part) {
        return part.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 4);
    }

    function combineSegments() {
        const parts = keySegmentInputs.map(input => (input.value || '').toUpperCase());
        return parts.join('-');
    }

    function syncHiddenAndButtons() {
        if (oneTimeKeyHiddenInput) {
            oneTimeKeyHiddenInput.value = combineSegments();
        }
        updateButtonState();
    }

    const updateButtonState = () => {
        const key = (oneTimeKeyHiddenInput ? oneTimeKeyHiddenInput.value : combineSegments()).trim();
        const uid = (userIdInput ? userIdInput.value : '').trim();
        const validUid = /^\d{6}$/.test(uid);
        finishBtn.disabled = isLoading || key.length === 0 || !validUid;
        if (key.length > 0 && validUid) {
            errorMessage.style.display = 'none';
        }
    };

    keySegmentInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const original = input.value;
            let sanitized = sanitizeKeyPart(original);

            if (original.length > 4) {
                const extra = sanitizeKeyPart(original);
                sanitized = extra.slice(0, 4);
                const overflow = extra.slice(4);
                input.value = sanitized;
                // distribute overflow to subsequent fields
                if (overflow && index < keySegmentInputs.length - 1) {
                    let remaining = overflow;
                    for (let i = index + 1; i < keySegmentInputs.length && remaining.length > 0; i++) {
                        const target = keySegmentInputs[i];
                        const capacity = 4 - target.value.length;
                        const chunk = remaining.slice(0, capacity);
                        target.value = sanitizeKeyPart((target.value + chunk));
                        remaining = remaining.slice(chunk.length);
                    }
                }
            } else {
                input.value = sanitized;
            }

            // auto-advance when full
            if (input.value.length === 4 && index < keySegmentInputs.length - 1) {
                keySegmentInputs[index + 1].focus();
                keySegmentInputs[index + 1].select();
            }
            syncHiddenAndButtons();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && input.selectionStart === 0 && input.selectionEnd === 0) {
                if (index > 0 && input.value.length === 0) {
                    e.preventDefault();
                    const prev = keySegmentInputs[index - 1];
                    prev.focus();
                    prev.setSelectionRange(Math.max(0, prev.value.length), Math.max(0, prev.value.length));
                }
            }
            if (e.key === 'ArrowLeft' && input.selectionStart === 0) {
                if (index > 0) {
                    const prev = keySegmentInputs[index - 1];
                    prev.focus();
                    prev.setSelectionRange(Math.max(0, prev.value.length), Math.max(0, prev.value.length));
                }
            }
            if (e.key === 'ArrowRight' && input.selectionStart === input.value.length) {
                if (index < keySegmentInputs.length - 1) {
                    const next = keySegmentInputs[index + 1];
                    next.focus();
                    next.setSelectionRange(0, 0);
                }
            }
            if (e.key === 'Enter' && !finishBtn.disabled) {
                finishBtn.click();
            }
        });

        input.addEventListener('paste', (e) => {
            const text = (e.clipboardData || window.clipboardData).getData('text');
            if (!text) return;
            e.preventDefault();

            const cleaned = text.replace(/[^a-z0-9]/gi, '').toUpperCase();
            if (cleaned.length === 0) return;

            let remaining = cleaned;
            // fill current and subsequent
            for (let i = index; i < keySegmentInputs.length && remaining.length > 0; i++) {
                const target = keySegmentInputs[i];
                const capacity = 4;
                const chunk = remaining.slice(0, capacity);
                target.value = chunk.slice(0, 4);
                remaining = remaining.slice(chunk.length);
            }
            // focus last filled or next empty
            let focusIndex = index;
            for (let i = index; i < keySegmentInputs.length; i++) {
                if (keySegmentInputs[i].value.length < 4) { focusIndex = i; break; }
                focusIndex = i;
            }
            keySegmentInputs[focusIndex].focus();
            keySegmentInputs[focusIndex].select();
            syncHiddenAndButtons();
        });
    });

    if (userIdInput) userIdInput.addEventListener('input', updateButtonState);

    if (toggleKeyVisibilityBtn) {
        toggleKeyVisibilityBtn.addEventListener('click', () => {
            const isPassword = keySegmentInputs[0] && keySegmentInputs[0].type === 'password';
            const newType = isPassword ? 'text' : 'password';
            keySegmentInputs.forEach(inp => { inp.type = newType; });
            toggleKeyVisibilityBtn.textContent = isPassword ? 'Verbergen' : 'Anzeigen';
            toggleKeyVisibilityBtn.setAttribute('aria-pressed', String(isPassword));
            if (keySegmentInputs[0]) keySegmentInputs[0].focus();
        });
    }

    // init sync
    syncHiddenAndButtons();

    goBackBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'onboarding-debrief.html' });
        window.close();
    });

    finishBtn.addEventListener('click', async () => {
        let oneTimeKey = combineSegments().trim();
        const userId = (userIdInput ? userIdInput.value : '').trim();
        if (oneTimeKey.length === 0) {
            showError('Bitte geben Sie Ihren einmaligen Onboarding‑Schlüssel ein.');
            return;
        }
        if (!/^\d{6}$/.test(userId)) {
            showError('Bitte geben Sie Ihre 6‑stellige Teilnehmer‑ID ein.');
            return;
        }
        oneTimeKey = oneTimeKey.toUpperCase();
        setLoading(true);
        try {
            const response = await fetch(`${SERVER_URL}/exchange-key`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, oneTimeKey })
            });
            const data = await response.json();
            if (data.apiKey) {
                chrome.storage.local.set({
                    simplifyApiKey: data.apiKey,
                    userId: data.userId || userId,
                    onboardingCompleted: true,
                    onboardingStep: 'login-completed',
                    oneTimeKey: oneTimeKey
                }, () => {
                    chrome.tabs.create({ url: 'onboarding-debrief.html' });
                    window.close();
                });
            } else {
                showError(data.error || 'Der eingegebene Onboarding‑Schlüssel wurde nicht erkannt. Bitte prüfen Sie die Schreibweise (Groß-/Kleinschreibung, keine Leerzeichen) oder versuchen Sie es erneut.');
                setLoading(false);
            }
        } catch (err) {
            showError('Netzwerkfehler: Die Anmeldung konnte nicht geprüft werden. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.');
            setLoading(false);
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function setLoading(loading) {
        isLoading = loading;
        const uid = (userIdInput ? userIdInput.value : '').trim();
        const validUid = /^\d{6}$/.test(uid);
        const currentKey = combineSegments().trim();
        finishBtn.disabled = loading || currentKey.length === 0 || !validUid;
        finishBtn.textContent = loading ? 'Prüfe…' : 'Abschließen';
        if (oneTimeKeyHiddenInput) oneTimeKeyHiddenInput.disabled = loading;
        keySegmentInputs.forEach(inp => { inp.disabled = loading; });
        if (userIdInput) userIdInput.disabled = loading;
    }
});