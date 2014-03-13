// Units - classes for the various units types

module Units {
    // This allows a real Unit to be easily found from game.units[owner][id]
    export interface Stub {
        id : number;
        owner : number;
    }

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

        // Special unit properties
        landOrSea : string;
        canAttack : boolean = true;
        canDefend : boolean = true;
        actions : string[];

        // Turn stuff
        active : boolean = false; // When set, show UI options for this unit
        moved : boolean = false; // When set, no need to loop through this unit before showing turn is over

        constructor(owner : number, coords : number[]) {
            this.id = game.maxId;
            game.maxId += 1;

            this.owner = owner;

            // Set coordinates of unit and put a reference to the unit in the map
            this.coords = coords;
            game.map.tiles[coords[0]][coords[1]].units.push(this.stub());

            // Store reference to unit in game.units
            game.units[this.owner][this.id] = this;
        }

        getName(inputClass) { 
            return (<any> inputClass).constructor.name;
        }

        // Used as a lightweight ID for this unit
        stub() {
            return {
                id: this.id,
                owner: this.owner
            };
        }

        // goToCoords can be set to false if you don't want the map centered on the unit after activating, like on a left click
        activate(goToCoords : boolean = true) {
            // Deactivate current active unit, if there is one
            if (game.activeUnit) {
                game.getUnit(game.activeUnit).active = false;
                game.activeUnit = null;
            }

            // Activate this unit
            this.active = true;
            game.activeUnit = this.stub();
            if (goToCoords) {
                mapUI.goToCoords(this.coords);
            }

            chromeUI.onUnitActivated();
        }

        // Set as moved, because it used up all its moves or because its turn was skipped or something
        setMoved() {
            this.moved = true;
            this.active = false;
            game.activeUnit = null;

            // After delay, move to next unit
            setTimeout(function () {
                game.moveUnits();
            }, 500);
        }

        move(direction : string) {
            var i, initialCoords, tileUnits;
            // Should be able to make this general enough to handle all units
            // Handle fight initiation here, if move goes to tile with enemy on it

            // Short circuit if no moves are available
            if (this.currentMovement <= 0) {
                return;
            }

            // Save a copy
            initialCoords = this.coords.slice();

            // Implement movement
            if (direction === "SW") {
                this.coords[0] += 1;
                this.coords[1] -= 1;
            } else if (direction === "S") {
                this.coords[0] += 1;
            } else if (direction === "SE") {
                this.coords[0] += 1;
                this.coords[1] += 1;
            } else if (direction === "W") {
                this.coords[1] -= 1;
            } else if (direction === "E") {
                this.coords[1] += 1;
            } else if (direction === "NW") {
                this.coords[0] -= 1;
                this.coords[1] -= 1;
            } else if (direction === "N") {
                this.coords[0] -= 1;
            } else if (direction === "NE") {
                this.coords[0] -= 1;
                this.coords[1] += 1;
            }

            // Don't walk off the map!
            if (this.coords[0] < 0) {
                this.coords[0] = 0;
            }
            if (this.coords[1] < 0) {
                this.coords[1] = 0;
            }
            if (this.coords[0] >= game.map.height - 1) {
                this.coords[0] = game.map.height - 1;
            }
            if (this.coords[1] >= game.map.width) {
                this.coords[1] = game.map.width - 1;
            }

            // If moved, update shit and render map
            if (this.coords[0] !== initialCoords[0] || this.coords[1] !== initialCoords[1]) {
                // Delete old unit in map
                tileUnits = game.getTile(initialCoords).units;
                for (i = 0; i < tileUnits.length; i++) {
                    if (tileUnits[i].id === this.id) {
                        tileUnits.splice(i);
                        break;
                    }
                }

                // Add unit at new tile
                game.getTile(this.coords).units.push(this.stub());

                // Keep track of movement
                this.currentMovement -= 1; // Should depend on terrain/improvements
                if (this.currentMovement <= 0) {
                    this.currentMovement = 0;
                    this.setMoved();
                }

                requestAnimationFrame(mapUI.render.bind(mapUI));
            }
        }

        // Mark as moved and go to the next active unit
        skipTurn() {
            this.setMoved();
            requestAnimationFrame(mapUI.render.bind(mapUI));
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