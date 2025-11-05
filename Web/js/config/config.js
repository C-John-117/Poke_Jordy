// Configuration de l'application
const CONFIG = {
    // URL de base de l'API
    //API_BASE_URL: "http://localhost:5123/api" // pour MacOs
    API_BASE_URL: "https://localhost:7295/api" // pour Windows
};

// Exporter pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG };
}
