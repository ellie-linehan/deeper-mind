const fs = require('fs');
const path = require('path');

async function listModels() {
    try {
        const envPath = path.join(__dirname, '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error(".env.local not found");
            return;
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        let apiKey = '';
        for (const line of lines) {
            if (line.trim().startsWith('NEXT_PUBLIC_GEMINI_API_KEY=')) {
                apiKey = line.split('=')[1].trim();
                break;
            }
        }

        if (!apiKey) {
            console.error("No API KEY found");
            return;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            console.error(`HTTP Error: ${response.status}`);
            return;
        }

        const data = await response.json();

        console.log("MODELS:");
        if (data.models) {
            data.models.forEach(m => {
                // Check for generateContent support
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    let name = m.name.replace('models/', '');
                    console.log(name);
                }
            });
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
