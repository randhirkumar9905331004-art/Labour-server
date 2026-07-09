const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '50mb' }));

// डेटा स्टोर करने के लिए लोकल फाइल या डेटाबेस (आप यहाँ MongoDB का भी उपयोग कर सकते हैं)
const DATA_FILE = './cloud_database.json';

function readData() {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 1. रजिस्ट्रेशन एपीआई (Register User)
app.post('/api/register', (req, res) => {
    const { name, email, mobile, companyName, passwordHash, language, isDarkMode } = req.body;
    const db = readData();

    if (db[email] || db[mobile]) {
        return res.status(400).json({ success: false, message: "User already exists with this Email or Mobile!" });
    }

    db[email] = {
        user: { name, email, mobile, companyName, passwordHash, language, isDarkMode },
        data: null
    };
    db[mobile] = db[email]; // दोनों से लॉगिन लिंक करें

    writeData(db);
    res.json({ success: true, message: "Registration successful on cloud!" });
});

// 2. लॉगिन एपीआई (Login User & Get Synced Data)
app.post('/api/login', (req, res) => {
    const { emailOrMobile, passwordHash } = req.body;
    const db = readData();
    const account = db[emailOrMobile];

    if (!account || account.user.passwordHash !== passwordHash) {
        return res.status(401).json({ success: false, message: "Invalid email/mobile or password!" });
    }

    res.json({
        success: true,
        user: account.user,
        data: account.data
    });
});

// 3. सिंक एपीआई (Sync / Backup Data)
app.post('/api/sync', (req, res) => {
    const { emailOrMobile, passwordHash, data } = req.body;
    const db = readData();
    const account = db[emailOrMobile];

    if (!account || account.user.passwordHash !== passwordHash) {
        return res.status(401).json({ success: false, message: "Authentication failed!" });
    }

    account.data = data; // नया बैकअप सुरक्षित करें
    writeData(db);

    res.json({ success: true, message: "Sync successful!", data: account.data });
});

app.listen(PORT, () => {
    console.log(`Cloud Sync Server is running on port ${PORT}`);
});