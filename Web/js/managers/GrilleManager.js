// Gestionnaire de la grille de jeu
class GrilleManager {
    constructor(gameManager) {
        // Référence au GameManager parent
        this.gameManager = gameManager;
        
        // Configuration de la grille
        this.ROWS = 5;
        this.COLS = 5;
        this.TILE_PX = 120;
        
        // Suivi des tuiles explorées
        this.exploredTiles = new Set();
        this.exploredTilesData = new Map();
    }

    // Constantes des limites de la carte (identiques au backend)
    static WORLD_MIN_X = 0;
    static WORLD_MIN_Y = 0;
    static WORLD_MAX_X = 50;
    static WORLD_MAX_Y = 50;

    /**
     * Vérifier si une position mondiale est dans les limites de la carte
     */
    isWorldPositionValid(worldX, worldY) {
        return worldX >= GrilleManager.WORLD_MIN_X && 
               worldX <= GrilleManager.WORLD_MAX_X &&
               worldY >= GrilleManager.WORLD_MIN_Y && 
               worldY <= GrilleManager.WORLD_MAX_Y;
    }

    /**
     * Calculer les coordonnées mondiales pour une position de grille
     * La grille est centrée sur le joueur
     */
    getWorldCoordinates(gridX, gridY) {
        const centerX = Math.floor(this.COLS / 2);
        const centerY = Math.floor(this.ROWS / 2);
        
        return {
            x: this.gameManager.playerX - centerX + gridX,
            y: this.gameManager.playerY - centerY + gridY
        };
    }

    /**
     * Créer la grille de jeu
     */
    async createGrid() {
        const carte = document.getElementById("carte");
        if (!carte) {
            console.error('Élément #carte non trouvé');
            return;
        }

        // Vider avant de régénérer
        carte.innerHTML = "";
        
        // Configurer la grille CSS
        carte.style.display = "grid";
        carte.style.gridTemplateColumns = `repeat(${this.COLS}, ${this.TILE_PX}px)`;
        carte.style.gridTemplateRows = `repeat(${this.ROWS}, ${this.TILE_PX}px)`;
        carte.style.gap = "5px";

        let currentVisionData;
        try {
            currentVisionData = await this.gameManager.personnageService.getVision();
            console.log('Vision récupérée dans createGrid:', currentVisionData);
            for (let gridY = 0; gridY < this.ROWS; gridY++) {
                for (let gridX = 0; gridX < this.COLS; gridX++) {
                    const worldCoords = this.getWorldCoordinates(gridX, gridY);
                    this.createTileElement(carte, gridX, gridY, worldCoords.x, worldCoords.y, currentVisionData);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de la vision:', error);
        }

    }
    
    /**
     * Créer un élément de tuile
     */
    createTileElement(container, gridX, gridY, worldX, worldY, visionData = null) {
        const cell = document.createElement("div");
        const isOutOfBounds = !this.isWorldPositionValid(worldX, worldY);
        
        if (isOutOfBounds) {
            this.createOutOfBoundsTile(cell, worldX, worldY, gridX, gridY);
            container.appendChild(cell);
            return;
        }
        
        // Case normale dans les limites
        cell.className = "tuile inconnu";
        cell.style.width = `${this.TILE_PX}px`;
        cell.style.height = `${this.TILE_PX}px`;
        cell.style.display = "flex";
        cell.style.alignItems = "center";
        cell.style.justifyContent = "center";
        cell.style.fontSize = "48px";
        cell.style.color = "#fff";
        cell.style.cursor = "pointer";

        // Marquer la tuile du joueur
        const isPlayerPosition = worldX === this.gameManager.playerX && worldY === this.gameManager.playerY;
        
        if (isPlayerPosition) {
            cell.classList.add("player-position");
            cell.textContent = "P"; // Icône du joueur
            cell.style.backgroundColor = "#4CAF50";
            cell.style.border = "3px solid #FFD700";
        } else {
            cell.textContent = "?";
        }

        // Vérifier si cette tuile est dans les tuiles explorées de la vision
        let tileFromVision = null;
        if (visionData && visionData.explored) {
            tileFromVision = visionData.explored.find(tile => tile.x === worldX && tile.y === worldY);
        }

        if (tileFromVision) {
            this.processTileFromVision(cell, tileFromVision, worldX, worldY);
        } else {
            // Vérifier si cette tuile a déjà été explorée précédemment
            const tileKey = `${worldX},${worldY}`;
            if (this.exploredTilesData.has(tileKey)) {
                const savedTileData = this.exploredTilesData.get(tileKey);
                this.displayTileData(cell, savedTileData);
            }
        }

        // Ajouter l'événement de clic
        cell.addEventListener("click", () => {
            this.gameManager.updateSelectedTileInfo(worldX, worldY, cell);
            if (cell.dataset.outOfBounds !== "true") {
                this.gameManager.handleTileClick(cell, worldX, worldY);
            }
        });

        // Ajouter des données pour le debug
        cell.title = `Grille: (${gridX}, ${gridY}) | Monde: (${worldX}, ${worldY})`;
        cell.dataset.worldX = worldX;
        cell.dataset.worldY = worldY;
        cell.dataset.gridX = gridX;
        cell.dataset.gridY = gridY;

        container.appendChild(cell);
    }

    /**
     * Créer une tuile hors limites
     */
    createOutOfBoundsTile(cell, worldX, worldY, gridX, gridY) {
        cell.className = "tuile hors-limites";
        cell.style.width = `${this.TILE_PX}px`;
        cell.style.height = `${this.TILE_PX}px`;
        cell.style.display = "flex";
        cell.style.alignItems = "center";
        cell.style.justifyContent = "center";
        cell.style.fontSize = "32px";
        cell.style.color = "#666";
        cell.style.backgroundColor = "#2a2a2a";
        cell.style.border = "2px solid #444";
        cell.style.cursor = "not-allowed";
        cell.style.opacity = "0.6";
        cell.textContent = "X";
        cell.title = `Hors limites: (${worldX}, ${worldY})`;
        
        cell.dataset.worldX = worldX;
        cell.dataset.worldY = worldY;
        cell.dataset.gridX = gridX;
        cell.dataset.gridY = gridY;
        cell.dataset.outOfBounds = "true";
    }

    /**
     * Traiter une tuile de la vision
     */
    processTileFromVision(cell, tileFromVision, worldX, worldY) {
        const tileKey = `${worldX},${worldY}`;
        this.exploredTiles.add(tileKey);
        
        const tileData = {
            positionX: tileFromVision.x,
            positionY: tileFromVision.y,
            type: tileFromVision.type,
            estTraversable: tileFromVision.estTraversable,
            instanceMonstre: tileFromVision.instanceMonstre
        };

        // Sauvegarder les données de la tuile
        this.exploredTilesData.set(tileKey, tileData);

        // Afficher la tuile
        this.displayTileData(cell, tileData);
    }

    /**
     * Ajouter l'icône du monstre
     */
    addMonsterIcon(cell, instanceMonstre) {
        const monsterIcon = document.createElement("img");
        monsterIcon.src = instanceMonstre.spriteUrl;
        monsterIcon.alt = instanceMonstre.nom;
        monsterIcon.style.position = "absolute";
        monsterIcon.style.top = "50%";
        monsterIcon.style.left = "50%";
        monsterIcon.style.transform = "translate(-50%, -50%)";
        monsterIcon.style.width = "80px";
        monsterIcon.style.height = "80px";
        monsterIcon.style.imageRendering = "pixelated";
        monsterIcon.style.filter = "drop-shadow(2px 2px 4px rgba(0,0,0,0.9))";
        monsterIcon.style.zIndex = "10";
        monsterIcon.title = `${instanceMonstre.nom} (Niveau ${instanceMonstre.niveau})`;
        
        cell.appendChild(monsterIcon);
    }

    /**
     * Ajouter l'icône du joueur
     */
    addPlayerIcon(cell) {
        const playerIcon = document.createElement("div");
        playerIcon.textContent = "🧙‍♂️";
        playerIcon.style.position = "absolute";
        playerIcon.style.top = "2px";
        playerIcon.style.right = "2px";
        playerIcon.style.fontSize = "20px";
        playerIcon.style.textShadow = "1px 1px 2px rgba(0,0,0,0.8)";
        
        cell.appendChild(playerIcon);
    }

    /**
     * Afficher les données d'une tuile
     */
    displayTileData(cell, data) {
        const isPlayerPosition = cell.classList.contains("player-position");
        const typeName = data.type || 'INCONNU';
        
        cell.className = `tuile ${typeName.toLowerCase()}`;
        if (isPlayerPosition) {
            cell.classList.add("player-position");
        }
        
        cell.innerHTML = "";
        cell.style.position = "relative";

        // Créer l'image de la tuile
        const img = document.createElement("img");
        img.src = `images/${typeName}.png`;
        img.alt = `${typeName} (${data.positionX},${data.positionY})`;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.borderRadius = "8px";
        
        img.onerror = () => {
            if (isPlayerPosition) {
                cell.innerHTML = `<div style="position: relative;">${typeName || 'inconnu'}<span style="position: absolute; top: -5px; right: -5px; font-size: 20px;">🧙‍♂️</span></div>`;
            } else {
                cell.textContent = `${typeName || 'inconnu'}`;
            }
        };
        
        cell.appendChild(img);
        
        // Ajouter l'icône du monstre si présent
        if (data.instanceMonstre && data.instanceMonstre.spriteUrl) {
            this.addMonsterIcon(cell, data.instanceMonstre);
        }
        
        // Ajouter l'icône du joueur si nécessaire
        if (isPlayerPosition) {
            this.addPlayerIcon(cell);
        }

        cell.dataset.revealed = "true";
        cell.title = `${typeName} (${data.positionX}, ${data.positionY})`;
        
        if (isPlayerPosition) {
            cell.style.border = "3px solid #FFD700";
        }
    }

    /**
     * Mettre à jour l'affichage des informations de la grille dans l'UI
     */
    updateGridDisplay() {
        const playerName = this.gameManager.getPlayerName();
        const centerX = Math.floor(this.COLS / 2);
        const centerY = Math.floor(this.ROWS / 2);
        const startX = this.gameManager.playerX - centerX;
        const startY = this.gameManager.playerY - centerY;
        const endX = startX + this.COLS - 1;
        const endY = startY + this.ROWS - 1;
        
        // Mettre à jour le header
        const header = document.querySelector('#header-status');
        if (header) {
            header.textContent = `Explorez le monde généré par votre API - ${playerName} : (${this.gameManager.playerX}, ${this.gameManager.playerY})`;
        }
        
        // Mettre à jour la zone affichée
        const zoneInfo = document.querySelector('#zone-info');
        if (zoneInfo) {
            zoneInfo.textContent = `Zone: (${startX}, ${startY}) → (${endX}, ${endY})`;
        }
    }
}

// Export pour être utilisé dans d'autres fichiers
window.GrilleManager = GrilleManager;
