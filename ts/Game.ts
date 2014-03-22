// Game - store the state of the game here, any non-UI stuff that would need for saving/loading a game

class Game {
    map : MapMaker.Map;
    maxId : number = 0;
    names: string[] = [];
    units : {[id : number] : Units.Unit}[] = []; // One object in array for each player. Then in object, can use unit ID as key
    groups : {[id : number] : Units.Group}[] = []; // Same as above
    activeUnit : Units.UnitOrGroup = null;
    turn : number = 0;
    turnID : number; // ID number of the user whose turn it is

    constructor(numPlayers : number, mapRows : number, mapCols : number) {
        var i : number;

        this.map = new MapMaker.BigIsland(mapRows, mapCols);

        // + 1 is for barbarians at index 0
        for (i = 0; i < numPlayers + 1; i++) {
            if (i === 0) {
                this.names.push("Barbarian");
            } else {
                this.names.push("Player " + i);
            }

            this.units.push({});
            this.groups.push({});
        }
    }

    // Returns null if coords are not valid. Otherwise, returns tile info while factoring in visibility
    // onlyVisible can be set when the base tile is needed no matter what, like adding new units at the beginning of the game
    // See also config.DISABLE_FOG_OF_WAR
    getTile(coords : number[], onlyVisible : boolean = true) : MapMaker.Tile {
        var i : number, j : number;

        i = coords[0];
        j = coords[1];

        if (this.map.validCoords(coords)) {
            if (!onlyVisible || config.DISABLE_FOG_OF_WAR) {
                // Forced to get real tile
                return this.map.tiles[i][j];
            }

            if (!this.map.visibility[i][j]) {
                if (!this.map.tiles[i][j].lastSeenState) {
                    // Never seen this tile, show nothing
                    return {
                        terrain: "unseen",
                        features: [],
                        units: []
                    };
                } else {
                    // Seen before, show last seen state
                    return this.map.tiles[i][j].lastSeenState;
                }
            } else {
                // Tile is visible (or forced to be shown), show current state
                return this.map.tiles[i][j];
            }
        } else {
            return null;
        }
    }

    newTurn() {
        var group : Units.Group, i : number, j : number, u : string, unit : Units.Unit, unitTypes : string[], tile : MapMaker.Tile;

        // See if anything still has to be moved, after the initial turn
        if (this.turn > 0 && this.moveUnits()) {
            return;
        }

        this.turn++;
        this.turnID = 0;
        chromeUI.onNewTurn();
        this.map.updateVisibility();

        // Randomly spawn barbs on non-visible tiles
        unitTypes = ["Scout", "Warrior", "Archer", "Chariot", "Spearman", "Axeman"];
        for (i = 0; i < this.map.rows; i++) {
            for (j = 0; j < this.map.cols; j++) {
                if (!this.map.visibility[i][j] && Math.random() < 0.01) {
                    tile = this.getTile([i, j], false);

                    // Spawn land unit
                    if (tile.terrain === "snow" || tile.terrain === "desert" || tile.terrain === "tundra" || tile.terrain === "grassland" || tile.terrain === "plains") {
                        new Units[Random.choice(unitTypes)](config.BARB_ID, [i, j]);
                    }
                }
            }
        }

        // Reset all movement counters
        for (i = 0; i < this.units.length; i++) {
            for (u in this.units[i]) {
                unit = this.units[i][u];
                unit.skippedTurn = false;
                unit.attacked = false;
                unit.currentMovement = unit.movement;
            }
            for (u in this.groups[i]) {
                group = this.groups[i][u];
                group.skippedTurn = false;
                group.currentMovement = group.movement;
            }
        }

        this.moveUnits();
    }

    moveUnits() : boolean {
        var centerViewport : boolean, i : number, j : string, unit : Units.Unit, group : Units.Group;

        for (i = this.turnID; i < this.names.length; i++) {
            if (i === config.PLAYER_ID) {
                // User

                // UNIT GROUPS
                // First look for ones not on a path towards targetCoords
                for (j in this.groups[i]) {
                    group = this.groups[i][j];
                    if (group.currentMovement > 0 && !group.skippedTurn && !group.targetCoords) {
                        group.activate();
                        return true;
                    }
                }

                // Then process all the targetCoords ones
                for (j in this.groups[i]) {
                    group = this.groups[i][j];
                    if (group.currentMovement > 0 && !group.skippedTurn) {
                        group.activate(true, true); // Activate, center screen, and auto-move to targetCoords
                        return true;
                    }
                }

                // INDIVIDUAL UNITS
                // First look for ones not on a path towards targetCoords
                for (j in this.units[i]) {
                    unit = this.units[i][j];
                    if (unit.currentMovement > 0 && !unit.skippedTurn && !unit.targetCoords && !unit.group) {
                        unit.activate();
                        return true;
                    }
                }

                // Then process all the targetCoords ones
                for (j in this.units[i]) {
                    unit = this.units[i][j];
                    if (unit.currentMovement > 0 && !unit.skippedTurn && !unit.group) {
                        unit.activate(true, true); // Activate, center screen, and auto-move to targetCoords
                        return true;
                    }
                }
            } else if (i === config.BARB_ID) {
                // INDIVIDUAL UNITS
                for (j in this.units[i]) {
                    unit = this.units[i][j];
                    if (unit.currentMovement > 0 && !unit.skippedTurn) {
                        centerViewport = !(game.activeUnit && game.activeUnit.id === unit.id); // Don't center viewport if unit is already active (multi-move)
                        unit.activate(centerViewport);

                        // Attack with >25% chance of winning

                        // Move towards weaker unit

                        // Move away from stronger unit

                        // Hurt, so fortify until healed

                        // Move randomly
                        setTimeout(function () {
                            if (Math.random() < 0.75) {
                                unit.move(Random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]));
                            } else {
                                unit.skipTurn();
                            }
                        }, config.UNIT_MOVEMENT_UI_DELAY);
                        return true;
                    }
                }
            } else {
                // Should auto-move non-barb AI units here
            }

            this.turnID += 1;
        }

        // If we made it this far, all of the user's units have moved
        chromeUI.onMovesDone();
        mapUI.render();
        return false;
    }
}