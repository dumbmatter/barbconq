// Units - classes for the various units types

module Units {
    export class BaseUnit {
        // Identification
        id : number; // Unique, incrementing
        owner : number;
        type : string;

        // Key attributes
        level : number = 1;
        xp : number = 0;
        strength : number;
        currentStrength : number;
        movement : number;
        currentMovement : number;
        coords : number[];
        targetCoords : number[] = null;

        // Special unit properties
        landOrSea : string;
        canAttack : boolean = true;
        canDefend : boolean = true;
        actions : string[];

        // Turn stuff
        private _active : boolean = false; // When set, show UI options for this unit
        moved : boolean = false; // When set, no need to loop through this unit before showing turn is over

        // Getters and setters, to make Knockout integration easier
        set active(value : boolean) {
            this._active = value;
        }
        get active() : boolean {
            return this._active;
        }

        constructor(owner : number, coords : number[]) {
            this.id = game.maxId;
            game.maxId += 1;

            this.owner = owner;

            // Set coordinates of unit and put a reference to the unit in the map
            this.coords = coords;
            game.map.tiles[coords[0]][coords[1]].units.push(this);

            // Store reference to unit in game.units
            game.units[this.owner][this.id] = this;
        }

        // goToCoords can be set to false if you don't want the map centered on the unit after activating, like on a left click
        activate(centerDisplay : boolean = true, autoMoveTowardsTarget : boolean = false) {
            // Deactivate current active unit, if there is one
            if (game.activeUnit) {
                game.activeUnit.active = false;
                game.activeUnit = null; // Is this needed? Next unit will set it, if it exists
            }

            // If this unit is on a path towards a target, just go along the path instead of activating. If there are still moves left when the target is reached, activate() will be called again.
            if (autoMoveTowardsTarget && this.targetCoords && this.currentMovement > 0) {
                setTimeout(function () {
                    this.moveTowardsTarget();
                }.bind(this), config.UNIT_MOVEMENT_UI_DELAY);
            }

            // Activate this unit
            this.active = true;
            game.activeUnit = this;
            if (centerDisplay) {
                mapUI.goToCoords(this.coords);
            }

            chromeUI.onUnitActivated();
        }

        // Set as moved, because it used up all its moves or because its turn was skipped or something
        setMoved() {
            this.moved = true;
            this.active = false;
            game.activeUnit = null; // Is this needed? Next unit will set it, if it exists

            // After delay, move to next unit
            setTimeout(function () {
                game.moveUnits();
            }, config.UNIT_MOVEMENT_UI_DELAY);
        }

        // Should be able to make this general enough to handle all units
        // Handle fight initiation here, if move goes to tile with enemy on it
        move(direction : string) {
            var newCoords;

            // Short circuit if no moves are available
            if (this.currentMovement <= 0) {
                return;
            }

            // Starting point
            newCoords = this.coords.slice();

            // Implement movement
            if (direction === "SW") {
                newCoords[0] += 1;
                newCoords[1] -= 1;
            } else if (direction === "S") {
                newCoords[0] += 1;
            } else if (direction === "SE") {
                newCoords[0] += 1;
                newCoords[1] += 1;
            } else if (direction === "W") {
                newCoords[1] -= 1;
            } else if (direction === "E") {
                newCoords[1] += 1;
            } else if (direction === "NW") {
                newCoords[0] -= 1;
                newCoords[1] -= 1;
            } else if (direction === "N") {
                newCoords[0] -= 1;
            } else if (direction === "NE") {
                newCoords[0] -= 1;
                newCoords[1] += 1;
            } else {
                // No move to make
                return;
            }

            // Don't walk off the map!
            if (mapUI.validCoords(newCoords)) {
                this.moveToCoords(newCoords);
            }
        }

        // Check for valid coords before calling
        moveToCoords(coords : number[]) {
            var i, tileUnits;

            // Delete old unit in map
            tileUnits = game.getTile(this.coords).units;
            for (i = 0; i < tileUnits.length; i++) {
                if (tileUnits[i].id === this.id) {
                    tileUnits.splice(i, 1);
                    break;
                }
            }

            // Add unit at new tile
            game.getTile(coords).units.push(this);

            // Keep track of movement
            this.coords = coords;
            this.currentMovement -= 1; // Should depend on terrain/improvements
            if (this.currentMovement <= 0) {
                this.currentMovement = 0;
                this.setMoved();
            }

            window.requestAnimationFrame(mapUI.render.bind(mapUI));
        }

        // Sets the unit on a path towards a coordinate on the map
        initiatePath(coords : number[]) {
            // See if there is a path to these coordinates
            game.map.pathFinding(this, coords, function (path : number[][]) {
                if (path) {
                    this.targetCoords = coords;

                    // This render is usually redundant if the user is setting a new path by right click, since that path is already on screen.
                    // But if the path is not set by right click, this is necessary.
                    // Also, if the path is set by right click but there is an old path and no moves, then mapUI.render would otherwise not be called after this point and the old path would be shown instead from a prior mapUI.render call.
                    window.requestAnimationFrame(mapUI.render.bind(mapUI));

                    this.moveTowardsTarget();
                } else {
                    // No path found!
                    this.targetCoords = null;
                    window.requestAnimationFrame(mapUI.render.bind(mapUI));
                }
            }.bind(this));
        }

        // Use up the player's moves by moving towards its targetCoords
        moveTowardsTarget() {
            game.map.pathFinding(this, this.targetCoords, function (path : number[][]) {
                var tryToMove;

                if (path) {
                    path.shift(); // Discard first one, since it's the current tile

                    // Move until moves are used up or target is reached
                    tryToMove = function (cb : () => void) {
                        if (this.currentMovement > 0 && path.length > 0) {
                            this.moveToCoords(path.shift());
                            // Delay so that the map can update before the next move
                            setTimeout(function () {
                                tryToMove(cb);
                            }, config.UNIT_MOVEMENT_UI_DELAY);
                        } else {
                            cb();
                        }
                    }.bind(this);

                    tryToMove(function () {
                        if (path.length === 0) {
                            // We reached our target!
                            this.targetCoords = null;
                            if (this.currentMovement > 0) {
                                this.activate(false); // Don't recenter, since unit must already be close to center of screen?
                            }
                        }
                    }.bind(this));
                } else {
                    // Must be something blocking the way now
                    this.targetCoords = null;
                }
            }.bind(this));
        }

        // Mark as moved and go to the next active unit
        skipTurn() {
            this.setMoved();

            // Clear any saved path
            this.targetCoords = null;

            requestAnimationFrame(mapUI.render.bind(mapUI));
        }

        fortify() {
console.log("FORTIFY")
        }

        sentry() {
console.log("SENTRY")
        }
    }

    export class Warrior extends BaseUnit {
        type = "Warrior";

        strength = 2;
        currentStrength = 2;
        movement = 2;
        currentMovement = 2;

        landOrSea = "land";
        actions = ["fortify", "skipTurn", "sentry"];
    }
}