// MapUI - Everything related to the display and interactivity of the on-screen map (including units, but not including non-map chrome)

class MapUI {
    // Constants
    TILE_SIZE : number = 50;
    WORLD_SIZE : number = 2000;
    KEYS = {
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        LEFT: 37
    };
    terrainColors: any;
    terrainFontColors: any;

    // Input
    keysPressed = {};

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
    hoveredTile : number[];

    constructor() {
        var key;

        // This is used to track which keys are currently pressed
        for (key in this.KEYS) {
            this.keysPressed[this.KEYS[key]] = false;
        }

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

        // Handle hover
        this.hoveredTile = [-1, -1];
        this.canvas.addEventListener("mousemove", function(e) {
            var i, j, left, top;

            // Top left coordinate in pixels, relative to the whole map
            top = this.Y - this.VIEW_HEIGHT / 2;
            left = this.X - this.VIEW_WIDTH / 2;

            // Coordinates in tiles
            i = Math.floor((top + e.y) / this.TILE_SIZE);
            j = Math.floor((left + e.x) / this.TILE_SIZE);

            if ((i !== this.hoveredTile[0] || j !== this.hoveredTile[1]) && i >= 0 && j >= 0 && i < game.map.height && j < game.map.width) {
                this.hoveredTile = [i, j];

                chromeUI.onHoverTile(game.map.tiles[i][j]);
            }
        }.bind(this));
        this.canvas.addEventListener("mouseout", function(e) {
            chromeUI.onHoverTile();
        }.bind(this));

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

    onKeyDown(keyCode : number) {
        if (keyCode in this.keysPressed) {
            this.keysPressed[keyCode] = true;

            // Panning viewport based on keyboard arrows
            if (this.keysPressed[this.KEYS.UP]) {
                this.Y = this.Y - 20;
            }
            if (this.keysPressed[this.KEYS.RIGHT]) {
                this.X = this.X + 20;
            }
            if (this.keysPressed[this.KEYS.DOWN]) {
                this.Y = this.Y + 20;
            }
            if (this.keysPressed[this.KEYS.LEFT]) {
                this.X = this.X - 20;
            }

            requestAnimationFrame(this.render.bind(this));
        }
    }

    onKeyUp(keyCode : number) {
        if (keyCode in this.keysPressed) {
            this.keysPressed[keyCode] = false;
        }
    }

    render() {
        var bottom, left, leftTile, right, tileOffsetX, tileOffsetY, top, topTile;

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
                unit = game.getUnit(game.map.tiles[i][j].units[0]);

                this.context.fillStyle = this.terrainFontColors[game.map.tiles[i][j].terrain];
                this.context.textBaseline = "top";
                this.context.fillText(unit.type, x * this.TILE_SIZE - tileOffsetX + 2, y * this.TILE_SIZE - tileOffsetY);
            }
        }.bind(this));

        // Second pass: highlight
        drawViewport(function (i, j, x, y) {
            var k, unit;

            // Highlight active tile
            if (game.map.tiles[i][j].units.length > 0) {
                for (k = 0; k < game.map.tiles[i][j].units.length; k++) {
                    unit = game.getUnit(game.map.tiles[i][j].units[k]);

                    if (unit.active) {
                        this.context.strokeStyle = "#f00";
                        this.context.lineWidth = 4;
                        this.context.strokeRect(x * this.TILE_SIZE - tileOffsetX - 2, y * this.TILE_SIZE - tileOffsetY - 2, this.TILE_SIZE + 2, this.TILE_SIZE + 2);
                    }
                }
            }
        }.bind(this));
    }

    goToCoords(coords) {
        // ith row, jth column, 0 indexed
        this.X = coords[1] * this.TILE_SIZE + this.TILE_SIZE / 2;
        this.Y = coords[0] * this.TILE_SIZE + this.TILE_SIZE / 2;
        window.requestAnimationFrame(this.render.bind(this));
    }
}