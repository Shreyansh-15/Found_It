import { useState } from 'react';

function ReportForm({ onCreated }) {
    const [reportType, setReportType] = useState('lost');
    const [itemName, setItemName] = useState('');
    const [description, setDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [categoryId, setCategoryId] = useState('1');
    const [customCategory, setCustomCategory] = useState('');
    const [locationId, setLocationId] = useState('6');
    const [locationDetails, setLocationDetails] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    async function handleSubmit(event) {
        event.preventDefault();

        setMessage('');
        setError('');
        setSubmitting(true);

        const token = localStorage.getItem('foundit_token');

        try {
            const formData = new FormData();

            formData.append('category_id', categoryId);
            formData.append('custom_category', customCategory);
            formData.append('location_id', locationId);
            formData.append(
                'location_details',
                locationDetails
            );
            formData.append('report_type', reportType);
            formData.append('item_name', itemName);
            formData.append('description', description);
            formData.append('event_date', eventDate);

            if (image) {
                formData.append('image', image);
            }

            const response = await fetch(
                'https://found-it-y7ck.onrender.com/api/items',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            );

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            setMessage(
                'Your report has been submitted successfully.'
            );

            setItemName('');
            setDescription('');
            setEventDate('');
            setCategoryId('1');
            setCustomCategory('');
            setLocationId('6');
            setLocationDetails('');

            if (onCreated) {
                onCreated();
            }
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section style={styles.wrapper}>
            <div style={styles.headingArea}>
                <div>
                    <p style={styles.eyebrow}>
                        HELP YOUR CAMPUS COMMUNITY
                    </p>

                    <h2 style={styles.heading}>
                        Report an Item
                    </h2>

                    <p style={styles.subheading}>
                        Tell us what happened so the right person
                        can find it.
                    </p>
                </div>

                <div style={styles.headingIcon}>📋</div>
            </div>

            <form
                onSubmit={handleSubmit}
                style={styles.form}
            >
                <div style={styles.typeSection}>
                    <label style={styles.label}>
                        What would you like to report?
                    </label>

                    <div style={styles.typeButtons}>
                        <button
                            type="button"
                            style={{
                                ...styles.typeButton,
                                ...(reportType === 'lost'
                                    ? styles.activeLost
                                    : {})
                            }}
                            onClick={() =>
                                setReportType('lost')
                            }
                        >
                            <span>🔍</span>
                            <span>
                                <strong>I lost something</strong>
                                <small>
                                    I am looking for my item
                                </small>
                            </span>
                        </button>

                        <button
                            type="button"
                            style={{
                                ...styles.typeButton,
                                ...(reportType === 'found'
                                    ? styles.activeFound
                                    : {})
                            }}
                            onClick={() =>
                                setReportType('found')
                            }
                        >
                            <span>🤝</span>
                            <span>
                                <strong>I found something</strong>
                                <small>
                                    I want to help return it
                                </small>
                            </span>
                        </button>
                    </div>
                </div>

                <div style={styles.formGrid}>
                    <div style={styles.field}>
                        <label style={styles.label}>
                            Item name
                        </label>

                        <input
                            type="text"
                            placeholder="e.g. Black backpack"
                            value={itemName}
                            onChange={(event) =>
                                setItemName(event.target.value)
                            }
                            required
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>
                            Item image
                        </label>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                                const selectedImage =
                                    event.target.files[0];

                                setImage(selectedImage);

                                if (selectedImage) {
                                    setImagePreview(
                                        URL.createObjectURL(selectedImage)
                                    );
                                }
                            }}
                        />

                        {imagePreview && (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                style={styles.preview}
                            />
                        )}
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>
                            Category
                        </label>

                        <select
                            value={categoryId}
                            onChange={(event) => {
                                setCategoryId(
                                    event.target.value
                                );
                                setCustomCategory('');
                            }}
                        >
                            <option value="1">
                                Electronics
                            </option>
                            <option value="2">
                                Books
                            </option>
                            <option value="3">
                                ID Cards
                            </option>
                            <option value="4">
                                Wallets
                            </option>
                            <option value="5">
                                Keys
                            </option>
                            <option value="6">
                                Clothing
                            </option>
                            <option value="other">
                                Other
                            </option>
                        </select>
                    </div>
                </div>

                {categoryId === 'other' && (
                    <div style={styles.field}>
                        <label style={styles.label}>
                            Custom item type
                        </label>

                        <input
                            type="text"
                            placeholder="e.g. Backpack, umbrella, glasses"
                            value={customCategory}
                            onChange={(event) =>
                                setCustomCategory(
                                    event.target.value
                                )
                            }
                            required
                        />
                    </div>
                )}

                <div style={styles.field}>
                    <label style={styles.label}>
                        Description
                    </label>

                    <textarea
                        placeholder="Describe the item, its colour, brand, or any identifying marks"
                        value={description}
                        onChange={(event) =>
                            setDescription(event.target.value)
                        }
                        required
                    />
                </div>

                <div style={styles.formGrid}>
                    <div style={styles.field}>
                        <label style={styles.label}>
                            Date
                        </label>

                        <input
                            type="date"
                            value={eventDate}
                            onChange={(event) =>
                                setEventDate(event.target.value)
                            }
                            required
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>
                            Campus area
                        </label>

                        <select
                            value={locationId}
                            onChange={(event) =>
                                setLocationId(
                                    event.target.value
                                )
                            }
                        >
                            <option value="6">
                                Kandoli Campus - Main Area
                            </option>

                            <option value="5">
                                Bidholi Campus - Main Area
                            </option>
                        </select>
                    </div>
                </div>

                <div style={styles.locationBox}>
                    <label style={styles.label}>
                        Exact location
                    </label>

                    <textarea
                        placeholder="e.g. Near the library entrance, beside the notice board"
                        value={locationDetails}
                        onChange={(event) =>
                            setLocationDetails(
                                event.target.value
                            )
                        }
                    />

                    <small style={styles.helperText}>
                        A specific location helps students find
                        the item faster.
                    </small>
                </div>

                <button
                    type="submit"
                    style={styles.submitButton}
                    disabled={submitting}
                >
                    {submitting
                        ? 'Submitting...'
                        : 'Submit Report →'}
                </button>

                {message && (
                    <div style={styles.success}>
                        ✓ {message}
                    </div>
                )}

                {error && (
                    <div style={styles.error}>
                        {error}
                    </div>
                )}
            </form>
        </section>
    );
}

const styles = {
    wrapper: {
        marginBottom: '30px',
        padding: '30px',
        borderRadius: '20px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow:
            '0 12px 30px rgba(15, 23, 42, 0.08)'
    },

    headingArea: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '25px'
    },

    eyebrow: {
        margin: '0 0 8px',
        color: '#2563eb',
        fontSize: '11px',
        fontWeight: 'bold',
        letterSpacing: '1.5px'
    },

    heading: {
        margin: '0',
        color: '#0f172a',
        fontSize: '30px'
    },

    subheading: {
        margin: '8px 0 0',
        color: '#64748b'
    },

    headingIcon: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '52px',
        height: '52px',
        borderRadius: '14px',
        backgroundColor: '#dbeafe',
        fontSize: '25px'
    },

    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
    },

    typeSection: {
        padding: '18px',
        borderRadius: '14px',
        backgroundColor: '#f8fafc'
    },

    typeButtons: {
        display: 'grid',
        gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
        marginTop: '10px'
    },

    typeButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px',
        border: '1px solid #cbd5e1',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        textAlign: 'left',
        cursor: 'pointer'
    },

    activeLost: {
        border: '2px solid #f87171',
        backgroundColor: '#fff1f2'
    },

    activeFound: {
        border: '2px solid #34d399',
        backgroundColor: '#ecfdf5'
    },

    formGrid: {
        display: 'grid',
        gridTemplateColumns:
            'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '18px'
    },

    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: '7px'
    },

    label: {
        color: '#334155',
        fontSize: '13px',
        fontWeight: 'bold'
    },

    locationBox: {
        display: 'flex',
        flexDirection: 'column',
        gap: '7px',
        padding: '18px',
        borderRadius: '14px',
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe'
    },

    helperText: {
        color: '#64748b',
        fontSize: '12px'
    },

    submitButton: {
        padding: '14px 20px',
        border: 'none',
        borderRadius: '10px',
        backgroundColor: '#1d4ed8',
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '15px',
        cursor: 'pointer'
    },

    success: {
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: '#dcfce7',
        color: '#166534'
    },

    error: {
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: '#fee2e2',
        color: '#991b1b'
    }
};

export default ReportForm;