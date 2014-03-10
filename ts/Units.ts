// Units - classes for the various units types

module Units {
    export class BaseUnit {
        // Identification
        id : number; // Unique, incrementing
        owner : number;

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

        // UI stuff
        active : boolean = false;

        constructor(owner : number, coords : number[]) {
            this.id = game.maxId;
            game.maxId += 1;

            this.owner = owner;

            // Set coordinates of unit and put a reference to the unit in the map
            this.coords = coords;
console.log(game.map.tiles[coords[0]][coords[1]]);
        }

        move(direction : string) {
            // Should be able to make this general enough to handle all units
            console.log(direction);
        }
    }

    export class Warrior extends BaseUnit {
        strength = 2;
        currentStrength = 2;
        movement = 2;
        currentMovement = 2;

        landOrSea = "land";
    }
}