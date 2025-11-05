// Service pour gérer les personnages
class PersonnageService {
    constructor() {
        this.apiBase = `${CONFIG.API_BASE_URL}/Personnages`;
        this.authService = new AuthService();
    }

    async getMyPersonnage() {
        try {
            const response = await fetch(`${this.apiBase}/me`, {
                method: "POST",
                headers: this.authService.getAuthHeaders(),
                body: JSON.stringify(this.authService.createAuthBody())
            });

            if (!response.ok) {
                throw new Error('Impossible de récupérer le personnage');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération du personnage:', error);
            throw error;
        }
    }

    async move(x, y) {
        try {
            const response = await fetch(`${this.apiBase}/move`, {
                method: "POST",
                headers: this.authService.getAuthHeaders(),
                body: JSON.stringify(this.authService.createAuthBody({ X: x, Y: y }))
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Erreur de déplacement" }));
                throw new Error(errorData.message || "Déplacement impossible");
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors du déplacement:', error);
            throw error;
        }
    }

    async getVision() {
        try {
            const response = await fetch(`${this.apiBase}/vision`, {
                method: "POST",
                headers: this.authService.getAuthHeaders(),
                body: JSON.stringify(this.authService.createAuthBody())
            });

            if (!response.ok) {
                throw new Error('Impossible de récupérer la vision');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération de la vision:', error);
            throw error;
        }
    }
}

// Export pour être utilisé dans d'autres fichiers
window.PersonnageService = PersonnageService;