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
    export interface Promotion {
        name : string;

        // Bonuses given by the promotion
        bonuses : {[name : string] : number};

        // Categories of units (like "melee", "archery", etc) that can get this promotion
        categories : string[];

        // Prerequisites for the promotion.
        // Each entry in the array contains an array of requirements that enable the promotion.
        // So "and" prereqs can be encoded like:
        //     [["combat3", "militaryScience"]]
        // and "or" prereqs can be encoded like:
        //     [["combat2"], ["drill2"]]
        prereqs : string[][];
    };

    export interface Promotions {
        [slug : string] : Promotion;
    };

    // IMPORTANT:
    // When adding a promotion here, make sure you also add support for it in ChromeUI.bonusText,
    // Combat.Battle.getAppliedBonuses, Combat.Battle.applyBonuses, and anywhere else that the
    // effect of the bonus is applied.
    export var promotions : Promotions = {
        cityRaider1: {
            name: "City Raider I",
            bonuses: {
                cityAttack: 20
            },
            categories: ["melee", "siege", "armored"],
            prereqs: []
        },
        cityRaider2: {
            name: "City Raider II",
            bonuses: {
                cityAttack: 25
            },
            categories: ["melee", "siege", "armored"],
            prereqs: [["cityRaider1"]]
        },
        cityRaider3: {
            name: "City Raider III",
            bonuses: {
                cityAttack: 30,
                gunpowder: 10
            },
            categories: ["melee", "siege", "armored"],
            prereqs: [["cityRaider2"]]
        },
        cityGarrison1: {
            name: "City Garrison I",
            bonuses: {
                cityDefense: 20
            },
            categories: ["archery", "gunpowder"],
            prereqs: []
        },
        cityGarrison2: {
            name: "City Garrison II",
            bonuses: {
                cityDefense: 25
            },
            categories: ["archery", "gunpowder"],
            prereqs: [["cityGarrison1"]]
        },
        cityGarrison3: {
            name: "City Garrison III",
            bonuses: {
                cityDefense: 30,
                melee: 10
            },
            categories: ["archery", "gunpowder"],
            prereqs: [["cityGarrison2"]]
        },
        combat1: {
            name: "Combat I",
            bonuses: {
                strength: 10
            },
            categories: ["recon", "archery", "mounted", "melee", "gunpowder", "armored", "helicopter", "naval", "air"],
            prereqs: []
        },
        combat2: {
            name: "Combat II",
            bonuses: {
                strength: 10
            },
            categories: ["recon", "archery", "mounted", "melee", "gunpowder", "armored", "helicopter", "naval", "air"],
            prereqs: [["combat1"]]
        },
        combat3: {
            name: "Combat III",
            bonuses: {
                strength: 10
            },
            categories: ["recon", "archery", "mounted", "melee", "gunpowder", "armored", "helicopter", "naval", "air"],
            prereqs: [["combat2"]]
        },
        cover: {
            name: "Cover",
            bonuses: {
                archery: 25
            },
            categories: ["archery", "melee", "gunpowder"],
            prereqs: [["combat1"], ["drill1"]]
        },
        drill1: {
            name: "Drill I",
            bonuses: {
                firstStrikeChances: 1
            },
            categories: ["archery", "siege", "armored", "helicopter", "naval"],
            prereqs: [[]]
        },
        drill2: {
            name: "Drill II",
            bonuses: {
                firstStrikes: 1
            },
            categories: ["archery", "siege", "armored", "helicopter", "naval"],
            prereqs: [["drill1"]]
        },
        drill3: {
            name: "Drill III",
            bonuses: {
                firstStrikeChances: 2
            },
            categories: ["archery", "siege", "armored", "helicopter", "naval"],
            prereqs: [["drill2"]]
        },
        drill4: {
            name: "Drill IV",
            bonuses: {
                firstStrikes: 2,
                mounted: 10
            },
            categories: ["archery", "siege", "armored", "helicopter", "naval"],
            prereqs: [["drill3"]]
        },
        flanking1: {
            name: "Flanking I",
            bonuses: {
                retreat: 10
            },
            categories: ["mounted", "armored", "helicopter", "naval"],
            prereqs: [[]]
        },
        flanking2: {
            name: "Flanking II",
            bonuses: {
                retreat: 10
            },
            categories: ["mounted", "armored", "helicopter", "naval"],
            prereqs: [["flanking1"]]
        },
        formation: {
            name: "Formation",
            bonuses: {
                mounted: 25
            },
            categories: ["archery", "mounted", "melee", "gunpowder"],
            prereqs: [["combat2"], ["drill2"]]
        }
    };

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
        _canHeal : boolean; // http://civilization.wikia.com/wiki/Heal
        _actions : string[] = [];
        _promotions : string[] = [];

        // Turn stuff
        _active : boolean = false; // When set, show UI options for this unit
        _skippedTurn : boolean = false; // When set, no need to loop through this unit before showing turn is over
        _attacked : boolean = false;
        _fortified : boolean = false;
        _fortifiedUntilHealed : boolean = false;
        _fortifiedTurns : number = 0;

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
        set canHeal(value : boolean) {
            this._canHeal = value;

            // Any action taken to set canHeal to false should also unfortify.
            if (!value) {
                this.fortified = false;
                this.fortifiedTurns = 0;
            }
        }
        get canHeal() : boolean { return this._canHeal; }
        set actions(value : string[]) { this._actions = value; }
        get actions() : string[] { return this._actions; }
        set promotions(value : string[]) { this._promotions = value; }
        get promotions() : string[] { return this._promotions; }
        set active(value : boolean) { this._active = value; }
        get active() : boolean { return this._active; }
        set skippedTurn(value : boolean) { this._skippedTurn = value; }
        get skippedTurn() : boolean { return this._skippedTurn; }
        set attacked(value : boolean) { this._attacked = value; }
        get attacked() : boolean { return this._attacked; }
        set fortified(value : boolean) { this._fortified = value; }
        get fortified() : boolean { return this._fortified; }
        set fortifiedUntilHealed(value : boolean) { this._fortifiedUntilHealed = value; }
        get fortifiedUntilHealed() : boolean { return this._fortifiedUntilHealed; }
        set fortifiedTurns(value : number) { this._fortifiedTurns = value; }
        get fortifiedTurns() : number { return this._fortifiedTurns; }

        constructor() {
            // Set unique ID for unit or group
            this.id = game.maxId;
            game.maxId += 1;
        }

        // goToCoords can be set to false if you don't want the map centered on the unit after activating, like on a left click
        activate(centerViewport : boolean = true, autoMoveTowardsTarget : boolean = false) {
            // Deactivate current active unit, if there is one
            if (game.activeUnit) {
                game.activeUnit.active = false;
                game.activeUnit = null; // Is this needed? Next unit will set it, if it exists
            }

            // If this unit is on a path towards a target, just go along the path instead of activating. If there are still moves left when the target is reached, activate() will be called again.
            if (autoMoveTowardsTarget && this.targetCoords && this.currentMovement > 0) {
                setTimeout(function () {
                    this.moveTowardsTarget();
                }.bind(this), this.movementDelay());
            }

            // Activate this unit
            this.active = true;
            game.activeUnit = this;
            if (centerViewport && this.isVisible()) {
                mapUI.goToCoords(this.coords);
            }

            chromeUI.onUnitActivated();
            mapUI.render();
        }

        // Should be able to make this general enough to handle all units
        // Handle fight initiation here, if move goes to tile with enemy on it
        move(direction : string) {
            var newCoords : number[], newTerrain : string;

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
                // Stay on land!
                newTerrain = game.getTile(newCoords, false).terrain;
                if (newTerrain === "snow" || newTerrain === "desert" || newTerrain === "tundra" || newTerrain === "grassland" || newTerrain === "plains") {
                    this.moveToCoords(newCoords);
                    return;
                }
            }

            // If made it this far, no move was made
            if (game.turnID !== config.PLAYER_ID) {
                game.moveUnits();
            }            
        }

        // Needs to be defined separately for individual and group
        moveOnMap(coords : number[]) {
            throw new Error('"moveOnMap" needs to be redefined by each derived class.');
        }

        // Check for valid coords before calling. Returns true when successful, false when "maybe
        // successful" (battle takes over because enemy is on coords). Note that the battle code is
        // async!!!!
        moveToCoords(coords : number[]) : boolean {
            var city : Cities.City;


            // Reset skippedTurn status
            this.skippedTurn = false;

            if (Combat.fightIfTileHasEnemy(this, coords)) {
                return false;
            }

            // Set canHeal this after Combat.fightIfTileHasEnemy, since *if* a fight is started, that will handle it
            this.canHeal = false;

            // Move the unit(s) in the map data structure
            this.moveOnMap(coords);

            // City to capture?
            city = game.getTile(coords).city;
            if (city && city.owner !== this.owner) {
                city.capture(this.owner);
            }

            // Keep track of movement locally
            this.coords = coords;

            this.countMovementToCoords(coords);

            return true;
        }

        // Decrease currentMovement as if the unit is moving to coords (this happens during a real movement, and also after winning a battle with enemy units still on the target tile)
        // Last two arguments are only for the special case of attacking with a group but not taking the tile because more enemies remain. "attacker" should be the same as "this", but "this" is UnitOrGroup so the types don't match up.
        countMovementToCoords(coords : number[], attacker : Unit = null) {
            var movementCost : number;

            // Movement cost based on terrain
            movementCost = game.map.tileMovementCost(this.coords, coords);

            // Keep track of unit movement (applies even if the unit fights but does not move)
            this.currentMovement -= movementCost;

            if (this.currentMovement <= 0) {
                this.currentMovement = 0;

                this.active = false;

                game.map.updateVisibility();
                mapUI.render();
                setTimeout(function () {
                    if (!attacker || !attacker.group) {
                        // After delay, move to next unit
                        game.activeUnit = null;

                        // Handle user and AI units differently
                        if (game.turnID === config.PLAYER_ID) {
                            game.moveUnits();
                        } else {
                            // Move only after a delay
                            setTimeout(function () {
                                game.moveUnits();
                            }, this.movementDelay());
                        }
                    } else {
                        // If unit is in a group and moves are used up after an attack while enemies still remain on attacked tile, leave the group
                        attacker.group.remove(attacker.id); // Will activate rest of group
                        // Handle user and AI units differently
                        if (game.turnID !== config.PLAYER_ID) {
                            setTimeout(function () {
                                game.moveUnits();
                            }, this.movementDelay());
                        }
                    }
                    mapUI.render();
                }.bind(this), this.movementDelay());
            } else if (game.turnID !== config.PLAYER_ID) {
                // For AI units, need to force move again, even if currentMovement > 0
                // No UI_DELAY needed here
                game.map.updateVisibility();
                mapUI.render();
                game.moveUnits();
            } else {
                game.map.updateVisibility();
                mapUI.render();
            }
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
                    mapUI.render();

                    this.moveTowardsTarget();
                } else {
                    // No path found!
                    this.targetCoords = null;
                    mapUI.render();
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
                            if (this.moveToCoords(path.shift())) { // This will be false is an enemy is on the target tile, in which case battle code takes over
                                // Delay so that the map can update before the next move
                                setTimeout(function () {
                                    tryToMove(cb);
                                }, this.movementDelay());
                            }
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

        goTo() {
            controller.initPathFindingSearch(controller.hoveredTile, {el: mapUI.canvas, event: "mousedown"});
        }

        // Mark skippedTurn and go to the next active unit
        skipTurn() {
            this.skippedTurn = true;
            this.active = false;

            // After delay, move to next unit
            setTimeout(function () {
                game.activeUnit = null;
                game.moveUnits();
            }, this.movementDelay());

            // Clear any saved path
            this.targetCoords = null;

            mapUI.render();
        }

        fortify() {
            this.fortified = true;

            this.skipTurn();
        }

        fortifyUntilHealed() {
            this.fortifiedUntilHealed = true;

            this.fortify();
        }

        wake() {
            this.skippedTurn = false;
            this.fortified = false;
            this.fortifiedUntilHealed = false;

            mapUI.render();
        }

        isVisible() : boolean {
            return Boolean(game.map.visibility[this.coords[0]][this.coords[1]]);
        }

        // If unit is visible, add movement delay. If not, don't.
        movementDelay() : number {
            if (this.isVisible()) {
                return config.UNIT_MOVEMENT_UI_DELAY;
            } else {
                return 0;
            }
        }

        // Needs to be defined separately for individual and group
        availablePromotions() : string[] {
            throw new Error('"availablePromotions" needs to be redefined by each derived class.');
            return [];
        }
        promote(promotionName : string, forceAccept : boolean = false) {
            throw new Error('"promote" needs to be redefined by each derived class.')
        }
    }

    export class Unit extends UnitOrGroup {
        // Identification
        type : string;
        category : string;
        group : Group = null;

        // Key attributes
        level : number = 1;
        canPromoteToLevel : number = 1; // Set at the beginning of each turn, so you can't use XP generated this turn to promote
        xp : number = 0;
        strength : number;
        currentStrength : number;

        // Set some defaults for special unit properties
        landOrSea = "land";
        _actions = ["fortify", "fortifyUntilHealed", "wake", "skipTurn", "goTo"]; // Defaults
        canAttack = true;
        canDefend = true;
        canHeal = true;
        unitBonuses : any = {}; // {[name : string] : number} // These are bonuses inherent to a unit type, regardless of promotions

        // Filter out fortify/wake and other action combos
        set actions(value : string[]) { this._actions = value; }
        get actions() : string[] {
            var actions : string[];

            actions = this._actions.slice();

            // Handle fortified/wake
            if (this.fortified) {
                actions = actions.filter(function (a : string) : boolean { return a !== "fortify"; });
            } else {
                actions = actions.filter(function (a : string) : boolean { return a !== "wake"; });
            }

            // Handle fortifyUntilHealed
            if (this.fortified || this.currentStrength >= this.strength) {
                actions = actions.filter(function (a : string) : boolean { return a !== "fortifyUntilHealed"; });
            }

            return actions;
        }

        constructor(owner : number, coords : number[]) {
            super();

            this.owner = owner;

            // Set coordinates of unit and put a reference to the unit in the map
            this.coords = coords;
            game.getTile(coords, false).units.push(this);

            // Store reference to unit in game.units
            game.units[this.owner][this.id] = this;
        }

        moveOnMap(coords : number[]) {
            // It's an individual unit!
            game.map.moveUnit(this, coords);
        }

        delete() {
            var i : number, tileUnits : Unit[];

            // Remove from group
            if (this.group) {
                this.group.remove(this.id);
            }

            // Remove from map
            tileUnits = game.getTile(this.coords, false).units;
            for (i = 0; i < tileUnits.length; i++) {
                if (tileUnits[i].id === this.id) {
                    tileUnits.splice(i, 1);
                    break;
                }
            }

            // Remove from game
            delete game.units[this.owner][this.id];

            // Update map visibility
            game.map.updateVisibility();

            if (this.owner === config.PLAYER_ID && game.result === "inProgress" && Object.keys(game.units[config.PLAYER_ID]).length === 0) {
                game.result = "lost";
                chromeUI.showModal("lost");
            }

            // Remove from active
            if (game.activeUnit && game.activeUnit.id === this.id) {
                game.activeUnit = null;
                game.moveUnits(); // Will always render map... right?
            } else {
                mapUI.render();
            }
        }

        // Merge together unitBonuses (from unit type) and bonuses from promotions
        getBonuses() : {[name : string] : number} {
            var bonuses : {[name : string] : number}, i : number, name : string, promotionBonuses : {[name : string] : number};

            bonuses = Util.deepCopy(this.unitBonuses);

            for (i = 0; i < this.promotions.length; i++) {
                promotionBonuses = promotions[this.promotions[i]].bonuses;
                for (name in promotionBonuses) {
                    if (bonuses.hasOwnProperty(name)) {
                        bonuses[name] += promotionBonuses[name];
                    } else {
                        bonuses[name] = promotionBonuses[name];
                    }
                }
            }

            // Add fortify bonus
            if (this.fortifiedTurns > 0 && (!bonuses.hasOwnProperty("noDefensiveBonuses") || !bonuses["noDefensiveBonuses"])) {
                bonuses["fortified"] = Util.bound(5 * this.fortifiedTurns, 0, 25);
            }

            return bonuses;
        }

        hasPrereqs(prereqs : string[][]) : boolean {
            var i : number, j : number, success : boolean;

            // No prereqs
            if (prereqs.length === 0) {
                return true;
            }

            // Loop over all possible "OR" prereqs
            for (i = 0; i < prereqs.length; i++) {
                success = true;

                // Loop over all the "AND" prereqs are met
                for (j = 0; j < prereqs[i].length; j++) {
                    // Assume an entry in a string refers to a promotion, unless there is some special logic here to handle other scenarios
                    if (this.promotions.indexOf(prereqs[i][j]) < 0) {
                        success = false;
                    }
                }

                if (success) {
                    return true;
                }
            }

            // If no return by now, prereqs were not met
            return false;
        }

        availablePromotions() : string[] {
            var result : string[];

            result = [];

            if (this.canPromoteToLevel > this.level) {
                for (name in promotions) {
                    if (promotions[name].categories.indexOf(this.category) >= 0 && this.promotions.indexOf(name) < 0 && this.hasPrereqs(promotions[name].prereqs)) {
                        result.push(name);
                    }
                }
            }

            return result;
        }

        xpForNextLevel() : number {
            return Math.pow(this.level, 2) + 1;
        }

        updateCanPromoteToLevel() {
            if (this.xp < 1) {
                this.canPromoteToLevel = 1;
            } else {
                this.canPromoteToLevel = Math.floor(Math.sqrt(this.xp - 1)) + 1;
            }
        }

        promote(promotionName : string, forceAccept : boolean = false) {
            if ((this.canPromoteToLevel > this.level && this.availablePromotions().indexOf(promotionName) >= 0) || forceAccept) {
                this.promotions.push(promotionName);
                this.level += 1;

                // Restore half of HP
                this.currentStrength = (this.currentStrength + this.strength) / 2;

                if (this.owner === config.PLAYER_ID) {
                    mapUI.render();
                }
            } else {
                throw new Error('Unit is not allowed to get the ' + promotionName + ' promotion now.')
            }
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
        set movement(value : number) {
            throw new Error('"movement" can only be set for individual units, not groups.');
        }
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
        set landOrSea(value : string) {
            throw new Error('"landOrSea" can only be set for individual units, not groups.');
        }
        // Find from units, all have the same value
        get landOrSea() : string {
            return this.units[0].landOrSea;
        }

        // Do nothing, can't be changed at group level
        set canAttack(value : boolean) {
            throw new Error('"canAttack" can only be set for individual units, not groups.');
        }
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
        set canDefend(value : boolean) {
            throw new Error('"canDefend" can only be set for individual units, not groups.');
        }
        get canDefend() : boolean {
            var i : number;

            for (i = 0; i < this.units.length; i++) {
                if (this.units[i].canDefend) {
                    return true;
                }
            }
            return false;
        }

        // Can't be read at group level
        set canHeal(value : boolean) {
            var i : number;

            for (i = 0; i < this.units.length; i++) {
                this.units[i].canHeal = value;
            }
        }
        get canHeal() : boolean {
            throw new Error('"canHeal" can only be get for individual units, not groups.');
        }

        // Do nothing, can't be changed at group level
        set actions(value : string[]) {
            throw new Error('"actions" can only be set for individual units, not groups.');
        }
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

        // Set for group and every group member
        set fortified(value : boolean) {
            var i : number;

            for (i = 0; i < this.units.length; i++) {
                this.units[i].fortified = value;
            }
            this._fortified = value;
        }
        get fortified() : boolean { return this._fortified; }

        // Set for group and every group member
        set fortifiedUntilHealed(value : boolean) {
            var i : number;

            for (i = 0; i < this.units.length; i++) {
                this.units[i].fortifiedUntilHealed = value;
            }
            this._fortifiedUntilHealed = value;
        }
        get fortifiedUntilHealed() : boolean { return this._fortifiedUntilHealed; }

        // Do nothing, can't be changed at group level
        set attacked(value : boolean) {
            throw new Error('"attacked" can only be set for individual units, not groups.');
        }
        // Only true if every group member either can't attack or has already attacked
        get attacked() : boolean {
            var i : number;

            for (i = 0; i < this.units.length; i++) {
                if (!this.units[i].attacked && this.units[i].canAttack) {
                    return false;
                }
            }
            return true;
        }

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
            var allNewUnitsAreFortified : boolean, i : number;

            allNewUnitsAreFortified = true;

            for (i = 0; i < units.length; i++) {
                this.units.push(units[i]);
                units[i].group = this;

                if (!units[i].fortified) {
                    allNewUnitsAreFortified = false;
                }
            }

            // Fortify group if it's a new group and all members are fortified
            if (units.length === this.units.length && allNewUnitsAreFortified) {
                this.fortified = true;
            }

            // Unfortify everyone when adding to a group, unless everyone involved is fortified.
            if (!this.fortified || !allNewUnitsAreFortified) {
                this.fortified = false;
                this.skippedTurn = false;
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

        // Promotion stuff: read from and write to individual units
        availablePromotions() : string[] {
            var result : string[];

            result = [];

            this.units.forEach(function (unit) {
                var i : number, unitAvailablePromotions : string[];

                unitAvailablePromotions = unit.availablePromotions();

                for (i = 0; i < unitAvailablePromotions.length; i++) {
                    if (result.indexOf(unitAvailablePromotions[i]) < 0) {
                        result.push(unitAvailablePromotions[i]);
                    }
                }
            });

            return result;
        }
        promote(promotionName : string, forceAccept : boolean = false) {
            this.units.forEach(function (unit) {
                if ((unit.canPromoteToLevel > unit.level && unit.availablePromotions().indexOf(promotionName) >= 0) || forceAccept) {
                    unit.promote(promotionName, forceAccept);
                }
            });
        }
    }

    export class Scout extends Unit {
        type = "Scout";
        category = "recon";

        strength = 1;
        currentStrength = 1;
        movement = 2;
        currentMovement = 2;

        landOrSea = "land";
    }

    export class Warrior extends Unit {
        type = "Warrior";
        category = "melee";

        strength = 2;
        currentStrength = 2;
        movement = 1;
        currentMovement = 1;

        landOrSea = "land";
    }

    export class Archer extends Unit {
        type = "Archer";
        category = "archery";

        strength = 3;
        currentStrength = 3;
        movement = 1;
        currentMovement = 1;

        landOrSea = "land";
        unitBonuses = {cityDefense: 50, hillsDefense: 25, firstStrikes: 1};
    }

    export class Chariot extends Unit {
        type = "Chariot";
        category = "mounted";

        strength = 4;
        currentStrength = 4;
        movement = 2;
        currentMovement = 2;

        landOrSea = "land";
        unitBonuses = {attackAxeman: 100, noDefensiveBonuses: 1, retreat: 10};
    }

    export class Spearman extends Unit {
        type = "Spearman";
        category = "melee";

        strength = 4;
        currentStrength = 4;
        movement = 1;
        currentMovement = 1;

        landOrSea = "land";
        unitBonuses = {mounted: 100};
    }

    export class Axeman extends Unit {
        type = "Axeman";
        category = "melee";

        strength = 5;
        currentStrength = 5;
        movement = 1;
        currentMovement = 1;

        landOrSea = "land";
        unitBonuses = {melee: 50};
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