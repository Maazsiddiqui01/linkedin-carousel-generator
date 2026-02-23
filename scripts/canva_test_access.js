import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN_PATH = path.join(__dirname, 'canva_tokens.json');

async function testAccess() {
    if (!fs.existsSync(TOKEN_PATH)) {
        console.error('Tokens not found. Run canva_auth.js first.');
        return;
    }

    const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    const accessToken = tokenData.access_token;

    console.log('Testing access with token...');

    try {
        // 1. Get Brand Templates (to check scope and access)
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
                console.log('Templates found. Writing first 5 to templates.json...');
                const templates = data.items.slice(0, 5).map(item => ({
                    title: item.title,
                    id: item.id
                }));
                fs.writeFileSync(path.join(__dirname, 'templates.json'), JSON.stringify(templates, null, 2));
                console.log('Templates saved to templates.json');
            } else {
                console.log('No brand templates found. You need to create one in Canva first.');
            }
        } else {
            console.error('Access Failed:', data);
        }

        // 2. Check User Profile (basic check)
        const profileResponse = await fetch('https://api.canva.com/rest/v1/users/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const profileData = await profileResponse.json();
        console.log('Profile Response Status:', profileResponse.status);
        if (profileResponse.ok) {
            console.log('User Profile Access SUCCESS!');
            console.log('User ID:', profileData.team_user.user_id);
        } else {
            console.error('Profile Access Failed:', profileData);
        }

        // 3. Create Blank Design (Presentation)
        console.log('Attempting to create a blank presentation...');
        const createResponse = await fetch('https://api.canva.com/rest/v1/designs', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                design_type: {
                    type: "preset",
                    name: "presentation"
                },
                title: "AI Generated Presentation Prototype"
            })
        });

        const createData = await createResponse.json();
        console.log('Create Design Status:', createResponse.status);

        if (createResponse.ok) {
            console.log('Design Creation SUCCESS!');
            console.log('Design ID:', createData.design.id);
            console.log('Edit URL:', createData.design.urls.edit_url);
        } else {
            console.error('Design Creation Failed:', createData);
        }


    } catch (error) {
        console.error('Test script error:', error);
    }
}

testAccess();
