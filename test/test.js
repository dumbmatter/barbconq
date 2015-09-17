var game;

var assets = {
    battleStart: jasmine.createSpyObj("asset", ["play"]),
    battleLost: jasmine.createSpyObj("asset", ["play"]),
    battleWon: jasmine.createSpyObj("asset", ["play"])
};
var chromeUI = jasmine.createSpyObj("chromeUI", ["eventLog", "onUnitActivated", "showModal"]);
var mapUI = jasmine.createSpyObj("mapUI", ["render"]);
var ga = null;
var TESTING = true;

function createBattle(params) {
    var u1, u2;

    // New game each time
    game = new Game("easy");
    game.map = new MapMaker.BigIsland(1, 2);

    // Same tiles every time
    game.map.tiles[0][0].terrain = params.tileTerrain;
    game.map.tiles[0][0].features = params.tileFeatures;
    game.map.tiles[0][1].terrain = params.tileTerrain;
    game.map.tiles[0][1].features = params.tileFeatures;

    // Same units every time
    u1 = new Units[params.u1Type](config.USER_ID, [0, 0]);
    u2 = new Units[params.u2Type](config.BARB_ID, [0, 1]);
    params.u1Promotions.forEach(function (promotion) {
        u1.promote(promotion, true);
    });
    params.u2Promotions.forEach(function (promotion) {
        u2.promote(promotion, true);
    });
    u1.currentStrength *= params.u1HP / 100;
    u2.currentStrength *= params.u2HP / 100;

    return new Combat.Battle(u1, u2);
}

// Last two params are optional. If provided, compare Battle.odds against civ4 odds. Otherwise, only compare Battle.odds and Battle.fight.
function testBattleOdds(params, civ4OddsAttackerWins, civ4OddsAttackerRetreats, cb) {
    var afterFightsComplete, attackerRetreats, attackerWins, expectedAttackerRetreats, expectedAttackerWins, expectedOddsAttackerRetreats, expectedOddsAttackerWins, i, numFights, numFightsComplete;

    numFights = 2000;

    attackerWins = 0;
    attackerRetreats = 0;
    numFightsComplete = 0;

    for (i = 0; i < numFights; i++) {
        (function (i) {
            var b, odds;

            b = createBattle(params);

            if (i === 0) {
                // Calculate odds for battle
                odds = b.odds();
/*console.log([b.A, b.D]);
console.log(b.appliedBonuses);
console.log(b.firstStrikes);
console.log(odds);*/
                expectedOddsAttackerWins = odds.attackerWinsFight;
                expectedOddsAttackerRetreats = odds.hasOwnProperty("attackerRetreats") ? odds.attackerRetreats : 0;
            }

            b.fight(function () {
                if (b.winner === "attacker") {
                    attackerWins += 1;
                } else if (!b.winner) {
                    attackerRetreats += 1;
                }

                numFightsComplete += 1;
                if (numFightsComplete === numFights) {
                    afterFightsComplete();
                }
            }, false);
        }(i));
    }


    afterFightsComplete = function () {
        expectedAttackerWins = expectedOddsAttackerWins * numFights;
        expectedAttackerRetreats = expectedOddsAttackerRetreats * numFights;

console.log(params);
if (civ4OddsAttackerWins !== null) { console.log("civ4 Wins: " + civ4OddsAttackerWins); }
console.log("Expected Wins: " + expectedAttackerWins / numFights);
console.log("Observed Wins: " + attackerWins / numFights);
if (civ4OddsAttackerRetreats !== null) { console.log("civ4 Retreats: " + civ4OddsAttackerRetreats); }
console.log("Expected Retreats: " + expectedAttackerRetreats / numFights);
console.log("Observed Retreats: " + attackerRetreats / numFights);

        expect(Math.abs((attackerWins - expectedAttackerWins) / numFights)).toBeLessThan(0.03);
        expect(Math.abs((attackerRetreats - expectedAttackerRetreats) / numFights)).toBeLessThan(0.03);
        if (civ4OddsAttackerWins !== null) {
            expect(Math.abs(civ4OddsAttackerWins - expectedAttackerWins / numFights)).toBeLessThan(0.03);
        }
        if (civ4OddsAttackerRetreats !== null) {
            expect(Math.abs(civ4OddsAttackerRetreats - expectedAttackerRetreats / numFights)).toBeLessThan(0.03);
        }

        cb();
    };
}

describe("Combat.Battle.odds()", function() {
    var async;

    async = new AsyncSpec(this);

    async.it("should accurately predict outcome for random battle", function (done) {
        var numBattles, numBattlesComplete, recursivelyDoBattles;

        numBattles = 10;
        numBattlesComplete = 0;

        recursivelyDoBattles = function () {
            var params, rand;

            params = {};

            // Randomize tile
            params.tileTerrain = "grassland";
            rand = Math.random();
            if (rand < 0.25) {
                params.tileFeatures = [];
            } else if (rand < 0.5) {
                params.tileFeatures = ["forest"];
            } else if (rand < 0.75) {
                params.tileFeatures = ["hills"];
            } else {
                params.tileFeatures = ["forest", "hills"];
            }

            // Randomize Units
            params.u1Type = Random.choice(["Warrior", "Archer", "Chariot", "Spearman", "Axeman"]);
            params.u2Type = Random.choice(["Scout", "Warrior", "Archer", "Chariot", "Spearman", "Axeman"]);

            // Randomize promotions
            params.u1Promotions = [Random.choice(Object.keys(promotions)), Random.choice(Object.keys(promotions)), Random.choice(Object.keys(promotions)), Random.choice(Object.keys(promotions))];
            params.u2Promotions = [Random.choice(Object.keys(promotions)), Random.choice(Object.keys(promotions)), Random.choice(Object.keys(promotions)), Random.choice(Object.keys(promotions))];

            // Randomize health
            params.u1HP = 1 + Math.round(Math.random() * 99);
            params.u2HP = 1 + Math.round(Math.random() * 99);
//params = {tileTerrain: 'grassland', tileFeatures: ['hills'], u1Type: 'Warrior', u2Type: 'Chariot', u1Promotions: ['drill2', 'combat1', 'combat2', 'cityRaider2'], u2Promotions: ['cityGarrison3', 'drill4', 'cityGarrison3', 'cityRaider3'], u1HP: 77, u2HP: 37};

            testBattleOdds(params, null, null, function () {
                numBattlesComplete += 1;
                if (numBattlesComplete === numBattles) {
                    done();
                } else {
                    recursivelyDoBattles();
                }
            });
        };

        recursivelyDoBattles();
    });

    async.it("should match results from civ4", function (done) {
        var params;

        params = {tileTerrain: 'grassland', tileFeatures: [], u1Type: 'Axeman', u2Type: 'Axeman', u1Promotions: ['drill1', 'drill2', 'drill3', 'drill4'], u2Promotions: [], u1HP: 100, u2HP: 100};
        testBattleOdds(params, 0.787, 0, function () {
            params = {tileTerrain: 'grassland', tileFeatures: [], u1Type: 'Axeman', u2Type: 'Axeman', u1Promotions: ['drill1', 'drill2', 'drill3'], u2Promotions: [], u1HP: 100, u2HP: 100};
            testBattleOdds(params, 0.667, 0, function () {

                params = {tileTerrain: 'grassland', tileFeatures: [], u1Type: 'Archer', u2Type: 'Chariot', u1Promotions: [], u2Promotions: ['drill2', 'drill3', 'drill4'], u1HP: 100, u2HP: 100};
                testBattleOdds(params, 0.096, 0, function () {

                    params = {tileTerrain: 'grassland', tileFeatures: [], u1Type: 'Chariot', u2Type: 'Chariot', u1Promotions: ['drill4'], u2Promotions: ['drill2', 'drill3', 'drill4'], u1HP: 100, u2HP: 100};
                    testBattleOdds(params, 0.364, 0.064, function () {

                        params = {tileTerrain: 'grassland', tileFeatures: ["forest", "hills"], u1Type: 'Spearman', u2Type: 'Archer', u1Promotions: ['cover'], u2Promotions: ['combat1'], u1HP: 100, u2HP: 100};
                        testBattleOdds(params, 0.093, 0, function () {

                            params = {tileTerrain: 'grassland', tileFeatures: ["forest", "hills"], u1Type: 'Spearman', u2Type: 'Archer', u1Promotions: ['cover'], u2Promotions: ['combat1'], u1HP: 100, u2HP: 2.5/3 * 100};
                            testBattleOdds(params, 0.341, 0, done);
                        });
                    });
                });
            });
        });
    });
});