const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDirectory = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const app = express();

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (req, file, callback) => {
        const uniqueName =
            `${Date.now()}-${file.originalname}`;

        callback(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, callback) => {
        if (file.mimetype.startsWith('image/')) {
            callback(null, true);
        } else {
            callback(
                new Error('Only image files are allowed')
            );
        }
    }
});

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.use(
    '/uploads',
    express.static(path.join(__dirname, 'uploads'))
);

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token is required'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        req.user = user;
        next();
    });
}

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'FoundIt backend is running'
    });
});

app.get('/api/db-health', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT 1 AS database_connection'
        );

        res.json({
            success: true,
            message: 'MySQL connection is working',
            result: rows[0]
        });
    } catch (error) {
        console.error('Database connection error:', error.message);

        res.status(500).json({
            success: false,
            message: 'MySQL connection failed'
        });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { full_name, email, password, phone } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'full_name, email, and password are required'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least 8 characters'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [existingUsers] = await pool.execute(
            `
            SELECT user_id
            FROM users
            WHERE email = ?
            `,
            [normalizedEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            `
            INSERT INTO users
                (full_name, email, password_hash, phone)
            VALUES (?, ?, ?, ?)
            `,
            [
                full_name.trim(),
                normalizedEmail,
                passwordHash,
                phone || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Student registered successfully',
            user_id: result.insertId
        });
    } catch (error) {
        console.error('Registration error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Could not register student'
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [users] = await pool.execute(
            `
            SELECT
                user_id,
                full_name,
                email,
                password_hash,
                role,
                account_status
            FROM users
            WHERE email = ?
            `,
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        if (user.account_status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'This account is not active'
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        await pool.execute(
            `
            UPDATE users
            SET last_login_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            `,
            [user.user_id]
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Could not log in'
        });
    }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            `
            SELECT
                user_id,
                full_name,
                email,
                role,
                account_status
            FROM users
            WHERE user_id = ?
            `,
            [req.user.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: users[0]
        });
    } catch (error) {
        console.error('Profile error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Could not fetch profile'
        });
    }
});

app.get('/api/items', async (req, res) => {
    try {
        const reportType = req.query.report_type;

        if (
            reportType &&
            !['lost', 'found'].includes(reportType)
        ) {
            return res.status(400).json({
                success: false,
                message: 'report_type must be lost or found'
            });
        }

        let sql = `
            SELECT
                i.item_id,
                i.item_name,
                i.description,
                i.report_type,
                i.event_date,
                i.status,
                c.category_name,
                cp.campus_name,
                cl.location_name,
                i.location_details,
                img.image_url,
                u.full_name AS reported_by
            FROM items i
            JOIN categories c
                ON i.category_id = c.category_id
            JOIN campus_locations cl
                ON i.location_id = cl.location_id
            JOIN campuses cp
                ON cl.campus_id = cp.campus_id
            LEFT JOIN item_images img
                ON i.item_id = img.item_id
                AND img.is_primary = TRUE
            JOIN users u
                ON i.user_id = u.user_id
            WHERE 1 = 1
        `;

        const params = [];

        if (reportType) {
            sql += ' AND i.report_type = ?';
            params.push(reportType);
        }

        sql += ' ORDER BY i.reported_at DESC';

        const [items] = await pool.query(sql, params);

        res.json({
            success: true,
            count: items.length,
            items
        });
    } catch (error) {
        console.error('Error fetching items:', error.message);

        res.status(500).json({
            success: false,
            message: 'Could not fetch items'
        });
    }
});

app.post(
    '/api/items',
    authenticateToken,
    upload.single('image'),
    async (req, res) => {

    const connection = await pool.getConnection();

    try {
        const {
            category_id,
            custom_category,
            location_id,
            location_details,
            report_type,
            item_name,
            description,
            event_date
        } = req.body;

        if (
            !category_id ||
            !location_id ||
            !report_type ||
            !item_name ||
            !description ||
            !event_date
        ) {
            return res.status(400).json({
                success: false,
                message: 'All required item fields are required'
            });
        }

        if (!['lost', 'found'].includes(report_type)) {
            return res.status(400).json({
                success: false,
                message: 'Report type must be lost or found'
            });
        }

        await connection.beginTransaction();

        let finalCategoryId = category_id;

        if (category_id === 'other') {
            if (!custom_category || !custom_category.trim()) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'Please enter a custom category'
                });
            }

            const categoryName = custom_category.trim();

            const [existingCategory] = await connection.query(
                `SELECT category_id
                 FROM categories
                 WHERE LOWER(category_name) = LOWER(?)`,
                [categoryName]
            );

            if (existingCategory.length > 0) {
                finalCategoryId = existingCategory[0].category_id;
            } else {
                const [newCategory] = await connection.query(
                    `INSERT INTO categories
                     (category_name, description)
                     VALUES (?, ?)`,
                    [categoryName, 'User-created category']
                );

                finalCategoryId = newCategory.insertId;
            }
        }

        const [result] = await connection.query(
            `INSERT INTO items
             (
                user_id,
                category_id,
                location_id,
                location_details,
                report_type,
                item_name,
                description,
                event_date,
                status
             )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
            [
                req.user.user_id,
                finalCategoryId,
                location_id,
                location_details || null,
                report_type,
                item_name,
                description,
                event_date
            ]
        );

        if (req.file) {
            const imageUrl =
                `/uploads/${req.file.filename}`;

            await connection.query(
                `INSERT INTO item_images
                (item_id, image_url, is_primary)
                VALUES (?, ?, TRUE)`,
                [result.insertId, imageUrl]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Item report created successfully',
            item_id: result.insertId
        });
    } catch (error) {
        await connection.rollback();

        console.error('Create item error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to create item report'
        });
    } finally {
        connection.release();
    }
});

app.get('/api/items/:id', async (req, res) => {
    try {
        const itemId = Number(req.params.id);

        if (!Number.isInteger(itemId) || itemId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Item ID must be a positive number'
            });
        }

        const [items] = await pool.execute(
            `
            SELECT
                i.item_id,
                i.item_name,
                i.description,
                i.report_type,
                i.event_date,
                i.status,
                c.category_name,
                cp.campus_name,
                cl.location_name,
                i.location_details,
                u.full_name AS reported_by
            FROM items i
            JOIN categories c
                ON i.category_id = c.category_id
            JOIN campus_locations cl
                ON i.location_id = cl.location_id
            JOIN campuses cp
                ON cl.campus_id = cp.campus_id
            JOIN users u
                ON i.user_id = u.user_id
            WHERE i.item_id = ?
            `,
            [itemId]
        );

        if (items.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item report not found'
            });
        }

        res.json({
            success: true,
            item: items[0]
        });
    } catch (error) {
        console.error('Error fetching item:', error.message);

        res.status(500).json({
            success: false,
            message: 'Could not fetch item report'
        });
    }
});

app.get('/api/items/:id/claims', async (req, res) => {
    try {
        const itemId = Number(req.params.id);

        if (!Number.isInteger(itemId) || itemId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Item ID must be a positive number'
            });
        }

        const [claims] = await pool.execute(
            `
            SELECT
                cl.claim_id,
                cl.item_id,
                cl.claim_description,
                cl.status,
                cl.submitted_at,
                u.full_name AS claimant
            FROM claims cl
            JOIN users u
                ON cl.claimant_user_id = u.user_id
            WHERE cl.item_id = ?
            ORDER BY cl.submitted_at DESC
            `,
            [itemId]
        );

        res.json({
            success: true,
            count: claims.length,
            claims
        });
    } catch (error) {
        console.error('Error fetching claims:', error.message);

        res.status(500).json({
            success: false,
            message: 'Could not fetch claims'
        });
    }
});

app.post(
    '/api/items/:id/claims',
    authenticateToken,
    async (req, res) => {
        const connection = await pool.getConnection();

        try {
            const itemId = Number(req.params.id);
            const claimantUserId = req.user.user_id;
            const { claim_description } = req.body;

            if (!Number.isInteger(itemId) || itemId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Item ID must be a positive number'
                });
            }

            if (!claim_description) {
                return res.status(400).json({
                    success: false,
                    message: 'claim_description is required'
                });
            }

            await connection.beginTransaction();

            const [items] = await connection.execute(
                `
                SELECT item_id, user_id, report_type, status
                FROM items
                WHERE item_id = ?
                `,
                [itemId]
            );

            if (items.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    message: 'Item report not found'
                });
            }

            const item = items[0];

            if (item.report_type !== 'found') {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'Claims can only be submitted for found items'
                });
            }

            if (
                item.status === 'resolved' ||
                item.status === 'closed'
            ) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'This item cannot receive new claims'
                });
            }

            if (claimantUserId === item.user_id) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'The finder cannot claim their own report'
                });
            }

            const [existingClaims] = await connection.execute(
                `
                SELECT claim_id
                FROM claims
                WHERE item_id = ?
                  AND claimant_user_id = ?
                  AND status IN ('pending', 'approved')
                `,
                [itemId, claimantUserId]
            );

            if (existingClaims.length > 0) {
                await connection.rollback();

                return res.status(409).json({
                    success: false,
                    message: 'This user already has an active claim for the item'
                });
            }

            const [result] = await connection.execute(
                `
                INSERT INTO claims
                    (item_id, claimant_user_id, claim_description)
                VALUES (?, ?, ?)
                `,
                [
                    itemId,
                    claimantUserId,
                    claim_description
                ]
            );

            await connection.execute(
                `
                UPDATE items
                SET status = 'claim_pending'
                WHERE item_id = ?
                `,
                [itemId]
            );

            await connection.commit();

            res.status(201).json({
                success: true,
                message: 'Claim submitted successfully',
                claim_id: result.insertId
            });
        } catch (error) {
            await connection.rollback();

            console.error(
                'Error submitting claim:',
                error.message
            );

            res.status(500).json({
                success: false,
                message: 'Could not submit claim'
            });
        } finally {
            connection.release();
        }
    }
);

app.patch(
    '/api/claims/:id/review',
    authenticateToken,
    async (req, res) => {
        const connection = await pool.getConnection();

        try {
            const claimId = Number(req.params.id);
            const { decision, decision_reason } = req.body;

            if (!['approved', 'rejected'].includes(decision)) {
                return res.status(400).json({
                    success: false,
                    message: 'Decision must be approved or rejected'
                });
            }

            await connection.beginTransaction();

            const [claims] = await connection.execute(
                `
                SELECT
                    cl.claim_id,
                    cl.item_id,
                    cl.status,
                    i.user_id AS finder_user_id,
                    i.status AS item_status
                FROM claims cl
                JOIN items i
                    ON cl.item_id = i.item_id
                WHERE cl.claim_id = ?
                `,
                [claimId]
            );

            if (claims.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    message: 'Claim not found'
                });
            }

            const claim = claims[0];

            if (claim.status !== 'pending') {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'Only pending claims can be reviewed'
                });
            }

            const isFinder =
                req.user.user_id === claim.finder_user_id;

            const isAdmin = req.user.role === 'admin';

            if (!isFinder && !isAdmin) {
                await connection.rollback();

                return res.status(403).json({
                    success: false,
                    message: 'Only the finder or an admin can review this claim'
                });
            }

            if (decision === 'approved') {
                const [approvedClaims] = await connection.execute(
                    `
                    SELECT claim_id
                    FROM claims
                    WHERE item_id = ?
                      AND status = 'approved'
                    `,
                    [claim.item_id]
                );

                if (approvedClaims.length > 0) {
                    await connection.rollback();

                    return res.status(409).json({
                        success: false,
                        message: 'Another claim is already approved'
                    });
                }
            }

            await connection.execute(
                `
                UPDATE claims
                SET
                    status = ?,
                    reviewed_by_user_id = ?,
                    reviewed_at = CURRENT_TIMESTAMP,
                    decision_reason = ?
                WHERE claim_id = ?
                `,
                [
                    decision,
                    req.user.user_id,
                    decision_reason || null,
                    claimId
                ]
            );

            if (decision === 'approved') {
                await connection.execute(
                    `
                    UPDATE items
                    SET
                        status = 'resolved',
                        resolved_at = CURRENT_TIMESTAMP
                    WHERE item_id = ?
                    `,
                    [claim.item_id]
                );

                await connection.execute(
                    `
                    UPDATE claims
                    SET status = 'rejected'
                    WHERE item_id = ?
                      AND claim_id <> ?
                      AND status = 'pending'
                    `,
                    [claim.item_id, claimId]
                );
            }

            await connection.commit();

            res.json({
                success: true,
                message: `Claim ${decision} successfully`
            });
        } catch (error) {
            await connection.rollback();

            console.error('Claim review error:', error.message);

            res.status(500).json({
                success: false,
                message: 'Could not review claim'
            });
        } finally {
            connection.release();
        }
    }
);

app.get('/api/my-claims', authenticateToken, async (req, res) => {
    try {
        const [claims] = await pool.query(
            `SELECT
                cl.claim_id,
                cl.item_id,
                cl.claim_description,
                cl.status,
                cl.submitted_at,
                i.item_name,
                i.report_type
             FROM claims cl
             JOIN items i
                ON cl.item_id = i.item_id
             WHERE cl.claimant_user_id = ?
             ORDER BY cl.submitted_at DESC`,
            [req.user.user_id]
        );

        res.json({
            success: true,
            count: claims.length,
            claims
        });
    } catch (error) {
        console.error('My claims error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch your claims'
        });
    }
});

app.get('/api/admin/claims', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can view all claims'
            });
        }

        const [claims] = await pool.query(
            `SELECT
                cl.claim_id,
                cl.item_id,
                cl.claim_description,
                cl.status,
                cl.submitted_at,
                i.item_name,
                u.full_name AS claimant
             FROM claims cl
             JOIN items i
                ON cl.item_id = i.item_id
             JOIN users u
                ON cl.claimant_user_id = u.user_id
             WHERE cl.status = 'pending'
             ORDER BY cl.submitted_at ASC`
        );

        res.json({
            success: true,
            count: claims.length,
            claims
        });
    } catch (error) {
        console.error('Admin claims error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending claims'
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(
        `FoundIt backend running at http://localhost:${PORT}`
    );
});