var game;

var assets = {
    battleLost: jasmine.createSpyObj("asset", ["play"]),
    battleWon: jasmine.createSpyObj("asset", ["play"])
};
var chromeUI = jasmine.createSpyObj("chromeUI", ["eventLog", "showModal"]);
var mapUI = jasmine.createSpyObj("mapUI", ["render"]);

describe("A test suite", function() {
    it('should fail', function() {
        var attackerWins, expectedAttackerWins, i, numFights, rand, params;

        attackerWins = 0;
        numFights = 100000;

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

        // Randomize health

console.log(params);

        for (i = 0; i < numFights; i++) {
            game = new Game(1, 1, 2);

            // Same tiles every time
            game.map.tiles[0][0].terrain = params.tileTerrain;
            game.map.tiles[0][0].features = params.tileFeatures;
            game.map.tiles[0][1].terrain = params.tileTerrain;
            game.map.tiles[0][1].features = params.tileFeatures;

            u1 = new Units[params.u1Type](config.PLAYER_ID, [0, 0]);
            u2 = new Units[params.u2Type](config.BARB_ID, [0, 1]);
            b = new Combat.Battle(u1, u2);

            if (i === 0) { expectedAttackerWins = b.oddsAttackerWinsFight() * numFights; }

            b.fight();
            if (b.winner === "attacker") {
                attackerWins += 1;
            }
        }

console.log(expectedAttackerWins / numFights);
console.log(attackerWins / numFights);

        expect(Math.abs((attackerWins - expectedAttackerWins) / numFights)).toBeLessThan(0.01);
    });
});