// Combat - battle between two units

module Combat {
    export class Battle {
        units : Units.Unit[];
        A : number; // Attacker's modified strength
        D : number; // Defender's modified strength
        hps : number[] = [null, null]; // Hid points for attacker and defender
        damagePerHit : number[] = [null, null]; // Damage done for a hit by attacker and defender
        hitsNeededToWin : number[] = [null, null]; // Number of successful hits by attacker and defender to win battle
        firstStrikes : number[] = [0, 0]; // Number of first strikes by attacker and defender
        names : string[] = [null, null]; // Unit names
        appliedBonuses : {[name: string] : number}[];
        log : string[] = [];
        withdrew : boolean = false;

        // "attacker" or "defender"
        winner : string = null;
        loser : string = null;

        constructor(attacker : Units.Unit, defender : Units.Unit) {
            var defenderBonus : number;

            this.units = [attacker, defender];

            // Hit points
            this.hps[0] = Math.round(attacker.currentStrength / attacker.strength * 100);
            this.hps[1] = Math.round(defender.currentStrength / defender.strength * 100);

            // Attacker's modified strength
            this.A = attacker.strength * (this.hps[0] / 100);

            // Defender's modified strength
            this.D = defender.strength * (this.hps[1] / 100);

            // Bonuses that modify A and D
            this.assignAppliedBonuses();
            this.applyBonuses();

            // Damage per hit
            this.damagePerHit[0] = Util.bound(Math.floor(20 * (3 * this.A + this.D) / (3 * this.D + this.A)), 6, 60);
            this.damagePerHit[1] = Util.bound(Math.floor(20 * (3 * this.D + this.A) / (3 * this.A + this.D)), 6, 60);
            this.hitsNeededToWin[0] = Math.ceil(this.hps[1] / this.damagePerHit[0]);
            this.hitsNeededToWin[1] = Math.ceil(this.hps[0] / this.damagePerHit[1]);

            // Names
            this.names[0] = game.names[this.units[0].owner] + "'s " + this.units[0].type;
            this.names[1] = game.names[this.units[1].owner] + "'s " + this.units[1].type;
        }

        // Generates appliedBonuses object, which is stored in this.appliedBonuses
        assignAppliedBonuses() {
            var bonuses : {[name: string] : number}, attacker : Units.Unit, attackerTile : MapMaker.Tile, defender : Units.Unit, defenderTile : MapMaker.Tile, name : string;

            attacker = this.units[0];
            defender = this.units[1];
//            attackerTile = game.getTile(attacker.coords, false);
            defenderTile = game.getTile(defender.coords, false);

            // Attacker, defender
            this.appliedBonuses = [{}, {}];

            // See which bonuses from the attacker apply
            bonuses = attacker.getBonuses();
            for (name in bonuses) {
                if (name === "cityDefense" || name === "hillsDefense" || name === "noDefensiveBonuses" || name === "fortified" || name === "doubleMovementHills") {
                    // Don't apply to attackers
                } else if (name === "strength") {
                    this.appliedBonuses[0][name] = bonuses[name];
                } else if (name === "cityAttack") {
                    if (defenderTile.city && defenderTile.city.owner === defender.owner) {
                        this.appliedBonuses[0][name] = bonuses[name];
                    }
                } else if (name === "hillsAttack") {
                    if (defenderTile.features.indexOf("hills") >= 0) {
                        this.appliedBonuses[0][name] = bonuses[name];
                    }
                } else if (name === "attackAxeman") {
                    if (defender.type === "Axeman") {
                        this.appliedBonuses[0][name] = bonuses[name];
                    }
                } else if (name === "archery") {
                    if (defender.category === "archery") {
                        this.appliedBonuses[0][name] = bonuses[name];
                    }
                } else if (name === "melee") {
                    if (defender.category === "melee") {
                        this.appliedBonuses[0][name] = bonuses[name];
                    }
                } else if (name === "mounted") {
                    if (defender.category === "mounted") {
                        this.appliedBonuses[0][name] = bonuses[name];
                    }
                } else if (name === "gunpowder") {
                    if (defender.category === "gunpowder") {
                        this.appliedBonuses[0][name] = bonuses[name];
                    }
                } else if (name === "retreat") {
                    this.appliedBonuses[0][name] = bonuses[name];
                } else if (name === "firstStrikes" || name === "firstStrikeChances") {
                    this.appliedBonuses[0][name] = bonuses[name];
                } else {
                    throw new Error('Unknown bonus type "' + name + '".');
                }
            }

            // See which bonuses from the defender apply
            bonuses = defender.getBonuses();
            for (name in bonuses) {
                if (name === "attackAxeman" || name === "cityAttack" || name === "retreat" || name === "noDefensiveBonuses" || name === "doubleMovementHills") {
                    // Don't apply to defenders
                } else if (name === "strength") {
                    this.appliedBonuses[1][name] = bonuses[name];
                } else if (name === "cityDefense") {
                    if (defenderTile.city && defenderTile.city.owner === defender.owner) {
                        this.appliedBonuses[1][name] = bonuses[name];
                    }
                } else if (name === "hillsDefense") {
                    if (defenderTile.features.indexOf("hills") >= 0) {
                        this.appliedBonuses[1][name] = bonuses[name];
                    }
                } else if (name === "archery") {
                    if (attacker.category === "archery") {
                        this.appliedBonuses[1][name] = bonuses[name];
                    }
                } else if (name === "melee") {
                    if (attacker.category === "melee") {
                        this.appliedBonuses[1][name] = bonuses[name];
                    }
                } else if (name === "mounted") {
                    if (attacker.category === "mounted") {
                        this.appliedBonuses[1][name] = bonuses[name];
                    }
                } else if (name === "gunpowder") {
                    if (attacker.category === "gunpowder") {
                        this.appliedBonuses[1][name] = bonuses[name];
                    }
                } else if (name === "firstStrikes" || name === "firstStrikeChances" || name === "fortified") {
                    this.appliedBonuses[1][name] = bonuses[name];
                } else {
                    throw new Error('Unknown bonus type "' + name + '".');
                }
            }

            // Add tile bonuses (terrain, improvements, culture) to the defender category
            if (!bonuses.hasOwnProperty("noDefensiveBonuses") || !bonuses["noDefensiveBonuses"]) {
                if (defenderTile.features.indexOf("hills") >= 0) {
                    if (!this.appliedBonuses[1].hasOwnProperty("tile")) { this.appliedBonuses[1]["tile"] = 0; }
                    this.appliedBonuses[1]["tile"] += 25;
                }
                if (defenderTile.features.indexOf("forest") >= 0 || defenderTile.features.indexOf("jungle") >= 0) {
                    if (!this.appliedBonuses[1].hasOwnProperty("tile")) { this.appliedBonuses[1]["tile"] = 0; }
                    this.appliedBonuses[1]["tile"] += 50;
                }
            }
        }

        // Recalculate this.firstStrikes. If successfulChances is given, use this for the firstStrikeChances. Otherwise, calculate randomly
        // This needs to be called *after* assignAppliedBonuses
        assignFirstStrikes(successfulChances : number[] = null) {
            var i : number, name : string, rawFirstStrikes : number[];

            // First strike chances - add to firstStrikes
            if (successfulChances) {
                this.firstStrikes = successfulChances;
            } else {
                this.firstStrikes = [0, 0];
                for (i = 0; i <= 1; i++) {
                    if (this.appliedBonuses[i].hasOwnProperty("firstStrikeChances")) {
                        // IS THIS CORRECT? Should it instead draw from a binomial distribution?
                        this.firstStrikes[i] = Math.round(Math.random() * this.appliedBonuses[i]["firstStrikeChances"]);
                    }
                }
            }

            // Guaranteed first strikes
            for (i = 0; i <= 1; i++) {
                if (this.appliedBonuses[i].hasOwnProperty("firstStrikes")) {
                    this.firstStrikes[i] += this.appliedBonuses[i]["firstStrikes"];
                }
            }

            // Normalize so lesser has 0
            if (this.firstStrikes[0] > 0 && this.firstStrikes[1] > 0) {
               if (this.firstStrikes[0] > this.firstStrikes[1]) {
                   this.firstStrikes = [this.firstStrikes[0] - this.firstStrikes[1], 0];
               } else {
                   this.firstStrikes = [0, this.firstStrikes[1] - this.firstStrikes[0]];
               } 
            }
        }

        // Applies the bonus (as a percentage) to apply to the attacjer's and defender's modified strengths.
        // http://www.civfanatics.com/civ4/strategy/combat_explained.php
        applyBonuses() {
            var attackerBonus : number, defenderBonus : number;

            attackerBonus = 0;
            defenderBonus = 0;

            // Attacker bonuses
            for (name in this.appliedBonuses[0]) {
                if (name !== "firstStrikes" && name !== "firstStrikeChances" && name !== "retreat") {
                    // Some go to attacker, others count against defender
                    if (name === "strength") {
                        attackerBonus += this.appliedBonuses[0][name];
                    } else {
                        defenderBonus -= this.appliedBonuses[0][name];
                    }
                }
            }

            // Defender bonuses
            for (name in this.appliedBonuses[1]) {
                if (name !== "firstStrikes" && name !== "firstStrikeChances" && name !== "retreat") {
                    defenderBonus += this.appliedBonuses[1][name];
                }
            }

            // Apply bonuses to attacker and defender
            this.A *= 1 + attackerBonus / 100;

            if (defenderBonus > 0) {
                this.D *= 1 + defenderBonus / 100;
            } else if (defenderBonus < 0) {
                this.D /= 1 - defenderBonus / 100;
            }
        }

        // Based on http://apolyton.net/showthread.php/140622-The-Civ-IV-Combat-System
        odds() : {attackerWinsFight : number; attackerRetreats? : number;} {
            var fscA : number, fscD : number, i : number, iFS : number, maxFscA : number, maxFscD : number, odds : {attackerWinsFight : number; attackerRetreats? : number;}, oddsAfterFirstStrikes, oddsDefenderWinsInFirstStrikes : number, p : number, pFS : number;

            p = this.A / (this.A + this.D); // Probability attacker wins round

            // iFS: 0 if attacker has first strikes, 1 if defender has first strikes
            // numHits: Number of successful first strikes
            oddsAfterFirstStrikes = function (iFS : number, numHits : number) : number {
                var hitsNeededToWinAttacker : number, i : number, maxRounds : number, odds : number;

                maxRounds = this.hitsNeededToWin[0] + this.hitsNeededToWin[1] - 1; // Somebody is dead by this time

                // Each successful first strike means one less possible round after first strikes
                maxRounds -= numHits;

                // Apply first strikes for attacker, if appropriate.
                // Otherwise, defender gets first strikes.
                hitsNeededToWinAttacker = this.hitsNeededToWin[0];
                if (iFS === 0) {
                    hitsNeededToWinAttacker -= numHits;
                }

                // Is the defender already dead from the first strikes?
                if (hitsNeededToWinAttacker < 0) {
                    hitsNeededToWinAttacker = 0;
                    maxRounds = 0;
                }

                odds = 0

                // Each successful first strike means one less possible round after first strikes
                for (i = hitsNeededToWinAttacker; i <= maxRounds; i++) {
                    odds += Util.binomialProb(maxRounds, i, p);
                    //odds += C(maxRounds, i) * Math.pow(p, i) * Math.pow(1 - p, maxRounds - i);
                    //odds += Util.factorial(maxRounds) / (Util.factorial(i) * Util.factorial(maxRounds - i)) * Math.pow(p, i) * Math.pow(1 - p, maxRounds - i);
                }

                return odds;
            }.bind(this);

            odds = {
                attackerWinsFight: 0
            };
            if (this.appliedBonuses[0].hasOwnProperty("retreat")) {
                oddsDefenderWinsInFirstStrikes = 0;
            }

            // Loop over possible first strike chance combos, for attacker (fscA) and defender (fscD)
            maxFscA = this.appliedBonuses[0].hasOwnProperty("firstStrikeChances") ? this.appliedBonuses[0]["firstStrikeChances"] : 0;
            maxFscD = this.appliedBonuses[1].hasOwnProperty("firstStrikeChances") ? this.appliedBonuses[1]["firstStrikeChances"] : 0;
            for (fscA = 0; fscA <= maxFscA; fscA++) {
                for (fscD = 0; fscD <= maxFscD; fscD++) {
                    // Set this.firstStrikes based on the current first strike chances
                    this.assignFirstStrikes([fscA, fscD]);

                    // Who gets first strikes?
                    // pFS is the probability of a first strike succeeding. Above, p is the probability of
                    // the attacker winning a round. The normal p is used in oddsAfterFirstStrikes, but pFS
                    // is needed to calculate the weights of oddsAfterFirstStrikes calls below.
                    if (this.firstStrikes[0] > 0) {
                        iFS = 0;
                        pFS = p;
                    } else {
                        iFS = 1;
                        pFS = 1 - p;
                    }

                    // Calculate odds
                    for (i = 0; i <= this.firstStrikes[iFS]; i++) {
//console.log([fscA, Util.binomialProb(maxFscA, fscA, 0.5), fscD,  Util.binomialProb(maxFscD, fscD, 0.5), i, Util.binomialProb(this.firstStrikes[iFS], i, pFS), oddsAfterFirstStrikes(iFS, i)]);
                        // (Product of binomials for attacker and defender first strike chances) * (binomial for first strike hitting) * (odds of winning after first strike)
                        odds.attackerWinsFight += Util.binomialProb(maxFscA, fscA, 0.5) * Util.binomialProb(maxFscD, fscD, 0.5) * Util.binomialProb(this.firstStrikes[iFS], i, pFS) * oddsAfterFirstStrikes(iFS, i);

                        // Retreat can't happen during first strikes, so keep track of the odds that the battle ends due to first strikes hitting more than hitsNeededToWin times
                        // Also, retreat only applies to the attacker
                        if (this.appliedBonuses[0].hasOwnProperty("retreat") && iFS === 1 && i >= this.hitsNeededToWin[iFS]) {
                            oddsDefenderWinsInFirstStrikes += Util.binomialProb(maxFscA, fscA, 0.5) * Util.binomialProb(maxFscD, fscD, 0.5) * Util.binomialProb(this.firstStrikes[iFS], i, pFS);
                        }
                    }
                }
            }

            if (this.appliedBonuses[0].hasOwnProperty("retreat")) {
                odds.attackerRetreats = (1 - oddsDefenderWinsInFirstStrikes - odds.attackerWinsFight) * this.appliedBonuses[0]["retreat"] / 100;
            }
//console.log(odds.QQQ);

            return odds;
        }

        attackerWinsRound() : boolean {
            return Math.random() < this.A / (this.A + this.D);
        }

        // Handle everything associated with a unit dying after battle
        processDeath(i : number, j : number) {
            var baseXP : number;

            this.log.push(this.names[i] + " defeated " + this.names[j] + "!");

            // Process results
            this.winner = i === 0 ? "attacker" : "defender";
            this.loser = j === 0 ? "attacker" : "defender";

            // Play sound and show event
            if (this.units[i].owner === config.PLAYER_ID) {
                assets.battleWon.play();
                chromeUI.eventLog("Your " + this.units[i].type + " killed a barbarian " + this.units[j].type + ".", "good");
            } else {
                assets.battleLost.play();
                chromeUI.eventLog("Your " + this.units[j].type + " was killed by a barbarian " + this.units[i].type + ".", "bad");
            }

            // Loser gets deleted
            this.units[j].delete(); // Delete the references we can
            this.units[j].currentStrength = 0; // So any outstanding references can see it's dead - should already be 0 by now, but why not be sure?
            this.units[j].currentMovement = 0; // So any outstanding references can see it's dead

            // Winner gets XP
            baseXP = this.winner === "attacker" ? 4 * this.D / this.A : 2 * this.A / this.D;
            this.units[i].xp += Util.bound(Math.floor(baseXP), 1, Infinity);
        }

        // Calls itself recursively to simulate rounds of the fight until it's over (someone dies or withdraws)
        simRounds(cb : () => void, includeAnimationDelays : boolean = true) {
            var i : number, j : number, newHP : number;

            if (this.attackerWinsRound()) {
                i = 0; // Winner
                j = 1; // Loser
            } else {
                i = 1; // Winner
                j = 0; // Loser
            }

            // If this is a first strike, only the unit with first strikes left can win. So only do
            // damage if the loser's first strikes are 0.
            if (this.firstStrikes[j] === 0) {
                newHP = Util.bound(this.hps[j] - this.damagePerHit[i], 0, 100);

                // Check for withdrawal, if it's not a first strike and it would kill the loser
                if (this.firstStrikes[i] === 0 && newHP === 0 && this.appliedBonuses[j].hasOwnProperty("retreat") && 100 * Math.random() < this.appliedBonuses[j]["retreat"]) {
                    // Show event
                    if (this.units[j].owner === config.PLAYER_ID) {
                        chromeUI.eventLog("Your " + this.units[j].type + " withdrew from combat with a " + this.units[i].type + ".", "good");
                    } else {
                        chromeUI.eventLog("A " + this.units[i].type + " withdrew from combat with your " + this.units[j].type + ".", "bad");
                    }

                    this.withdrew = true;
                } else {
                    // Apply damage
                    this.hps[j] = newHP;
                    this.units[j].currentStrength = this.units[j].strength * this.hps[j] / 100;
                    this.log.push(this.names[j] + " is hit for " + this.damagePerHit[i] + " (" + this.hps[j] + "/100HP)");
//console.log(this.names[j] + " is hit for " + this.damagePerHit[i] + " (" + this.hps[j] + "/100HP)");
                }
            }

            // Decrement first strikes
            if (this.firstStrikes[0] > 0) {
                this.firstStrikes[0] -= 1;
            }
            if (this.firstStrikes[1] > 0) {
                this.firstStrikes[1] -= 1;
            }

//console.log("START HIT ANIMATION");
            mapUI.render();
            setTimeout(function () {
                if (!this.withdrew && this.hps[0] > 0 && this.hps[1] > 0) {
                    this.simRounds(cb, includeAnimationDelays);
                } else {
                    // Fight over
                    if (!this.withdrew) {
                        // Somebody died
                        this.processDeath(i, j);
                    }
//console.log(this.log);

                    cb();
                }
            }.bind(this), includeAnimationDelays ? config.BATTLE_ROUND_UI_DELAY : 0);
//console.log("END HIT ANIMATION");
        }

        // includeAnimationDelays should be set to false for unit tests and non-visible units
        fight(cb : () => void, includeAnimationDelays : boolean = true) {
            setTimeout(function () {
                this.log.push(this.names[0] + " (" + Util.round(this.A, 2) + ") attacked " + this.names[1] + " (" + Util.round(this.D, 2) + ")");
                this.log.push("Combat odds for attacker: " + Math.round(this.odds().attackerWinsFight * 100) + "%");

                // Calculate first strikes here, since it could have been perturbed by odds() call if first strikes were set previously
                this.assignFirstStrikes();

/*console.log(JSON.stringify(this.appliedBonuses));
console.log(this.firstStrikes);*/

                this.units[0].attacked = true;
                this.units[0].canHeal = false;

                // Simulate the fight
                this.simRounds(cb, includeAnimationDelays);
            }.bind(this), includeAnimationDelays ? config.BATTLE_ROUND_UI_DELAY : 0);
            assets.battleStart.play();
        }
    }

    // Find best attacker/defender combo for a unit/group attacking a tile. If no combo found, defender is null.
    // If the third parameter (forceFindDefender) is true, then even invalid attackers are used. This should be used for path finding only, not for actual attacking
    export function findBestDefender(attackerUnitOrGroup : Units.UnitOrGroup, coords : number[], forceFindDefender : boolean = false) : {attacker : Units.Unit; defender : Units.Unit} {
        var attacker : Units.Unit, defender : Units.Unit, findBestDefenderForAttacker : (attacker : Units.Unit, coords : number[]) => {defender : Units.Unit; oddsDefenderWinsFight : number};

        // Works on individual attacker; needs to be called on all members of group
        findBestDefenderForAttacker = function (attacker : Units.Unit, coords : number[]) : {defender : Units.Unit; oddsDefenderWinsFight : number} {
            var battle : Battle, defender : Units.Unit, maxOdds : number, newTileUnits : Units.Unit[], oddsDefenderWinsFight : number;

            newTileUnits = game.getTile(coords).units;

            // See if an enemy is on that tile, and if so, find the one with max strength against attacker
            defender = null;
            maxOdds = -Infinity;
            newTileUnits.forEach(function (unit) {
                if (unit.owner !== attacker.owner) {
                    battle = new Battle(attacker, unit);
                    oddsDefenderWinsFight = 1 - battle.odds().attackerWinsFight;
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

        if (attackerUnitOrGroup instanceof Units.Unit) {
            // Attacker is a single unit
            attacker = <Units.Unit> attackerUnitOrGroup;

            // Only proceed if there is a valid attacker
            if (forceFindDefender || (attacker.canAttack && !attacker.attacked)) {
                defender = findBestDefenderForAttacker(attacker, coords).defender;
            }
        } else if (attackerUnitOrGroup instanceof Units.Group) {
            // Attacker is a group, find the one with the best odds against its best defender
            (function () { // Just makes things neater if some variables are local here
                var attackerGroup : Units.Group, minOdds : number;

                minOdds = Infinity;

                attackerGroup = <Units.Group> attackerUnitOrGroup;
                attackerGroup.units.forEach(function (unit) {
                    var obj : {defender : Units.Unit; oddsDefenderWinsFight : number};

                    // Only proceed if there is a valid attacker
                    if (forceFindDefender || (unit.canAttack && !unit.attacked)) {
                        obj = findBestDefenderForAttacker(unit, coords);

                        if (obj.oddsDefenderWinsFight < minOdds) {
                            minOdds = obj.oddsDefenderWinsFight;
                            attacker = unit;
                            defender = obj.defender;
                        }
                    }
                });
            }());
        }

        return {
            attacker: attacker !== undefined ? attacker : null,
            defender: defender !== undefined ? defender : null
        };
    };

    // If tile has enemy unit on it, initiate combat (if appropriate) and return true. Otherwise, do
    // nothing and return false. WARNING: If returning true, some async stuff might still going on
    // in the background!!!
    export function fightIfTileHasEnemy(attackerUnitOrGroup : Units.UnitOrGroup, coords : number[]) : boolean {
        var attacker : Units.Unit, battle : Battle, defender : Units.Unit, newTileUnits : Units.Unit[], units : {attacker : Units.Unit; defender : Units.Unit};

        newTileUnits = game.getTile(coords).units;

        units = findBestDefender(attackerUnitOrGroup, coords);
        attacker = units.attacker;
        defender = units.defender;

        if (defender) {
            // Delete path
            attackerUnitOrGroup.targetCoords = null;

            // We have a valid attacker and defender! Fight!
            battle = new Battle(attacker, defender);
            game.activeBattle = battle;
            battle.fight(function () {
                game.activeBattle = null;

                if (battle.winner === "attacker") {
                    if (game.map.enemyUnits(attackerUnitOrGroup.owner, coords).length === 0) {
                        // No enemies left on tile, take it.
                        attackerUnitOrGroup.moveToCoords(coords); // Move entire group, if it's a group
                    } else {
                        // Enemies left on tile, don't take it
                        attacker.countMovementToCoords(coords, attacker); // Only count for attacker, not whole group
                    }
                } else if (battle.winner === "defender") {
                    // Attacker died, so on to the next one
                    game.moveUnits();
                } else {
                    // Withdrew from battle

                    // Enemies left on tile, don't take it
                    attacker.countMovementToCoords(coords, attacker); // Only count for attacker, not whole group
                }

                // Update hover tile, since this could change, particularly for right click attack when defending tile is hovered over
                chromeUI.onHoverTile(game.getTile(controller.hoveredTile));
            });

            return true;
        } else if (game.map.enemyUnits(attackerUnitOrGroup.owner, coords).length > 0) {
            // Delete path
            attackerUnitOrGroup.targetCoords = null;

            // We didn't find an attacker, because there is an enemy on the tile and we're not attacking
            return true;
        }

        return false;
    }
}