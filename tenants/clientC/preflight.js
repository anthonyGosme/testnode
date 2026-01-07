console.log("⚡ Le fichier preflight est bien chargé !");

window.runPreflight = async function() {
    console.log("⚡ Exécution de la logique preflight...");
    const urlParams = new URLSearchParams(window.location.search);
    const meta = {};
    if (urlParams.has('refDossier')) {
        meta['refDossier'] = urlParams.get('refDossier');
    }
    return meta;
};