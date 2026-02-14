const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// --- RENDER DISK SETUP (FIXED) ---
// Galti yahan thi. Hum '/data' folder create nahi kar sakte.
// Ye code ab sirf check karega.
let DATA_DIR;
if (fs.existsSync('/data')) {
    DATA_DIR = '/data'; // Agar Render Disk attached hai toh wahan save karo
    console.log("📂 Using Persistent Disk: /data");
} else {
    DATA_DIR = __dirname; // Agar Disk nahi hai (Free Tier), toh yahin save karo
    console.log("📂 Using Temporary Storage: " + __dirname);
}

const postsFile = path.join(DATA_DIR, 'posts.json');
const passFile = path.join(DATA_DIR, 'password.json');

// 50MB Limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- SAFE FILE FUNCTIONS ---
function getPostsSafe() {
    try {
        if (!fs.existsSync(postsFile)) {
            // Agar file nahi hai to empty array banayenge
            fs.writeFileSync(postsFile, JSON.stringify([]));
            return [];
        }
        const data = fs.readFileSync(postsFile, 'utf8');
        if (!data || data.trim() === "") return [];
        return JSON.parse(data);
    } catch (e) {
        console.log("⚠️ File Resetting...");
        fs.writeFileSync(postsFile, JSON.stringify([])); 
        return [];
    }
}

// Password Setup
if (!fs.existsSync(passFile)) {
    fs.writeFileSync(passFile, JSON.stringify({ password: "1234" }));
}

function getAdminPassword() {
    try {
        return JSON.parse(fs.readFileSync(passFile)).password;
    } catch (e) { return "1234"; }
}

// --- API ROUTES (Isse upar rakha hai taaki fast load ho) ---
app.get('/posts.json', (req, res) => {
    // Cache control taaki naya post turant dikhe
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json(getPostsSafe());
});

// --- STATIC FILES ---
app.use(express.static(__dirname));

// --- PAGES ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/dashboard', (req, res) => res.redirect('/login'));
app.get('/post/:id', (req, res) => res.sendFile(path.join(__dirname, 'post.html')));

// --- ACTIONS ---
app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === getAdminPassword()) {
        res.sendFile(path.join(__dirname, 'dashboard.html'));
    } else {
        res.send('<h2 style="color:red;text-align:center;margin-top:50px;">Wrong Password! <a href="/login">Try Again</a></h2>');
    }
});

app.post('/add-post', (req, res) => {
    try {
        const posts = getPostsSafe();
        const newPost = { id: Date.now(), ...req.body };
        posts.push(newPost);
        fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/update-post/:id', (req, res) => {
    try {
        const posts = getPostsSafe();
        const index = posts.findIndex(p => p.id == req.params.id);
        if (index !== -1) {
            posts[index] = { ...posts[index], ...req.body };
            fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));
            res.json({ success: true });
        } else { res.status(404).json({ success: false }); }
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/delete-post/:id', (req, res) => {
    try {
        let posts = getPostsSafe();
        posts = posts.filter(p => p.id != req.params.id);
        fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/change-password', (req, res) => {
    try {
        const { oldPass, newPass } = req.body;
        if (oldPass === getAdminPassword()) {
            fs.writeFileSync(passFile, JSON.stringify({ password: newPass }));
            res.json({ success: true });
        } else { res.json({ success: false, message: "Wrong Old Password" }); }
    } catch (e) { res.status(500).json({ success: false }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
