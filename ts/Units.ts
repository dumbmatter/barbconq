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
        strength : number;
        currentStrength : number;
        movement : number;
        currentMovement : number;
        coords : number[];

        // Special unit properties
        landOrSea : string;
        canAttack : boolean = true;
        canDefend : boolean = true;

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

        activate() {
            this.active = true;
            game.activeUnit = this.stub();
            mapUI.goToCoords(this.coords);
console.log("activate")
console.log(this)
        }

        move(direction : string) {
            var i, initialCoords, tileUnits;
            // Should be able to make this general enough to handle all units
            // Handle fight initiation here, if move goes to tile with enemy on it
            // Decrease "currentMovement", and if it hits 0, go to next step of GameLoop (how? set "moved" to true)
            // Keep coords synced with map!
console.log(direction);
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

            // If moved, update shit and render map
            if (this.coords[0] !== initialCoords[0] || this.coords[1] !== initialCoords[1]) {
console.log("ACTUALLY MOVED")
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
                this.currentMovement -= 1;

                mapUI.render();
            }
        }
    }

    export class Warrior extends BaseUnit {
        type = "Warrior";

        strength = 2;
        currentStrength = 2;
        movement = 2;
        currentMovement = 2;

        landOrSea = "land";
    }
}