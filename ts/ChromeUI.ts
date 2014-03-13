// ChromeUI - Everything related to the display and interactivity of the on-screen chrome (everything not on the map/minimap)

class ChromeUI {
    elHoverBox : HTMLDivElement;
    elTurnBox : HTMLDivElement;
    elBottomInfo : HTMLDivElement;
    elBottomActions : HTMLDivElement;

    constructor() {
        this.elHoverBox = <HTMLDivElement> document.getElementById("hover-box");
        this.elTurnBox = <HTMLDivElement> document.getElementById("turn-box");
        this.elBottomInfo = <HTMLDivElement> document.getElementById("bottom-info");
        this.elBottomActions = <HTMLDivElement> document.getElementById("bottom-actions");
    }

    strengthFraction(unit : Units.BaseUnit) {
        if (unit.strength === unit.currentStrength) {
            return unit.currentStrength + ' S';
        } else {
            return unit.currentStrength + '/' + unit.strength + ' S';
        }
    }

    movementFraction(unit : Units.BaseUnit) {
        if (unit.movement === unit.currentMovement) {
            return unit.currentMovement + ' M';
        } else {
            return unit.currentMovement + '/' + unit.movement + ' M';
        }
    }

    onHoverTile(tile : MapMaker.Tile = null) {
        var content, i, unit;

        if (tile) {
            content = "";

            for (i = 0; i < tile.units.length; i++) {
                unit = game.getUnit(tile.units[i]);
                content += '<span class="unit-name">' + unit.type + '</span>, ';
                content += this.strengthFraction(unit) + ', ';
                content += this.movementFraction(unit) + ', ';
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

    onUnitActivated() {
        var activeUnit;

        activeUnit = game.getUnit(game.activeUnit);

        // Update bottom-info
        this.elBottomInfo.innerHTML = "<h1>" + activeUnit.type + "</h1>" +
            "<table>" +
            "<tr><td>Strength:</td><td>" + this.strengthFraction(activeUnit) + "</td></tr>" +
            "<tr><td>Movement:</td><td>" + this.movementFraction(activeUnit) + "</td></tr>" +
            "<tr><td>Level:</td><td>" + activeUnit.level + "</td></tr>" +
            "<tr><td>Experience:</td><td>" + activeUnit.xp + "</td></tr>" +
            "</table>";

        // Update bottom-actions
    }
}