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
    rendering : boolean = false; // When true, render() is working so no need to call it again
    pathFindingSearch : boolean = false; // Set by Controller depending on if the user is searching for a path (like by right click) or not

    // Minimap
    miniCanvas : HTMLCanvasElement;
    miniContext : CanvasRenderingContext2D;
    miniTileSize : number;

    constructor() {
        // Colors!
        this.terrainColors = {
            peak: "#000",
            snow: "#fff",
            desert: "#f1eabd",
            tundra: "#ddd",
            sea: "#00f",
            coast: "#7c7cff",
            grassland: "#070",
            plains: "#fd0"
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
        this.X = game.map.width * this.TILE_SIZE / 2;
        this.Y = game.map.height * this.TILE_SIZE / 2;

        this.canvas = <HTMLCanvasElement> document.getElementById("map");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.context = this.canvas.getContext("2d");

        // Minimap
        this.miniCanvas = <HTMLCanvasElement> document.getElementById("minimap");
        this.miniContext = this.miniCanvas.getContext("2d");
        // See whether it's height or width limited based on the aspect ratio
        if (game.map.width / game.map.height > this.miniCanvas.width / this.miniCanvas.height) {
            // Bound based on map width
            this.miniTileSize = this.miniCanvas.width / game.map.width;
        } else {
            // Bound based on map height
            this.miniTileSize = this.miniCanvas.height / game.map.height;
        }

        // Handle resize
        window.addEventListener("resize", function () {
            requestAnimationFrame(function () {
                this.setCanvasSize();
                this.render();
            }.bind(this));
        }.bind(this));

        this.setCanvasSize();

        // Initial render
        window.requestAnimationFrame(this.render.bind(this));
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
            var i : number, pixels : number[];

            if (renderMapFirst) {
                this.render();
            }

            if (path && path.length > 1) {
                // Origin
                this.context.beginPath();
                pixels = this.coordsToPixels(path[0][0], path[0][1]);
                this.context.moveTo(pixels[0], pixels[1]);

                for (i = 1; i < path.length; i++) { // Skip the last one, since we're connecting points
                    pixels = this.coordsToPixels(path[i][0], path[i][1]);
                    this.context.lineTo(pixels[0], pixels[1]);
                }

                this.context.strokeStyle = "#000";
                this.context.lineWidth = 2;
                this.context.setLineDash([5]);
                this.context.stroke();
                this.context.setLineDash([]); // Reset dash state
            }
        }.bind(this));
    }

    render() {
        var bottom, left, leftTile, right, tileOffsetX, tileOffsetY, top, topTile;

        if (this.rendering) {
            return;
        }

        this.rendering = true;

        // Check the bounds for the viewport
        top = this.Y - this.VIEW_HEIGHT / 2;
        right = this.X + this.VIEW_WIDTH / 2;
        bottom = this.Y + this.VIEW_HEIGHT / 2;
        left = this.X - this.VIEW_WIDTH / 2;

        // Adjust position if hitting the boundary
        if (top < -this.VIEW_HEIGHT / 2) {
            this.Y = 0;
        }
        if (right > game.map.width * this.TILE_SIZE + this.VIEW_WIDTH / 2) {
            this.X = game.map.width * this.TILE_SIZE;
        }
        if (bottom > game.map.height * this.TILE_SIZE + this.VIEW_HEIGHT / 2) {
            this.Y = game.map.height * this.TILE_SIZE;
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

        // Loop over all tiles, call cb on each tile in the viewport
        var drawViewport = function (cb) {
            var i, j, x, y;

            for (x = 0; x < this.VIEW_TILE_WIDTH; x++) {
                for (y = 0; y < this.VIEW_TILE_HEIGHT; y++) {
                    // Coordinates in the map
                    i = topTile + y;
                    j = leftTile + x;

                    // The "if" restricts this to only draw tiles that are in view
                    if (i >= 0 && j >= 0 && i < game.map.height && j < game.map.width) {
                        cb(i, j, x, y);
                    }
                }
            }
        }.bind(this);

        // First pass: draw tiles and units
        drawViewport(function (i, j, x, y) {
            var unit;

            // Background
            this.context.fillStyle = this.terrainColors[game.map.tiles[i][j].terrain];
            this.context.fillRect(x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY, this.TILE_SIZE, this.TILE_SIZE);

            // Grid lines
            this.context.strokeStyle = "#000";
            this.context.lineWidth = 1;
            this.context.strokeRect(x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY, this.TILE_SIZE, this.TILE_SIZE);

            // Text - list units
            if (game.map.tiles[i][j].units.length > 0) {
                // Show first unit, arbitrarily
                unit = game.map.tiles[i][j].units[0];

                this.context.fillStyle = this.terrainFontColors[game.map.tiles[i][j].terrain];
                this.context.textBaseline = "top";
                this.context.fillText(unit.type, x * this.TILE_SIZE - tileOffsetX + 2, y * this.TILE_SIZE - tileOffsetY);
            }
        }.bind(this));

        // Second pass: highlight active unit
        drawViewport(function (i, j, x, y) {
            var k, unit;

            // Highlight active tile
            if (game.map.tiles[i][j].units.length > 0) {
                for (k = 0; k < game.map.tiles[i][j].units.length; k++) {
                    unit = game.map.tiles[i][j].units[k];

                    if (unit.active) {
                        this.context.strokeStyle = "#f00";
                        this.context.lineWidth = 4;
                        this.context.strokeRect(x * this.TILE_SIZE - tileOffsetX - 2, y * this.TILE_SIZE - tileOffsetY - 2, this.TILE_SIZE + 2, this.TILE_SIZE + 2);

                        // Draw path if unit is moving to a target
                        if (unit.targetCoords) {
                            // If there is a pathfinding search occurring (like from the user holding down the right click button), don't draw active path
                            if (!this.pathFindingSearch) {
                                game.map.pathFinding(unit, unit.targetCoords, function (path) {
                                    // This is to prevent an infinite loop of render() being called
                                    this.drawPath(path, false);
                                }.bind(this));
                            }
                        }

                        break;
                    }
                }
            }
        }.bind(this));

        this.rendering = false;

        // Render minimap at the end
        this.renderMiniMap();

        // Other UI rendering
        chromeUI.onMapRender();
    }

    renderMiniMap() {
        var bottom, bottomTile, i, j, k, left, leftTile, right, rightTile, top, topTile, unit;

        // Clear canvas and redraw everything
        this.miniContext.clearRect(0, 0, this.miniCanvas.width, this.miniCanvas.height);
        this.miniContext.fillStyle = "#000";
        this.miniContext.fillRect(0, 0, this.miniCanvas.width, this.miniCanvas.height);

        // Background
        for (i = 0; i < game.map.height; i++) {
            for (j = 0; j < game.map.width; j++) {
                // Background
                this.miniContext.fillStyle = this.terrainColors[game.map.tiles[i][j].terrain];
                this.miniContext.fillRect(j * this.miniTileSize, i * this.miniTileSize, this.miniTileSize, this.miniTileSize);
            }
        }

        // Second pass: highlight
        for (i = 0; i < game.map.height; i++) {
            for (j = 0; j < game.map.width; j++) {
                // Highlight active tile
                if (game.map.tiles[i][j].units.length > 0) {
                    for (k = 0; k < game.map.tiles[i][j].units.length; k++) {
                        unit = game.map.tiles[i][j].units[k];

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
        this.Y = coords[0] * this.TILE_SIZE + this.TILE_SIZE / 2 + chromeUI.elBottomActions.offsetHeight / 2; // chromeUI.elBottomInfo.offsetHeight is to account for the panels at the bottom when centering vertically
        window.requestAnimationFrame(this.render.bind(this));
    }

    // Input: pixel coordinates from canvas events like "click" and "mousemove". Output: tile coordinates (row, col) 0 indexed
    pixelsToCoords(x : number, y : number) : number[] {
        var coords, left, top;

        // Top left coordinate in pixels, relative to the whole map
        top = this.Y - this.VIEW_HEIGHT / 2;
        left = this.X - this.VIEW_WIDTH / 2;

        // Coordinates in tiles
        coords = [
            Math.floor((top + y) / this.TILE_SIZE),
            Math.floor((left + x) / this.TILE_SIZE)
        ];

        // Only return coordinates in map
        if (this.validCoords(coords)) {
            return coords;
        } else {
            return null;
        }
    }

    // Input: tile coords (row, col) 0 indexed. Output: (x, y) pixels at center of tile in current viewport (can go off screen)
    coordsToPixels(i : number, j : number) : number[] {
        var left, pixels, top;

        if (this.validCoords([i, j])) {
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
        var coords, left, top;

        // Coordinates in tiles
        coords = [
            Math.floor(y / this.miniTileSize),
            Math.floor(x / this.miniTileSize)
        ];

        // Only return coordinates in map
        if (this.validCoords(coords)) {
            return coords;
        } else {
            return null;
        }
    }

    // Make sure coords are on map
    validCoords(coords : number []) {
        if (coords) {
            return coords[0] >= 0 && coords[1] >= 0 && coords[0] < game.map.height && coords[1] < game.map.width;
        }

        return false;
    }
}