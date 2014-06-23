// AI

module AI {
    export module Barb {
        export function moveUnit(unit : Units.Unit) {
            var battle : Combat.Battle, cities : Cities.City[], currentTile : MapMaker.Tile, enemies : {coords : number[]; oddsWinFight : number}[], i : number, j : number, k : string, possibleCoords : number[][], units : {attacker : Units.Unit; defender : Units.Unit};

            // For each visible enemy unit within 3 tiles, calculate and store {coords, oddsWinFight}
            enemies = [];
            for (i = unit.coords[0] - 3; i <= unit.coords[0] + 3; i++) {
                for (j = unit.coords[1] - 3; j <= unit.coords[1] + 3; j++) {
                    if (game.map.validCoords([i, j])) {
                        // If there is any defender on this tile, find the best defender and calculate battle odds
                        units = Combat.findBestDefender(game.activeUnit, [i, j]);
                        if (units.defender) {
                            battle = new Combat.Battle(unit, units.defender);
                            enemies.push({
                                coords: [i, j],
                                oddsWinFight: battle.odds().attackerWinsFight
                            });                                        
                        }
                    }
                }
            }
            // Sort by odds descending, so that the best odds will be selected first
            enemies.sort(function (a, b) { return b.oddsWinFight - a.oddsWinFight; }); 

            currentTile = game.getTile(unit.coords);

            // MOVE DECISION

            // If in city, only move to attack if >75% chance of winning and if 2 other units are in city
            if (currentTile.city) {
                if (currentTile.units.length > 2) {
                    for (i = 0; i < enemies.length; i++) {
                        // Only look at adjacent tiles
                        if (Math.abs(unit.coords[0] - enemies[i].coords[0]) <= 1 && Math.abs(unit.coords[1] - enemies[i].coords[1]) <= 1) {
                            if (enemies[i].oddsWinFight >= 0.75) {
console.log("Attack out of city with " + enemies[i].oddsWinFight + " odds");
                                unit.moveToCoords(enemies[i].coords);
                                return;
                            }
                        }
                    }

                }

console.log("Wait in city");
                unit.skipTurn();
                return;
            }

            // Attack with >25% chance of winning
            for (i = 0; i < enemies.length; i++) {
                // Only look at adjacent tiles
                if (Math.abs(unit.coords[0] - enemies[i].coords[0]) <= 1 && Math.abs(unit.coords[1] - enemies[i].coords[1]) <= 1) {
                    if (enemies[i].oddsWinFight >= 0.25) {
console.log("Attack with " + enemies[i].oddsWinFight + " odds");
                        unit.moveToCoords(enemies[i].coords);
                        return;
                    }
                }
            }

            // Move into city, if possible
            // This is for both moving in to defend a barb city, and attacking a non-barb city
            for (i = unit.coords[0] - 1; i <= unit.coords[0] + 1; i++) {
                for (j = unit.coords[1] - 1; j <= unit.coords[1] + 1; j++) {
                    if ((i !== unit.coords[0] || j !== unit.coords[1]) && game.map.validCoords([i, j])) {
                        if (game.getTile([i, j]).city) {
console.log("Move into city");
                                unit.moveToCoords([i, j]);
                                return;
                        }
                    }
                }
            }

            // Move towards nearby weaker unit
            for (i = 0; i < enemies.length; i++) {
                if (enemies[i].oddsWinFight >= 0.5) {
console.log("Move towards unit with " + enemies[i].oddsWinFight + " odds");
                    unit.initiatePath(enemies[i].coords);
                    return;
                }
            }
            

            // Move away from stronger unit
            for (i = 0; i < enemies.length; i++) {
                // Only look at adjacent tiles
                if (Math.abs(unit.coords[0] - enemies[i].coords[0]) <= 1 && Math.abs(unit.coords[1] - enemies[i].coords[1]) <= 1) {
                    if (enemies[i].oddsWinFight < 0.25) {
                        possibleCoords = [
                            [unit.coords[0] + 1, unit.coords[1] + 1],
                            [unit.coords[0] + 1, unit.coords[1]],
                            [unit.coords[0] + 1, unit.coords[1] - 1],
                            [unit.coords[0], unit.coords[1] + 1],
                            [unit.coords[0], unit.coords[1] - 1],
                            [unit.coords[0] - 1, unit.coords[1] + 1],
                            [unit.coords[0] - 1, unit.coords[1]],
                            [unit.coords[0] - 1, unit.coords[1] - 1]
                        ].filter(function (coords) {
                            return (Math.abs(coords[0] - enemies[i].coords[0]) > 1 || Math.abs(coords[1] - enemies[i].coords[1]) > 1) && unit.canMoveOnCoords(coords)
                        });

                        if (possibleCoords.length) {
console.log("Run away from enemy with " + enemies[i].oddsWinFight + " odds");
                            unit.moveToCoords(Random.choice(possibleCoords));
                            return;
                        }
                    }
                }
            }

            // Fortify until healed, if hurt
            if (unit.canHeal && unit.currentStrength < unit.strength) {
console.log("Fortify until healed");
                unit.skipTurn();
                return;
            }

            // Move towards city
            // If there can be more than one city, this should somehow intelligently decide which one
            if (Math.random() < 0.5) { // Add some randomness
                cities = []; // Array of all cities
                for (i = 0; i < game.cities.length; i++) {
                    for (k in game.cities[i]) {
                        cities.push(game.cities[i][k]);
                    }
                }
                if (cities.length > 0) {
console.log("Move towards city " + cities[0].id);
                    unit.initiatePath(cities[0].coords);
                    return;
                }
            }

            // Move randomly
console.log("Move randomly");
            if (Math.random() < 0.75) {
                unit.move(Random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]));
                return;
            }

            unit.skipTurn();
        }
    }
}