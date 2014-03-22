// MapUI - Everything related to the display and interactivity of the on-screen map (including units, but not including non-map chrome)

class MapUI {
    // Constants
    TILE_SIZE : number = 50;
    terrainColors: any;
    terrainFontColors: any;

    // Display
    // (X, Y) is the center of the region of the map displayed on the screen.
    X : number;
    Y : number;
    canvas : HTMLCanvasElement;
    context : CanvasRenderingContext2D;
    VIEW_WIDTH : number;
    VIEW_HEIGHT : number;
    VIEW_TILE_WIDTH : number;
    VIEW_TILE_HEIGHT : number;
    pathFindingSearch : boolean = false; // Set by Controller depending on if the user is searching for a path (like by right click) or not

    // Minimap
    miniCanvas : HTMLCanvasElement;
    miniContext : CanvasRenderingContext2D;
    miniTileSize : number;

    constructor() {
        // Colors!
        this.terrainColors = {
            unseen: "#000",
            peak: "#000",
            snow: "#fff",
            desert: "#f1eabd",
            tundra: "#ddd",
            sea: "#00f",
            coast: "#7c7cff",
            grassland: "#080",
            plains: "#fd0",
            shadow: "rgba(0, 0, 0, 0.5)" // Goes on top of other colors
        }
        this.terrainFontColors = {
            peak: "#fff",
            snow: "#000",
            desert: "#000",
            tundra: "#000",
            sea: "#fff",
            coast: "#000",
            grassland: "#fff",
            plains: "#000"
        }

        this.initMapDisplay();
    }

    initMapDisplay() {
        this.X = game.map.cols * this.TILE_SIZE / 2;
        this.Y = game.map.rows * this.TILE_SIZE / 2;

        this.canvas = <HTMLCanvasElement> document.getElementById("map");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.context = this.canvas.getContext("2d");

        // Minimap
        this.miniCanvas = <HTMLCanvasElement> document.getElementById("minimap");
        this.miniContext = this.miniCanvas.getContext("2d");
        // See whether it's height or width limited based on the aspect ratio
        if (game.map.cols / game.map.rows > this.miniCanvas.width / this.miniCanvas.height) {
            // Bound based on map width
            this.miniTileSize = this.miniCanvas.width / game.map.cols;
        } else {
            // Bound based on map height
            this.miniTileSize = this.miniCanvas.height / game.map.rows;
        }

        // Handle resize
        window.addEventListener("resize", function () {
            this.setCanvasSize();
            this.render();
        }.bind(this));

        this.setCanvasSize();
    }

    setCanvasSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.VIEW_WIDTH = this.canvas.width;
        this.VIEW_HEIGHT = this.canvas.height;
        this.VIEW_TILE_WIDTH = Math.floor(this.VIEW_WIDTH / this.TILE_SIZE) + 2;
        this.VIEW_TILE_HEIGHT = Math.floor(this.VIEW_HEIGHT / this.TILE_SIZE) + 2;
    }

    drawPath(path : number[][] = [], renderMapFirst : boolean = true) {
        window.requestAnimationFrame(function () {
            var battle : Combat.Battle, i : number, pixels : number[], units : {attacker : Units.Unit; defender : Units.Unit};

            if (renderMapFirst) {
                this.render(true);
            }

            if (path && path.length > 1) {
                // See if the path ends at an enemy unit. If so, display combat info.
                units = Combat.findBestDefender(game.activeUnit, path[path.length - 1], true);
                if (units.defender) {
                    battle = new Combat.Battle(units.attacker, units.defender);
                    chromeUI.onHoverMoveEnemy(battle);
                }

                // Start at origin
                this.context.beginPath();
                pixels = this.coordsToPixels(path[0][0], path[0][1]);
                this.context.moveTo(pixels[0], pixels[1]);

                // Add a line for each step in the path
                for (i = 1; i < path.length; i++) { // Skip the first one
                    pixels = this.coordsToPixels(path[i][0], path[i][1]);
                    this.context.lineTo(pixels[0], pixels[1]);
                }

                // Draw path
                if (units.defender) {
                    // Path ends in enemy, so show red
                    this.context.strokeStyle = "#f00";
                } else {
                    this.context.strokeStyle = "#fff";
                }
                this.context.lineWidth = 2;
                this.context.setLineDash([5]);
                this.context.stroke();
                this.context.setLineDash([]); // Reset dash state

                // Draw move numbers on top of path
                (function () {
                    var currentMovement : number, drawNumber : (i : number) => void, i : number, movement : number, movementCost : number, numTurns : number;

                    // Initialize with current values
                    movement = game.activeUnit.movement;
                    currentMovement = game.activeUnit.currentMovement;

                    // If no movement left now, it takes an extra turn to get anywhere
                    if (currentMovement === 0) {
                        numTurns = 1;
                        currentMovement = movement;
                    } else {
                        numTurns = 0;
                    }

                    // Universal text options
                    this.context.textAlign = "center";
                    this.context.textBaseline = "middle";
                    this.context.font = "30px sans-serif";
                    drawNumber = function (i : number) {
                        var pixels : number[]

                        pixels = this.coordsToPixels(path[i][0], path[i][1]);

                        if (units.defender && i === path.length - 1) {
                            this.context.fillStyle = "#f00";
                        } else {
                            this.context.fillStyle = "#ccc";
                        }
                        this.context.fillText(numTurns, pixels[0], pixels[1]);
                    }.bind(this);

                    for (i = 1; i < path.length; i++) { // Skip the first one
                        movementCost = game.map.tileMovementCost(path[i - 1], path[i]);
                        currentMovement -= movementCost;
                        if (currentMovement <= 0) {
                            numTurns += 1;
                            currentMovement = movement;
                            drawNumber(i);
                        }
                    }

                    // Add turns on the last tile if there is still remaining movement
                    if (currentMovement < movement) { // Because they will be equal if currentMovement was reset in the last loop iteration above
                        numTurns += 1;
                        drawNumber(i - 1);
                    }
                }.bind(this)());
            }
        }.bind(this));
    }

    // If already requested an animation frame, set animationFrameAlreadyRequested to true to avoid race conditions.
    render(animationFrameAlreadyRequested : boolean = false) {
        var bottom : number, draw : () => void, left : number, leftTile : number, right : number, tileOffsetX : number, tileOffsetY : number, top : number, topTile : number;

        // Check the bounds for the viewport
        top = this.Y - this.VIEW_HEIGHT / 2;
        right = this.X + this.VIEW_WIDTH / 2;
        bottom = this.Y + this.VIEW_HEIGHT / 2;
        left = this.X - this.VIEW_WIDTH / 2;

        // Adjust position if hitting the boundary
        if (top < -this.VIEW_HEIGHT / 2) {
            this.Y = 0;
        }
        if (right > game.map.cols * this.TILE_SIZE + this.VIEW_WIDTH / 2) {
            this.X = game.map.cols * this.TILE_SIZE;
        }
        if (bottom > game.map.rows * this.TILE_SIZE + this.VIEW_HEIGHT / 2) {
            this.Y = game.map.rows * this.TILE_SIZE;
        }
        if (left < -this.VIEW_WIDTH / 2) {
            this.X = 0;
        }

        // Recalculate bounds after adjustments
        top = this.Y - this.VIEW_HEIGHT / 2;
        right = this.X + this.VIEW_WIDTH / 2;
        bottom = this.Y + this.VIEW_HEIGHT / 2;
        left = this.X - this.VIEW_WIDTH / 2;

        // Find top left coordinates
        leftTile = Math.floor(left / this.TILE_SIZE);
        topTile = Math.floor(top / this.TILE_SIZE);

        // Offsets for showing partial tiles
        tileOffsetX = left % this.TILE_SIZE;
        tileOffsetY = top % this.TILE_SIZE;

        // Fix top and left limits (don't really understand this)
        if (tileOffsetY < 0) {
            tileOffsetY += this.TILE_SIZE;
        }
        if (tileOffsetX < 0) {
            tileOffsetX += this.TILE_SIZE;
        }

        // Clear canvas and redraw everything in view
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fillStyle = "#000";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Function to loop over all tiles, call cb on each tile in the viewport
        var drawViewport = function (cb) {
            var i, j, x, y;

            for (x = 0; x < this.VIEW_TILE_WIDTH; x++) {
                for (y = 0; y < this.VIEW_TILE_HEIGHT; y++) {
                    // Coordinates in the map
                    i = topTile + y;
                    j = leftTile + x;

                    // Only draw tiles that are on the map
                    if (i >= 0 && j >= 0 && i < game.map.rows && j < game.map.cols) {
                        cb(i, j, x, y);
                    }
                }
            }
        }.bind(this);

        draw = function () {
            var x : number, y : number;

            // First pass: draw tiles and units
            drawViewport(function (i, j, x, y) {
                var k, maxStrength, tile : MapMaker.Tile, unit, unitImage, units;

                tile = game.getTile([i, j]);

                // Background
                this.context.fillStyle = this.terrainColors[tile.terrain];
                this.context.fillRect(x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY, this.TILE_SIZE, this.TILE_SIZE);

                if (tile.features.indexOf("forest") >= 0) {
                  this.context.drawImage(assets.forest, x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY);
                }
                if (tile.features.indexOf("hills") >= 0) {
                  this.context.globalAlpha = 0.5;
                  this.context.drawImage(assets.hills, x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY);
                  this.context.globalAlpha = 1.0;
                }

                // Grid lines
                this.context.strokeStyle = "#000";
                this.context.lineWidth = 1;
                this.context.strokeRect(x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY, this.TILE_SIZE, this.TILE_SIZE);

                // Shadow for non-visible tiles?
                if (!game.map.visibility[i][j] && tile.terrain !== "unseen") {
                    this.context.fillStyle = this.terrainColors.shadow;
                    this.context.fillRect(x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY, this.TILE_SIZE, this.TILE_SIZE);
                }

                // Show units on tile
                units = tile.units;
                if (units.length > 0) {
                    // Pick which unit to show on top of tile
                    if (units.length === 1) {
                        // Only one to show...
                        unit = units[0];
                    } else if (game.activeUnit && game.activeUnit.coords[0] === i && game.activeUnit.coords[1] === j) {
                        // Active unit/group on this tile
                        if (game.activeUnit instanceof Units.Group) {
                            // Group is active, show highest currentStrength from the group
                            maxStrength = -Infinity;
                            for (k = 0; k < units.length; k++) {
                                if (units[k].currentStrength > maxStrength && (units[k].group && units[k].group.id === game.activeUnit.id)) {
                                    unit = units[k];
                                    maxStrength = units[k].currentStrength;
                                }
                            }
                        } else {
                            // Individual is active, show it
                            unit = game.activeUnit;
                        }
                    } else {
                        // Nothing active here, show highest currentStrength
                        maxStrength = -Infinity;
                        for (k = 0; k < units.length; k++) {
                            if (units[k].currentStrength > maxStrength) {
                                unit = units[k];
                                maxStrength = units[k].currentStrength;
                            }
                        }
                    }

                    if (unit.owner === config.BARB_ID) {
                        unitImage = assets["Black" + unit.type];
                    } else {
                        unitImage = assets["White" + unit.type];
                    }
                    this.context.drawImage(unitImage, x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY);
                }
            }.bind(this));

            // Highlight active unit
            if (game.activeUnit && game.map.visibility[game.activeUnit.coords[0]][game.activeUnit.coords[1]]) {
                x = game.activeUnit.coords[1] - leftTile;
                y = game.activeUnit.coords[0] - topTile;

                this.context.strokeStyle = "#f00";
                this.context.lineWidth = 4;
                this.context.strokeRect(x * this.TILE_SIZE - tileOffsetX - 2, y * this.TILE_SIZE - tileOffsetY - 2, this.TILE_SIZE + 2, this.TILE_SIZE + 2);

                // Draw path if unit is moving to a target
                if (game.activeUnit.targetCoords) {
                    // If there is a pathfinding search occurring (like from the user holding down the right click button), don't draw active path
                    if (!this.pathFindingSearch) {
                        game.map.pathFinding(game.activeUnit, game.activeUnit.targetCoords, function (path) {
                            // This is to prevent an infinite loop of render() being called
                            this.drawPath(path, false);
                        }.bind(this));
                    }
                }
            }

            // Render minimap at the end
            this.renderMiniMap();

            // Other UI rendering
            chromeUI.onMapRender();
        }.bind(this);

        if (animationFrameAlreadyRequested) {
            draw();
        } else {
            window.requestAnimationFrame(draw);
        }
    }

    renderMiniMap() {
        var bottom : number, bottomTile : number, i : number, j : number, k : number, left : number, leftTile : number, right : number, rightTile : number, top : number, tile : MapMaker.Tile, topTile : number, unit : Units.Unit;

        // Clear canvas and redraw everything
        this.miniContext.clearRect(0, 0, this.miniCanvas.width, this.miniCanvas.height);
        this.miniContext.fillStyle = "#000";
        this.miniContext.fillRect(0, 0, this.miniCanvas.width, this.miniCanvas.height);

        // Background
        for (i = 0; i < game.map.rows; i++) {
            for (j = 0; j < game.map.cols; j++) {
                // Background
                tile = game.getTile([i, j]);
                this.miniContext.fillStyle = this.terrainColors[tile.terrain];
                this.miniContext.fillRect(j * this.miniTileSize, i * this.miniTileSize, this.miniTileSize, this.miniTileSize);

                // Shadow for non-visible tiles?
                if (!game.map.visibility[i][j] && tile.terrain !== "unseen") {
                    this.miniContext.fillStyle = this.terrainColors.shadow;
                    this.miniContext.fillRect(j * this.miniTileSize, i * this.miniTileSize, this.miniTileSize, this.miniTileSize);
                }
            }
        }

        // Second pass: highlight
        for (i = 0; i < game.map.rows; i++) {
            for (j = 0; j < game.map.cols; j++) {
                // Highlight active tile
                tile = game.getTile([i, j]);
                if (tile.units.length > 0) {
                    for (k = 0; k < tile.units.length; k++) {
                        unit = tile.units[k];

                        if (unit.active) {
                            this.miniContext.fillStyle = "#f00";
                            this.miniContext.fillRect(j * this.miniTileSize, i * this.miniTileSize, this.miniTileSize, this.miniTileSize);
                            break;
                        }
                    }
                }
            }
        }

        // Show box for viewport
        top = this.Y - this.VIEW_HEIGHT / 2;
        right = this.X + this.VIEW_WIDTH / 2;
        bottom = this.Y + this.VIEW_HEIGHT / 2;
        left = this.X - this.VIEW_WIDTH / 2;
        topTile = top / this.TILE_SIZE; // Don't need to floor these since they're just being used for drawing
        rightTile = right / this.TILE_SIZE;
        bottomTile = bottom / this.TILE_SIZE;
        leftTile = left / this.TILE_SIZE;
        this.miniContext.strokeStyle = "#f00";
        this.miniContext.lineWidth = 2;
        this.miniContext.strokeRect(leftTile * this.miniTileSize, topTile * this.miniTileSize, (rightTile - leftTile) * this.miniTileSize, (bottomTile - topTile) * this.miniTileSize);
    }

    goToCoords(coords : number[]) {
        // ith row, jth column, 0 indexed
        this.X = coords[1] * this.TILE_SIZE + this.TILE_SIZE / 2;
        this.Y = coords[0] * this.TILE_SIZE + this.TILE_SIZE / 2;
        this.render();
    }

    // Input: pixel coordinates from canvas events like "click" and "mousemove". Output: tile coordinates (row, col) 0 indexed
    pixelsToCoords(x : number, y : number) : number[] {
        var coords : number[], left : number, top : number;

        // Top left coordinate in pixels, relative to the whole map
        top = this.Y - this.VIEW_HEIGHT / 2;
        left = this.X - this.VIEW_WIDTH / 2;

        // Coordinates in tiles
        coords = [
            Math.floor((top + y) / this.TILE_SIZE),
            Math.floor((left + x) / this.TILE_SIZE)
        ];

        // Only return coordinates in map
        if (game.map.validCoords(coords)) {
            return coords;
        } else {
            return null;
        }
    }

    // Input: tile coords (row, col) 0 indexed. Output: (x, y) pixels at center of tile in current viewport (can go off screen)
    coordsToPixels(i : number, j : number) : number[] {
        var left : number, pixels : number[], top : number;

        if (game.map.validCoords([i, j])) {
            // Top left coordinate in pixels, relative to the whole map
            top = this.Y - this.VIEW_HEIGHT / 2;
            left = this.X - this.VIEW_WIDTH / 2;

            // Pixels at center of tile
            pixels = [
                j * this.TILE_SIZE + this.TILE_SIZE / 2 - left,
                i * this.TILE_SIZE + this.TILE_SIZE / 2 - top
            ]

            return pixels;
        } else {
            return null;
        }
    }

    // Same as above, but for minimap
    miniPixelsToCoords(x : number, y : number) : number[] {
        var coords : number[], left : number, top : number;

        // Coordinates in tiles
        coords = [
            Math.floor(y / this.miniTileSize),
            Math.floor(x / this.miniTileSize)
        ];

        // Only return coordinates in map
        if (game.map.validCoords(coords)) {
            return coords;
        } else {
            return null;
        }
    }
}