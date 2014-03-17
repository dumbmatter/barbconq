/*
Units - classes for the various units types

Inheritance chart:
UnitOrGroup - properties and functions that apply to all units and groups of units
-> Unit - stuff specific to individual units
   -> All the individual unit classes, like Warrior
-> Group - groups of units

The general idea for groups of units is that they should expose the same API as regular units, so
all the rest of the code can treat them the same. Mainly through the use of getters and setters,
they take the appropriate action with updating each variable (some things trickle down to individual
units, like move counting, and others don't).
*/

module Units {
    // Things that both individual units and groups of units have in common
    export class UnitOrGroup {
        // Identification
        id : number; // Unique, incrementing
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
        _skippedTurn : boolean = false; // When set, no need to loop through this unit before showing turn is over

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
        set skippedTurn(value : boolean) { this._skippedTurn = value; }
        get skippedTurn() : boolean { return this._skippedTurn; }

        constructor() {
            // Set unique ID for unit or group
            this.id = game.maxId;
            game.maxId += 1;
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
            window.requestAnimationFrame(mapUI.render.bind(mapUI));
        }

        // Should be able to make this general enough to handle all units
        // Handle fight initiation here, if move goes to tile with enemy on it
        move(direction : string) {
            var newCoords : number[];

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

            // Reset skippedTurn status
            this.skippedTurn = false;

            // Keep track of movement locally
            this.coords = coords;
            this.currentMovement -= 1; // Should depend on terrain/improvements
            if (this.currentMovement <= 0) {
                this.currentMovement = 0;

                this.active = false;

                // After delay, move to next unit
                setTimeout(function () {
                    game.activeUnit = null;
                    game.moveUnits();
                }, config.UNIT_MOVEMENT_UI_DELAY);
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

        // Mark skippedTurn and go to the next active unit
        skipTurn() {
            this.skippedTurn = true;
            this.active = false;

            // After delay, move to next unit
            setTimeout(function () {
                game.activeUnit = null;
                game.moveUnits();
            }, config.UNIT_MOVEMENT_UI_DELAY);

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

    export class Unit extends UnitOrGroup {
        // Identification
        type : string;
        group : Group;

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

    export class Group extends UnitOrGroup {
        units : Unit[] = [];

        // Getters/setters for groups

        // Set for group and every group member, like if the entire group is captured
        set owner(value : number) {
            var i : number, min : number;

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
            var i : number, min : number;

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
            var diff : number, i : number;

            if (value === this.movement) {
                // We're resetting the current movement at the start of a new turn
            } else {
                // We're moving and need to update
                diff = this.currentMovement - value;
                for (i = 0; i < this.units.length; i++) {
                    this.units[i].currentMovement -= diff;
                }
            }
            this._currentMovement = value;
        }
        // Find minimum of group members
        get currentMovement() : number {
            var i : number, min : number;

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
            var i : number;

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
            var i : number;

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
            var i : number;

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
            var actions : string[], i : number, j : number;

            actions = [];
            for (i = 0; i < this.units.length; i++) {
                for (j = 0; j < this.units[i].actions.length; j++) {
                    if (actions.indexOf(this.units[i].actions[j]) < 0) {
                        actions.push(this.units[i].actions[j]);
                    }
                }
            }

            actions.push("separate");

            return actions;
        }

        set active(value : boolean) { this._active = value; }
        get active() : boolean { return this._active; }

        // Set for group and every group member
        set skippedTurn(value : boolean) {
            var i : number;

            for (i = 0; i < this.units.length; i++) {
                this.units[i].skippedTurn = value;
            }
            this._skippedTurn = value;
        }
        get skippedTurn() : boolean { return this._skippedTurn; }

        constructor(owner : number, units : Unit[]) {
            super();

            this.owner = owner;

            this.add(units);

            // Initialize private variables
            this.coords = units[0].coords;

            // Store reference to group in game.groups
            game.groups[this.owner][this.id] = this;
        }

        moveOnMap(coords : number[]) {
            var i : number;

            // It's a unit group!
            for (i = 0; i < this.units.length; i++) {
                game.map.moveUnit(this.units[i], coords);
            }
        }

        add(units : Unit[]) {
            var i : number;

            for (i = 0; i < units.length; i++) {
                this.units.push(units[i]);
                units[i].group = this;
            }
        }

        remove(id : number, activateUnitIfSeparate : boolean = true) {
            var i : number;

            for (i = 0; i < this.units.length; i++) {
                if (this.units[i].id === id) {
                    this.units[i].group = null;
                    this.units.splice(i, 1);
                    break;
                }
            }

            // Don't keep a unit of 1 around
            if (this.units.length === 1) {
                this.separate(activateUnitIfSeparate);
            }
        }

        separate(activateUnitAtEnd : boolean = true) {
            var i : number, toActivate : Unit;

            // Save the first member of this unit to arbitrarily activate at the end
            toActivate = this.units[0];

            // Remove all units from group
            for (i = 0; i < this.units.length; i++) {
                this.units[i].group = null;
            }

            // Delete group
            if (this.active) {
                game.activeUnit = null;
            }
            delete game.groups[this.owner][this.id];

            // If desired, activate one of the members of the separateed group
            if (activateUnitAtEnd) {
                toActivate.activate();
            }
        }

        merge() {}
    }

    export class Warrior extends Unit {
        type = "Warrior";

        strength = 2;
        currentStrength = 2;
        movement = 1;
        currentMovement = 1;

        landOrSea = "land";
        actions = ["fortify", "skipTurn", "sentry"];
    }

    export class Chariot extends Unit {
        type = "Chariot";

        strength = 4;
        currentStrength = 4;
        movement = 2;
        currentMovement = 2;

        landOrSea = "land";
        actions = ["fortify", "skipTurn", "sentry"];
    }

    // Functions for working with units or groups of units

    // Like alt+click
    export function addUnitsToNewGroup(owner : number, units : Unit[]) {
        var newUnits : Unit[], newGroup : Group;

        // Separate any current groups on the tile
        newUnits = [];
        units.forEach(function (unit) {
            if (unit.group) {
                unit.group.separate(false);
            }
            if (unit.currentMovement > 0) {
                newUnits.push(unit);
            }
        });

        if (newUnits.length > 0) {
            // Make a new group with all units with currentMovement > 0 and activate it
            newGroup = new Units.Group(owner, newUnits);
            newGroup.activate(false);
        }
    }

    // Like ctrl+click
    export function addUnitsWithTypeToNewGroup(owner : number, units : Unit[], type : string) {
        var newUnits : Unit[], newGroup : Group;

        // Separate any current groups on this tile involving this type
        newUnits = [];
        units.forEach(function (unit) {
            if (unit.currentMovement > 0 && unit.type === type) {
                if (unit.group) {
                    unit.group.separate(false);
                }
                newUnits.push(unit);
            }
        });

        if (newUnits.length > 0) {
            // Make a new group from all the units of the clicked type with currentMovement > 0
            newGroup = new Units.Group(owner, newUnits);
            newGroup.activate(false);
        }
    }
}