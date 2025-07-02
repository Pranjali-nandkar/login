document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('register-form') as HTMLFormElement;
    const messageDiv = document.getElementById('message') as HTMLDivElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;

    function validateEmail(email: string): boolean {
        return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
    }

    function validatePassword(password: string): boolean {
        // Minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 symbol
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
    }

    function getPasswordStrength(password: string): { isValid: boolean; message: string } {
        if (password.length < 8) {
            return { isValid: false, message: 'Password must be at least 8 characters long' };
        }
        
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSymbols = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
        
        const missing = [];
        if (!hasUpperCase) missing.push('uppercase letter');
        if (!hasLowerCase) missing.push('lowercase letter');
        if (!hasNumbers) missing.push('number');
        if (!hasSymbols) missing.push('symbol');
        
        if (missing.length > 0) {
            return { 
                isValid: false, 
                message: `Password must contain at least one ${missing.join(', ')}` 
            };
        }
        
        return { isValid: true, message: 'Password meets all requirements ✓' };
    }

    // Real-time password validation
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = getPasswordStrength(password);
        
        if (password.length > 0) {
            messageDiv.textContent = strength.message;
            messageDiv.style.color = strength.isValid ? '#28a745' : '#dc3545';
        } else {
            messageDiv.textContent = '';
        }
    });

    registerForm.addEventListener('submit', async function (e: Event) {
        e.preventDefault();
        const firstName = (document.getElementById('firstName') as HTMLInputElement).value.trim();
        const lastName = (document.getElementById('lastName') as HTMLInputElement).value.trim();
        const email = (document.getElementById('email') as HTMLInputElement).value.trim();
        const password = (document.getElementById('password') as HTMLInputElement).value;
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
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ firstName, lastName, email, password })
            });
            const result = await response.json();
            if (response.ok) {
                messageDiv.style.color = '#28a745';
                messageDiv.textContent = result.message;
            } else {
                messageDiv.textContent = result.message;
            }
        } catch (error) {
            messageDiv.textContent = 'Network error. Please try again.';
            console.error('API Error:', error);
        }
    });
}); 