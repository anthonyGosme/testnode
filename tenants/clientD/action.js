// Correction pour tenants/clientD/action.js
module.exports = async function(context) {
    const { file, meta } = context;
    
    // Les clés sont en minuscules !
    const ref = meta.refdossier || 'Inconnu'; 
    const user = meta['ctx-userlogin'] || 'Anonyme';

    console.log(`Dossier ${ref} reçu de ${user}`);
};