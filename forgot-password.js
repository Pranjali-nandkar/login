document.addEventListener('DOMContentLoaded', function () {
    const forgotForm = document.getElementById('forgot-form');
    const messageDiv = document.getElementById('message');

    function validateEmail(email) {
        return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
    }

    forgotForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        messageDiv.textContent = '';
        messageDiv.style.color = '#dc3545';

        if (!email) {
            messageDiv.textContent = 'Please enter your email address.';
            return;
        }

        if (!validateEmail(email)) {
            messageDiv.textContent = 'Please enter a valid Gmail address (must end with @gmail.com).';
            return;
        }

        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (response.ok) {
                messageDiv.style.color = '#28a745';
                messageDiv.textContent = result.message;
                
                // Show the reset token for demo purposes (remove in production)
                if (result.resetToken) {
                    messageDiv.innerHTML += `<br><br><strong>Demo Reset Token:</strong><br><code style="background: #f8f9fa; padding: 5px; border-radius: 3px;">${result.resetToken}</code><br><br><a href="${result.resetUrl}" style="color: #4b2aad;">Click here to reset password</a>`;
                }
            } else {
                messageDiv.textContent = result.message;
            }
        } catch (error) {
            messageDiv.textContent = 'Network error. Please try again.';
            console.error('API Error:', error);
        }
    });
}); 