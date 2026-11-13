const axios = require('axios');

// ═══════════════════════════════════════════════════════════
//                    🎯 CREATOR INFO
// ═══════════════════════════════════════════════════════════
const CREATOR = {
    creator: 'C9Muzamil',
    team: 'RedXhackers',
    contact: '+923130122643',
    channel: 'https://whatsapp.com/channel/0029VbCkm3rAe5VzCYLtNb2u'
};

const UPSTREAM = 'https://sim-db-api.faizankhichi.me/';

// ═══════════════════════════════════════════════════════════
//                    🛠️ HELPERS
// ═══════════════════════════════════════════════════════════
function cleanText(str) {
    if (!str) return 'N/A';
    return String(str)
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&')
        .trim();
}

function normalizeResponse(upstreamData, query) {
    if (!upstreamData || !Array.isArray(upstreamData.data) || upstreamData.data.length === 0) {
        return null;
    }

    const records = upstreamData.data.map((item) => ({
        number: cleanText(item.nbr) || 'N/A',
        name: cleanText(item.nam) || 'N/A',
        cnic: cleanText(item.cni) || 'N/A',
        address: cleanText(item.adr) || 'N/A'
    }));

    return {
        ok: true,
        cached: upstreamData.cached === 'yes' ? true : false,
        query,
        total: records.length,
        data: records,
        ...CREATOR
    };
}

// ═══════════════════════════════════════════════════════════
//                    🚀 MAIN HANDLER
// ═══════════════════════════════════════════════════════════
module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({
            ok: false,
            error: 'Method not allowed. Use GET.',
            ...CREATOR
        });
    }

    const number = req.query.number || req.query.search || req.query.q;

    // Validation
    if (!number) {
        return res.status(400).json({
            ok: false,
            error: 'Missing required parameter: number',
            example: '/search?number=03001234567',
            ...CREATOR
        });
    }

    const cleanNumber = String(number).replace(/\D/g, '');
    if (cleanNumber.length < 10 || cleanNumber.length > 13) {
        return res.status(400).json({
            ok: false,
            error: 'Invalid number. Must be 10–13 digits.',
            received: number,
            ...CREATOR
        });
    }

    try {
        const upstreamUrl = `${UPSTREAM}?search=${encodeURIComponent(cleanNumber)}`;
        const response = await axios.get(upstreamUrl, {
            timeout: 20000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });

        const normalized = normalizeResponse(response.data, cleanNumber);

        if (!normalized) {
            return res.status(404).json({
                ok: false,
                cached: false,
                query: cleanNumber,
                error: 'No record found for this number',
                data: [],
                ...CREATOR
            });
        }

        return res.status(200).json(normalized);

    } catch (err) {
        const status = err.response?.status || 500;
        let message = 'Upstream API error';

        if (err.code === 'ECONNABORTED') message = 'Upstream request timed out';
        else if (err.response?.status === 404) message = 'Number not found in database';
        else if (err.message) message = err.message;

        return res.status(status >= 400 && status < 600 ? status : 500).json({
            ok: false,
            cached: false,
            query: cleanNumber,
            error: message,
            data: [],
            ...CREATOR
        });
    }
};
