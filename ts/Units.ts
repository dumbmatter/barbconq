/*
Units - classes for the various units types

Inheritance chart:
BaseUnitOrStack - properties and functions that apply to all units and stacks of units
-> BaseUnit - stuff specific to individual units
   -> All the individual unit classes, like Warrior
-> Stack - stacks of units

The general idea for stacks of units is that they should expose the same API as regular units, so
all the rest of the code can treat them the same. Mainly through the use of getters and setters,
they take the appropriate action with updating each variable (some things trickle down to individual
units, like move counting, and others don't).
*/

module Units {
    // Things that both individual units and stacks of units have in common
    export class BaseUnitOrStack {
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

        constructor() {
            // Set unique ID for unit or stack
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

        // Needs to be defined separately for individual and stack
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

    export class BaseUnit extends BaseUnitOrStack {
        // Identification
        type : string;
        stack : Stack;

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

    export class Stack extends BaseUnitOrStack {
        units : BaseUnit[] = [];

        // Getters/setters for stacks

        // Set for stack and every stack member, like if the entire stack is captured
        set owner(value : number) {
            var i : number, min : number;

            for (i = 0; i < this.units.length; i++) {
                this.units[i].owner = value;
            }
            this._owner = value;
        }
        // Read value from stack, since they're all the same
        get owner() : number { return this._owner; }

        // Do nothing, can't be changed at stack level
        set movement(value : number) {}
        // Find minimum of stack members
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

        // Update each unit in stack with difference, and keep track at stack level for comparison here
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
        // Find minimum of stack members
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

        // Set for stack and every stack member
        set coords(value : number[]) {
            var i : number;

            for (i = 0; i < this.units.length; i++) {
                this.units[i].coords = value;
            }
            this._coords = value;
        }
        // Read value from stack, since they're all the same
        get coords() : number[] { return this._coords; }

        // Set for stack
        set targetCoords(value : number[]) { this._targetCoords = value; }
        // Read value from stack
        get targetCoords() : number[] { return this._targetCoords; }

        // Do nothing, can't be changed at stack level
        set landOrSea(value : string) {}
        // Find from units, all have the same value
        get landOrSea() : string {
            return this.units[0].landOrSea;
        }

        // Do nothing, can't be changed at stack level
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

        // Do nothing, can't be changed at stack level
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

        // Do nothing, can't be changed at stack level
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

        // Set for stack and every stack member
        set moved(value : boolean) {
            var i : number;

            for (i = 0; i < this.units.length; i++) {
                this.units[i].moved = value;
            }
            this._moved = value;
        }
        get moved() : boolean { return this._moved; }

        constructor(owner : number, units : BaseUnit[]) {
            super();

            this.owner = owner;

            this.add(units);

            // Initialize private variables
            this.coords = units[0].coords;

            // Store reference to stack in game.stacks
            game.stacks[this.owner][this.id] = this;
        }

        moveOnMap(coords : number[]) {
            var i : number;

            // It's a unit stack!
            for (i = 0; i < this.units.length; i++) {
                game.map.moveUnit(this.units[i], coords);
            }
        }

        add(units : BaseUnit[]) {
            var i : number;

            for (i = 0; i < units.length; i++) {
                this.units.push(units[i]);
                units[i].stack = this;
            }
        }

        remove(id : number, activateUnitIfSeparate : boolean = true) {
            var i : number;

            for (i = 0; i < this.units.length; i++) {
                if (this.units[i].id === id) {
                    this.units[i].stack = null;
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
            var i : number, toActivate : BaseUnit;

            // Save the first member of this unit to arbitrarily activate at the end
            toActivate = this.units[0];

            // Remove all units from stack
            for (i = 0; i < this.units.length; i++) {
                this.units[i].stack = null;
            }

            // Delete stack
            if (this.active) {
                game.activeUnit = null;
            }
            delete game.stacks[this.owner][this.id];

            // If desired, activate one of the members of the separateed stack
            if (activateUnitAtEnd) {
                toActivate.activate();
            }
        }

        merge() {}
    }

    export class Warrior extends BaseUnit {
        type = "Warrior";

        strength = 2;
        currentStrength = 2;
        movement = 1;
        currentMovement = 1;

        landOrSea = "land";
        actions = ["fortify", "skipTurn", "sentry"];
    }

    export class Chariot extends BaseUnit {
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
    export function addUnitsToNewStack(owner : number, units : BaseUnit[]) {
        var newUnits : BaseUnit[], newStack : Stack;

        // Separate any current stacks on the tile
        newUnits = [];
        units.forEach(function (unit) {
            if (unit.stack) {
                unit.stack.separate(false);
            }
            if (unit.currentMovement > 0) {
                newUnits.push(unit);
            }
        });

        if (newUnits.length > 0) {
            // Make a new stack with all units with currentMovement > 0 and activate it
            newStack = new Units.Stack(owner, newUnits);
            newStack.activate(false);
        }
    }

    // Like ctrl+click
    export function addUnitsWithTypeToNewStack(owner : number, units : BaseUnit[], type : string) {
        var newUnits : BaseUnit[], newStack : Stack;

        // Separate any current stacks on this tile involving this type
        newUnits = [];
        units.forEach(function (unit) {
            if (unit.currentMovement > 0 && unit.type === type) {
                if (unit.stack) {
                    unit.stack.separate(false);
                }
                newUnits.push(unit);
            }
        });

        if (newUnits.length > 0) {
            // Make a new stack from all the units of the clicked type with currentMovement > 0
            newStack = new Units.Stack(owner, newUnits);
            newStack.activate(false);
        }
    }
}