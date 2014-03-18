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

        // 0: attacker, 1: defender
        winner : number = null;
        loser : number = null;

        constructor(attacker : Units.Unit, defender : Units.Unit) {
            this.units = [attacker, defender];

            // Hit points
            this.hps[0] = Math.round(attacker.strength / attacker.currentStrength * 100);
            this.hps[1] = Math.round(defender.strength / defender.currentStrength * 100);

            // Attacker's modified strength
            this.A = attacker.strength * (this.hps[0] / 100);

            // Defender's modified strength
            this.D = defender.strength * (this.hps[1] / 100);

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

        oddsAttackerWinsFight() {
            return this.A / (this.A + this.D);
        }

        attackerWinsRound() {
            return Math.random() < this.A / (this.A + this.D);
        }

        fight() {
            var i : number, j : number;

            this.log.push(this.names[0] + " (" + this.round(this.A, 2) + ") attacked " + this.names[1] + " (" + this.round(this.D, 2) + ")");
            this.log.push("Combat odds for attacker: " + Math.round(this.oddsAttackerWinsFight() * 100) + "%");

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
            this.units[j].delete();
            this.winner = i;
            this.loser = j;
        }
    }
}