var game;

var assets = {
    battleLost: jasmine.createSpyObj("asset", ["play"]),
    battleWon: jasmine.createSpyObj("asset", ["play"])
};
var chromeUI = jasmine.createSpyObj("chromeUI", ["eventLog", "onUnitActivated", "showModal"]);
var mapUI = jasmine.createSpyObj("mapUI", ["render"]);

describe("Combat.Battle.oddsAttackerWinsFight()", function() {
    it("should accurately predict battle outcomes for arbitrary combatants", function() {
        var attackerWins, expectedAttackerWins, i, numFights, rand, params, u1, u2;

        attackerWins = 0;
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
        params.u1Promotions = [Random.choice(Object.keys(Units.promotions)), Random.choice(Object.keys(Units.promotions))];
        params.u2Promotions = [Random.choice(Object.keys(Units.promotions)), Random.choice(Object.keys(Units.promotions))];

        // Randomize health
        params.u1HP = Math.round(Math.random() * 100);
        params.u2HP = Math.round(Math.random() * 100);
//params = {tileTerrain: "grassland", tileFeatures: ["forest"], u1Type: "Axeman", u2Type: "Archer", u1Promotions: ["combat1"], u2Promotions: ["combat1", "combat2"], u1HP: 100, u2HP: 100};
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
            if (i === 0) { expectedAttackerWins = b.oddsAttackerWinsFight() * numFights; console.log(b); }

            b.fight();
            if (b.winner === "attacker") {
                attackerWins += 1;
            }
        }

console.log("Expected: " + expectedAttackerWins / numFights);
console.log("Observed: " + attackerWins / numFights);

        expect(Math.abs((attackerWins - expectedAttackerWins) / numFights)).toBeLessThan(0.01);
    });
});