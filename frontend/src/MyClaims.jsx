import { useEffect, useState } from 'react';

function MyClaims() {
    const [claims, setClaims] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadClaims() {
            const token = localStorage.getItem('foundit_token');

            try {
                const response = await fetch(
                    'http://localhost:5000/api/my-claims',
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

        loadClaims();
    }, []);

    return (
        <section style={styles.container}>
            <h2>My Claims</h2>

            {error && (
                <p style={styles.error}>{error}</p>
            )}

            {!error && claims.length === 0 && (
                <p>You have not submitted any claims yet.</p>
            )}

            {claims.map((claim) => (
                <article
                    key={claim.claim_id}
                    style={styles.card}
                >
                    <h3>{claim.item_name}</h3>

                    <p>
                        <strong>Claim:</strong>{' '}
                        {claim.claim_description}
                    </p>

                    <p>
                        <strong>Status:</strong>{' '}
                        {claim.status}
                    </p>

                    <p>
                        <strong>Submitted:</strong>{' '}
                        {new Date(
                            claim.submitted_at
                        ).toLocaleDateString()}
                    </p>
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

    error: {
        color: '#b91c1c'
    }
};

export default MyClaims;