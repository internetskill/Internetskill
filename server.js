const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// बड़ी फाइलों और इमेजेस के लिए 50mb की लिमिट
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

const postsFile = './posts.json';

if (!fs.existsSync(postsFile)) fs.writeFileSync(postsFile, JSON.stringify([]));

// --- राउट्स (Routes) ---

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/post/:id', (req, res) => res.sendFile(path.join(__dirname, 'post.html')));

// --- SEO राउट्स (Google Search के लिए) ---
app.get('/robots.txt', (req, res) => res.sendFile(path.join(__dirname, 'robots.txt')));
app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap.xml')));

// --- नए लीगल राउट्स (AdSense Approval के लिए ज़रूरी) ---
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'about.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'contact.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'privacy.html')));
app.get('/disclaimer', (req, res) => res.sendFile(path.join(__dirname, 'disclaimer.html')));

// एडमिन लॉगिन
app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '1234') {
        res.sendFile(path.join(__dirname, 'dashboard.html'));
    } else {
        res.send('Wrong Password! <a href="/login">Try Again</a>');
    }
});

// नई पोस्ट जोड़ना
app.post('/add-post', (req, res) => {
    try {
        const posts = JSON.parse(fs.readFileSync(postsFile));
        const newPost = {
            id: Date.now(),
            title: req.body.title,
            img: req.body.img,
            link: req.body.link || "#",
            desc: req.body.desc, 
            category: req.body.category
        };
        posts.push(newPost);
        fs.writeFileSync(postsFile, JSON.stringify(posts));

        res.send(`
            <html>
            <body style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #f0f2f5; margin: 0;">
                <div style="background: white; padding: 50px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center;">
                    <h1 style="color: #2ecc71; font-size: 60px; margin: 0;">✅</h1>
                    <h2 style="color: #333; margin-top: 10px;">Post Published Successfully!</h2>
                    <a href="/login" style="display: inline-block; margin-top: 25px; padding: 12px 30px; background: #00d4ff; color: white; text-decoration: none; border-radius: 10px; font-weight: bold;">Back to Dashboard</a>
                </div>
            </body>
            </html>
        `);
    } catch (e) {
        res.status(500).send("Error saving post.");
    }
});

// अपडेट पोस्ट रूट
app.post('/update-post/:id', (req, res) => {
    try {
        const posts = JSON.parse(fs.readFileSync(postsFile));
        const id = req.params.id;
        const index = posts.findIndex(p => p.id == id);

        if (index !== -1) {
            posts[index] = {
                ...posts[index],
                title: req.body.title,
                img: req.body.img,
                link: req.body.link || "#",
                desc: req.body.desc,
                category: req.body.category
            };
            fs.writeFileSync(postsFile, JSON.stringify(posts));
            res.sendStatus(200); 
        } else {
            res.status(404).send("Post not found");
        }
    } catch (e) {
        res.status(500).send("Error updating post.");
    }
});

// पोस्ट डिलीट करना
app.post('/delete-post/:id', (req, res) => {
    let posts = JSON.parse(fs.readFileSync(postsFile));
    posts = posts.filter(p => p.id != req.params.id);
    fs.writeFileSync(postsFile, JSON.stringify(posts));
    res.send('Deleted');
});

// सर्वर चालू करें
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Server is running at http://localhost:' + PORT);
});