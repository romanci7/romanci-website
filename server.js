// server.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middlewares
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Your HTML/CSS/JS files folder

// Load vouches
const vouchFile = './vouches.json';
let vouches = [];
if (fs.existsSync(vouchFile)) {
  vouches = JSON.parse(fs.readFileSync(vouchFile, 'utf8'));
}

// Save vouches
function saveVouches() {
  fs.writeFileSync(vouchFile, JSON.stringify(vouches, null, 2));
}

// API: get all vouches
app.get('/api/vouches', (req, res) => {
  res.json(vouches);
});

// API: submit a new vouch
app.post('/api/vouch', (req, res) => {
  const { name, message, ip } = req.body;
  const now = Date.now();

  // Check if same IP has submitted in last 12h
  const lastVouch = vouches.filter(v => v.ip === ip).sort((a,b) => b.time - a.time)[0];
  if(lastVouch && now - lastVouch.time < 12*60*60*1000){
    return res.status(429).json({ error: "You can only submit 1 vouch per 12 hours" });
  }

  const newVouch = {
    id: vouches.length ? vouches[vouches.length-1].id +1 : 1,
    name,
    message,
    ip,
    time: now,
    approved: false
  };
  vouches.push(newVouch);
  saveVouches();
  res.json({ success: true });
});

// API: approve vouch
app.post('/api/vouch/:id/approve', (req, res) => {
  const id = parseInt(req.params.id);
  const vouch = vouches.find(v => v.id === id);
  if(!vouch) return res.status(404).json({ error: "Vouch not found" });
  vouch.approved = true;
  saveVouches();
  res.json({ success: true });
});

// API: delete vouch
app.delete('/api/vouch/:id', (req, res) => {
  const id = parseInt(req.params.id);
  vouches = vouches.filter(v => v.id !== id);
  saveVouches();
  res.json({ success: true });
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
