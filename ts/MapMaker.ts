// MapMaker - map generation module

module MapMaker {
    export interface LastSeenState {
        terrain : string;
        features : string[];
        units : Units.Unit[]; // This should never get anything in it! Just a placeholder empty array!
        city : Cities.City;
    }

    export interface Tile {
        terrain : string;
        features : string[];
        units : Units.Unit[];
        city : Cities.City
        lastSeenState? : LastSeenState[];
    }

    export class Map {
        rows : number;
        cols : number;
        tiles : Tile[][];
        visibility : number[][][];
        game : Game;

        constructor(game : Game) {
            this.game = game;
        }

        // Default callback will draw path (or clear path if it's not valid)
        pathFinding(unit : Units.UnitOrGroup = null, targetCoords : number[] = null, cb : (path? : number[][]) => void = mapUI.drawPath.bind(mapUI)) {
            var grid : number[][], i : number, j : number, tile : MapMaker.Tile;

            if (!unit || !this.validCoords(unit.coords) || !this.validCoords(targetCoords) || (unit.coords[0] === targetCoords[0] && unit.coords[1] === targetCoords[1])) {
                cb(); // Clear any previous paths
                return;
            }

            grid = [];
            for (i = 0; i < this.rows; i++) {
                grid[i] = [];
                for (j = 0; j < this.cols; j++) {
                    tile = this.game.getTile([i, j]);
                    if (this.enemyUnits(this.game.turnID, [i, j]).length > 0 && (i !== targetCoords[0] || j !== targetCoords[1])) {
                        // Avoid enemies, except on the targetCoords tile
                        grid[i][j] = 0;
                    } else {
                        // Two types: two move (2), one move (1), and blocked
                        // But 2 move only matters if unit can move more than once
                        if (tile.features.indexOf("hills") >= 0 || tile.features.indexOf("forest") >= 0 || tile.features.indexOf("jungle") >= 0) {
                            grid[i][j] = unit.movement > 1 ? 2 : 1;
                        } else if (tile.terrain === "snow" || tile.terrain === "desert" || tile.terrain === "tundra" || tile.terrain === "grassland" || tile.terrain === "plains" || tile.terrain === "unseen") {
                            grid[i][j] = 1;
                        } else {
                            grid[i][j] = 0;
                        }
                    }
                }
            }

            easystar.setGrid(grid);
            easystar.setAcceptableTiles([1, 2]);
            easystar.enableDiagonals();
            easystar.setTileCost(2, 2);

            // Note that easystar coords are (x=col, y=row), so I have to switch things around since all the c4c internal coords are the opposite.
            easystar.findPath(unit.coords[1], unit.coords[0], targetCoords[1], targetCoords[0], function (path : {x : number; y : number}[]) {
                var i : number, pathArray : number[][];

                if (path) {
                    // Fix coord labels
                    pathArray = [];
                    for (i = 0; i < path.length; i++) {
                        pathArray[i] = [path[i].y, path[i].x]; // Swap back rows/cols from easystar
                    }
                }
                cb(pathArray);
            });

            // Not sure why the setTimeout is necessary (the easystar readme says to do it), but I get weird errors from easystar if it's not like this
            window.setTimeout(function () {
                easystar.calculate();
            });
        }

        // Make sure coords are on map
        validCoords(coords : number []) {
            if (coords) {
                return coords[0] >= 0 && coords[1] >= 0 && coords[0] < this.rows && coords[1] < this.cols;
            }

            return false;
        }

        // Moves a unit from its current coordinates to coords.
        // Doesn't call render automatically, since this is often called multiple times before rendering (like for moving a group)
        moveUnit(unit : Units.Unit, coords : number[]) {
            var i : number, tileUnits : Units.Unit[];

            // Delete old unit in map
            tileUnits = this.game.getTile(unit.coords, -1).units;
            for (i = 0; i < tileUnits.length; i++) {
                if (tileUnits[i].id === unit.id) {
                    tileUnits.splice(i, 1);
                    break;
                }
            }

            // Add unit at new tile
            this.game.getTile(coords, -1).units.push(unit);
        }

        // Entries in output matrix are visible (1) or not visible (0).
        updateVisibility() {
            var i : number, j : number, turnID : number, updateAll : boolean;

            // Initialize visibility if this is the first call to updateVisibility
            if (this.visibility === undefined) {
                this.visibility = [];
                updateAll = true;
            } else {
                updateAll = false;
            }

            // For loop only needed if we need to update visibility all at once
            for (turnID = 0; turnID < this.game.numPlayers; turnID++) {
                // Unless updateAll is true (such as for initialization of visibility), only update active player
                if (!updateAll && turnID !== this.game.turnID) {
                    continue;
                }

                // Find the visibilility of each tile in the grid (could be made smarter by only looking at units that can impact viewport)
                // Init as everything is unseen
                this.visibility[turnID] = [];
                for (i = 0; i < this.rows; i++) {
                    this.visibility[turnID][i] = [];
                    for (j = 0; j < this.cols; j++) {
                        this.visibility[turnID][i][j] = 0; // Not visible
                    }
                }

                // Loop through units, set visibility
                Object.keys(this.game.units[turnID]).forEach(function (id : number) {
                    var bonuses : {[name: string] : number}, i : number, j : number, radius : number, unit : Units.Unit;

                    unit = this.game.units[turnID][id];
                
                    // Number of tiles away from center that the unit can see
                    if (this.tiles[unit.coords[0]][unit.coords[1]].features.indexOf("hills") >= 0) {
                        radius = 2;
                    }  else {
                        radius = 1;
                    }

                    // Check for Sentry promotion
                    bonuses = unit.getBonuses();
                    if (bonuses.hasOwnProperty("visibilityRange") && bonuses["visibilityRange"] >= 0) {
                        radius += 1;
                    }

                    // Radius 1 search around unit
                    for (i = unit.coords[0] - radius; i <= unit.coords[0] + radius; i++) {
                        for (j = unit.coords[1] - radius; j <= unit.coords[1] + radius; j++) {
                            if (this.validCoords([i, j])) {
                                this.visibility[turnID][i][j] = 1; // Visible

                                // Cache current state
                                this.tiles[i][j].lastSeenState[turnID] = {
                                    terrain: this.tiles[i][j].terrain,
                                    features: this.tiles[i][j].features,
                                    units: [],
                                    city: this.tiles[i][j].city
                                };
                            }
                        }
                    }
                }.bind(this));
            }
        }

        enemyUnits(playerID : number, coords : number[]) : Units.Unit[] {
            return this.game.getTile(coords).units.filter(function (unit) { return unit.owner !== playerID; });
        }

        // Cost (in "movement") of moving from coordsFrom to coordsTo
        tileMovementCost(coordsFrom : number[], coordsTo : number[], bonuses : {[name : string] : number}) : number {
            var cost : number, tileTo : Tile;

            tileTo = this.game.getTile(coordsTo, -1);

            // Short circuit check for move bonuses
            if (tileTo.features.indexOf("hills") >= 0 && bonuses.hasOwnProperty("doubleMovementHills") && bonuses["doubleMovementHills"] > 0) {
                return 0.5;
            }
            if (tileTo.features.indexOf("forest") >= 0 && bonuses.hasOwnProperty("doubleMovementForest") && bonuses["doubleMovementForest"] > 0) {
                return 0.5;
            }

            cost = 1;

            if (tileTo.features.indexOf("hills") >= 0) {
                cost += 1;
            }
            if (tileTo.features.indexOf("forest") >= 0) {
                cost += 1;
            }

            // With mobility, decrease cost by 1, but lower bound is 1
            if (bonuses.hasOwnProperty("mobility") && bonuses["mobility"] > 0) {
                cost = Util.bound(cost - 1, 1, Infinity);
            }

            return cost;
        }
    }

    function initLastSeenState(game : Game) {
        var i : number, lastSeenState  : LastSeenState[];

        lastSeenState = [];

        for (i = 0; i < game.numPlayers; i++) {
            lastSeenState[i] = null;
        }

        return lastSeenState;
    }

    export class TotallyRandom extends Map {
        constructor(game : Game, rows : number, cols : number) {
            var i : number, j : number, types: {[terrain : string] : string[]};

            super(game);

            this.cols = cols !== undefined ? cols : 80;
            this.rows = rows !== undefined ? rows : 40;

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

            this.tiles = [];
            for (i = 0; i < this.rows; i++) {
                this.tiles[i] = [];
                for (j = 0; j < this.cols; j++) {
                    this.tiles[i][j] = {
                        terrain: Random.choice(Object.keys(types)),
                        features: [],
                        units: [],
                        city: null,
                        lastSeenState: initLastSeenState(this.game)
                    };
                    if (Math.random() < 0.5 && types[this.tiles[i][j].terrain].length > 0) {
                        this.tiles[i][j].features.push(Random.choice(types[this.tiles[i][j].terrain]));
                    }
                }
            }
        }
    }

    export class BigIsland extends Map {
        constructor(game : Game, rows : number, cols : number) {
            var ci : number, cj : number, i : number, j : number, r : number, types: {[terrain : string] : string[]};

            super(game);

            this.rows = rows !== undefined ? rows : 40;
            this.cols = cols !== undefined ? cols : 80;

            // Center of map
            ci = Math.round(this.rows / 2);
            cj = Math.round(this.cols / 2);

            // Radius of island
            r = Math.round(Math.min(this.rows, this.cols) * 0.5);

            this.tiles = [];
            for (i = 0; i < this.rows; i++) {
                this.tiles[i] = [];
                for (j = 0; j < this.cols; j++) {
                    // Inside circle at center?
                    if (Math.sqrt(Math.pow(ci - i, 2) + Math.pow(cj - j, 2)) <= r * (0.75 + 0.5 * Math.random())) {
                        this.tiles[i][j] = {
                            terrain: "grassland",
                            features: [],
                            units: [],
                            city: null,
                            lastSeenState: initLastSeenState(this.game)
                        };

                        // Features
                        if (Math.random() < 0.2) {
                            this.tiles[i][j].features.push("hills");
                        }
                        if (Math.random() < 0.3) {
                            this.tiles[i][j].features.push("forest");
                        }
                    } else {
                        this.tiles[i][j] = {
                            terrain: "sea",
                            features: [],
                            units: [],
                            city: null,
                            lastSeenState: initLastSeenState(this.game)
                        };
                    }
                }
            }

            this.eliminateUnconnectedIslands(ci, cj);
        }

        // Get rid of any unconnected islands by turning them to sea
        eliminateUnconnectedIslands(ci : number, cj : number) {
            var addLandNeighbors, found : boolean, goodLandCoords : number[][], i : number, j : number;

            // Start in center, find all connected land tiles
            goodLandCoords = [[ci, cj]];
            addLandNeighbors = function (coords : number[]) {
                var duplicate : boolean, i : number, j : number, newCoords : number[];

                for (i = coords[0] - 1; i <= coords[0] + 1; i++) {
                    for (j = coords[1] - 1; j <= coords[1] + 1; j++) {
                        newCoords = [i, j];
                        if (this.validCoords(newCoords) && this.tiles[i][j].terrain !== "sea") {
                            duplicate = false;
                            goodLandCoords.some(function (compareCoords : number[]) {
                                if (compareCoords[0] === newCoords[0] && compareCoords[1] === newCoords[1]) {
                                    duplicate = true;
                                    return true;
                                }
                            });
                            if (!duplicate) {
                                goodLandCoords.push(newCoords);
                                addLandNeighbors(newCoords);
                            }
                        }
                    }
                }
            }.bind(this);
            addLandNeighbors([ci, cj]);

            // Any land tile not in goodLandCoords is part of an unconnected island. Turn them to sea.
            for (i = 0; i < this.rows; i++) {
                for (j = 0; j < this.cols; j++) {
                    if (this.tiles[i][j].terrain !== "sea") {
                        found = false;
                        goodLandCoords.some(function (compareCoords : number[]) {
                            if (compareCoords[0] === i && compareCoords[1] === j) {
                                found = true;
                                return true;
                            }
                        });
                        if (!found) {
                            this.tiles[i][j].terrain = "sea";
                            this.tiles[i][j].features = [];
                        }
                    }
                }
            }
        }
    }
}