// Gestionnaire d'authentification
class AuthManager {
    constructor() {
        this.authService = new AuthService();
        this.currentView = 'login'; // 'login' ou 'register'
    }

    // Initialiser le gestionnaire d'auth
    init() {
        // Vérifier si l'utilisateur est déjà connecté
        const isAuth = this.authService.isAuthenticated();
        
        if (isAuth) {
            return true; // L'utilisateur peut accéder à l'app
        }
        
        // Afficher l'interface d'authentification
        this.showAuthInterface();
        return false; // L'utilisateur doit s'authentifier
    }

    // Afficher l'interface d'authentification
    async showAuthInterface() {
        try {
            // Cacher le contenu principal
            const mainContent = document.querySelector('main');
            if (mainContent) {
                mainContent.style.display = 'none';
            }

            // Charger et afficher la vue de login
            await this.loadAuthView('login');
        } catch (error) {
            console.error('Erreur lors du chargement de l\'interface auth:', error);
        }
    }

    // Charger une vue d'authentification
    async loadAuthView(viewType) {
        try {
            const response = await fetch(`views/${viewType}.html`);
            const html = await response.text();
            
            // Créer ou mettre à jour le container d'auth
            let authContainer = document.getElementById('authContainer');
            if (!authContainer) {
                authContainer = document.createElement('div');
                authContainer.id = 'authContainer';
                document.body.appendChild(authContainer);
            }
            
            authContainer.innerHTML = html;
            this.currentView = viewType;
            
            // Attacher les événements
            this.attachAuthEvents();
            
        } catch (error) {
            console.error(`Erreur lors du chargement de la vue ${viewType}:`, error);
        }
    }

    // Attacher les événements aux formulaires
    attachAuthEvents() {
        if (this.currentView === 'login') {
            this.attachLoginEvents();
        } else if (this.currentView === 'registration') {
            this.attachRegisterEvents();
        }
    }

    // Événements du formulaire de connexion
    attachLoginEvents() {
        const form = document.getElementById('loginForm');
        const showRegisterBtn = document.getElementById('showRegisterBtn');
        
        if (form) {
            form.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', () => {
                this.loadAuthView('registration');
            });
        }
    }

    // Événements du formulaire d'inscription
    attachRegisterEvents() {
        const form = document.getElementById('registerForm');
        const showLoginBtn = document.getElementById('showLoginBtn');
        
        if (form) {
            form.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', () => {
                this.loadAuthView('login');
            });
        }
    }

    // Gérer la soumission du formulaire de connexion
    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const submitBtn = document.getElementById('loginBtn');
        
        // Désactiver le bouton et afficher le chargement
        submitBtn.disabled = true;
        submitBtn.textContent = 'Connexion...';
        
        this.hideMessages();
        
        try {
            const loginData = await this.authService.login(email, password);
            
            // Sauvegarder les données d'authentification avec l'email
            this.saveAuthData(loginData, email);
            
            this.showSuccessMessage('loginSuccess', 'Connexion réussie ! Redirection...');
            
            // Attendre un peu et rediriger vers l'app
            setTimeout(() => {
                this.onAuthSuccess();
            }, 1500);
            
        } catch (error) {
            this.showErrorMessage('loginError', error.message || 'Erreur de connexion');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Se connecter';
        }
    }

    // Gérer la soumission du formulaire d'inscription
    async handleRegister(event) {
        event.preventDefault();
        
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const heroName = document.getElementById('heroName').value;
        const submitBtn = document.getElementById('registerBtn');
        
        // Vérifications côté client
        if (password !== confirmPassword) {
            this.showErrorMessage('registerError', 'Les mots de passe ne correspondent pas');
            return;
        }
        
        if (password.length < 6) {
            this.showErrorMessage('registerError', 'Le mot de passe doit contenir au moins 6 caractères');
            return;
        }
        
        // Désactiver le bouton et afficher le chargement
        submitBtn.disabled = true;
        submitBtn.textContent = 'Création...';
        
        this.hideMessages();
        
        try {
            await this.authService.register(email, password, username, heroName);
            
            this.showSuccessMessage('registerSuccess', 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
            
            // Attendre un peu et basculer vers le login
            setTimeout(() => {
                this.loadAuthView('login');
            }, 2000);
            
        } catch (error) {
            this.showErrorMessage('registerError', error.message || 'Erreur lors de la création du compte');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Créer le compte';
        }
    }

    // Afficher un message d'erreur
    showErrorMessage(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    // Afficher un message de succès
    showSuccessMessage(elementId, message) {
        const successElement = document.getElementById(elementId);
        if (successElement) {
            successElement.textContent = message;
            successElement.style.display = 'block';
        }
    }

    // Cacher tous les messages
    hideMessages() {
        const messages = document.querySelectorAll('.error-message, .success-message');
        messages.forEach(msg => msg.style.display = 'none');
    }

    saveAuthData(loginData, email = null) {
        try {
            // Sauvegarder le token
            if (loginData.token) {
                localStorage.setItem('authToken', loginData.token);
            }

            // Sauvegarder le personnage avec validation des propriétés
            if (loginData.personnage) {
                const personnage = loginData.personnage;
                const normalizedPlayer = this.normalizePlayerData(personnage, email);
                localStorage.setItem('currentPlayer', JSON.stringify(normalizedPlayer));
                console.log('Personnage sauvegardé:', normalizedPlayer);
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des données d\'auth:', error);
        }
    }

    // Normaliser les données du personnage selon le format attendu
    normalizePlayerData(playerData, email = null) {
        return {
            id: playerData.id || null,
            email: email || null, // Ajouter l'email pour l'API vision
            
            nom: playerData.nom || 'Joueur',
            niveau: parseInt(playerData.niveau || 1),
            experience: parseInt(playerData.experience || 0),

            pointDeVie: parseInt(playerData.pointVie || 100),
            pointDeVieMax: parseInt(playerData.pointVieMax || 100),
            force: parseInt(playerData.force || 10),
            defense: parseInt(playerData.defense || 10),

            positionX: parseInt(playerData.positionX || 0),
            positionY: parseInt(playerData.positionY || 0),
        };
    }

    // Récupérer le personnage actuel
    getCurrentPlayer() {
        try {
            const playerData = localStorage.getItem('currentPlayer');
            return playerData ? JSON.parse(playerData) : null;
        } catch (error) {
            console.error('Erreur lors de la récupération du personnage:', error);
            return null;
        }
    }

    // Vérifier si l'utilisateur est authentifié et a un personnage
    isFullyAuthenticated() {
        return this.authService.isAuthenticated() && this.getCurrentPlayer() !== null;
    }

    // Nettoyer toutes les données d'authentification
    clearAuthData() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentPlayer');
        localStorage.removeItem('discoveredTiles');
        console.log('🧹 Données d\'authentification nettoyées');
    }

    // Mettre à jour la position du joueur
    updatePlayerPosition(newX, newY) {
        try {
            const player = this.getCurrentPlayer();
            if (player) {
                player.positionX = parseInt(newX);
                player.positionY = parseInt(newY);
                localStorage.setItem('currentPlayer', JSON.stringify(player));
                console.log(`Position du joueur mise à jour: (${newX}, ${newY})`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la position:', error);
            return false;
        }
    }

    // Obtenir un résumé des stats du personnage
    getPlayerSummary() {
        const player = this.getCurrentPlayer();
        if (!player) return null;

        return {
            nom: player.nom,
            niveau: player.niveau,
            experience: player.experience,
            vie: `${player.pointDeVie}/${player.pointDeVieMax}`,
            position: `(${player.positionX}, ${player.positionY})`,
            stats: `Force: ${player.force}, Défense: ${player.defense}`,
            pourcentageVie: Math.round((player.pointDeVie / player.pointDeVieMax) * 100)
        };
    }

    // Appelé quand l'authentification est réussie
    onAuthSuccess() {
        // Supprimer l'interface d'auth
        const authContainer = document.getElementById('authContainer');
        if (authContainer) {
            authContainer.remove();
        }
        
        // Réafficher le contenu principal
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.style.display = 'block';
        }
        
        // Redémarrer l'application principale
        if (window.RPGApp && window.RPGApp.restartAfterAuth) {
            window.RPGApp.restartAfterAuth();
        } else {
            // Recharger la page si la méthode n'existe pas
            window.location.reload();
        }
    }

    // Déconnexion
    async logout() {
        try {
            await this.authService.logout();
            this.clearAuthData(); // Utiliser la nouvelle méthode
            // Recharger la page pour revenir à l'état initial
            window.location.reload();
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            // Forcer la déconnexion même en cas d'erreur
            this.clearAuthData();
            window.location.reload();
        }
    }
}

// Export pour être utilisé dans d'autres fichiers
window.AuthManager = AuthManager;
