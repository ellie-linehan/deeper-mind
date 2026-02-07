const fs = require('fs');
const path = require('path');

// Basic env parser
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

async function listModels() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found");
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${text}`);
        }
        const data = await response.json();

        let output = "Available Models:\n";
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    output += `- ${m.name}\n`;
                }
            });
        } else {
            output += "No models found.\n";
        }
        fs.writeFileSync('models_list.txt', output, 'utf8');
        console.log("Wrote models to models_list.txt");
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
