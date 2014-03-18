// Game - store the state of the game here, any non-UI stuff that would need for saving/loading a game

class Game {
    map : MapMaker.Map;
    maxId : number = 0;
    names: string[] = [];
    units : {[id : number] : Units.Unit}[] = []; // One object in array for each player. Then in object, can use unit ID as key
    groups : {[id : number] : Units.Group}[] = []; // Same as above
    activeUnit : Units.UnitOrGroup = null;
    turn : number = 0;

    constructor(numPlayers : number, mapRows : number, mapCols : number) {
        var i : number;

        this.map = new MapMaker.DefaultMap(mapRows, mapCols);

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

    getTile(coords : number[]) {
        if (this.map.validCoords(coords)) {
            return this.map.tiles[coords[0]][coords[1]];
        } else {
            return null;
        }
    }

    newTurn() {
        var i : number, j : string, unit : Units.Unit, group : Units.Group;

        // See if anything still has to be moved, after the initial turn
        if (game.turn > 0 && this.moveUnits()) {
            return;
        }

        game.turn++;
        chromeUI.onNewTurn();

        // Reset all movement counters
        for (i = 0; i < this.units.length; i++) {
            for (j in this.units[i]) {
                unit = this.units[i][j];
                unit.skippedTurn = false;
                unit.currentMovement = unit.movement;
            }
            for (j in this.groups[i]) {
                group = this.groups[i][j];
                group.skippedTurn = false;
                group.currentMovement = group.movement;
            }
        }

        this.moveUnits();
    }

    moveUnits() : boolean {
        var i : number, j : string, unit : Units.Unit, group : Units.Group;

        for (i = 0; i < this.names.length; i++) {
            // User
            if (i === config.PLAYER_ID) {
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
            } else {
                // Should auto-move AI units here
            }
        }

        // If we made it this far, everybody has moved
        chromeUI.onMovesDone();
        window.requestAnimationFrame(mapUI.render.bind(mapUI));
        return false;
    }
}