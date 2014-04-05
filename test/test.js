var game;

var assets = {
    battleLost: jasmine.createSpyObj("asset", ["play"]),
    battleWon: jasmine.createSpyObj("asset", ["play"])
};
var chromeUI = jasmine.createSpyObj("chromeUI", ["eventLog", "onUnitActivated", "showModal"]);
var mapUI = jasmine.createSpyObj("mapUI", ["render"]);

function createBattle(params) {
    var u1, u2;

    // New game each time
    game = new Game(1, 1, 2);

    // Same tiles every time
    game.map.tiles[0][0].terrain = params.tileTerrain;
    game.map.tiles[0][0].features = params.tileFeatures;
    game.map.tiles[0][1].terrain = params.tileTerrain;
    game.map.tiles[0][1].features = params.tileFeatures;

    // Same units every time
    u1 = new Units[params.u1Type](config.PLAYER_ID, [0, 0]);
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
function testBattleOdds(params, civ4OddsAttackerWins, civ4OddsAttackerRetreats) {
    var attackerRetreats, attackerWins, b, expectedAttackerRetreats, expectedAttackerWins, expectedOddsAttackerRetreats, expectedOddsAttackerWins, i, numFights, odds;

    numFights = 20000;

    attackerWins = 0;
    attackerRetreats = 0;

    for (i = 0; i < numFights; i++) {
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

        b.fight();
        if (b.winner === "attacker") {
            attackerWins += 1;
        } else if (!b.winner) {
            attackerRetreats += 1;
        }
    }

    expectedAttackerWins = expectedOddsAttackerWins * numFights;
    expectedAttackerRetreats = expectedOddsAttackerRetreats * numFights;

if (civ4OddsAttackerWins !== undefined) { console.log("civ4 Wins: " + civ4OddsAttackerWins); }
console.log("Expected Wins: " + expectedAttackerWins / numFights);
console.log("Observed Wins: " + attackerWins / numFights);
if (civ4OddsAttackerRetreats !== undefined) { console.log("civ4 Retreats: " + civ4OddsAttackerRetreats); }
console.log("Expected Retreats: " + expectedAttackerRetreats / numFights);
console.log("Observed Retreats: " + attackerRetreats / numFights);

    expect(Math.abs((attackerWins - expectedAttackerWins) / numFights)).toBeLessThan(0.01);
    expect(Math.abs((attackerRetreats - expectedAttackerRetreats) / numFights)).toBeLessThan(0.01);
    if (civ4OddsAttackerWins !== undefined) { expect(Math.abs(civ4OddsAttackerWins - expectedAttackerWins / numFights)).toBeLessThan(0.01); }
    if (civ4OddsAttackerRetreats !== undefined) { expect(Math.abs(civ4OddsAttackerRetreats - expectedAttackerRetreats / numFights)).toBeLessThan(0.01); }
}

describe("Combat.Battle.odds()", function() {
    it("should accurately predict outcome for random battle", function() {
        var i, params, rand;

        for (i = 0; i < 10; i++) {
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
            params.u1Promotions = [Random.choice(Object.keys(Units.promotions)), Random.choice(Object.keys(Units.promotions)), Random.choice(Object.keys(Units.promotions)), Random.choice(Object.keys(Units.promotions))];
            params.u2Promotions = [Random.choice(Object.keys(Units.promotions)), Random.choice(Object.keys(Units.promotions)), Random.choice(Object.keys(Units.promotions)), Random.choice(Object.keys(Units.promotions))];

            // Randomize health
            params.u1HP = 1 + Math.round(Math.random() * 99);
            params.u2HP = 1 + Math.round(Math.random() * 99);
//params = {tileTerrain: 'grassland', tileFeatures: ['hills'], u1Type: 'Warrior', u2Type: 'Chariot', u1Promotions: ['drill2', 'combat1', 'combat2', 'cityRaider2'], u2Promotions: ['cityGarrison3', 'drill4', 'cityGarrison3', 'cityRaider3'], u1HP: 77, u2HP: 37};
console.log(params);

            testBattleOdds(params);
        }
    });
    it("should match results from civ4", function() {
        var params;

        params = {tileTerrain: 'grassland', tileFeatures: [], u1Type: 'Axeman', u2Type: 'Axeman', u1Promotions: ['drill1', 'drill2', 'drill3', 'drill4'], u2Promotions: [], u1HP: 100, u2HP: 100};
        testBattleOdds(params, 0.787, 0);

        params = {tileTerrain: 'grassland', tileFeatures: [], u1Type: 'Axeman', u2Type: 'Axeman', u1Promotions: ['drill1', 'drill2', 'drill3'], u2Promotions: [], u1HP: 100, u2HP: 100};
        testBattleOdds(params, 0.667, 0);

        params = {tileTerrain: 'grassland', tileFeatures: [], u1Type: 'Archer', u2Type: 'Chariot', u1Promotions: [], u2Promotions: ['drill2', 'drill3', 'drill4'], u1HP: 100, u2HP: 100};
        testBattleOdds(params, 0.096, 0);

        params = {tileTerrain: 'grassland', tileFeatures: [], u1Type: 'Chariot', u2Type: 'Chariot', u1Promotions: ['drill4'], u2Promotions: ['drill2', 'drill3', 'drill4'], u1HP: 100, u2HP: 100};
        testBattleOdds(params, 0.364, 0.064);

        params = {tileTerrain: 'grassland', tileFeatures: ["forest", "hills"], u1Type: 'Spearman', u2Type: 'Archer', u1Promotions: ['cover'], u2Promotions: ['combat1'], u1HP: 100, u2HP: 100};
        testBattleOdds(params, 0.093, 0);

        params = {tileTerrain: 'grassland', tileFeatures: ["forest", "hills"], u1Type: 'Spearman', u2Type: 'Archer', u1Promotions: ['cover'], u2Promotions: ['combat1'], u1HP: 100, u2HP: 2.5/3 * 100};
        testBattleOdds(params, 0.341, 0);
    });
});