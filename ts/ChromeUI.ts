// ChromeUI - Everything related to the display and interactivity of the on-screen chrome (everything not on the map/minimap)

class ChromeUI {
    elHoverBox : HTMLDivElement;
    elTurn : HTMLDivElement;
    elBottomInfo : HTMLDivElement;
    elBottomActions : HTMLDivElement;
    elBottomText : HTMLDivElement;
    elBottomUnits : HTMLDivElement;
    elEvents : HTMLUListElement;

    constructor() {
        this.elHoverBox = <HTMLDivElement> document.getElementById("hover-box");
        this.elTurn = <HTMLDivElement> document.getElementById("turn");
        this.elBottomInfo = <HTMLDivElement> document.getElementById("bottom-info");
        this.elBottomActions = <HTMLDivElement> document.getElementById("bottom-actions");
        this.elBottomText = <HTMLDivElement> document.getElementById("bottom-text");
        this.elBottomUnits = <HTMLDivElement> document.getElementById("bottom-units");
        this.elEvents = <HTMLUListElement> document.getElementById("events");
    }

    strengthFraction(unit : Units.Unit) {
        if (unit.strength === unit.currentStrength) {
            return unit.currentStrength + ' S';
        } else {
            return Util.round(unit.currentStrength, 1) + '/' + unit.strength + ' S';
        }
    }

    movementFraction(unit : Units.Unit) {
        if (unit.movement === unit.currentMovement) {
            return unit.currentMovement + ' M';
        } else {
            return Util.round(unit.currentMovement, 1) + '/' + unit.movement + ' M';
        }
    }

    // Update Chrome that might have changed in render, like unit stuff
    onMapRender() {
        this.updateActiveUnit();
    }

    onUnitActivated() {
        this.updateActiveUnit();
    }

    onHoverTile(tile : MapMaker.Tile = null) {
        var content : string, features : string[], i : number;

        if (tile && tile.terrain !== "unseen") {
            content = "";

            for (i = 0; i < tile.units.length; i++) {
                content += this.hoverBoxUnitSummary(tile.units[i], i === 0);
            }

            // Capitalize feature names
            features = [];
            tile.features.forEach(function (feature) {
                features.push(feature[0].toUpperCase() + feature.slice(1));
            });

            // Show tile terrain and features
            content += '<p>' + features.join("/") + (features.length ? "/" : "") + tile.terrain[0].toUpperCase() + tile.terrain.slice(1) + '</p>';

            this.elHoverBox.innerHTML = content;
            this.elHoverBox.style.display = "block";
        } else {
            this.elHoverBox.style.display = "none";
        }
    }

    onHoverUnitIcon(owner : number = null, id: number = null) {
        var content : string;

        if (owner !== null && id !== null) {
            content = "";
            content += this.hoverBoxUnitSummary(game.units[owner][id]);
            content += '<p>(&lt;CTRL+CLICK&gt; to select all ' + game.units[owner][id].type + ' units)</p>';
            content += '<p>(&lt;ALT+CLICK&gt; to select all units)</p>';

            this.elHoverBox.innerHTML = content;
            this.elHoverBox.style.display = "block";
        } else {
            this.elHoverBox.style.display = "none";
        }
    }

    onHoverMoveEnemy(battle : Combat.Battle) {
        var appliedBonuses : {[name: string] : number}[], content : string, name : string;

        content = "<p>Combat Odds: " + Util.round(battle.oddsAttackerWinsFight() * 100, 1) + "%</p>";
        content += '<p><span class="text-good">' + Util.round(battle.A, 2) + '</span> vs. <span class="text-bad">' + Util.round(battle.D, 2) + '</span></p>';

        // Combat bonuses
        appliedBonuses = battle.getAppliedBonuses();
        content += '<ul class="text-good">';
        for (name in appliedBonuses[0]) {
            content += '<li>' + this.bonusText(name, appliedBonuses[0][name]) + '</li>'
        }
        content += '</ul>';
        content += '<ul class="text-bad">';
        for (name in appliedBonuses[1]) {
            content += '<li>' + this.bonusText(name, appliedBonuses[1][name]) + '</li>'
        }
        content += '</ul>';

        this.elHoverBox.innerHTML = content;
        this.elHoverBox.style.display = "block";
    }

    private hoverBoxUnitSummary(unit : Units.Unit, showCombatBonuses : boolean = true) {
        var bonuses : {[name: string] : number}, content : string, name : string;

        content = "";
        content += '<p><span class="unit-name">' + unit.type + '</span>, ';
        content += this.strengthFraction(unit) + ', ';
        content += this.movementFraction(unit) + ', ';
        content += 'XP: (' + unit.xp + '/' + unit.xpForNextLevel() + '), ';
        content += game.names[unit.owner];
        content += '</p>';

        // Combat bonuses
        if (showCombatBonuses) {
            bonuses = unit.getBonuses();
            content += '<ul>';
            for (name in bonuses) {
                content += '<li>' + this.bonusText(name, bonuses[name]) + '</li>'
            }
            content += '</ul>';
        }

        return content;
    }

    bonusText(name : string, amount : number) {
        if (name === "strength") {
            return "+" + amount + "% Strength";
        } else if (name === "cityDefense") {
            return "+" + amount + "% City Defense";
        } else if (name === "hillsDefense") {
            return "+" + amount + "% Hills Defense";
        } else if (name === "cityAttack") {
            return "+" + amount + "% City Attack";
        } else if (name === "attackAxeman") {
            return "+" + amount + "% Attack vs. Axeman";
        } else if (name === "archery") {
            return "+" + amount + "% vs. Archery Units";
        } else if (name === "melee") {
            return "+" + amount + "% vs. Melee Units";
        } else if (name === "mounted") {
            return "+" + amount + "% vs. Mounted Units";
        } else if (name === "gunpowder") {
            return "+" + amount + "% vs. Gunpowder Units";
        } else if (name === "tile") {
            return "+" + amount + "% Tile Defense";
        } else {
            throw new Error('Unknown bonus type "' + name + '".');
        }
    }

    onHoverAction(action : string = null, arg : string = null) {
        var name : string, promotion : Units.Promotion;

        if (action === "fortify") {
            this.elHoverBox.innerHTML = '<p><span class="action-name">Fortify</span> <span class="action-shortcut">&lt;F&gt;</span></p><p>The unit prepares itself to defend. A unit gets a 5% defensive bonus for each turn it is fortified (maximum 25%). Units also heal while fortified.</p>';
            this.elHoverBox.style.display = "block";
        } else if (action === "skipTurn") {
            this.elHoverBox.innerHTML = '<p><span class="action-name">Skip Turn</span> <span class="action-shortcut">&lt;Space Bar&gt;</span></p><p>The unit does nothing this turn, but will ask for orders again next turn.</p>';
            this.elHoverBox.style.display = "block";
        } else if (action === "separate") {
            this.elHoverBox.innerHTML = '<p><span class="action-name">Separate</span></p><p>Separates the group so you can move each unit individually.</p>';
            this.elHoverBox.style.display = "block";
        } else if (action === "promote") {
            promotion = Units.promotions[arg];
            this.elHoverBox.innerHTML = '<p><span class="action-name">Promote Unit (' + promotion.name + ')</span></p><ul>';
            for (name in promotion.bonuses) {
                this.elHoverBox.innerHTML += '<li>' + this.bonusText(name, promotion.bonuses[name]) + '</li>'
            }
            this.elHoverBox.innerHTML += '</ul>';
            this.elHoverBox.style.display = "block";
        } else {
            this.elHoverBox.style.display = "none";
        }
    }

    // Can be called multiple times during a turn, so needs to be idempotent
    onNewTurn() {
        this.elTurn.innerHTML = String(game.turn);
        this.updateBottomText();
    }

    onMovesDone() {
        this.updateBottomText("Press &lt;ENTER&gt; to begin the next turn...");
    }

    onAIMoving() {
        this.updateBottomText("Waiting for barbarians to move...");
    }

    // Can be called even if no unit is active, in which case it'll remove all displayed unit info
    private updateActiveUnit() {
        var activeUnit, addCommas : boolean, content : string, counts : {[type: string]: number}, i : number, units : Units.Unit[], type : string;

        activeUnit = game.activeUnit; // Really should have separate variables for unit and group, like in unit icon click handling

        // Reset
        this.elBottomActions.innerHTML = "";
        this.elBottomInfo.innerHTML = "";
        this.elBottomUnits.innerHTML = "";

        if (game.activeUnit && game.activeUnit.owner === config.PLAYER_ID) {
            // Update bottom-info
            if (activeUnit instanceof Units.Unit) {
                this.elBottomInfo.innerHTML = "<h1>" + activeUnit.type + "</h1>" +
                    "<table>" +
                    "<tr><td>Strength:</td><td>" + this.strengthFraction(activeUnit) + "</td></tr>" +
                    "<tr><td>Movement:</td><td>" + this.movementFraction(activeUnit) + "</td></tr>" +
                    "<tr><td>Level:</td><td>" + activeUnit.level + "</td></tr>" +
                    "<tr><td>Experience:</td><td>" + activeUnit.xp + "/" + activeUnit.xpForNextLevel() + "</td></tr>" +
                    "</table>";
            } else if (activeUnit instanceof Units.Group) {
                content = "<h1>Unit Group (" + activeUnit.units.length + ")</h1>" +
                    "<table>" +
                    "<tr><td>Movement: " + this.movementFraction(activeUnit) + "</td></tr>" +
                    '<tr><td><div class="group-types">Units: ';

                // List individual unit types in group
                counts = {};
                for (i = 0; i < activeUnit.units.length; i++) {
                    if (activeUnit.units[i].type in counts) {
                        counts[activeUnit.units[i].type] += 1;
                    } else {
                        counts[activeUnit.units[i].type] = 1;
                    }
                }
                addCommas = false;
                for (type in counts) {
                    if (!addCommas) {
                        addCommas = true;
                    } else {
                        content += ", ";
                    }

                    if (counts[type] > 1) {
                        content += type + " (" + counts[type] + ")";
                    } else {
                        content += type;
                    }
                }
                content += "</div></td></tr></table>";

                this.elBottomInfo.innerHTML = content;
            }

            // Update bottom-actions
            this.updateActiveUnitActions();

            // Update bottom-units
            units = game.getTile(game.activeUnit.coords).units;
            for (i = 0; i < units.length; i++) {
                this.elBottomUnits.appendChild(this.unitIcon(units[i]));
            }
        }
    }

    // this.elBottomActions.innerHTML should be emptied before calling this
    updateActiveUnitActions() {
        var actionName : string, availablePromotions : string[], i : number;

        // First, the actions
        for (i = 0; i < game.activeUnit.actions.length; i++) {
            // Convert camel case to title case
            actionName = game.activeUnit.actions[i].replace(/([A-Z]+)*([A-Z][a-z])/g, "$1 $2"); // http://stackoverflow.com/a/7225474
            actionName = actionName.charAt(0).toUpperCase() + actionName.slice(1); // Fix first character

            this.elBottomActions.innerHTML += '<button class="action" data-action="' + game.activeUnit.actions[i] + '">' + actionName + '</button>';
        }

        // Second, the promotions
        availablePromotions = game.activeUnit.availablePromotions();
        for (i = 0; i < availablePromotions.length; i++) {
            this.elBottomActions.innerHTML += '<button class="action promote" data-action="promote" data-arg="' + availablePromotions[i] + '">' + Units.promotions[availablePromotions[i]].name + '</button>';
        }

        // Third, the automated tasks
    }


    private unitIcon(unit : Units.Unit) : HTMLDivElement {
        var healthPct : number, healthBar : HTMLDivElement, icon : HTMLDivElement, iconWrapper, movementIndicator : HTMLDivElement;

        iconWrapper = document.createElement("div");
        iconWrapper.classList.add("unit-icon-wrapper");
        iconWrapper.dataset.owner = unit.owner;
        iconWrapper.dataset.id = unit.id;
        if (unit.group) {
            iconWrapper.dataset.gid = unit.group.id;
        }

        // Unit icon
        icon = document.createElement("div");
        icon.classList.add("unit-icon");
        icon.innerHTML = unit.type.slice(0, 2);
        if (unit.active || (unit.group && unit.group.active)) {
            icon.classList.add("active");
        }

        // Health bar
        healthBar = document.createElement("div");
        healthBar.classList.add("health-bar");
        healthPct = Math.round(unit.currentStrength / unit.strength * 100); // 0 to 100
        healthBar.style.width = healthPct + "%";
        if (healthPct >= 67) {
            healthBar.classList.add("health-good");
        } else if (healthPct >= 33) {
            healthBar.classList.add("health-medium");
        } else {
            healthBar.classList.add("health-bad");
        }

        // Movement indicator
        movementIndicator = document.createElement("div");
        movementIndicator.classList.add("movement-indicator");
        if (unit.skippedTurn) {
            movementIndicator.classList.add("movement-skipped");
        } else if (unit.currentMovement === unit.movement) {
            movementIndicator.classList.add("movement-all");
        } else if (unit.currentMovement > 0) {
            movementIndicator.classList.add("movement-some");
        } else if (unit.currentMovement === 0) {
            movementIndicator.classList.add("movement-none");
        }

        iconWrapper.appendChild(icon);
        iconWrapper.appendChild(healthBar);
        iconWrapper.appendChild(movementIndicator);

        return iconWrapper;
    }

    private updateBottomText(text : string = null) {
        if (!text) {
            this.elBottomText.style.display = "none";
        } else {
            this.elBottomText.innerHTML = text;
            this.elBottomText.style.display = "block";
        }
    }

    showModal(id : string) {
        var closeModal : (e : Event) => void, closeModalEsc : (e : KeyboardEvent) => void, modal : HTMLElement, modalBackground : HTMLElement, modalCloseX : HTMLElement, preventCloseModal : (e : Event) => void, resizeModal : () => void;

        // Modal content
        modal = document.getElementById(id);
        modal.classList.add("modal-active");
        modal.classList.remove("modal-inactive");

        // Make visible
        modalBackground = document.getElementById("modal-background");
        modalBackground.classList.add("modal-active");
        modalBackground.classList.remove("modal-inactive");

        // Close icon - position relative to scrollbar
        modalCloseX = document.getElementById("modal-close");

        // Set maximum height dynamically
        resizeModal = function () {
            modal.style.maxHeight = (window.innerHeight - 40) + "px";
            modalCloseX.style.right = (modal.offsetWidth - modal.clientWidth - 2) + "px";
        }
        resizeModal();
        window.addEventListener("resize", resizeModal);

        // Close modal with a click outside of it, or escape key
        closeModal = function (e : Event) {
            e.stopPropagation();

            modal.classList.remove("modal-active");
            modal.classList.add("modal-inactive");
            modalBackground.classList.remove("modal-active");
            modalBackground.classList.add("modal-inactive");

            window.removeEventListener("resize", resizeModal);
            modalBackground.removeEventListener("click", closeModal);
            modal.removeEventListener("click", preventCloseModal);
            document.removeEventListener("keydown", closeModalEsc);
        }
        closeModalEsc = function (e : KeyboardEvent) {
            if (e.keyCode === 27) { // escape
                closeModal(e);
            }
        };
        preventCloseModal = function (e : Event) {
            e.stopPropagation();
        }
        modal.addEventListener("click", preventCloseModal);
        modalBackground.addEventListener("click", closeModal);
        document.addEventListener("keydown", closeModalEsc);
    }

    eventLog(msg : string, goodOrBad : string = null) {
        var event;

        event = document.createElement("li")
        event.innerHTML = msg;
        if (goodOrBad === "good") {
            event.classList.add("text-good");
        } else if (goodOrBad === "bad") {
            event.classList.add("text-bad");
        }
        this.elEvents.appendChild(event);

        window.setTimeout(function () {
            this.elEvents.removeChild(event);
        }.bind(this), 3000);
    }
}