/*
Units - classes for the various units types

Inheritance chart:
BaseUnitOrGroup - properties and functions that apply to all units and groups of units
-> BaseUnit - stuff specific to individual units
   -> All the individual unit classes, like Warrior
-> UnitGroup - groups of units

The general idea for groups of units is that they should expose the same API as regular units, so
all the rest of the code can treat them the same. Mainly through the use of getters and setters,
they take the appropriate action with updating each variable (some things trickle down to individual
units, like move counting, and others don't).
*/

module Units {
    // Things that both individual units and groups of units have in common
    export class BaseUnitOrGroup {
        // Identification
        _owner : number;

        // Key attributes
        _movement: number;
        _currentMovement : number;
        _coords : number[];
        _targetCoords : number[] = null;

        // Special unit properties
        _landOrSea : string;
        _canAttack : boolean;
        _canDefend : boolean;
        _actions : string[];

        // Turn stuff
        _active : boolean = false; // When set, show UI options for this unit
        _moved : boolean = false; // When set, no need to loop through this unit before showing turn is over

        // Default getters/setters for units
        set owner(value : number) { this._owner = value; }
        get owner() : number { return this._owner; }
        set movement(value : number) { this._movement = value; }
        get movement() : number { return this._movement; }
        set currentMovement(value : number) { this._currentMovement = value; }
        get currentMovement() : number { return this._currentMovement; }
        set coords(value : number[]) { this._coords = value; }
        get coords() : number[] { return this._coords; }
        set targetCoords(value : number[]) { this._targetCoords = value; }
        get targetCoords() : number[] { return this._targetCoords; }
        set landOrSea(value : string) { this._landOrSea = value; }
        get landOrSea() : string { return this._landOrSea; }
        set canAttack(value : boolean) { this._canAttack = value; }
        get canAttack() : boolean { return this._canAttack; }
        set canDefend(value : boolean) { this._canDefend = value; }
        get canDefend() : boolean { return this._canDefend; }
        set actions(value : string[]) { this._actions = value; }
        get actions() : string[] { return this._actions; }
        set active(value : boolean) { this._active = value; }
        get active() : boolean { return this._active; }
        set moved(value : boolean) { this._moved = value; }
        get moved() : boolean { return this._moved; }

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
            if (game.map.validCoords(newCoords)) {
                this.moveToCoords(newCoords);
            }
        }

        // Needs to be defined separately for individual and group
        moveOnMap(coords : number[]) {}

        // Check for valid coords before calling
        moveToCoords(coords : number[]) {
            // Move the unit(s) in the map data structure
            this.moveOnMap(coords);

            // Keep track of movement locally
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

    export class BaseUnit extends BaseUnitOrGroup {
        // Identification
        id : number; // Unique, incrementing
        type : string;
        unitGroup : UnitGroup;

        // Key attributes
        level : number = 1;
        xp : number = 0;
        strength : number;
        currentStrength : number;

        // Set some defaults for special unit properties
        landOrSea = "land";
        canAttack = true;
        canDefend = true;

        constructor(owner : number, coords : number[]) {
            super();

            this.id = game.maxId;
            game.maxId += 1;

            this.owner = owner;

            // Set coordinates of unit and put a reference to the unit in the map
            this.coords = coords;
            game.map.tiles[coords[0]][coords[1]].units.push(this);

            // Store reference to unit in game.units
            game.units[this.owner][this.id] = this;
        }

        moveOnMap(coords : number[]) {
            // It's an individual unit!
            game.map.moveUnit(this, coords);
        }
    }

    export class UnitGroup extends BaseUnitOrGroup {
        units : BaseUnit[] = [];

        // Getters/setters for groups

        // Set for group and every group member, like if the entire group is captured
        set owner(value : number) {
            var i, min;

            for (i = 0; i < this.units.length; i++) {
                this.units[i].owner = value;
            }
            this._owner = value;
        }
        // Read value from group, since they're all the same
        get owner() : number { return this._owner; }

        // Do nothing, can't be changed at group level
        set movement(value : number) {}
        // Find minimum of group members
        get movement() : number {
            var i, min;

            min = Infinity;
            for (i = 0; i < this.units.length; i++) {
                if (this.units[i].movement < min) {
                    min = this.units[i].movement;
                }
            }
            return min;
        }

        // Update each unit in group with difference, and keep track at group level for comparison here
        set currentMovement(value : number) {
            var diff, i;

            if (value === this.movement) {
                // We're resetting the current movement at the start of a new turn
            } else {
                // We're moving and need to update
                diff = this._currentMovement - value;
                for (i = 0; i < this.units.length; i++) {
                    this.units[i].currentMovement -= diff;
                }
            }
            this._currentMovement = value;
        }
        // Find minimum of group members
        get currentMovement() : number {
            var i, min;

            min = Infinity;
            for (i = 0; i < this.units.length; i++) {
                if (this.units[i].currentMovement < min) {
                    min = this.units[i].currentMovement;
                }
            }
            return min;
        }

        // Set for group and every group member
        set coords(value : number[]) {
            var i, min;

            for (i = 0; i < this.units.length; i++) {
                this.units[i].coords = value;
            }
            this._coords = value;
        }
        // Read value from group, since they're all the same
        get coords() : number[] { return this._coords; }

        // Set for group
        set targetCoords(value : number[]) { this._targetCoords = value; }
        // Read value from group
        get targetCoords() : number[] { return this._targetCoords; }

        // Do nothing, can't be changed at group level
        set landOrSea(value : string) {}
        // Find from units, all have the same value
        get landOrSea() : string {
            return this.units[0].landOrSea;
        }

        // Do nothing, can't be changed at group level
        set canAttack(value : boolean) {}
        get canAttack() : boolean {
            var i;

            for (i = 0; i < this.units.length; i++) {
                if (this.units[i].canAttack) {
                    return true;
                }
            }
            return false;
        }

        // Do nothing, can't be changed at group level
        set canDefend(value : boolean) {}
        get canDefend() : boolean {
            var i;

            for (i = 0; i < this.units.length; i++) {
                if (this.units[i].canAttack) {
                    return true;
                }
            }
            return false;
        }

        // Do nothing, can't be changed at group level
        set actions(value : string[]) {}
        get actions() : string[] {
            var actions, i, j;

            actions = [];
            for (i = 0; i < this.units.length; i++) {
                for (j = 0; j < this.units[i].actions.length; j++) {
                    if (actions.indexOf(this.units[i].actions[j]) < 0) {
                        actions.push(this.units[i].actions[j]);
                    }
                }
            }
            return actions;
        }
        set active(value : boolean) { this._active = value; }
        get active() : boolean { return this._active; }
        set moved(value : boolean) { this._moved = value; }
        get moved() : boolean { return this._moved; }

        constructor(owner : number, units : BaseUnit[]) {
            super();

            this.owner = owner;

            this.add(units);

            // Initialize private variables
            this.currentMovement = this.currentMovement; // Getters/setters make this make sense, maybe
            this.coords = units[0].coords;

            // Store reference to group in game.unitGroups
            game.unitGroups[this.owner].push(this);
        }

        moveOnMap(coords : number[]) {
            var i;

            // It's a unit group!
            for (i = 0; i < this.units.length; i++) {
                game.map.moveUnit(this.units[i], coords);
            }
        }

        add(units : BaseUnit[]) {
            var i;

            for (i = 0; i < units.length; i++) {
                this.units.push(units[i]);
                units[i].unitGroup = this;
            }
        }

        remove(id) {}

        disband() {
            var i, toActivate;

            // Arbitrarily activate the first member of this unit
            toActivate = this.units[0];

            for (i = 0; i < this.units.length; i++) {
                this.units[i].unitGroup = null;
            }

            for (i = 0; i < game.unitGroups[this.owner].length; i++) {
                if (game.unitGroups[this.owner][i] === this) {
                    if (this.active) {
                        game.activeUnit = null;
                    }

                    game.unitGroups[this.owner].splice(i, 1);
                }
            }

            toActivate.activate();
        }

        merge() {}
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