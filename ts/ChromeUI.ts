// ChromeUI - Everything related to the display and interactivity of the on-screen chrome (everything not on the map)

class ChromeUI {
    elInfoBox : HTMLDivElement;

    constructor() {
        this.elInfoBox = <HTMLDivElement> document.getElementById("info-box");
    }
    onHoverTile(tile : MapMaker.Tile = null) {
        var content, i, unit;

        if (tile) {
            content = "";

            for (i = 0; i < tile.units.length; i++) {
                unit = game.getUnit(tile.units[i]);
                content += unit.type + "<br>";
            }

            // Show tile info
            this.elInfoBox.innerHTML = tile.features.join("/") + (tile.features.length ? "/" : "") + tile.terrain;
            this.elInfoBox.style.display = "block";
        } else {
            // Hide info box
            this.elInfoBox.style.display = "none";
        }
    }
}