document.addEventListener('DOMContentLoaded', function () {
    const resetForm = document.getElementById('reset-form');
    const messageDiv = document.getElementById('message');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const timerDiv = document.getElementById('timer');
    const resendLinkDiv = document.getElementById('resend-link');

    // Get token and expiry from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    // Optionally, you could pass expiry as a param, but we'll default to 60 seconds from now
    const TOKEN_VALIDITY_MS = 60 * 1000; // 60 seconds
    const tokenCreatedAt = Date.now();
    const tokenExpiresAt = tokenCreatedAt + TOKEN_VALIDITY_MS;

    // Timer logic
    function updateTimer() {
        const now = Date.now();
        const diff = tokenExpiresAt - now;
        if (diff <= 0) {
            timerDiv.textContent = 'Reset link expired!';
            resetForm.style.display = 'none';
            resendLinkDiv.style.display = 'block';
            return;
        }
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        timerDiv.textContent = `Link expires in ${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;
        setTimeout(updateTimer, 1000);
    }
    updateTimer();

    if (!token) {
        messageDiv.style.color = '#dc3545';
        messageDiv.textContent = 'Invalid reset link. Please request a new password reset.';
        resetForm.style.display = 'none';
        timerDiv.style.display = 'none';
        return;
    }

    function validatePassword(password) {
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
    newPasswordInput.addEventListener('input', function () {
        const password = this.value;
        const strength = getPasswordStrength(password);
        if (password.length > 0) {
            messageDiv.textContent = strength.message;
            messageDiv.style.color = strength.isValid ? '#28a745' : '#dc3545';
        } else {
            messageDiv.textContent = '';
        }
    });

    resetForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        messageDiv.textContent = '';
        messageDiv.style.color = '#dc3545';

        if (!newPassword || !confirmPassword) {
            messageDiv.textContent = 'Please fill in all fields.';
            return;
        }

        if (newPassword !== confirmPassword) {
            messageDiv.textContent = 'Passwords do not match.';
            return;
        }

        const passwordStrength = getPasswordStrength(newPassword);
        if (!passwordStrength.isValid) {
            messageDiv.textContent = passwordStrength.message;
            return;
        }

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    token: token,
                    newPassword: newPassword 
                })
            });

            const result = await response.json();

            if (response.ok) {
                messageDiv.style.color = '#28a745';
                messageDiv.textContent = result.message;
                
                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                messageDiv.textContent = result.message;
            }
        } catch (error) {
            messageDiv.textContent = 'Network error. Please try again.';
            console.error('API Error:', error);
        }
    });
}); 