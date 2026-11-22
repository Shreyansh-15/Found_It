import { useEffect, useState } from 'react';

function AdminClaims() {
    const [claims, setClaims] = useState([]);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    async function loadClaims() {
        const token = localStorage.getItem('foundit_token');

        try {
            const response = await fetch(
                'https://found-it-y7ck.onrender.com/api/admin/claims',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            setClaims(data.claims);
        } catch (claimError) {
            setError(claimError.message);
        }
    }

    useEffect(() => {
        loadClaims();
    }, []);

    async function reviewClaim(claimId, decision) {
        const token = localStorage.getItem('foundit_token');

        const decisionReason = window.prompt(
            `Enter a reason for ${decision}:`
        );

        if (!decisionReason) {
            return;
        }

        try {
            const response = await fetch(
                `https://found-it-y7ck.onrender.com/api/claims/${claimId}/review`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        decision,
                        decision_reason: decisionReason
                    })
                }
            );

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            setMessage(`Claim ${decision} successfully.`);
            loadClaims();
        } catch (reviewError) {
            setError(reviewError.message);
        }
    }

    return (
        <section style={styles.container}>
            <h2>Admin Claim Reviews</h2>

            {message && (
                <p style={styles.success}>{message}</p>
            )}

            {error && (
                <p style={styles.error}>{error}</p>
            )}

            {!error && claims.length === 0 && (
                <p>No pending claims.</p>
            )}

            {claims.map((claim) => (
                <article
                    key={claim.claim_id}
                    style={styles.card}
                >
                    <h3>{claim.item_name}</h3>

                    <p>
                        <strong>Claimant:</strong>{' '}
                        {claim.claimant}
                    </p>

                    <p>
                        <strong>Explanation:</strong>{' '}
                        {claim.claim_description}
                    </p>

                    <button
                        style={styles.approve}
                        onClick={() =>
                            reviewClaim(
                                claim.claim_id,
                                'approved'
                            )
                        }
                    >
                        Approve
                    </button>

                    <button
                        style={styles.reject}
                        onClick={() =>
                            reviewClaim(
                                claim.claim_id,
                                'rejected'
                            )
                        }
                    >
                        Reject
                    </button>
                </article>
            ))}
        </section>
    );
}

const styles = {
    container: {
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
    },

    card: {
        padding: '15px',
        marginTop: '12px',
        borderRadius: '8px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0'
    },

    approve: {
        marginRight: '8px',
        padding: '8px 12px',
        border: 'none',
        borderRadius: '6px',
        backgroundColor: '#16a34a',
        color: '#ffffff',
        cursor: 'pointer'
    },

    reject: {
        padding: '8px 12px',
        border: 'none',
        borderRadius: '6px',
        backgroundColor: '#dc2626',
        color: '#ffffff',
        cursor: 'pointer'
    },

    success: {
        color: '#166534'
    },

    error: {
        color: '#b91c1c'
    }
};

export default AdminClaims;