module.exports = async function(context) {
    const { file, meta, tenantConfig } = context;

    console.log(`\n--- ⚡ ACTION SPÉCIFIQUE CLIENT : ${tenantConfig.name} ---`);
    console.log(`[Traitement] Fichier reçu : ${file.originalname}`);
    
    // CORRECTION ICI : On utilise la clé spécifique définie dans le YAML (en minuscule)
    // Le header x-meta-codeprojet devient la clé 'codeprojet'
    const reference = meta.codeprojet || 'AUCUNE RÉFÉRENCE';

    console.log(`[Données] Code Projet reçu : ${reference}`);
    
    // Logique métier adaptée
    if (reference.startsWith('URG')) {
        console.log("🚨 ALERTE : Projet Urgent détecté !");
    }
    console.log("----------------------------------------------------\n");
};