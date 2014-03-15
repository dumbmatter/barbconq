// ChromeUI - Everything related to the display and interactivity of the on-screen chrome (everything not on the map/minimap)

class ChromeUI {
    elHoverBox : HTMLDivElement;
    elTurnBox : HTMLDivElement;
    elBottomInfo : HTMLDivElement;
    elBottomActions : HTMLDivElement;
    elBottomText : HTMLDivElement;

    constructor() {
        this.elHoverBox = <HTMLDivElement> document.getElementById("hover-box");
        this.elTurnBox = <HTMLDivElement> document.getElementById("turn-box");
        this.elBottomText = <HTMLDivElement> document.getElementById("bottom-text");
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

    // Update Chrome that might have changed in render, like unit stuff
    onMapRender() {
        if (game.activeUnit) {
            this.updateActiveUnit();
        }
    }

    onUnitActivated() {
        this.updateActiveUnit();
    }

    onHoverTile(tile : MapMaker.Tile = null) {
        var content, i, unit;

        if (tile) {
            content = "";

            for (i = 0; i < tile.units.length; i++) {
                unit = tile.units[i];
                content += '<p><span class="unit-name">' + unit.type + '</span>, ';
                content += this.strengthFraction(unit) + ', ';
                content += this.movementFraction(unit) + ', ';
                content += game.names[unit.owner];
                content += '</p>';
            }

            // Show tile terrain and features
            content += '<p>' + tile.features.join("/") + (tile.features.length ? "/" : "") + tile.terrain + '</p>';

            this.elHoverBox.innerHTML = content;
            this.elHoverBox.style.display = "block";
        } else {
            this.elHoverBox.style.display = "none";
        }
    }

    onHoverAction(action : string = null) {
        if (action === "fortify") {
            this.elHoverBox.innerHTML = '<p><span class="action-name">Fortify</span> <span class="action-shortcut">&lt;F&gt;</span></p><p>The unit prepares itself to defend. A unit gets a 5% defensive bonus for each turn it is fortified (maximum 25%). Units also heal while fortified.</p>';
            this.elHoverBox.style.display = "block";
        } else if (action === "skipTurn") {
            this.elHoverBox.innerHTML = '<p><span class="action-name">Skip Turn</span> <span class="action-shortcut">&lt;Space Bar&gt;</span></p><p>The unit does nothing this turn, but will ask for orders again next turn.</p>';
            this.elHoverBox.style.display = "block";
        } else if (action === "sentry") {
            this.elHoverBox.innerHTML = '<p><span class="action-name">Sentry</span> <span class="action-shortcut">&lt;S&gt;</span></p><p>The unit remains inactive until it sees an enemy unit.</p>';
            this.elHoverBox.style.display = "block";
        } else {
            this.elHoverBox.style.display = "none";
        }
    }

    onNewTurn() {
        this.elTurnBox.innerHTML = "Turn " + game.turn;
        this.updateBottomText();
    }

    onMovesDone() {
        this.updateBottomText("Press &lt;ENTER&gt; to move to next turn...");
    }

    updateActiveUnit() {
        var activeUnit, actionName, i;

        activeUnit = game.activeUnit;

        // Update bottom-info
        this.elBottomInfo.innerHTML = "<h1>" + activeUnit.type + "</h1>" +
            "<table>" +
            "<tr><td>Strength:</td><td>" + this.strengthFraction(activeUnit) + "</td></tr>" +
            "<tr><td>Movement:</td><td>" + this.movementFraction(activeUnit) + "</td></tr>" +
            "<tr><td>Level:</td><td>" + activeUnit.level + "</td></tr>" +
            "<tr><td>Experience:</td><td>" + activeUnit.xp + "</td></tr>" +
            "</table>";

        // Update bottom-actions
        this.elBottomActions.innerHTML = "";
        for (i = 0; i < activeUnit.actions.length; i++) {
            // Convert camel case to title case
            actionName = activeUnit.actions[i].replace(/([A-Z]+)*([A-Z][a-z])/g, "$1 $2"); // http://stackoverflow.com/a/7225474
            actionName = actionName.charAt(0).toUpperCase() + actionName.slice(1); // Fix first character

            this.elBottomActions.innerHTML += '<button class="action" data-action="' + activeUnit.actions[i] + '">' + actionName + '</button>'
        }
    }

    updateBottomText(text : string = null) {
        if (!text) {
            this.elBottomText.style.display = "none";
        } else {
            this.elBottomText.innerHTML = text;
            this.elBottomText.style.display = "block";
        }
    }
}