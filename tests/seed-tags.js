const db = require('../Database');

const presetTags = [
    "React.js", "Next.js", "Vue.js", "Angular", "Svelte", "Django", "Flask", "Laravel", "Node.js", "Express", "FastAPI", "GraphQL", "REST API", "WebSockets", "PostgreSQL", "MongoDB", "MySQL", "Firebase", "Redis", "Supabase", "Machine Learning", "Deep Learning", "Natural Language Processing (NLP)", "Computer Vision", "LLM", "OpenAI API", "LangChain", "Stable Diffusion", "Prompt Engineering", "TensorFlow", "PyTorch", "Scikit-learn", "OpenCV", "Hugging Face", "Pandas", "Sentiment Analysis", "Object Detection", "Recommender Systems", "Predictive Modeling", "Arduino", "Raspberry Pi", "ESP32", "Jetson Nano", "STM32", "IoT", "MQTT", "LoRaWAN", "Bluetooth (BLE)", "Zigbee", "NFC/RFID", "Sensors", "Actuators", "Embedded Systems", "PCB Design", "Robotics", "AWS", "Azure", "Google Cloud (GCP)", "Heroku", "Vercel", "Docker", "Kubernetes", "CI/CD", "GitHub Actions", "Terraform", "Blockchain", "Solidity", "Web3", "AR/VR", "Unity", "Cybersecurity", "FinTech", "HealthTech", "EdTech", "E-commerce", "Agriculture", "Smart Home", "Management System", "Dashboard", "Automation", "Accessibility", "Data Visualization"
];

async function seedTags() {
    try {
        console.log('Seeding tags into the database...');

        let insertedCount = 0;
        let skippedCount = 0;

        for (const tagName of presetTags) {
            // we use ON CONFLICT DO NOTHING to ignore duplicate tags
            const result = await db.query(
                `INSERT INTO Tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING tag_id;`,
                [tagName]
            );

            if (result.rowCount > 0) {
                insertedCount++;
            } else {
                skippedCount++;
            }
        }

        console.log(`✅ Tag seeding completed! Inserted: ${insertedCount}, Skipped (already exists): ${skippedCount}`);
    } catch (error) {
        console.error('❌ Error seeding tags:', error);
    } finally {
        process.exit(0);
    }
}

seedTags();
