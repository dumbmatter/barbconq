// ChromeUI - Everything related to the display and interactivity of the on-screen chrome (everything not on the map)

class ChromeUI {
    elInfoBox : HTMLDivElement;
    elTurnBox : HTMLDivElement;

    constructor() {
        this.elInfoBox = <HTMLDivElement> document.getElementById("info-box");
        this.elTurnBox = <HTMLDivElement> document.getElementById("turn-box");
    }

    onHoverTile(tile : MapMaker.Tile = null) {
        var content, i, unit;

        if (tile) {
            content = "";

            for (i = 0; i < tile.units.length; i++) {
                unit = game.getUnit(tile.units[i]);
                content += '<span class="unit-name">' + unit.type + '</span>, ';
                if (unit.strength === unit.currentStrength) {
                    content += unit.currentStrength + ' S, ';
                } else {
                    content += unit.currentStrength + '/' + unit.strength + ' S, ';
                }
                if (unit.movement === unit.currentMovement) {
                    content += unit.currentMovement + ' M, ';
                } else {
                    content += unit.currentMovement + '/' + unit.movement + ' M, ';
                }
                content += game.names[unit.owner];
                content += '<br>';
            }

            // Show tile terrain and features
            content += tile.features.join("/") + (tile.features.length ? "/" : "") + tile.terrain;

            this.elInfoBox.innerHTML = content;
            this.elInfoBox.style.display = "block";
        } else {
            // Hide info box
            this.elInfoBox.style.display = "none";
        }
    }

    onNewTurn() {
        this.elTurnBox.innerHTML = "Turn " + game.turn;
    }
}