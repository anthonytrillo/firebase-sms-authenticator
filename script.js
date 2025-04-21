// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBRgg3wynYEn9PrNSYkbjpp5bMrOAjZOKo",
    authDomain: "phone-validation-8aa32.firebaseapp.com",
    projectId: "phone-validation-8aa32",
    storageBucket: "phone-validation-8aa32.firebasestorage.app",
    messagingSenderId: "469334748744",
    appId: "1:469334748744:web:a5dc0a55d9b2bdbdca727d",
};

firebase.initializeApp(firebaseConfig);

let countdownInterval;
let isSending = false;

function startCountdown(duration) {
    const timerDisplay = document.getElementById('timer');
    let timeRemaining = duration;

    countdownInterval = setInterval(() => {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = `Code expires in ${('0' + minutes).slice(-2)}:${('0' + seconds).slice(-2)}`;

        if (timeRemaining <= 0) {
            clearInterval(countdownInterval);
            timerDisplay.textContent = "Code expired. Please request a new one.";
        }

        timeRemaining--;
    }, 1000);
}

function render() {
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: function () {
            sendOTP();
        }
    });
}
render();

function sendOTP() {
    if (isSending) return;
    isSending = true;

    const sendButton = document.getElementById('send');
    const numberInput = document.getElementById('number');
    const rawNumber = numberInput.value.trim();
    const fullNumber = `+54${rawNumber}`;
    const errorMessage = document.getElementById('error-message');

    errorMessage.textContent = '';
    if (!/^[+]?\d+$/.test(fullNumber)) {
        errorMessage.textContent = 'Solo se permiten números en el teléfono. No incluyas espacios ni símbolos.';
        isSending = false;
        return;
    }

    sendButton.disabled = true;
    sendButton.innerHTML = `Enviando... <span class="loader" aria-hidden="true"></span>`;

    firebase.auth().signInWithPhoneNumber(fullNumber, window.recaptchaVerifier)
        .then(function (confirmationResult) {
            window.confirmationResult = confirmationResult;
            coderesult = confirmationResult;

            document.querySelector('.number-input').style.display = 'none';
            document.querySelector('.verification').style.display = '';
            document.getElementById('verificationCode').focus();
            startCountdown(300);
        })
        .catch(function (error) {
            const errorText = error.message || '';
            let message = 'Ocurrió un error. Intentá nuevamente.';

            if (errorText.includes('TOO_SHORT')) {
                message = 'El número es demasiado corto.';
            } else if (errorText.includes('TOO_LONG')) {
                message = 'El número es demasiado largo.';
            } else if (error.code === 'auth/invalid-phone-number') {
                message = 'El número ingresado no es válido.';
            }

            errorMessage.textContent = message;
        })
        .finally(() => {
            sendButton.disabled = false;
            sendButton.innerHTML = 'Verificar Número';
            isSending = false;
        });
}

function verifyCode() {
    const codeInput = document.getElementById('verificationCode');
    const code = codeInput.value;
    const errorMessage = document.getElementById('code-error-message');

    if (code === '') {
        errorMessage.textContent = 'Por favor ingresá el código de verificación.';
        codeInput.focus();
        return;
    }

    if (!/^\d+$/.test(code)) {
        errorMessage.textContent = 'Solo se permiten números.';
        codeInput.focus();
        return;
    }

    if (code.length !== 6) {
        errorMessage.textContent = code.length < 6 ? 'El código debe tener 6 dígitos.' : 'El código no puede tener más de 6 dígitos.';
        codeInput.focus();
        return;
    }

    errorMessage.textContent = '';

    coderesult.confirm(code)
        .then(function () {
            document.querySelector('.verification').style.display = 'none';
            document.querySelector('.result').style.display = '';
            document.querySelector('.correct').style.display = '';
            document.querySelector('.correct').focus();
            console.log('OTP Verified');
        })
        .catch(function (error) {
            const incorrectBlock = document.querySelector('.incorrect');
            const errorMessageBlock = document.getElementById('verification-error-message');
            let message = 'El código ingresado no es correcto. Intentá nuevamente.';

            switch (error.code) {
                case 'auth/invalid-verification-code':
                    message = 'El código ingresado no es válido o está mal escrito.';
                    break;
                case 'auth/code-expired':
                    message = 'El código expiró. Solicitá uno nuevo.';
                    break;
                case 'auth/missing-verification-code':
                    message = 'Por favor, ingresá el código que recibiste por SMS.';
                    break;
            }

            document.querySelector('.verification').style.display = 'none';
            document.querySelector('.result').style.display = '';
            incorrectBlock.style.display = '';

            if (!errorMessageBlock) {
                const div = document.createElement('div');
                div.id = 'verification-error-message';
                div.style.color = 'red';
                div.style.marginTop = '10px';
                div.setAttribute('aria-live', 'assertive');
                div.textContent = message;
                incorrectBlock.appendChild(div);
            } else {
                errorMessageBlock.textContent = message;
            }

            document.querySelector('.incorrect button').focus();
        });
}

document.getElementById('verificationCode').addEventListener('input', function () {
    const code = this.value;
    const verifyBtn = document.getElementById('verify');
    const errorMessage = document.getElementById('code-error-message');

    verifyBtn.disabled = true;
    errorMessage.textContent = '';

    if (code === '') {
        errorMessage.textContent = 'Por favor ingresá el código de verificación.';
    } else if (!/^\d+$/.test(code)) {
        errorMessage.textContent = 'Solo se permiten números.';
    } else if (code.length < 6) {
        errorMessage.textContent = 'El código debe tener 6 dígitos.';
    } else if (code.length > 6) {
        errorMessage.textContent = 'El código no puede tener más de 6 dígitos.';
    } else {
        verifyBtn.disabled = false;
    }
});

document.getElementById('number').addEventListener('input', function () {
    this.value = this.value.replace(/[^\d]/g, '');
});