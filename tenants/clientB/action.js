module.exports = async function(context) {
    const { file, meta, tenantConfig } = context;

    console.log(`\n--- 👔 ACTION RH (${tenantConfig.name}) ---`);
    
    // Rappel : les headers arrivent en minuscules -> 'nomcandidat'
    const candidat = meta.nomcandidat || 'Inconnu';
    
    console.log(`[Candidature] CV reçu pour : ${candidat}`);
    console.log(`[Fichier] Stocké sous : ${file.filename}`);
    
    // Simulation d'une logique métier spécifique
    console.log(`>> Envoi automatique d'un email de confirmation à ${candidat}...`);
    console.log("----------------------------------------------------\n");
};