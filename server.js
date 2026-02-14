const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Render Disk Path (Data loss se bachne ke liye)
const DATA_DIR = '/data';
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Database Files Path
const postsFile = path.join(DATA_DIR, 'posts.json');
const passFile = path.join(DATA_DIR, 'password.json');

// बड़ी फाइलों और इमेजेस के लिए 50mb की लिमिट
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

// Initial Files Setup inside Persistent Disk
if (!fs.existsSync(postsFile)) fs.writeFileSync(postsFile, JSON.stringify([]));
if (!fs.existsSync(passFile)) fs.writeFileSync(passFile, JSON.stringify({ password: "1234" }));

function getAdminPassword() {
    const data = JSON.parse(fs.readFileSync(passFile));
    return data.password;
}

// --- राउट्स (Routes) ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/post/:id', (req, res) => res.sendFile(path.join(__dirname, 'post.html')));
app.get('/robots.txt', (req, res) => res.sendFile(path.join(__dirname, 'robots.txt')));
app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap.xml')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'about.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'contact.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'privacy.html')));
app.get('/disclaimer', (req, res) => res.sendFile(path.join(__dirname, 'disclaimer.html')));

app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;
    const currentPass = getAdminPassword();
    if (username === 'admin' && password === currentPass) {
        res.sendFile(path.join(__dirname, 'dashboard.html'));
    } else {
        res.send('Wrong Password! <a href="/login">Try Again</a>');
    }
});

app.post('/change-password', (req, res) => {
    const { oldPass, newPass } = req.body;
    const currentPass = getAdminPassword();
    if (oldPass === currentPass) {
        fs.writeFileSync(passFile, JSON.stringify({ password: newPass }));
        res.json({ success: true });
    } else {
        res.json({ success: false, message: "Purana password galat hai!" });
    }
});

app.post('/add-post', (req, res) => {
    try {
        const posts = JSON.parse(fs.readFileSync(postsFile));
        const newPost = { id: Date.now(), ...req.body }; // Title, Img, Link, Desc, Category, SEO Keywords, Meta Desc, Ads
        posts.push(newPost);
        fs.writeFileSync(postsFile, JSON.stringify(posts));
        res.json({ success: true, message: "Post Published!" });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

app.post('/update-post/:id', (req, res) => {
    try {
        const posts = JSON.parse(fs.readFileSync(postsFile));
        const id = req.params.id;
        const index = posts.findIndex(p => p.id == id);
        if (index !== -1) {
            posts[index] = { ...posts[index], ...req.body };
            fs.writeFileSync(postsFile, JSON.stringify(posts));
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false });
        }
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

app.post('/delete-post/:id', (req, res) => {
    try {
        let posts = JSON.parse(fs.readFileSync(postsFile));
        posts = posts.filter(p => p.id != req.params.id);
        fs.writeFileSync(postsFile, JSON.stringify(posts));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});