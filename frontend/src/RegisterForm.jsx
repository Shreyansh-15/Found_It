import { useState } from 'react';

function RegisterForm({ onRegistered }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    async function handleSubmit(event) {
        event.preventDefault();

        setMessage('');
        setError('');

        try {
            const response = await fetch(
                'http://localhost:5000/api/auth/register',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        full_name: fullName,
                        email,
                        password,
                        phone
                    })
                }
            );

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            setMessage(
                'Account created successfully. You can now log in.'
            );

            setFullName('');
            setEmail('');
            setPassword('');
            setPhone('');

            if (onRegistered) {
                onRegistered();
            }
        } catch (registerError) {
            setError(registerError.message);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            style={styles.form}
        >
            <h2>Create Student Account</h2>

            <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(event) =>
                    setFullName(event.target.value)
                }
                required
            />

            <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(event) =>
                    setEmail(event.target.value)
                }
                required
            />

            <input
                type="password"
                placeholder="Create password"
                value={password}
                onChange={(event) =>
                    setPassword(event.target.value)
                }
                required
            />

            <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(event) =>
                    setPhone(event.target.value)
                }
            />

            <button
                type="submit"
                style={styles.button}
            >
                Create Account
            </button>

            {message && (
                <p style={styles.success}>{message}</p>
            )}

            {error && (
                <p style={styles.error}>{error}</p>
            )}
        </form>
    );
}

const styles = {
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '420px',
        margin: '0 auto 30px',
        padding: '22px',
        borderRadius: '14px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0'
    },

    button: {
        padding: '11px',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: '#1d4ed8',
        color: '#ffffff',
        fontWeight: 'bold',
        cursor: 'pointer'
    },

    success: {
        color: '#166534'
    },

    error: {
        color: '#b91c1c'
    }
};

export default RegisterForm;