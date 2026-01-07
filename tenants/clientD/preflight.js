// tenants/clientD/preflight.js

window.runPreflight = function() {
    console.log("🔒 Démarrage de la séquence d'authentification...");

    // On retourne une PROMESSE. Le formulaire Form.io ne chargera pas
    // tant que l'on n'appelle pas resolve().
    return new Promise((resolve, reject) => {

        // 1. Création du HTML de la modale (Login Page Mock)
        const modal = document.createElement('div');
        modal.id = 'auth-modal';
        modal.innerHTML = `
            <style>
                #auth-modal {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: #f1f5f9; z-index: 9999;
                    display: flex; align-items: center; justify-content: center;
                    font-family: 'Segoe UI', sans-serif;
                }
                .auth-card {
                    background: white; padding: 2.5rem; border-radius: 12px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    width: 100%; max-width: 400px; text-align: center;
                }
                .auth-title { margin-bottom: 1.5rem; color: #0f172a; font-size: 1.5rem; font-weight: bold; }
                .auth-input {
                    width: 100%; padding: 0.75rem; margin-bottom: 1rem;
                    border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box;
                }
                .auth-btn {
                    width: 100%; padding: 0.75rem; background: #0f172a; color: white;
                    border: none; border-radius: 6px; font-weight: 600; cursor: pointer;
                    transition: background 0.2s;
                }
                .auth-btn:hover { background: #334155; }
                .error-msg { color: #ef4444; font-size: 0.875rem; margin-top: 1rem; display: none; }
            </style>

            <div class="auth-card">
                <div class="auth-title">🔒 Connexion Requise</div>
                <p style="color:#64748b; margin-bottom:20px; font-size:0.9em;">Veuillez vous identifier pour accéder au formulaire de dépôt.</p>
                
                <input type="text" id="login-user" class="auth-input" placeholder="Identifiant (ex: admin)" autocomplete="off">
                <input type="password" id="login-pass" class="auth-input" placeholder="Mot de passe (ex: 1234)">
                
                <button id="btn-connect" class="auth-btn">Se connecter</button>
                <div id="error-msg" class="error-msg">Identifiants incorrects (Essayez admin/1234)</div>
            </div>
        `;

        // 2. Injection dans la page
        document.body.appendChild(modal);

        // 3. Gestion du click "Se connecter"
        const btn = document.getElementById('btn-connect');
        const errorMsg = document.getElementById('error-msg');
        const loginInput = document.getElementById('login-user');
        const passInput = document.getElementById('login-pass');

        btn.addEventListener('click', () => {
            const user = loginInput.value;
            const pass = passInput.value;

            // --- SIMULATION D'UNE VÉRIFICATION ---
            if (user === 'admin' && pass === '1234') {
                
                // A. On retire la modale
                modal.style.opacity = '0';
                setTimeout(() => modal.remove(), 300); // Petite animation

                // B. On RÉSOUT la promesse avec les métadonnées
                // Ces données iront dans le formulaire ET dans les headers
                console.log("🔓 Authentification réussie !");
                
                resolve({
                    userLogin: user,           // Sera injecté dans le champ 'userLogin' du form
                    auth_timestamp: Date.now(),
                    session_id: 'SESS-' + Math.floor(Math.random() * 10000)
                });

            } else {
                // Erreur
                errorMsg.style.display = 'block';
                passInput.value = '';
                passInput.focus();
            }
        });
    });
};