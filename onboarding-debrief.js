document.addEventListener('DOMContentLoaded', () => {
    const goBackBtn = document.getElementById('goBackBtn');
    const continueBtn = document.getElementById('continueBtn');
    const contentStep1 = document.getElementById('contentStep1');
    const contentStep2 = document.getElementById('contentStep2');

    let step = 1;

    function renderStep() {
        if (step === 1) {
            contentStep1.style.display = '';
            contentStep2.style.display = 'none';
            continueBtn.textContent = 'Weiter';
            goBackBtn.textContent = 'Zurück';
        } else {
            contentStep1.style.display = 'none';
            contentStep2.style.display = '';
            continueBtn.textContent = 'Fortfahren';
            goBackBtn.textContent = 'Zurück';
        }
    }

    goBackBtn.addEventListener('click', () => {
        if (step === 2) {
            step = 1;
            renderStep();
        } else {
            window.close();
        }
    });

    continueBtn.addEventListener('click', () => {
        if (step === 1) {
            step = 2;
            renderStep();
        } else {
            chrome.storage.local.set({
                debriefCompleted: true,
                onboardingStep: 'debrief-completed'
            }, () => {
                window.close();
            });
        }
    });

    try {
        chrome.storage.local.get(['simplifyApiKey', 'onboardingCompleted', 'onboardingStep'], (res) => {
            const loginDone = Boolean(res?.simplifyApiKey) || res?.onboardingCompleted === true || res?.onboardingStep === 'login-completed';
            if (loginDone && goBackBtn) {
                goBackBtn.style.display = 'none';
            }
        });
    } catch (_) {}

    renderStep();
});