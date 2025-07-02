var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Toggle between Login and Register is no longer needed
const authForm = document.getElementById('auth-form');
const submitBtn = document.getElementById('submit-btn');
const messageDiv = document.getElementById('message');
function validateEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
}
function validatePassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,12}$/.test(password);
}
authForm.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    messageDiv.textContent = '';
    messageDiv.style.color = '#dc3545';
    if (!validateEmail(email)) {
        messageDiv.textContent = 'Please enter a valid Gmail address (must end with @gmail.com).';
        return;
    }
    if (!validatePassword(password)) {
        messageDiv.textContent = 'Password must be 8-12 chars, include uppercase, lowercase, number, and symbol.';
        return;
    }
    try {
        const response = yield fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        const result = yield response.json();
        if (response.ok) {
            messageDiv.style.color = '#28a745';
            messageDiv.textContent = result.message;
            setTimeout(() => {
                window.location.href = 'welcome.html';
            }, 1000);
        }
        else {
            if (result.message === 'Incorrect password') {
                messageDiv.style.color = '#dc3545';
                messageDiv.textContent = 'Incorrect password';
            }
            else if (result.message === 'Invalid credentials') {
                messageDiv.style.color = '#dc3545';
                messageDiv.textContent = 'User is not registered';
            }
            else {
                messageDiv.style.color = '#dc3545';
                messageDiv.textContent = result.message;
            }
        }
    }
    catch (error) {
        messageDiv.textContent = 'Network error. Please try again.';
        console.error('API Error:', error);
    }
}));
