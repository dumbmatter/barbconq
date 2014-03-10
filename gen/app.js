// Random - utility functions like Python's random module
var Random;
(function (Random) {
    function choice(x) {
        return x[Math.floor(Math.random() * x.length)];
    }
    Random.choice = choice;
})(Random || (Random = {}));
// MapUI - Everything related to the display and interactivity of the on-screen map (including units, but not including non-map chrome)
var MapUI = (function () {
    function MapUI() {
        // Constants
        this.TILE_SIZE = 50;
        this.WORLD_SIZE = 2000;
        this.KEYS = {
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            LEFT: 37
        };
        // Input
        this.keysPressed = {};
        var key;

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
        };
        this.terrainFontColors = {
            peak: "#fff",
            snow: "#000",
            desert: "#000",
            tundra: "#000",
            sea: "#fff",
            coast: "#000",
            grassland: "#fff",
            plains: "#000"
        };

        this.initMapDisplay();
    }
    MapUI.prototype.initMapDisplay = function () {
        var elTileInfo;

        this.X = game.map.width * this.TILE_SIZE / 2;
        this.Y = game.map.height * this.TILE_SIZE / 2;

        this.canvas = document.getElementById("map");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.context = this.canvas.getContext("2d");

        // Handle hover
        elTileInfo = document.getElementById("tile-info");
        this.hoveredTile = [-1, -1];
        this.canvas.addEventListener("mousemove", function (e) {
            var i, j, left, top;

            // Top left coordinate in pixels, relative to the whole map
            top = this.Y - this.VIEW_HEIGHT / 2;
            left = this.X - this.VIEW_WIDTH / 2;

            // Coordinates in tiles
            i = Math.floor((top + e.y) / this.TILE_SIZE);
            j = Math.floor((left + e.x) / this.TILE_SIZE);

            if ((i !== this.hoveredTile[0] || j !== this.hoveredTile[1]) && i > 0 && j > 0 && i < game.map.height && j < game.map.width) {
                this.hoveredTile = [i, j];

                // Show tile info
                elTileInfo.innerHTML = game.map.tiles[i][j].features.join("/") + (game.map.tiles[i][j].features.length ? "/" : "") + game.map.tiles[i][j].terrain;
                elTileInfo.style.display = "block";
            }
        }.bind(this));
        this.canvas.addEventListener("mouseout", function (e) {
            elTileInfo.style.display = "none";
        }.bind(this));

        // Handle key presses
        document.addEventListener("keydown", function (e) {
            if (e.keyCode in this.keysPressed) {
                this.keysPressed[e.keyCode] = true;
                requestAnimationFrame(this.render.bind(this));
            }
        }.bind(this));
        document.addEventListener("keyup", function (e) {
            if (e.keyCode in this.keysPressed) {
                this.keysPressed[e.keyCode] = false;
                requestAnimationFrame(this.render.bind(this));
            }
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
    };

    MapUI.prototype.setCanvasSize = function () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.VIEW_WIDTH = this.canvas.width;
        this.VIEW_HEIGHT = this.canvas.height;
        this.VIEW_TILE_WIDTH = Math.floor(this.VIEW_WIDTH / this.TILE_SIZE) + 2;
        this.VIEW_TILE_HEIGHT = Math.floor(this.VIEW_HEIGHT / this.TILE_SIZE) + 2;
    };

    MapUI.prototype.render = function () {
        var bottom, i, j, left, leftTile, right, tileOffsetX, tileOffsetY, top, topTile, x, y;

        // Has there been movement?
        if (this.keysPressed[this.KEYS.RIGHT]) {
            this.X = this.X + 20;
        }
        if (this.keysPressed[this.KEYS.LEFT]) {
            this.X = this.X - 20;
        }
        if (this.keysPressed[this.KEYS.UP]) {
            this.Y = this.Y - 20;
        }
        if (this.keysPressed[this.KEYS.DOWN]) {
            this.Y = this.Y + 20;
        }

        // Check the bounds for the view
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
        for (x = 0; x < this.VIEW_TILE_WIDTH; x++) {
            for (y = 0; y < this.VIEW_TILE_HEIGHT; y++) {
                // Coordinates in the map
                i = topTile + y;
                j = leftTile + x;

                // The "if" restricts this to only draw tiles that are in view
                if (i >= 0 && j >= 0 && i < game.map.height && j < game.map.width) {
                    // Background
                    this.context.fillStyle = this.terrainColors[game.map.tiles[i][j].terrain];
                    this.context.fillRect(x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY, this.TILE_SIZE, this.TILE_SIZE);

                    // Grid lines
                    this.context.strokeStyle = "#000";
                    this.context.strokeRect(x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY, this.TILE_SIZE, this.TILE_SIZE);

                    // Text
                    this.context.fillStyle = this.terrainFontColors[game.map.tiles[i][j].terrain];
                    this.context.textBaseline = "top";
                    this.context.fillText("Text", x * this.TILE_SIZE - tileOffsetX + 2, y * this.TILE_SIZE - tileOffsetY);
                }
            }
        }
    };

    MapUI.prototype.goToCoords = function (i, j) {
        // ith row, jth column, 0 indexed
        this.X = j * game.map.width + this.TILE_SIZE / 2;
        this.Y = i * game.map.height + this.TILE_SIZE / 2;
        window.requestAnimationFrame(this.render.bind(this));
    };
    return MapUI;
})();
// MapMaker - map generation module
var MapMaker;
(function (MapMaker) {
    function generate(width, height) {
        var i, j, map, types;

        map = {};

        map.width = width !== undefined ? width : 80;
        map.height = height !== undefined ? height : 40;

        types = {
            peak: [],
            snow: ["hills"],
            desert: ["flood-plains", "hills", "oasis"],
            tundra: ["forest", "hills"],
            sea: ["ice"],
            coast: ["ice"],
            grassland: ["forest", "hills", "jungle"],
            plains: ["forest", "hills"]
        };

        map.tiles = [];
        for (i = 0; i < map.height; i++) {
            map.tiles[i] = [];
            for (j = 0; j < map.width; j++) {
                map.tiles[i][j] = {};
                map.tiles[i][j].terrain = Random.choice(Object.keys(types));
                map.tiles[i][j].features = [];
                if (Math.random() < 0.5 && types[map.tiles[i][j].terrain].length > 0) {
                    map.tiles[i][j].features.push(Random.choice(types[map.tiles[i][j].terrain]));
                }
            }
        }

        return map;
    }
    MapMaker.generate = generate;
})(MapMaker || (MapMaker = {}));
// Game - store the state of the game here, any non-UI stuff that would need for saving/loading a game
// Units - classes for the various units types
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Units;
(function (Units) {
    var BaseUnit = (function () {
        function BaseUnit(owner, coords) {
            this.canAttack = true;
            this.canDefend = true;
            // UI stuff
            this.active = false;
            this.id = game.maxId;
            game.maxId += 1;

            this.owner = owner;
            this.coords = coords;
        }
        BaseUnit.prototype.move = function (direction) {
        };
        return BaseUnit;
    })();
    Units.BaseUnit = BaseUnit;

    var Warrior = (function (_super) {
        __extends(Warrior, _super);
        function Warrior() {
            _super.apply(this, arguments);
            this.strength = 2;
            this.currentStrength = 2;
            this.movement = 2;
            this.currentMovement = 2;
            this.landOrSea = "land";
        }
        Warrior.prototype.move = function (direction) {
            console.log(direction);
        };
        return Warrior;
    })(BaseUnit);
    Units.Warrior = Warrior;
})(Units || (Units = {}));
///<reference path='Random.ts'/>
///<reference path='MapUI.ts'/>
///<reference path='MapMaker.ts'/>
///<reference path='Game.ts'/>
///<reference path='Units.ts'/>
var game = {
    map: MapMaker.generate(80, 40),
    maxId: 0
};

var mapUI = new MapUI();

var w = new Units.Warrior(0, [10, 10]);
//# sourceMappingURL=app.js.map
