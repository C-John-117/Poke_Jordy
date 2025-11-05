// Service d'authentification
class AuthService {
    constructor() {
        this.apiBase = `${CONFIG.API_BASE_URL}/Auth`;
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBase}/Login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    Email: email,      // Majuscule pour correspondre au backend
                    Password: password 
                })
            });
            
            if (!response.ok) {
                let errorMessage = "Erreur de connexion";
                
                // Gérer les différents codes d'erreur
                switch (response.status) {
                    case 401:
                        errorMessage = "Email ou mot de passe incorrect";
                        break;
                
                    default:
                        const data = await response.text().catch(() => null);
                        errorMessage = data || errorMessage;
                }
                
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            
            // Stocker l'email au lieu d'un token
            localStorage.setItem('userEmail', data.email);
            localStorage.setItem('userData', JSON.stringify(data));
            
            return data;
        } catch (error) {
            console.error('Erreur de login:', error);
            throw error;
        }
    }

    async register(email, password, username, heroName) {
        try {
            const response = await fetch(`${this.apiBase}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    Email: email,
                    Password: password,
                    Pseudo: username,
                    NomHeros: heroName
                })
            });
            
            if (!response.ok) {
                let errorMessage = "Erreur lors de la création du compte";
                
                // Gérer les différents codes d'erreur
                switch (response.status) {
                    case 400:
                        errorMessage = "Données invalides. Vérifiez vos informations.";
                        break;
                    case 409:
                        errorMessage = "Cet email est déjà utilisé";
                        break;
                    default:
                        const data = await response.text().catch(() => null);
                        errorMessage = data || errorMessage;
                }
                
                throw new Error(errorMessage);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            throw error;
        }
    }

    async logout() {
        try {
            const email = this.getUserEmail();
            if (email) {
                await fetch(`${this.apiBase}/logout`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ Email: email })
                });
            }
        } catch (error) {
            console.error('Erreur de logout côté serveur:', error);
        } finally {
            // Nettoie toujours le localStorage même en cas d'erreur
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userData');
        }
    }

    isAuthenticated() {
        return !!localStorage.getItem('userEmail');
    }

    getUserEmail() {
        return localStorage.getItem('userEmail');
    }

    getUserData() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }

    // Méthode utilitaire pour créer les en-têtes avec email
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json'
        };
    }

    // Méthode pour créer le body avec email pour les requêtes authentifiées
    createAuthBody(additionalData = {}) {
        const email = this.getUserEmail();
        if (!email) {
            throw new Error('Utilisateur non authentifié');
        }
        return {
            Email: email,
            ...additionalData
        };
    }
}

// Export pour être utilisé dans d'autres fichiers
window.AuthService = AuthService;