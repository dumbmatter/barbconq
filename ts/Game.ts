// Game - store the state of the game here, any non-UI stuff that would need for saving/loading a game

class Game {
    map : MapMaker.Map;
    maxId : number = 0;
    names: string[] = [];
    units : {[id : number] : Units.Unit}[] = []; // One object in array for each player. Then in object, can use unit ID as key
    groups : {[id : number] : Units.Group}[] = []; // Same as above
    cities : {[id : number] : Cities.City}[] = [];
    activeUnit : Units.UnitOrGroup = null;
    activeBattle : Combat.Battle = null;
    turn : number = 0;
    turnID : number; // ID number of the user whose turn it is
    result : string = "inProgress"; // Starts "inProgress", eventually will be "won" or "lost"
    nextPlayerAfterTargetCoordsDone : boolean = false; // Set to true when a turn is ended early

    constructor(mapRows : number, mapCols : number) {
        var i : number;

        this.map = new MapMaker.BigIsland(mapRows, mapCols);

        // + 1 is for barbarians at index 0
        for (i = 0; i < config.NUM_PLAYERS + 1; i++) {
            if (i === 0) {
                this.names.push("Barbarian");
            } else {
                this.names.push("Player " + i);
            }

            this.units.push({});
            this.groups.push({});
            this.cities.push({});
        }
    }

    // Returns null if coords are not valid. Otherwise, returns tile info while factoring in visibility
    // playerID can be used to get the tile from the "perspective" of different players.
    //   Default is -2, which will use the current active player in game.turnID.
    //   -1 will force the true base tile to be returned regardless of visibility, like for altering units on tile
    //   Anything >=0 is a player ID number
    // See also config.DISABLE_FOG_OF_WAR
    getTile(coords : number[], playerID : number = -2) : MapMaker.Tile {
        var i : number, j : number;

        // If playerID is -2, use the current active player
        if (playerID === -2) {
            playerID = this.turnID;
        }

        i = coords[0];
        j = coords[1];

        if (this.map.validCoords(coords)) {
            if (playerID === -1 || config.DISABLE_FOG_OF_WAR) {
                // Forced to get real tile
                return this.map.tiles[i][j];
            }

            if (!this.map.visibility[playerID][i][j]) {
                if (!this.map.tiles[i][j].lastSeenState[playerID]) {
                    // Never seen this tile, show nothing
                    return {
                        terrain: "unseen",
                        features: [],
                        units: [],
                        city: null
                    };
                } else {
                    // Seen before, show last seen state
                    return this.map.tiles[i][j].lastSeenState[playerID];
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
        var i : number, j : number, unitTypes : string[], tile : MapMaker.Tile;

/*        // See if anything still has to be moved, after the initial turn
        if (this.turn > 0 && this.moveUnits()) {
            return;
        }*/

        this.turn++;
        this.turnID = 0;
        this.map.updateVisibility();
        chromeUI.onNewTurn();

        // Randomly spawn barbs on non-visible tiles - works because barbs are turnID=0
        unitTypes = ["Scout", "Warrior", "Archer", "Chariot", "Spearman", "Axeman"];
        for (i = 0; i < this.map.rows; i++) {
            for (j = 0; j < this.map.cols; j++) {
                if (!this.map.visibility[config.USER_ID][i][j] && Math.random() < 0.01) {
                    tile = this.getTile([i, j], -1);

                    // Spawn land unit
                    if (tile.terrain === "snow" || tile.terrain === "desert" || tile.terrain === "tundra" || tile.terrain === "grassland" || tile.terrain === "plains") {
                        new Units[Random.choice(unitTypes)](config.BARB_ID, [i, j]);
                    }
                }
            }
        }
    }

    // Within a turn, move to the next player. Or if all players have moved, start the next turn.
    nextPlayer() {
        var allHealed : boolean, group : Units.Group, u : string, unit : Units.Unit;

        // Move to the next player, or start a new turn (move to player 0)
        if (this.turnID < config.NUM_PLAYERS) {
            this.turnID += 1;
        } else {
            this.newTurn();
        }

        // Stuff that happens before each turn, including the first
        for (u in this.units[this.turnID]) {
            unit = this.units[this.turnID][u];
            unit.updateCanPromoteToLevel();
        }
        this.nextPlayerAfterTargetCoordsDone = false;

        // Stuff that happens before each turn, except the first of the game
        if (this.turn > 1) {
            // Reset all unit counters, do healing/fortifiedTurns crap
            for (u in this.units[this.turnID]) {
                unit = this.units[this.turnID][u];

                if (unit.canHeal) {
                    unit.fortifiedTurns += 1;

                    // Heal 10 HP
                    unit.currentStrength = Util.bound(unit.currentStrength + 10 * unit.strength / 100, 0, unit.strength);
                } else {
                    unit.fortifiedTurns = 0;
                }

                // If fortifiedUntilHealed and not in group, wake when healed
                if (unit.fortifiedUntilHealed && !unit.group && unit.currentStrength >= unit.strength) {
                    unit.wake();
                }

                if (!unit.fortified) {
                    unit.skippedTurn = false;
                } else {
                    unit.skippedTurn = true;
                }

                unit.attacked = false;
                unit.canHeal = true;
                unit.currentMovement = unit.movement;
            }

            for (u in this.groups[this.turnID]) {
                group = this.groups[this.turnID][u];

                if (!group.fortified) {
                    group.skippedTurn = false;
                } else {
                    unit.skippedTurn = true;
                }

                // If fortifiedUntilHealed and all in group are healed, wake
                if (group.fortifiedUntilHealed) {
                    allHealed = true;
                    group.units.forEach(function (unit) {
                        if (unit.currentStrength < unit.strength) {
                            allHealed = false;
                        }
                    });
                    if (allHealed) {
                        group.wake();
                    }
                }

                group.currentMovement = group.movement;
            }
        }

        this.moveUnits();
    }

    moveUnits() : boolean {
        var centerViewport : boolean, i : number, j : string, unit : Units.Unit, group : Units.Group;

        i = this.turnID;

        if (i === config.USER_ID) {
            // User

            // UNIT GROUPS
            // First look for ones not on a path towards targetCoords
            if (!this.nextPlayerAfterTargetCoordsDone) {
                for (j in this.groups[i]) {
                    group = this.groups[i][j];
                    if (group.currentMovement > 0 && !group.skippedTurn && !group.targetCoords) {
                        group.activate();
                        return true;
                    }
                }
            }

            // Then process all the targetCoords ones
            for (j in this.groups[i]) {
                group = this.groups[i][j];
                if (group.currentMovement > 0 && !group.skippedTurn && group.targetCoords) {
                    group.activate(true, true); // Activate, center screen, and auto-move to targetCoords
                    return true;
                }
            }

            // INDIVIDUAL UNITS
            // First look for ones not on a path towards targetCoords
            if (!this.nextPlayerAfterTargetCoordsDone) {
                for (j in this.units[i]) {
                    unit = this.units[i][j];
                    if (unit.currentMovement > 0 && !unit.skippedTurn && !unit.targetCoords && !unit.group) {
                        unit.activate();
                        return true;
                    }
                }
            }

            // Then process all the targetCoords ones
            for (j in this.units[i]) {
                unit = this.units[i][j];
                if (unit.currentMovement > 0 && !unit.skippedTurn && !unit.group && unit.targetCoords) {
                    unit.activate(true, true); // Activate, center screen, and auto-move to targetCoords
                    return true;
                }
            }

            if (this.nextPlayerAfterTargetCoordsDone) {
                // All auto-moves are done and turn was ended early, so go to next turn
                this.nextPlayer();
                return false;
            }

            // If we made it this far, all of the user's units have moved
            chromeUI.onMovesDone();
            mapUI.render();
            return false;
        } else if (i === config.BARB_ID) {
            chromeUI.onAIMoving();

            // INDIVIDUAL UNITS
            for (j in this.units[i]) {
                unit = this.units[i][j];
                if (unit.currentMovement > 0 && !unit.skippedTurn) {
                    centerViewport = !(game.activeUnit && game.activeUnit.id === unit.id); // Don't center viewport if unit is already active (multi-move)
                    unit.activate(centerViewport);

                    setTimeout(function () {
                        var battle : Combat.Battle, currentTile : MapMaker.Tile, enemies : {coords : number[]; oddsWinFight : number}[], i : number, j : number, possibleCoords : number[][], units : {attacker : Units.Unit; defender : Units.Unit};

                        // For each visible enemy unit within 3 tiles, calculate and store {coords, oddsWinFight}
                        enemies = [];
                        for (i = unit.coords[0] - 3; i <= unit.coords[0] + 3; i++) {
                            for (j = unit.coords[1] - 3; j <= unit.coords[1] + 3; j++) {
                                if (game.map.validCoords([i, j])) {
                                    // If there is any defender on this tile, find the best defender and calculate battle odds
                                    units = Combat.findBestDefender(game.activeUnit, [i, j]);
                                    if (units.defender) {
                                        battle = new Combat.Battle(unit, units.defender);
                                        enemies.push({
                                            coords: [i, j],
                                            oddsWinFight: battle.odds().attackerWinsFight
                                        });                                        
                                    }
                                }
                            }
                        }
                        // Sort by odds descending, so that the best odds will be selected first
                        enemies.sort(function (a, b) { return b.oddsWinFight - a.oddsWinFight; }); 

                        currentTile = game.getTile(unit.coords);

                        // MOVE DECISION

                        // If in city, only move to attack if >75% chance of winning and if 2 other units are in city
                        if (currentTile.city) {
                            if (currentTile.units.length > 2) {
                                for (i = 0; i < enemies.length; i++) {
                                    // Only look at adjacent tiles
                                    if (Math.abs(unit.coords[0] - enemies[i].coords[0]) <= 1 && Math.abs(unit.coords[1] - enemies[i].coords[1]) <= 1) {
                                        if (enemies[i].oddsWinFight >= 0.75) {
console.log("Attack out of city with " + enemies[i].oddsWinFight + " odds");
                                            unit.moveToCoords(enemies[i].coords);
                                            return;
                                        }
                                    }
                                }

                            }

console.log("Wait in city");
                            unit.skipTurn();
                            return;
                        }

                        // Attack with >25% chance of winning
                        for (i = 0; i < enemies.length; i++) {
                            // Only look at adjacent tiles
                            if (Math.abs(unit.coords[0] - enemies[i].coords[0]) <= 1 && Math.abs(unit.coords[1] - enemies[i].coords[1]) <= 1) {
                                if (enemies[i].oddsWinFight >= 0.25) {
console.log("Attack with " + enemies[i].oddsWinFight + " odds");
                                    unit.moveToCoords(enemies[i].coords);
                                    return;
                                }
                            }
                        }

                        // Move into city, if possible
                        // This is for both moving in to defend a barb city, and attacking a non-barb city
                        for (i = unit.coords[0] - 1; i <= unit.coords[0] + 1; i++) {
                            for (j = unit.coords[1] - 1; j <= unit.coords[1] + 1; j++) {
                                if ((i !== unit.coords[0] || j !== unit.coords[1]) && game.map.validCoords([i, j])) {
                                    if (game.getTile([i, j]).city) {
console.log("Move into city");
                                            unit.moveToCoords([i, j]);
                                            return;
                                    }
                                }
                            }
                        }

                        // Move towards nearby weaker unit
                        for (i = 0; i < enemies.length; i++) {
                            if (enemies[i].oddsWinFight >= 0.5) {
console.log("Move towards unit with " + enemies[i].oddsWinFight + " odds");
                                unit.initiatePath(enemies[i].coords);
                                return;
                            }
                        }
                        

                        // Move away from stronger unit
                        for (i = 0; i < enemies.length; i++) {
                            // Only look at adjacent tiles
                            if (Math.abs(unit.coords[0] - enemies[i].coords[0]) <= 1 && Math.abs(unit.coords[1] - enemies[i].coords[1]) <= 1) {
                                if (enemies[i].oddsWinFight < 0.25) {
console.log("Run away from enemy with " + enemies[i].oddsWinFight + " odds");

                                    // If in corner, move anywhere except directly next to corner
                                    possibleCoords = [
                                        [unit.coords[0] + 1, unit.coords[1] + 1],
                                        [unit.coords[0] + 1, unit.coords[1]],
                                        [unit.coords[0] + 1, unit.coords[1] - 1],
                                        [unit.coords[0], unit.coords[1] + 1],
                                        [unit.coords[0], unit.coords[1] - 1],
                                        [unit.coords[0] - 1, unit.coords[1] + 1],
                                        [unit.coords[0] - 1, unit.coords[1]],
                                        [unit.coords[0] - 1, unit.coords[1] - 1]
                                    ].filter(function (coords) {
                                        return Math.abs(coords[0] - enemies[i].coords[0]) > 1 || Math.abs(coords[1] - enemies[i].coords[1]) > 1
                                    });
console.log(possibleCoords);

                                    unit.moveToCoords(Random.choice(possibleCoords));

                                    return;
                                }
                            }
                        }

                        // Fortify until healed, if hurt

                        // Move towards city
                        // Set on path, then clear path after movement so next turn can find best move again

                        // Move randomly
console.log("Move randomly");
                        if (Math.random() < 0.75) {
                            unit.move(Random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]));
                            return;
                        }

                        unit.skipTurn();
                    }, unit.movementDelay());
                    return true;
                }
            }

            // If we made it this far, all of the barbarian units have moved
            chromeUI.onAIMovingDone();
            game.nextPlayer();
            return false;
        } else {
            // Should auto-move non-barb AI units here
        }
    }
}