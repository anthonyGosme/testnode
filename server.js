const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const app = express();
const PORT = 3000;

// Configuration EJS
app.set('view engine', 'ejs');
app.use(express.json());
const cors = require('cors');
app.use(cors()); // Autorise tout le monde (Ok pour un POC)
app.use(express.urlencoded({ extended: true }));

// --- 1. Chargement de la configuration Tenants ---
const CONFIG_PATH = path.join(__dirname, 'config', 'tenants.yaml');
let tenantsConfig = {};

try {
    const fileContents = fs.readFileSync(CONFIG_PATH, 'utf8');
    const doc = yaml.load(fileContents);
    tenantsConfig = doc.tenants;
    console.log("✅ Configuration Tenants chargée:", Object.keys(tenantsConfig));
} catch (e) {
    console.error("❌ Erreur lecture YAML:", e);
    process.exit(1);
}

// --- 2. Middleware de Résolution de Tenant ---
const resolveTenant = (req, res, next) => {
    const host = req.get('host'); // ex: alpha:3000
    const urlParts = req.path.split('/'); // ex: ['', 'client-a', 'upload']
    
    let tenantId = null;
    let uploadUrlBase = "";

    // A. Détection par Sous-domaine (Host)
    // On cherche un tenant dont le match.subdomain correspond au début du host
    for (const [id, config] of Object.entries(tenantsConfig)) {
        if (host.startsWith(config.match.subdomain) && host !== 'localhost') {
            tenantId = id;
            uploadUrlBase = ""; // Racine car on est sur le sous-domaine
            break;
        }
    }

    // B. Détection par Path (si pas trouvé par host)
    if (!tenantId && urlParts.length > 1) {
        const firstSegment = urlParts[1];
        for (const [id, config] of Object.entries(tenantsConfig)) {
            if (config.match.path === firstSegment) {
                tenantId = id;
                uploadUrlBase = `/${firstSegment}`; // On garde le préfixe
                break;
            }
        }
    }

    if (tenantId && tenantsConfig[tenantId].active) {
        req.tenantId = tenantId;
        req.tenant = tenantsConfig[tenantId];
        req.uploadUrlBase = uploadUrlBase;
        next();
    } else {
        res.status(404).send("Tenant non trouvé ou inactif.");
    }
};

// --- 3. Configuration Multer Dynamique ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Isolation : dossier uploads/ID_CLIENT/
        const dir = path.join(__dirname, 'uploads', req.tenantId);
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- 4. Routes ---
app.get(['/preflight.js', '/:pathPrefix/preflight.js'], resolveTenant, (req, res) => {
    const tenant = req.tenant;

    // CORRECTION : On regarde dans tenant.paths.preflight
    if (!tenant.paths || !tenant.paths.preflight) {
        return res.status(404).send('// No preflight script configured');
    }

    const absolutePath = path.resolve(__dirname, tenant.paths.preflight);

    res.sendFile(absolutePath, (err) => {
        if (err) {
            console.error(`Erreur chargement preflight:`, err);
            res.status(404).send('// File not found');
        }
    });
});

app.get(['/', '/:pathPrefix'], resolveTenant, (req, res) => {
    // Si l'utilisateur tape /client-a, le middleware l'a détecté.
    // Si l'utilisateur tape / (sur sous-domaine), le middleware l'a détecté.
    
    // Si on est sur localhost et qu'on tape juste /, on ne sait pas qui c'est
    if (!req.tenantId && req.path === '/') return res.send("Veuillez utiliser une URL client.");

    try {
        // Lecture du JSON spécifique au client
        const formJsonPath = path.join(__dirname, req.tenant.paths.form);
        let formSchema = JSON.parse(fs.readFileSync(formJsonPath, 'utf8'));

        // Injection de l'URL d'upload correcte
        const fullUploadUrl = `${req.uploadUrlBase}/upload`;
        
        // Remplacement dynamique dans le JSON (Stringify -> Replace -> Parse)
        let jsonString = JSON.stringify(formSchema);
        jsonString = jsonString.replace('{{UPLOAD_URL}}', fullUploadUrl);
        formSchema = JSON.parse(jsonString);

        // Rendu du wrapper
        res.render('layout', { 
            tenant: req.tenant,
            formSchema: formSchema,
            uploadUrl: fullUploadUrl,
            urlBase: req.uploadUrlBase,
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur chargement configuration formulaire.");
    }
});
// Route A : Affichage du formulaire (GET)
// Gère /client-a/ ou / (si sous-domaine)
// Route B : Traitement de l'upload (POST)
// On accepte /upload (sous-domaine) ou /client-a/upload (path)
app.post(['/upload', '/:pathPrefix/upload'], resolveTenant, upload.single('file'), async (req, res) => {
    
    // Récupération des métadonnées (Headers ou Body)
    const meta = {};
    Object.keys(req.headers).forEach(key => {
        if(key.startsWith('x-meta-')) {
            meta[key.replace('x-meta-', '')] = decodeURIComponent(req.headers[key]);
        }
    });

    // Sauvegarde Meta JSON
    const metaPath = req.file.path + '.meta.json';
    fs.writeFileSync(metaPath, JSON.stringify({
        originalName: req.file.originalname,
        metaData: meta,
        date: new Date()
    }, null, 2));

    // --- EXECUTION DU HOOK SPÉCIFIQUE ---
    if (req.tenant.paths.action) {
        try {
            const actionPath = path.join(__dirname, req.tenant.paths.action);
            if (fs.existsSync(actionPath)) {
                const clientAction = require(actionPath);
                
                // On passe le contexte
                await clientAction({
                    file: req.file,
                    meta: meta,
                    tenantConfig: req.tenant,
                    req: req
                });
            }
        } catch (error) {
            console.error("❌ Erreur exécution Hook Client:", error);
            // On ne bloque pas la réponse HTTP, mais on log l'erreur
        }
    }

    // Réponse compatible Form.io
    res.json({
        file: req.file.filename,
        url: `http://localhost:${PORT}/uploads/${req.tenantId}/${req.file.filename}` // URL simplifiée pour le POC
    });
});

app.get(['/logo.png', '/:pathPrefix/logo.png'], resolveTenant, (req, res) => {
    if (req.tenant.theme && req.tenant.theme.logo) {
        // On résout le chemin : ./tenants/clientB/logo.png
        const logoPath = path.resolve(__dirname, req.tenant.theme.logo);
        
        res.sendFile(logoPath, (err) => {
            if (err) res.status(404).send('Logo introuvable sur le serveur');
        });
    } else {
        res.status(404).send('Aucun logo configuré');
    }
});
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));