import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN_PATH = path.join(__dirname, 'canva_tokens.json');

async function listTemplates() {
    if (!fs.existsSync(TOKEN_PATH)) {
        console.error('Tokens not found. Run canva_auth.js first.');
        return;
    }

    const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    const accessToken = tokenData.access_token;

    console.log('Fetching brand templates...');

    try {
        const response = await fetch('https://api.canva.com/rest/v1/brand-templates', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();

        console.log('Response Status:', response.status);

        if (response.ok) {
            console.log('Brand Templates Access SUCCESS!');
            console.log('Templates found:', data.items ? data.items.length : 0);

            if (data.items && data.items.length > 0) {
                const templates = data.items.map(item => ({
                    title: item.title,
                    id: item.id,
                    url: item.view_url
                }));
                const templatesPath = path.join(__dirname, 'brand_templates.json');
                fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
                console.log(`Saved ${templates.length} templates to ${templatesPath}`);
            } else {
                console.log('No brand templates found in this team.');
            }
        } else {
            console.error('Failed to list templates:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Error fetching templates:', error);
    }
}

listTemplates();
