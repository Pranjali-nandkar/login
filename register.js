var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('register-form');
    const messageDiv = document.getElementById('message');
    const passwordInput = document.getElementById('password');
    function validateEmail(email) {
        return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
    }
    function validatePassword(password) {
        // Minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 symbol
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
    }
    function getPasswordStrength(password) {
        if (password.length < 8) {
            return { isValid: false, message: 'Password must be at least 8 characters long' };
        }
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSymbols = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
        const missing = [];
        if (!hasUpperCase)
            missing.push('uppercase letter');
        if (!hasLowerCase)
            missing.push('lowercase letter');
        if (!hasNumbers)
            missing.push('number');
        if (!hasSymbols)
            missing.push('symbol');
        if (missing.length > 0) {
            return {
                isValid: false,
                message: `Password must contain at least one ${missing.join(', ')}`
            };
        }
        return { isValid: true, message: 'Password meets all requirements ✓' };
    }
    // Real-time password validation
    passwordInput.addEventListener('input', function () {
        const password = this.value;
        const strength = getPasswordStrength(password);
        if (password.length > 0) {
            messageDiv.textContent = strength.message;
            messageDiv.style.color = strength.isValid ? '#28a745' : '#dc3545';
        }
        else {
            messageDiv.textContent = '';
        }
    });
    registerForm.addEventListener('submit', function (e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            messageDiv.textContent = '';
            messageDiv.style.color = '#dc3545';
            if (!firstName || !lastName) {
                messageDiv.textContent = 'First and last name are required.';
                return;
            }
            if (!validateEmail(email)) {
                messageDiv.textContent = 'Please enter a valid Gmail address (must end with @gmail.com).';
                return;
            }
            const passwordStrength = getPasswordStrength(password);
            if (!passwordStrength.isValid) {
                messageDiv.textContent = passwordStrength.message;
                return;
            }
            try {
                const response = yield fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firstName, lastName, email, password })
                });
                const result = yield response.json();
                if (response.ok) {
                    messageDiv.style.color = '#28a745';
                    messageDiv.textContent = result.message;
                }
                else {
                    messageDiv.textContent = result.message;
                }
            }
            catch (error) {
                messageDiv.textContent = 'Network error. Please try again.';
                console.error('API Error:', error);
            }
        });
    });
});
