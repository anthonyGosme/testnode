const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  })
});

app.post('/upload', upload.single('file'), (req, res) => {
  const description = req.headers['x-file-description'] 
    ? decodeURIComponent(req.headers['x-file-description']) 
    : "Aucune description";

  console.log("📥 Fichier:", req.file.originalname);
  console.log("📝 Description:", description);

  // Sauvegarde méta
  fs.writeFileSync(req.file.path + '.meta.json', JSON.stringify({
    originalName: req.file.originalname,
    description,
    uploadDate: new Date().toISOString()
  }, null, 2));

  res.json({
    name: req.file.originalname,
    url: `http://localhost:${PORT}/uploads/${req.file.filename}`
  });
});

app.listen(PORT, () => console.log(`✅ http://localhost:${PORT}`));