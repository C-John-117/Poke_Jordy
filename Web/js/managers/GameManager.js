// Gestionnaire du jeu principal
class GameManager {
    constructor() {
        // Services
        this.gameService = new GameService();
        this.personnageService = new PersonnageService();
        
        // Gestionnaire de grille
        this.grilleManager = new GrilleManager(this);
        
        // État du jeu
        this.isInitialized = false;
        this.isMoving = false; // Flag pour éviter les déplacements multiples
        
        // Position du personnage (coordonnées mondiales)
        // Sera initialisée depuis l'API lors de updatePlayerPosition()
        this.playerX = null;
        this.playerY = null;
        
        // Pour le simulateur de combat
        this.lastVisibleMonster = null;
        this.updateApiStatus();
    }

    // Initialiser le jeu
    async init() {
        console.log('Initialisation du GameManager...');
        
        // Récupérer la position du joueur depuis l'API
        await this.updatePlayerPosition();
        
        // Créer la grille de jeu via GrilleManager
        await this.grilleManager.createGrid();
        
        // Attacher les événements
        this.attachGameEvents();
        
        this.isInitialized = true;
        console.log('GameManager initialisé avec succès');
        
        // Afficher des informations sur la grille
        this.grilleManager.updateGridDisplay();
        this.updatePlayerInfo();
        this.updateMapInfo();
    }

    // === GESTION DE LA POSITION DU JOUEUR ===
    
    /**
     * Mettre à jour la position du joueur depuis l'API
     */
    async updatePlayerPosition() {
        const player = this.getCurrentPlayer();
        this.playerX = player.positionX ?? 25;
        this.playerY = player.positionY ?? 25;
        console.log(`Position du joueur: (${this.playerX}, ${this.playerY})`);
    }
    
    
    // === GESTION DES INFORMATIONS DU JOUEUR ===

    /**
     * Mettre à jour les informations du joueur dans la sidebar
     */
    updatePlayerInfo() {
        const player = this.getCurrentPlayer();
        if (!player) {
            console.warn('Aucun joueur trouvé pour mise à jour');
            return;
        }

        const hp = this.getPlayerHp();
        const stats = this.getPlayerStats();

        // Nom du joueur
        const nameElement = document.querySelector('#player-name');
        if (nameElement) {
            nameElement.textContent = `Nom : ${player.nom}`;
        }

        // Niveau
        const levelElement = document.querySelector('#player-level');
        if (levelElement) {
            levelElement.textContent = `Niveau : ${player.niveau || 1}`;
        }

        // Points de vie
        const hpElement = document.querySelector('#player-hp');
        if (hpElement) {
            hpElement.textContent = `PV : ${hp.current}/${hp.max} (${hp.percentage}%)`;
            // Changer la couleur selon le pourcentage de vie
            if (hp.percentage > 75) {
                hpElement.className = 'text-success';
            } else if (hp.percentage > 25) {
                hpElement.className = 'text-warning';
            } else {
                hpElement.className = 'text-danger';
            }
        }

        // Statistiques
        const statsElement = document.querySelector('#player-stats');
        if (statsElement) {
            statsElement.textContent = `Stats : Force ${stats.force} | Défense ${stats.defense}`;
        }
        
        // Expérience
        const expElement = document.querySelector('#player-exp');
        if (expElement) {
            expElement.textContent = `XP : ${player.experience || 0}`;
        }
    }

    /**
     * Mettre à jour les informations de la carte
     */
    updateMapInfo() {
        // Taille de la grille affichée
        const gridSizeElement = document.querySelector('#grid-size');
        if (gridSizeElement) {
            gridSizeElement.textContent = `Zone affichée : ${this.grilleManager.COLS} x ${this.grilleManager.ROWS} tuiles`;
        }

        // Nombre de tuiles explorées
        const tilesLoadedElement = document.querySelector('#tiles-loaded');
        if (tilesLoadedElement) {
            tilesLoadedElement.textContent = `Tuiles explorées : ${this.grilleManager.exploredTiles.size}`;
        }
    }

    /**
     * Mettre à jour le statut de l'API
     */
    updateApiStatus() {
        const apiStatusElement = document.querySelector('#api-status');
        if (apiStatusElement) {
            // Tester la connexion API
            this.gameService.testApiConnection().then(isConnected => {
                if (isConnected) {
                    apiStatusElement.innerHTML = 'Status API : <span class="text-success">Connectée</span>';
                } else {
                    apiStatusElement.innerHTML = 'Status API : <span class="text-danger">Déconnectée</span>';
                }
            }).catch(() => {
                apiStatusElement.innerHTML = 'Status API : <span class="text-danger">Erreur</span>';
            });
        }
    }

    /**
     * Trouver l'élément DOM d'une tuile par ses coordonnées mondiales
     * @param {number} worldX - Coordonnée X mondiale
     * @param {number} worldY - Coordonnée Y mondiale
     * @returns {HTMLElement|null} - Élément DOM de la tuile
     */
    findTileElement(worldX, worldY) {
        const carte = document.getElementById("carte");
        if (!carte) return null;
        
        // Chercher parmi tous les enfants de la carte
        for (let child of carte.children) {
            if (child.dataset.worldX == worldX && child.dataset.worldY == worldY) {
                return child;
            }
        }
        
        return null;
    }

    // === GESTION DES TUILES ===

    async handleTileClick(cell, x, y) {
        // Mettre à jour les informations de la tuile sélectionnée
        this.updateSelectedTileInfo(x, y, cell);

        // Ne pas refaire l'appel API si la tuile est déjà révélée
        if (cell.dataset.revealed === "true") {
            return;
        }

        try {
            // Afficher l'état de chargement
            cell.textContent = "⌛";
            cell.style.opacity = "0.7";

            // Charger les données de la tuile depuis l'API via le service
            const data = await this.gameService.fetchTileData(x, y);

            // Ajouter au Set des tuiles explorées et sauvegarder les données
            const tileKey = `${x},${y}`;
            this.grilleManager.exploredTiles.add(tileKey);
            this.grilleManager.exploredTilesData.set(tileKey, data);

            // Afficher les données de la tuile
            this.grilleManager.displayTileData(cell, data);

            // Mettre à jour les informations avec les nouvelles données
            this.updateSelectedTileInfo(x, y, cell, data);
            
            // Mettre à jour le compteur de tuiles explorées
            this.updateMapInfo();

        } catch (error) {
            console.error("Erreur lors du chargement de la tuile:", error);
            
            // Vérifier si l'erreur contient des données de tuile (cas d'une tuile non traversable)
            if (error.response && error.response.data) {
                console.log("Données de tuile reçues malgré l'erreur:", error.response.data);
                
                // Si on a des données de tuile dans l'erreur, les utiliser
                const data = error.response.data;
                
                // Ajouter au Set des tuiles explorées
                this.grilleManager.exploredTiles.add(`${x},${y}`);
                
                this.grilleManager.displayTileData(cell, data);
                this.updateSelectedTileInfo(x, y, cell, data);
                
                // Mettre à jour le compteur de tuiles explorées
                this.updateMapInfo();
            } else {
                // Vraie erreur - afficher l'erreur temporairement
                cell.textContent = "ERROR";
                cell.style.color = "#ff6b6b";
                
                // Remettre en état après 2 secondes
                setTimeout(() => {
                    cell.textContent = "?";
                    cell.style.color = "#fff";
                    cell.style.opacity = "1";
                }, 2000);
            }
        } finally {
            cell.style.opacity = "1";
        }
    }

    /**
     * Mettre à jour les informations de la tuile sélectionnée dans la sidebar
     * @param {number} x - Coordonnée X de la tuile
     * @param {number} y - Coordonnée Y de la tuile
     * @param {HTMLElement} cell - Élément DOM de la tuile
     * @param {Object} tileData - Données de la tuile (optionnel)
     */
    updateSelectedTileInfo(x, y, cell, tileData = null) {
        // Position
        const positionElement = document.querySelector('#selected-position');
        const imageElement = document.querySelector('#selected-tile-image');
        
        if (positionElement) {
            positionElement.textContent = `Position : (${x}, ${y})`;
        }

        // Vérifier si c'est hors limites
        if (cell.dataset.outOfBounds === "true") {
            const typeElement = document.querySelector('#selected-type');
            const traversableElement = document.querySelector('#selected-traversable');
            const descriptionElement = document.querySelector('#selected-description');

            // Cacher l'image pour les zones hors limites
            if (imageElement) {
                imageElement.style.display = 'none';
            }

            if (typeElement) typeElement.textContent = 'Type : Hors limites';
            if (traversableElement) traversableElement.textContent = 'Traversable : Non';
            if (descriptionElement) descriptionElement.textContent = 'Cette zone est en dehors des limites de la carte.';
            return;
        }

        // Essayer d'obtenir les données de la tuile
        let data = tileData;
        
        // Si pas de données fournies, vérifier dans les tuiles explorées
        if (!data) {
            const tileKey = `${x},${y}`;
            data = this.grilleManager.exploredTilesData.get(tileKey);
        }

        if (data && data.instanceMonstre) {
            // Pas de DTO: on garde l’objet brut pour le simulateur
            this.lastVisibleMonster = data.instanceMonstre;
        } else if (this.isPlayerAt(x, y)) {
            // Sur la case joueur, on ne garde rien
            this.lastVisibleMonster = null;
        }

        if (imageElement && data.type) {
            const typeName = data.type || 'INCONNU';
            imageElement.src = `images/${typeName}.png`;
            imageElement.style.display = 'block';
            imageElement.alt = `Tuile ${typeName}`;
        }

        const typeElement = document.querySelector('#selected-type');
        if (typeElement) {
            typeElement.textContent = `Type : ${data.type}`;
        }

        const traversableElement = document.querySelector('#selected-traversable');
        if (traversableElement) {
            const traversableText = data.estTraversable ? 'Oui' : 'Non';
            traversableElement.textContent = `Traversable : ${traversableText}`;
            traversableElement.className = data.estTraversable ? 'text-success' : 'text-danger';
        }

        // Description
        const descriptionElement = document.querySelector('#selected-description');
        if (descriptionElement) {
            let description = `Tuile ${data.type.toLowerCase()} en position (${x}, ${y})`;
            
            // Ajouter l'information détaillée du monstre si présent
            if (data.instanceMonstre) {
                const m = data.instanceMonstre;
                description = `
                    <div>${description}</div>
                    <div style="margin-top: 15px; padding: 10px; background-color: rgba(231, 76, 60, 0.1); border-left: 3px solid #e74c3c; border-radius: 4px;">
                        <strong style="color: #e74c3c;">MONSTRE PRÉSENT</strong><br>
                        <div style="margin-top: 8px; line-height: 1.6;">
                            <strong>${m.nom}</strong><br>
                            Niveau: ${m.niveau}<br>
                            PV: ${m.pointsVieActuels}/${m.pointsVieMax}<br>
                            Attaque: ${m.attaque}<br>
                            Défense: ${m.defense}
                        </div>
                    </div>
                `;
                descriptionElement.innerHTML = description;
            } else {
                descriptionElement.textContent = description;
            }
        }
    }

    // === RAFRAÎCHISSEMENT ===

    async refresh() {
        if (this.isInitialized) {
            await this.createGrid();
        }
    }

    // Obtenir les statistiques du jeu
    getGameStats() {
        return {
            discoveredTiles: 0,
            gridSize: `${this.grilleManager.COLS} x ${this.grilleManager.ROWS}`,
            totalTiles: this.grilleManager.COLS * this.grilleManager.ROWS
        };
    }

    // === GESTION DU JOUEUR ===

    // Récupérer les données du joueur actuel
    getCurrentPlayer() {
        try {
            const playerData = localStorage.getItem('currentPlayer');
            return playerData ? JSON.parse(playerData) : null;
        } catch (error) {
            console.error('Erreur lors de la récupération du joueur:', error);
            return null;
        }
    }

    // Obtenir le nom du joueur
    getPlayerName() {
        const player = this.getCurrentPlayer();
        return player?.nom || 'Joueur Inconnu';
    }

    // Obtenir les points de vie actuels/max
    getPlayerHp() {
        const player = this.getCurrentPlayer();
        return {
            current: player?.pointDeVie || 100,
            max: player?.pointDeVieMax || 100,
            percentage: player ? Math.round((player.pointDeVie / player.pointDeVieMax) * 100) : 100
        };
    }

    // Obtenir les statistiques de combat
    getPlayerStats() {
        const player = this.getCurrentPlayer();
        return {
            force: player?.force || 10,
            defense: player?.defense || 10
        };
    }

    // Vérifier si le joueur est à une position donnée
    isPlayerAt(x, y) {
        return this.playerX === x && this.playerY === y;
    }

    /**
     * Optionnel: si vous avez une tuile sélectionnée avec un monstre,
     * retournez ses stats sous la forme { hp, str, def, crit }.
     * Ici, on retourne null par défaut (à vous d'implémenter).
     */
    getVisibleMonsterStats() {
        if (this.lastVisibleMonster) {
            return {
                hp: Number(this.lastVisibleMonster.hp ?? this.lastVisibleMonster.pointsDeVie ?? 80),
                str: Number(this.lastVisibleMonster.str ?? this.lastVisibleMonster.force ?? 8),
                def: Number(this.lastVisibleMonster.def ?? this.lastVisibleMonster.defense ?? 6),
                crit: Number(this.lastVisibleMonster.crit ?? this.lastVisibleMonster.critique ?? 5),
            };
        }
        return null;
    }

    attachGameEvents() {
        // Boutons de navigation
        this.attachNavigationEvents();
    }

    attachNavigationEvents() {
        // Sélectionner tous les boutons de navigation par leur texte
        const buttons = document.querySelectorAll('.sidebar-block button');
        
        buttons.forEach(button => {
            const text = button.textContent.trim();
            switch (text) {
                case 'Nord':
                    button.addEventListener('click', () => this.handleAsyncMovement(0, -1));
                    break;
                case 'Sud':
                    button.addEventListener('click', () => this.handleAsyncMovement(0, 1));
                    break;
                case 'Est':
                    button.addEventListener('click', () => this.handleAsyncMovement(1, 0));
                    break;
                case 'Ouest':
                    button.addEventListener('click', () => this.handleAsyncMovement(-1, 0));
                    break;
                case 'Actualiser':
                    button.addEventListener('click', async () => await this.refresh());
                    break;
            }
        });

        // Ajouter les événements pour les flèches du clavier
        document.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'ArrowUp': // Flèche haut
                    this.handleAsyncMovement(0, -1);
                    break;
                case 'ArrowDown': // Flèche bas
                    this.handleAsyncMovement(0, 1);
                    break;
                case 'ArrowRight': // Flèche droite
                    this.handleAsyncMovement(1, 0);
                    break;
                case 'ArrowLeft': // Flèche gauche
                    this.handleAsyncMovement(-1, 0);
                    break;
            }
        });
    }

    /**
     * Gérer les déplacements asynchrones avec protection contre les déplacements multiples
     * @param {number} deltaX - Déplacement en X
     * @param {number} deltaY - Déplacement en Y
     */
    async handleAsyncMovement(deltaX, deltaY) {
        if (this.isMoving) {
            console.log('Déplacement déjà en cours...');
            return;
        }
        this.isMoving = true;
        try {
            await this.movePlayer(deltaX, deltaY);
        } catch (error) {
            console.debug('Déplacement non autorisé');
        } finally {
            this.isMoving = false;
        }
    }

    /**
     * Afficher une notification de combat en haut à droite
     */
    showCombatPopup(combat) {
        // Calculer les dégâts
        const monsterCurrentHp = combat.instanceMonstre?.pointsVieActuels || 0;
        const monsterMaxHp = combat.instanceMonstre?.pointsVieMax || 0;
        const monsterDamageTaken = monsterMaxHp - monsterCurrentHp;
        
        // Créer le pop-up (notification en haut à droite)
        const popup = document.createElement('div');
        popup.style.position = 'fixed';
        popup.style.top = '20px';
        popup.style.right = '20px';
        popup.style.backgroundColor = '#2c3e50';
        popup.style.padding = '20px';
        popup.style.borderRadius = '10px';
        popup.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.4)';
        popup.style.zIndex = '9999';
        popup.style.minWidth = '300px';
        popup.style.maxWidth = '380px';
        popup.style.border = '3px solid';
        popup.style.cursor = 'pointer';

        let borderColor = '';
        let backgroundColor = '';
        let message = '';

        switch (combat.result) {
            case 'VICTORY':
                borderColor = '#27ae60';
                backgroundColor = '#1e8449';
                message = `Victoire contre ${combat.instanceMonstre?.nom || 'le monstre'} !`;
                break;
            case 'DEFEAT':
                borderColor = '#e74c3c';
                backgroundColor = '#c0392b';
                message = `Défaite contre ${combat.instanceMonstre?.nom || 'le monstre'}...`;
                break;
            case 'NONE':
                borderColor = '#f39c12';
                backgroundColor = '#d68910';
                message = `Personne n'est sorti vainqueur du combat contre ${combat.instanceMonstre?.nom || 'le monstre'}.`;
                break;
        }

        popup.style.borderColor = borderColor;

        // Section des PV restants
        let damageSection = `
            <div style="background-color: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px; margin: 10px 0; font-size: 13px;">
                <div style="color: #27ae60; margin: 3px 0;">Vous: ${combat.pointVie}/${combat.pointVieMax} PV</div>
                <div style="color: #e74c3c; margin: 3px 0;">${combat.instanceMonstre?.nom || 'Monstre'}: ${monsterCurrentHp}/${monsterMaxHp} PV</div>
            </div>
        `;
        
        popup.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <strong style="color: white; font-size: 16px;">${combat.result === 'VICTORY' ? 'VICTOIRE' : combat.result === 'DEFEAT' ? 'DÉFAITE' : 'COMBAT INDÉCIS'}</strong>
                </div>
                <span id="closePopup" style="color: #bdc3c7; font-size: 20px; cursor: pointer; line-height: 1;">×</span>
            </div>
            <p style="color: #ecf0f1; margin: 8px 0; font-size: 14px;">${message}</p>
            ${damageSection}
            <div style="background-color: ${backgroundColor}; padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 13px;">
                <div style="color: #ecf0f1; font-weight: bold; margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 3px;">Votre personnage</div>
                <div style="display: flex; justify-content: space-between; color: white; margin: 3px 0;">
                    <span>💚 PV:</span>
                    <strong>${combat.pointVie}/${combat.pointVieMax}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; color: white; margin: 3px 0;">
                    <span>⚔️ Force:</span>
                    <strong>${combat.force}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; color: white; margin: 3px 0;">
                    <span>🛡️ Défense:</span>
                    <strong>${combat.defense}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; color: white; margin: 3px 0;">
                    <span>⭐ Niveau:</span>
                    <strong>${combat.niveau}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; color: white; margin: 3px 0;">
                    <span>✨ XP:</span>
                    <strong>${combat.experience}</strong>
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        // Fermer le pop-up
        const closePopup = () => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
            }
        };

        // Fermeture au clic sur la croix
        const closeBtn = popup.querySelector('#closePopup');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closePopup();
            });
        }

        // Fermeture au clic sur le popup entier
        popup.addEventListener('click', closePopup);

        // Disparition automatique après 5 secondes
        setTimeout(closePopup, 5000);
    }

    async movePlayer(deltaX, deltaY) {
        const newX = this.playerX + deltaX;
        const newY = this.playerY + deltaY;
        
        console.log(`Tentative de déplacement: (${this.playerX}, ${this.playerY}) -> (${newX}, ${newY})`);
        
        try {
            // Appeler l'API de déplacement du personnage
            const moveResult = await this.personnageService.move(newX, newY);
            console.log('Déplacement réussi:', moveResult);
            
            // Mettre à jour la position locale
            this.playerX = moveResult.x;
            this.playerY = moveResult.y;
            
            // Mettre à jour le personnage en localStorage
            const player = this.getCurrentPlayer();
            if (!player) return;

            // Position
            player.positionX = moveResult.x;
            player.positionY = moveResult.y;
            
            // Stats du combat (si présentes)
            const combat = moveResult.combatOutcome;
            if (combat) {
                player.pointDeVie = combat.pointVie;
                player.pointDeVieMax = combat.pointVieMax;
                player.force = combat.force;
                player.defense = combat.defense;
                player.experience = combat.experience;
                player.niveau = combat.niveau;
                
                this.showCombatPopup(combat);
                const tileKey = `${moveResult.x},${moveResult.y}`;
                const tileData = this.grilleManager.exploredTilesData.get(tileKey);
                if (tileData) {
                    tileData.instanceMonstre = combat.instanceMonstre;
                    this.grilleManager.exploredTilesData.set(tileKey, tileData);
                    
                    const tileElement = this.findTileElement(moveResult.x, moveResult.y);
                    if (tileElement) {
                        this.updateSelectedTileInfo(moveResult.x, moveResult.y, tileElement, tileData);
                    }
                }
            }
            
            // Sauvegarde unique
            localStorage.setItem('currentPlayer', JSON.stringify(player));
            await this.grilleManager.createGrid();

            // Mise à jour de l'UI
            this.updatePlayerInfo();
            this.updateMapInfo();
            this.grilleManager.updateGridDisplay();
            
        } catch (error) {
            console.debug('Déplacement non autorisé:', error.message || 'Erreur inconnue');
        }
    }
}

window.GameManager = GameManager;
