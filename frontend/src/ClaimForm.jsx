import { useState } from 'react';

function ClaimForm({ itemId, onSubmitted }) {
    const [claimDescription, setClaimDescription] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setMessage('');
        setError('');

        const token = localStorage.getItem('foundit_token');

        try {
            const response = await fetch(
                `https://found-it-y7ck.onrender.com/api/items/${itemId}/claims`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        claim_description: claimDescription
                    })
                }
            );

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            setMessage('Claim submitted successfully.');
            setClaimDescription('');

            if (onSubmitted) {
                onSubmitted();
            }
        } catch (submitError) {
            setError(submitError.message);
        }
    }

    return (
        <div style={styles.container}>
            {!showForm && (
                <button
                    type="button"
                    style={styles.button}
                    onClick={() => setShowForm(true)}
                >
                    Claim This Item
                </button>
            )}

            {showForm && (
                <form onSubmit={handleSubmit}>
                    <textarea
                        placeholder="Explain why this item belongs to you"
                        value={claimDescription}
                        onChange={(event) =>
                            setClaimDescription(event.target.value)
                        }
                        required
                    />

                    <button type="submit" style={styles.button}>
                        Submit Claim
                    </button>

                    <button
                        type="button"
                        style={styles.cancelButton}
                        onClick={() => setShowForm(false)}
                    >
                        Cancel
                    </button>
                </form>
            )}

            {message && (
                <p style={styles.success}>{message}</p>
            )}

            {error && (
                <p style={styles.error}>{error}</p>
            )}
        </div>
    );
}

const styles = {
    container: {
        marginTop: '15px'
    },

    button: {
        backgroundColor: '#1e3a8a',
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 12px',
        cursor: 'pointer'
    },

    cancelButton: {
        marginLeft: '8px',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #64748b',
        backgroundColor: '#ffffff',
        cursor: 'pointer'
    },

    success: {
        color: '#166534'
    },

    error: {
        color: '#b91c1c'
    }
};

export default ClaimForm;