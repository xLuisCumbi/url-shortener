require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

app.use(express.static('public'));
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function createTable() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS shortened_urls (
                id SERIAL PRIMARY KEY,
                short_url VARCHAR(50) UNIQUE NOT NULL,
                original_url TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP WITH TIME ZONE
            )
        `);
    } finally {
        client.release();
    }
}

createTable();

app.post('/shorten', async (req, res) => {
    const originalUrl = req.body.url;
    const shortCode = crypto.randomBytes(4).toString('hex');
    const shortUrl = `${baseUrl}/${shortCode}`;

    try {
        const result = await pool.query(
            'INSERT INTO shortened_urls (short_url, original_url) VALUES ($1, $2) RETURNING id',
            [shortUrl, originalUrl]
        );
        res.json({ shortUrl: shortUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al acortar la URL' });
    }
});

app.get('/:shortCode', async (req, res) => {
    const shortUrl = `${baseUrl}/${req.params.shortCode}`;

    try {
        const result = await pool.query('SELECT original_url FROM shortened_urls WHERE short_url = $1', [shortUrl]);
        if (result.rows.length > 0) {
            res.redirect(result.rows[0].original_url);
        } else {
            res.status(404).send('URL not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al recuperar la URL');
    }
});

app.listen(port, () => {
    console.log(`Server running at ${baseUrl}`);
});