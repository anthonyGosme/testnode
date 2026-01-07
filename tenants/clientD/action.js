module.exports = async function(context) {
    const { file, meta, tenantConfig } = context;

    console.log(`\n--- ⚡ ACTION SPÉCIFIQUE CLIENT : ${tenantConfig.name} ---`);
    console.log(`[Traitement] Fichier reçu : ${file.originalname}`);
    const reference = meta.refDossier || 'AUCUNE RÉFÉRENCE';
    console.log(`reference : ${reference}`);
    
    // Simulation d'une logique métier spécifique
    if (reference.startsWith('URG')) {
        console.log("🚨 ALERTE : Projet Urgent détecté !");
    }
    console.log("----------------------------------------------------\n");
};