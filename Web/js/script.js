// === Application RPG avec Authentification ===

let authManager = null;
let gameManager = null;
let isAuthenticated = false;

try { const themeManager = new ThemeManager(); themeManager.init(); } catch (e) {}

// === Initialisation de l'application ===
document.addEventListener('DOMContentLoaded', async () => {
  // Réactiver l'authentification
  authManager = new AuthManager();
  window.authManager = authManager; // Rendre accessible globalement
  isAuthenticated = authManager.init();
  
  if (isAuthenticated) {
  // — Theme —
  const themeManager = new ThemeManager();
  themeManager.init();

  // — Simulateur de combat —
  window.combatSimulator = new CombatSimulator(new PersonnageService());
  await window.combatSimulator.init();
  const openBtn = document.getElementById("btnOpenSimulator");
  openBtn?.addEventListener("click", () => window.combatSimulator.open());

    // L'utilisateur est connecté, initialiser l'app
    initializeGame();
  }
  // Sinon, l'interface d'auth sera affichée automatiquement
});

// Fonction pour initialiser le jeu après authentification
async function initializeGame() {
  // Réactiver le bouton de déconnexion
  addLogoutButton();
  
  // Initialiser le gestionnaire de jeu
  gameManager = new GameManager();
  await gameManager.init();
  
  // Rendre le gameManager accessible globalement pour le debug
  window.gameManager = gameManager;
  
  console.log('Jeu initialisé avec succès !');
}

// Ajouter un bouton de déconnexion
function addLogoutButton() {
  const header = document.querySelector('header');
  if (header && !document.getElementById('logoutBtn')) {
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logoutBtn';
    logoutBtn.className = 'btn btn-danger';
    logoutBtn.textContent = '🚪 Déconnexion';
    logoutBtn.style.position = 'absolute';
    logoutBtn.style.top = '1rem';
    logoutBtn.style.right = '1rem';
    
    logoutBtn.addEventListener('click', () => {
      if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        authManager.logout();
      }
    });
    
    header.style.position = 'relative';
    header.appendChild(logoutBtn);
  }
}

// Fonction pour redémarrer l'app après authentification
async function restartAfterAuth() {
  isAuthenticated = true;
  await initializeGame();
}

// Rendre la fonction accessible globalement
window.restartAfterAuth = restartAfterAuth;

// === FONCTIONS UTILITAIRES GLOBALES ===

// Obtenir les statistiques du jeu
function getGameStats() {
  if (gameManager) {
    return gameManager.getGameStats();
  }
  return null;
}

// Rafraîchir le jeu
async function refreshGame() {
  if (gameManager) {
    await gameManager.refresh();
  }
}

// Rendre les fonctions utilitaires accessibles globalement
window.getGameStats = getGameStats;
window.refreshGame = refreshGame;

