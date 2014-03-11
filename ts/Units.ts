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
            game.map.tiles[coords[0]][coords[1]].units.push({
                id: this.id,
                owner: this.owner
            });

            // Store reference to unit in game.units
            game.units[this.owner][this.id] = this;
        }

        getName(inputClass) { 
            return (<any> inputClass).constructor.name;
        }

        activate() {
            this.active = true;
            mapUI.goToCoords(this.coords);
console.log("activate")
console.log(this)
        }

        move(direction : string) {
            // Should be able to make this general enough to handle all units
            console.log(direction);
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