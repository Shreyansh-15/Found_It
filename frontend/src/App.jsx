import { useEffect, useState } from 'react';
import ReportForm from './ReportForm';
import ClaimForm from './ClaimForm';
import MyClaims from './MyClaims';
import AdminClaims from './AdminClaims';
import RegisterForm from './RegisterForm';

function App() {
    const [items, setItems] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [loggedInUser, setLoggedInUser] = useState(() => {
        const savedUser = localStorage.getItem('foundit_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [showRegister, setShowRegister] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        loadItems();
    }, [filter]);

    async function loadItems() {
        try {
            setLoading(true);
            setError('');

            const url =
                filter === 'all'
                    ? 'https://found-it-y7ck.onrender.com/api/items'
                    : `https://found-it-y7ck.onrender.com/api/items?report_type=${filter}`;

            const response = await fetch(url);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            setItems(data.items);
        } catch (loadError) {
            setError(loadError.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleLogin(event) {
        event.preventDefault();
        setLoginError('');

        try {
            const response = await fetch(
                'https://found-it-y7ck.onrender.com/api/auth/login',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            localStorage.setItem('foundit_token', data.token);
            localStorage.setItem(
                'foundit_user',
                JSON.stringify(data.user)
            );

            setLoggedInUser(data.user);
            setEmail('');
            setPassword('');
        } catch (loginErrorMessage) {
            setLoginError(loginErrorMessage.message);
        }
    }

    function handleLogout() {
        localStorage.removeItem('foundit_token');
        localStorage.removeItem('foundit_user');
        setLoggedInUser(null);
    }

    return (
        <main style={styles.page}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.logo}>FoundIt</h1>
                    <p style={styles.subtitle}>
                        Smart Campus Lost and Found
                    </p>
                </div>

                {loggedInUser ? (
                    <div style={styles.userArea}>
                        <span>
                            Welcome, {loggedInUser.full_name}
                        </span>

                        <button
                            style={styles.logoutButton}
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <div style={styles.authArea}>
                        {!showRegister && (
                            <>
                                <form
                                    onSubmit={handleLogin}
                                    style={styles.loginForm}
                                >
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        required
                                    />

                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        required
                                    />

                                    <button
                                        type="submit"
                                        style={styles.loginButton}
                                    >
                                        Login
                                    </button>
                                </form>

                                <button
                                    style={styles.registerLink}
                                    onClick={() => setShowRegister(true)}
                                >
                                    Create Account
                                </button>
                            </>
                        )}

                        {showRegister && (
                            <button
                                style={styles.registerLink}
                                onClick={() => setShowRegister(false)}
                            >
                                Back to Login
                            </button>
                        )}
                    </div>
                )}
            </header>

            {loginError && (
                <p style={styles.error}>{loginError}</p>
            )}

            <section style={styles.hero}>
                <div style={styles.heroContent}>
                    <div style={styles.statusPill}>
                        <span style={styles.statusDot}></span>
                        CAMPUS COMMUNITY ACTIVE
                    </div>

                    <h2 style={styles.heroTitle}>
                        Lost it?
                        <br />
                        <span style={styles.heroAccent}>
                            Find it.
                        </span>
                    </h2>

                    <p style={styles.heroText}>
                        A smarter way for the UPES community to
                        report, discover, and recover belongings.
                    </p>

                    <div style={styles.heroActions}>
                        <button
                            style={styles.heroButton}
                            onClick={() =>
                                document
                                    .getElementById('report-form')
                                    ?.scrollIntoView({
                                        behavior: 'smooth'
                                    })
                            }
                        >
                            + Report an Item
                        </button>

                        <button
                            style={styles.heroLink}
                            onClick={() =>
                                document
                                    .getElementById('reports')
                                    ?.scrollIntoView({
                                        behavior: 'smooth'
                                    })
                            }
                        >
                            Explore reports →
                        </button>
                    </div>
                </div>

                <div style={styles.heroDashboard}>
                    <div
                        style={{
                            ...styles.orbit,
                            ...styles.orbitOne
                        }}
                    ></div>

                    <div
                        style={{
                            ...styles.orbit,
                            ...styles.orbitTwo
                        }}
                    ></div>

                    <div style={styles.heroIcon}>🔎</div>

                    <div
                        style={{
                            ...styles.floatingCard,
                            ...styles.cardTop
                        }}
                    >
                        <span>🎒</span>

                        <div>
                            <strong>Lost backpack</strong>
                            <small>Searching campus</small>
                        </div>
                    </div>

                    <div
                        style={{
                            ...styles.floatingCard,
                            ...styles.cardBottom
                        }}
                    >
                        <span>✓</span>

                        <div>
                            <strong>Item recovered</strong>
                            <small>Just now</small>
                        </div>
                    </div>
                </div>
            </section>

            {!loggedInUser && showRegister && (
                <RegisterForm
                    onRegistered={() => setShowRegister(false)}
                />
            )}

            {loggedInUser && (
                <div id="report-form">
                    <ReportForm
                        onCreated={() => {
                            setFilter('all');
                            loadItems();
                        }}
                    />
                </div>
            )}

            {loggedInUser && <MyClaims />}

            {loggedInUser &&
                loggedInUser.role === 'admin' && (
                    <AdminClaims />
                )}

            <div style={styles.filters}>
                <button
                    style={styles.button}
                    onClick={() => setFilter('all')}
                >
                    All Reports
                </button>

                <button
                    style={styles.button}
                    onClick={() => setFilter('lost')}
                >
                    Lost Items
                </button>

                <button
                    style={styles.button}
                    onClick={() => setFilter('found')}
                >
                    Found Items
                </button>
            </div>

            {loading && (
                <p style={styles.centerText}>
                    Loading item reports...
                </p>
            )}

            {error && (
                <p style={styles.error}>{error}</p>
            )}

            {!loading && !error && (
                <section
                    id="reports"
                    style={styles.grid}
                >
                    {items.map((item) => (
                        <article
                            key={item.item_id}
                            style={styles.card}
                        >
                        {item.image_url && (
                            <img
                                src={`https://found-it-y7ck.onrender.com${item.image_url}`}
                                alt={item.item_name}
                                style={styles.itemImage}
                                onClick={() =>
                                    setSelectedImage(
                                        `https://found-it-y7ck.onrender.com${item.image_url}`
                                    )
                                }
                            />
                        )}    
                            <span
                                style={{
                                    ...styles.badge,
                                    backgroundColor:
                                        item.report_type === 'lost'
                                            ? '#fee2e2'
                                            : '#dcfce7',
                                    color:
                                        item.report_type === 'lost'
                                            ? '#991b1b'
                                            : '#166534'
                                }}
                            >
                                {item.report_type.toUpperCase()}
                            </span>

                            <h2 style={styles.itemTitle}>
                                {item.item_name}
                            </h2>

                            <p>{item.description}</p>

                            <p>
                                <strong>Category:</strong>{' '}
                                {item.category_name}
                            </p>

                            <p>
                                <strong>Campus:</strong>{' '}
                                {item.campus_name}
                            </p>

                            <p>
                                <strong>Location:</strong>{' '}
                                {item.location_name}
                            </p>

                            {item.location_details && (
                                <p>
                                    <strong>
                                        Exact location:
                                    </strong>{' '}
                                    {item.location_details}
                                </p>
                            )}

                            <p>
                                <strong>Reported by:</strong>{' '}
                                {item.reported_by}
                            </p>

                            <p>
                                <strong>Status:</strong>{' '}
                                {item.status}
                            </p>

                            {loggedInUser &&
                                item.report_type === 'found' &&
                                item.status !== 'resolved' && (
                                    <ClaimForm
                                        itemId={item.item_id}
                                        onSubmitted={loadItems}
                                    />
                                )}
                        </article>
                    ))}
                </section>
            )}
            
            {!loading && !error && (
                <section
                    id="reports"
                    style={styles.grid}
                >
                    {/* item cards */}
                </section>
            )}

            {selectedImage && (
                <div
                    style={styles.imageOverlay}
                    onClick={() =>
                        setSelectedImage(null)
                    }
                >
                    <button
                        style={styles.closeButton}
                        onClick={() =>
                            setSelectedImage(null)
                        }
                    >
                        ×
                    </button>

                    <img
                        src={selectedImage}
                        alt="Large item preview"
                        style={styles.largeImage}
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    />
                </div>
            )}
        </main>
    );
}

const styles = {
    page: {
        maxWidth: '1180px',
        margin: '0 auto',
        padding: '30px 24px',
        fontFamily: 'Arial, sans-serif',
        color: '#0f172a'
    },

    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '20px',
        marginBottom: '30px'
    },

    logo: {
        margin: '0',
        fontSize: '32px',
        color: '#172554'
    },

    subtitle: {
        marginTop: '8px',
        color: '#64748b'
    },

    userArea: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: '#1e3a8a'
    },

    logoutButton: {
        padding: '9px 14px',
        border: '1px solid #1d4ed8',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        color: '#1d4ed8',
        cursor: 'pointer'
    },

    loginForm: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexWrap: 'wrap'
    },

    loginButton: {
        padding: '9px 14px',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: '#1d4ed8',
        color: '#ffffff',
        cursor: 'pointer'
    },

    hero: {
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '40px',
        minHeight: '390px',
        padding: '55px',
        marginBottom: '35px',
        overflow: 'hidden',
        borderRadius: '28px',
        background:
            'radial-gradient(circle at 85% 20%, #164e63, transparent 32%), linear-gradient(135deg, #020617, #0f172a 55%, #172554)',
        boxShadow:
            '0 20px 50px rgba(15, 23, 42, 0.3)'
    },

    heroContent: {
        position: 'relative',
        zIndex: 2,
        maxWidth: '560px'
    },

    statusPill: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '999px',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        color: '#bae6fd',
        fontSize: '11px',
        fontWeight: 'bold',
        letterSpacing: '1px'
    },

    statusDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#4ade80',
        boxShadow: '0 0 12px #4ade80'
    },

    heroTitle: {
        margin: '22px 0 16px',
        color: '#ffffff',
        fontSize: '64px',
        lineHeight: '0.98',
        letterSpacing: '-3px'
    },

    heroAccent: {
        color: '#67e8f9'
    },

    heroText: {
        maxWidth: '470px',
        color: '#cbd5e1',
        fontSize: '17px',
        lineHeight: '1.6'
    },

    heroActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        marginTop: '25px',
        flexWrap: 'wrap'
    },

    heroButton: {
        padding: '13px 20px',
        border: 'none',
        borderRadius: '9px',
        backgroundColor: '#22d3ee',
        color: '#082f49',
        fontWeight: 'bold',
        cursor: 'pointer'
    },

    heroLink: {
        border: 'none',
        backgroundColor: 'transparent',
        color: '#bae6fd',
        fontWeight: 'bold',
        cursor: 'pointer'
    },

    heroDashboard: {
        position: 'relative',
        width: '330px',
        height: '260px',
        flexShrink: 0
    },

    heroIcon: {
        position: 'absolute',
        top: '65px',
        left: '95px',
        zIndex: 2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '130px',
        height: '130px',
        borderRadius: '50%',
        backgroundColor: '#0ea5e9',
        fontSize: '62px',
        boxShadow: '0 0 55px rgba(34, 211, 238, 0.7)'
    },

    orbit: {
        position: 'absolute',
        border: '1px solid rgba(125, 211, 252, 0.35)',
        borderRadius: '50%'
    },

    orbitOne: {
        top: '25px',
        left: '55px',
        width: '210px',
        height: '210px'
    },

    orbitTwo: {
        top: '0',
        left: '30px',
        width: '260px',
        height: '260px',
        transform: 'rotate(35deg)'
    },

    floatingCard: {
        position: 'absolute',
        zIndex: 3,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 15px',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        borderRadius: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.14)',
        backdropFilter: 'blur(12px)',
        color: '#ffffff',
        boxShadow:
            '0 12px 25px rgba(0, 0, 0, 0.2)'
    },

    cardTop: {
        top: '8px',
        right: '0'
    },

    cardBottom: {
        bottom: '8px',
        left: '0'
    },

    filters: {
        display: 'flex',
        gap: '10px',
        marginBottom: '25px',
        flexWrap: 'wrap'
    },

    button: {
        padding: '11px 18px',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: '#1e3a8a',
        color: '#ffffff',
        fontWeight: 'bold',
        cursor: 'pointer'
    },

    grid: {
        display: 'grid',
        gridTemplateColumns:
            'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
    },

    card: {
        padding: '20px',
        borderRadius: '14px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow:
            '0 6px 16px rgba(15, 23, 42, 0.08)'
    },

    itemImage: {
        width: '100%',
        height: '180px',
        objectFit: 'cover',
        borderRadius: '10px',
        marginBottom: '15px'
    },

    badge: {
        display: 'inline-block',
        padding: '5px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 'bold'
    },

    itemTitle: {
        marginTop: '15px',
        color: '#0f172a'
    },

    centerText: {
        textAlign: 'center'
    },

    error: {
        color: '#b91c1c'
    },

    authArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px'
    },

    registerLink: {
        border: 'none',
        backgroundColor: 'transparent',
        color: '#1d4ed8',
        cursor: 'pointer',
        fontWeight: 'bold'
    }

};

export default App;