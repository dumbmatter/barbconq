// MapMaker - map generation module

module MapMaker {
    export interface Tile {
        terrain : string;
        features : string[];
        units : Units.BaseUnit[];
    }

    export class Map {
        width : number;
        height : number;
        tiles : Tile[][];

        // Default callback will draw path (or clear path if it's not valid)
        pathFinding(unit : Units.BaseUnit = null, targetCoords : number[] = null, cb : (path? : number[][]) => void = mapUI.drawPath.bind(mapUI)) {
            var grid : number[][], i : number, j : number;

            if (!unit || !this.validCoords(unit.coords) || !this.validCoords(targetCoords) || (unit.coords[0] === targetCoords[0] && unit.coords[1] === targetCoords[1])) {
                cb(); // Clear any previous paths
                return;
            }

            grid = [];
            for (i = 0; i < this.tiles.length; i++) {
                grid[i] = [];
                for (j = 0; j < this.tiles[0].length; j++) {
                    // Two types: two move (2), one move (1), and blocked
                    // But 2 move only matters if unit can move more than once
                    if (this.tiles[i][j].features.indexOf("hills") >= 0 || this.tiles[i][j].features.indexOf("forest") >= 0 || this.tiles[i][j].features.indexOf("jungle") >= 0) {
                        grid[i][j] = unit.movement > 1 ? 2 : 1;
                    } else if (this.tiles[i][j].terrain === "snow" || this.tiles[i][j].terrain === "desert" || this.tiles[i][j].terrain === "tundra" || this.tiles[i][j].terrain === "grassland" || this.tiles[i][j].terrain === "plains") {
                        grid[i][j] = 1;
                    } else {
                        grid[i][j] = 0;
                    }
                }
            }

            easystar.setGrid(grid);
            easystar.setAcceptableTiles([1, 2]);
            easystar.enableDiagonals();
            easystar.setTileCost(2, 2);

            // Note that easystar coords are (x=col, y=row), so I have to switch things around since all the c4c internal coords are the opposite.
            easystar.findPath(unit.coords[1], unit.coords[0], targetCoords[1], targetCoords[0], function (path) {
                var i;

                if (path) {
                    // Fix coord labels
                    for (i = 0; i < path.length; i++) {
                        path[i] = [path[i].y, path[i].x]; // Swap back rows/cols from easystar
                    }
                }
                cb(path);
            });

            // Not sure why the setTimeout is necessary (the easystar readme says to do it), but I get weird errors from easystar if it's not like this
            window.setTimeout(function () {
                easystar.calculate();
            });
        }

        // Make sure coords are on map
        validCoords(coords : number []) {
            if (coords) {
                return coords[0] >= 0 && coords[1] >= 0 && coords[0] < this.height && coords[1] < this.width;
            }

            return false;
        }
    }

    export class DefaultMap extends Map {
        constructor(rows : number, cols : number) {
            var i, j, types;

            super();

            this.width = cols !== undefined ? cols : 80;
            this.height = rows !== undefined ? rows : 40;

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
            for (i = 0; i < this.height; i++) {
                this.tiles[i] = [];
                for (j = 0; j < this.width; j++) {
                    this.tiles[i][j] = {
                        terrain: Random.choice(Object.keys(types)),
                        features: [],
                        units: []
                    };
                    if (Math.random() < 0.5 && types[this.tiles[i][j].terrain].length > 0) {
                        this.tiles[i][j].features.push(Random.choice(types[this.tiles[i][j].terrain]));
                    }
                }
            }
        }
    }
}