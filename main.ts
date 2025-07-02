// Toggle between Login and Register is no longer needed
const authForm = document.getElementById('auth-form') as HTMLFormElement;
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
const messageDiv = document.getElementById('message') as HTMLElement;

function validateEmail(email: string): boolean {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
}

function validatePassword(password: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,12}$/.test(password);
}

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('password') as HTMLInputElement).value;
    messageDiv.textContent = '';
    messageDiv.style.color = '#dc3545';

    if (!validateEmail(email)) {
        messageDiv.textContent = 'Please enter a valid Gmail address (must end with @gmail.com).';
        return;
    }
    // Removed password validation for login page
    /*
    if (!validatePassword(password)) {
        messageDiv.textContent = 'Password must be 8-12 chars, include uppercase, lowercase, number, and symbol.';
        return;
    }
    */

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json();
        if (response.ok) {
            messageDiv.style.color = '#28a745';
            messageDiv.textContent = result.message;
            setTimeout(() => {
                window.location.href = 'welcome.html';
            }, 1000);
        } else {
            if (result.message === 'Incorrect password') {
                messageDiv.style.color = '#dc3545';
                messageDiv.textContent = 'Incorrect password';
            } else if (result.message === 'Invalid credentials') {
                messageDiv.style.color = '#dc3545';
                messageDiv.textContent = 'User is not registered';
            } else {
                messageDiv.style.color = '#dc3545';
                messageDiv.textContent = result.message;
            }
        }
    } catch (error) {
        messageDiv.textContent = 'Network error. Please try again.';
        console.error('API Error:', error);
    }
}); 