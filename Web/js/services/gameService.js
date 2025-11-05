// Service pour les appels API du jeu
class GameService {
    constructor() {
        this.API_BASE = CONFIG.API_BASE_URL + "/Tuiles";
    }

    // === APPELS API POUR LES TUILES ===

    /**
     * Récupérer les données d'une tuile depuis l'API
     * @param {number} x - Position X de la tuile
     * @param {number} y - Position Y de la tuile
     * @returns {Promise<Object>} - Données de la tuile
     */
    async fetchTileData(x, y) {
        try {
            const response = await fetch(`${this.API_BASE}/${x}/${y}`);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Erreur lors de la récupération de la tuile (${x}, ${y}):`, error);
            throw error;
        }
    }

    // === MÉTHODES UTILITAIRES ===
    /**
     * Tester la connexion à l'API
     * @returns {Promise<boolean>} - true si l'API répond
     */
    async testApiConnection() {
        try {
            const response = await fetch(`${this.API_BASE}/0/0`);
            return response.status !== 0; // Retourne true si on a une réponse (même une erreur HTTP)
        } catch (error) {
            console.error('Impossible de se connecter à l\'API:', error);
            return false;
        }
    }
}

// Export pour être utilisé dans d'autres fichiers
window.GameService = GameService;
