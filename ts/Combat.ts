// Combat - battle between two units

module Combat {
    export class Battle {
        units : Units.Unit[];
        A : number; // Attacker's modified strength
        D : number; // Defender's modified strength
        hps : number[] = [null, null]; // Hid points for attacker and defender
        damagePerHit : number[] = [null, null]; // Damage done for a hit by attacker and defender
        names : string[] = [null, null]; // Unit names
        log : string[] = [];

        // "attacker" or "defender"
        winner : string = null;
        loser : string = null;

        constructor(attacker : Units.Unit, defender : Units.Unit) {
            this.units = [attacker, defender];

            // Hit points
            this.hps[0] = Math.round(attacker.currentStrength / attacker.strength * 100);
            this.hps[1] = Math.round(defender.currentStrength / defender.strength * 100);

            // Attacker's modified strength
            this.A = attacker.currentStrength * (this.hps[0] / 100);

            // Defender's modified strength
            this.D = defender.currentStrength * (this.hps[1] / 100);

            // Damage per hit
            this.damagePerHit[0] = this.bound(Math.floor(20 * (3 * this.A + this.D) / (3 * this.D + this.A)), 6, 60);
            this.damagePerHit[1] = this.bound(Math.floor(20 * (3 * this.D + this.A) / (3 * this.A + this.D)), 6, 60);

            // Names
            this.names[0] = game.names[this.units[0].owner] + "'s " + this.units[0].type;
            this.names[1] = game.names[this.units[1].owner] + "'s " + this.units[1].type;
        }

        // Bound x between min and max
        bound(x : number, min : number, max : number) {
            if (x > max) {
                return max;
            }
            if (x < min) {
                return min;
            }
            return x;
        }

        round(value : number, precision : number = 0) : string {
            return value.toFixed(precision);
        }

        oddsAttackerWinsFight() : number {
            return this.A / (this.A + this.D);
        }

        attackerWinsRound() : boolean {
            return Math.random() < this.A / (this.A + this.D);
        }

        fight() {
            var i : number, j : number;

            this.log.push(this.names[0] + " (" + this.round(this.A, 2) + ") attacked " + this.names[1] + " (" + this.round(this.D, 2) + ")");
            this.log.push("Combat odds for attacker: " + Math.round(this.oddsAttackerWinsFight() * 100) + "%");

            this.units[0].attacked = true;

            // Simulate the fight
            while (this.hps[0] > 0 && this.hps[1] > 0) {
                if (this.attackerWinsRound()) {
                    i = 0; // Winner
                    j = 1; // Loser
                } else {
                    i = 1; // Winner
                    j = 0; // Loser
                }
                this.hps[j] = this.bound(this.hps[j] - this.damagePerHit[i], 0, 100);
                this.log.push(this.names[j] + " is hit for " + this.damagePerHit[i] + " (" + this.hps[j] + "/100HP)");
            }

            this.log.push(this.names[i] + " defeated " + this.names[j] + "!");
console.log(this.log);

            // Process results
            this.winner = i === 0 ? "attacker" : "defender";
            this.loser = j === 0 ? "attacker" : "defender";

            // Loser gets deleted
            this.units[j].delete(); // Delete the references we can
            this.units[j].currentStrength = 0; // So any outstanding references can see it's dead
            this.units[j].currentMovement = 0; // So any outstanding references can see it's dead

            // Winner gets damaged
            this.units[i].currentStrength *= this.hps[i] / 100;
        }
    }

    // Find best defender for a unit/group attacking a tile, if that tile has a defender
    export function findBestDefender(attacker : Units.Unit, coords : number[]) {
        var battle : Battle, defender : Units.Unit, maxOdds : number, newTileUnits : Units.Unit[], oddsDefenderWinsFight : number;

        newTileUnits = game.getTile(coords).units;

        // See if an enemy is on that tile, and if so, find the one with max strength against attacker
        defender = null;
        maxOdds = -Infinity;
        newTileUnits.forEach(function (unit) {
            if (unit.owner !== attacker.owner) {
                battle = new Battle(attacker, unit);
                oddsDefenderWinsFight = 1 - battle.oddsAttackerWinsFight();
                if (oddsDefenderWinsFight > maxOdds) {
                    maxOdds = oddsDefenderWinsFight;
                    defender = unit;
                }
            }
        });

        return {
            defender: defender,
            oddsDefenderWinsFight: maxOdds
        };
    };

    // If tile has enemy unit on it, initiate combat (if appropriate) and return true. Otherwise, do nothing and return false.
    export function fightIfTileHasEnemy(attackerUnitOrGroup : Units.UnitOrGroup, coords : number[]) : boolean {
        var attacker : Units.Unit, battle : Battle, defender : Units.Unit, newTileUnits : Units.Unit[];

        // Delete path
        attackerUnitOrGroup.targetCoords = null;

        newTileUnits = game.getTile(coords).units;

        if (attackerUnitOrGroup instanceof Units.Unit) {
            // Attacker is a single unit
            attacker = <Units.Unit> attackerUnitOrGroup;

            // Only proceed if there is a valid attacker
            if (attacker.canAttack && !attacker.attacked) {
                defender = findBestDefender(attacker, coords).defender;
            }
        } else if (attackerUnitOrGroup instanceof Units.Group) {
            // Attacker is a group, find the one with the best odds against its best defender
            (function () { // Just makes things neater if some variables are local here
                var attackerGroup : Units.Group, minOdds : number;

                minOdds = Infinity;

                attackerGroup = <Units.Group> attackerUnitOrGroup;
                attackerGroup.units.forEach(function (unit) {
                    var obj;

                    // Only proceed if there is a valid attacker
                    if (unit.canAttack && !unit.attacked) {
                        obj = findBestDefender(unit, coords);

                        if (obj.oddsDefenderWinsFight < minOdds) {
                            minOdds = obj.oddsDefenderWinsFight;
                            attacker = unit;
                            defender = obj.defender;
                        }
                    }
                });
            }());
        }

        if (defender) {
            // We have a valid attacker and defender! Fight!
            battle = new Battle(attacker, defender);
            battle.fight();
            if (battle.winner === "attacker") {
                if (newTileUnits.filter(function (unit) { return unit.owner !== attackerUnitOrGroup.owner; }).length === 0) {
                    // No enemies left on tile, take it.
                    attackerUnitOrGroup.moveToCoords(coords); // Move entire group, if it's a group
                } else {
                    attacker.countMovementToCoords(coords); // Only count for attacker, not whole group
                }
            } else {
                // Attacker died, so on to the next one
                game.moveUnits();
            }

            // Update hover tile, since this could change, particularly for right click attack when defending tile is hovered over
            chromeUI.onHoverTile(game.getTile(controller.hoveredTile));

            return true;
        } else if (newTileUnits.filter(function (unit) { return unit.owner !== attackerUnitOrGroup.owner; }).length > 0) {
            // We didn't find an attacker, because there is an enemy on the tile and we're not attacking
            return true;
        }

        return false;
    }
}