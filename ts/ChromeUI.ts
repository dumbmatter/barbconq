// ChromeUI - Everything related to the display and interactivity of the on-screen chrome (everything not on the map)

class ChromeUI {
    elHoverBox : HTMLDivElement;
    elTurnBox : HTMLDivElement;

    constructor() {
        this.elHoverBox = <HTMLDivElement> document.getElementById("hover-box");
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

            this.elHoverBox.innerHTML = content;
            this.elHoverBox.style.display = "block";
        } else {
            // Hide hover box
            this.elHoverBox.style.display = "none";
        }
    }

    onNewTurn() {
        this.elTurnBox.innerHTML = "Turn " + game.turn;
    }
}