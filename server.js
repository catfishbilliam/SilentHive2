// Import required modules
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Load environment variables from .env file
dotenv.config();

// Get the USDA API key from environment variables
const USDA_API_KEY = process.env.USDA_API_KEY;

// Create an Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Get the current file path and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Middlware to serve 3D image
app.use('/models', express.static(path.join(__dirname, 'models')));

// Function to load JSON data from a file
const loadJsonData = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return null;
    }
};

// Load the registered colonies data
const registeredColoniesData = loadJsonData(path.join(__dirname, 'public', 'registered_colonies.json'));

// Function to fetch colony loss data from the USDA API
const fetchColonyLossData = async (year) => {
    const baseUrl = 'https://quickstats.nass.usda.gov/api/api_GET/';
    const params = new URLSearchParams({
        key: USDA_API_KEY,
        source_desc: 'SURVEY',
        sector_desc: 'ANIMALS & PRODUCTS',
        group_desc: 'SPECIALTY',
        commodity_desc: 'HONEY',
        statisticcat_desc: 'LOSS, COLONY COLLAPSE DISORDER',
        short_desc: 'HONEY, BEE COLONIES - LOSS, COLONY COLLAPSE DISORDER, MEASURED IN COLONIES',
        domain_desc: 'TOTAL',
        agg_level_desc: 'STATE',
        year: year,
        freq_desc: 'MONTHLY',
        format: 'json'
    });

    console.log(`[LOG] Fetching colony loss data for year ${year} with the following parameters:`);
    console.log(params.toString());

    try {
        const response = await fetch(`${baseUrl}?${params}`);
        console.log(`[LOG] USDA API Response Status: ${response.status}`);

        if (!response.ok) {
            console.error(`HTTP error! Status: ${response.status}`);
            return [];
        }

        const data = await response.json();
        console.log(`[LOG] Data received from USDA API for year ${year}:`, data);

        if (data.data && data.data.length > 0) {
            const mappedData = data.data.map(record => ({
                state: record.state_name,
                month: record.reference_period_desc,
                coloniesLost: parseInt(record.Value.replace(/,/g, '')) // Convert value to integer
            }));

            // Log specific records to verify each quarter's presence
            const periods = ['JAN THRU MAR', 'APR THRU JUN', 'JUL THRU SEP', 'OCT THRU DEC'];
            periods.forEach(period => {
                const entries = mappedData.filter(record => record.month === period);
                console.log(`[LOG] Entries for ${period} in ${year}:`, entries);
                if (entries.length === 0) {
                    console.warn(`[WARN] No data found for period ${period} in ${year}.`);
                }
            });

            return mappedData;
        } else {
            console.warn(`No data returned for ${year} (MONTHLY).`);
            return [];
        }
    } catch (error) {
        console.error(`Error fetching data for ${year} (MONTHLY):`, error);
        return [];
    }
};


// API endpoint to fetch monthly colony data
app.get('/api/monthly/:year', async (req, res) => {
    const { year } = req.params;
    console.log(`[LOG] API Request received for monthly colony loss data for year: ${year}`);

    const coloniesLostData = await fetchColonyLossData(year);

    if (coloniesLostData.length > 0) {
        console.log(`[LOG] Successfully fetched data for year ${year}.`);
        res.json(coloniesLostData);
    } else {
        console.error(`[ERROR] No data available for year ${year}.`);
        res.status(500).json({ error: `Error fetching monthly colony loss data for ${year}.` });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
