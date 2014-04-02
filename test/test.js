var game;

var assets = {
    battleLost: jasmine.createSpyObj("asset", ["play"]),
    battleWon: jasmine.createSpyObj("asset", ["play"])
};
var chromeUI = jasmine.createSpyObj("chromeUI", ["eventLog", "onUnitActivated", "showModal"]);
var mapUI = jasmine.createSpyObj("mapUI", ["render"]);

describe("Combat.Battle.odds()", function() {
    it("should accurately predict battle outcomes for arbitrary combatants", function() {
        var attackerRetreats, attackerWins, expectedAttackerRetreats, expectedAttackerWins, i, numFights, odds, params, rand, u1, u2;

        attackerWins = 0;
        attackerRetreats = 0;
        numFights = 10000;

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
        params.u1HP = Math.round(Math.random() * 100);
        params.u2HP = Math.round(Math.random() * 100);
//params = {tileTerrain: "grassland", tileFeatures: ["forest"], u1Type: "Chariot", u2Type: "Archer", u1Promotions: [], u2Promotions: [], u1HP: 100, u2HP: 100};
//params = {tileTerrain: 'grassland', tileFeatures: [], u1Type: 'Axeman', u2Type: 'Axeman', u1Promotions: ['drill1', 'drill2', 'drill3'], u2Promotions: [], u1HP: 100, u2HP: 100};
console.log(params);
        
        for (i = 0; i < numFights; i++) {
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

            b = new Combat.Battle(u1, u2);

            // Save prediction for later
            if (i === 0) {
                odds = b.odds();
console.log(b.appliedBonuses);
console.log(b.firstStrikes);
console.log(odds);
                expectedAttackerWins = odds.attackerWinsFight * numFights;
                expectedAttackerRetreats = odds.hasOwnProperty("attackerRetreats") ? odds.attackerRetreats * numFights : 0;
            }

            b.fight();
            if (b.winner === "attacker") {
                attackerWins += 1;
            } else if (!b.winner) {
                attackerRetreats += 1
            }
        }

console.log("Expected Wins: " + expectedAttackerWins / numFights);
console.log("Observed Wins: " + attackerWins / numFights);
console.log("Expected Retreats: " + expectedAttackerRetreats / numFights);
console.log("Observed Retreats: " + attackerRetreats / numFights);

        expect(Math.abs((attackerWins - expectedAttackerWins) / numFights)).toBeLessThan(0.01);
        expect(Math.abs((attackerRetreats - expectedAttackerRetreats) / numFights)).toBeLessThan(0.01);
    });
});