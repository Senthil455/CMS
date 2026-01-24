import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const baseURL = 'https://generativelanguage.googleapis.com';
    const endpoint = `${baseURL}/v1beta/models?key=${apiKey}`;

    console.log(`Checking endpoint: ${endpoint.replace(apiKey, 'REDACTED')}`);

    try {
        const resp = await fetch(endpoint);
        if (!resp.ok) {
            const text = await resp.text();
            console.error(`Error ${resp.status}: ${text}`);
            return;
        }

        const data = await resp.json();
        console.log('Available Models:');
        data.models.forEach(m => {
            console.log(`- ${m.name} (supports: ${m.supportedGenerationMethods.join(', ')})`);
        });
    } catch (error) {
        console.error('Fetch failed:', error);
    }
}

listModels();
