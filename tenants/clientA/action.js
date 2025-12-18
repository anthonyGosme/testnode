module.exports = async function(context) {
    const { file, meta, tenantConfig } = context;

    console.log(`\n--- ⚡ ACTION SPÉCIFIQUE CLIENT : ${tenantConfig.name} ---`);
    console.log(`[Traitement] Fichier reçu : ${file.originalname}`);
    console.log(`[Données] Référence Facture : ${meta.refFacture || 'N/A'}`);
    
    // Simulation d'une action métier (ex: appel API compta)
    if (meta.refFacture && meta.refFacture.startsWith('URG')) {
        console.log("🚨 ALERTE : Facture urgente détectée !");
    }
    console.log("----------------------------------------------------\n");
};