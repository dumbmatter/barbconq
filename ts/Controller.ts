// Handle user input from keyboard and mouse, and route it to the appropriate place based on the state of the game

class Controller {
    KEYS = {
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        LEFT: 37,
        NUMPAD_1: 97,
        NUMPAD_2: 98,
        NUMPAD_3: 99,
        NUMPAD_4: 100,
        NUMPAD_6: 102,
        NUMPAD_7: 103,
        NUMPAD_8: 104,
        NUMPAD_9: 105,
        C: 67,
        F: 70,
        G: 71,
        H: 72,
        S: 83,
        ENTER: 13,
        SPACE_BAR: 32
    };
    // Only needed for some keys
    keysPressed = {
        38: false,
        39: false,
        40: false,
        37: false
    };

    hoveredTile : number[];

    constructor() {
        // Start listening for various kinds of user input
        this.initMapPanning();
        this.initUnitActions();
        this.initUnitIcons();
        this.initHoverTile();
        this.initMapClick();
        this.initGameActions();
    }

    // Every function in Controller should check this and see if user input is allowed. If the AI is
    // moving or a battle is occurring, then no.
    preventUserInput() {
        if (game.activeBattle) {
            return true;
        }

        if (game.turnID !== config.PLAYER_ID) {
            return true;
        }

        return false;
    }

    initMapPanning() {
        document.addEventListener("keydown", function (e : KeyboardEvent) {
            if (this.preventUserInput()) { return; }

            if (e.keyCode in this.keysPressed) {
                this.keysPressed[e.keyCode] = true;

                // Panning viewport based on keyboard arrows
                if (this.keysPressed[this.KEYS.UP]) {
                    mapUI.Y = mapUI.Y - 20;
                }
                if (this.keysPressed[this.KEYS.RIGHT]) {
                    mapUI.X = mapUI.X + 20;
                }
                if (this.keysPressed[this.KEYS.DOWN]) {
                    mapUI.Y = mapUI.Y + 20;
                }
                if (this.keysPressed[this.KEYS.LEFT]) {
                    mapUI.X = mapUI.X - 20;
                }

                mapUI.render();
            }
        }.bind(this));

        document.addEventListener("keyup", function (e : KeyboardEvent) {
            if (this.preventUserInput()) { return; }

            if (e.keyCode in this.keysPressed) {
                this.keysPressed[e.keyCode] = false;
            }
        }.bind(this));
    }

    initUnitActions() {
        document.addEventListener("keydown", function (e : KeyboardEvent) {
            var activeUnit : Units.UnitOrGroup;

            if (this.preventUserInput()) { return; }

            // Active unit stuff
            if (game.activeUnit) {
                activeUnit = game.activeUnit;

                // Unit movement
                if (e.keyCode === this.KEYS.NUMPAD_1) {
                    activeUnit.move("SW");
                } else if (e.keyCode === this.KEYS.NUMPAD_2) {
                    activeUnit.move("S");
                } else if (e.keyCode === this.KEYS.NUMPAD_3) {
                    activeUnit.move("SE");
                } else if (e.keyCode === this.KEYS.NUMPAD_4) {
                    activeUnit.move("W");
                } else if (e.keyCode === this.KEYS.NUMPAD_6) {
                    activeUnit.move("E");
                } else if (e.keyCode === this.KEYS.NUMPAD_7) {
                    activeUnit.move("NW");
                } else if (e.keyCode === this.KEYS.NUMPAD_8) {
                    activeUnit.move("N");
                } else if (e.keyCode === this.KEYS.NUMPAD_9) {
                    activeUnit.move("NE");
                }

                // Center on active unit
                if (e.keyCode === this.KEYS.C) {
                    mapUI.goToCoords(activeUnit.coords)
                }

                // Unit-specific actions, might not always apply
                if (e.keyCode === this.KEYS.F) {
                    if (activeUnit.actions.indexOf("fortify") >= 0) {
                        activeUnit.fortify();
                    } else if (activeUnit.actions.indexOf("wake") >= 0) {
                        activeUnit.wake();
                    }
                } else if (e.keyCode === this.KEYS.H) {
                    if (activeUnit.actions.indexOf("fortifyUntilHealed") >= 0) {
                        activeUnit.fortifyUntilHealed();
                    }
                } else if (e.keyCode === this.KEYS.SPACE_BAR && activeUnit.actions.indexOf("skipTurn") >= 0) {
                    activeUnit.skipTurn();
                } else if (e.keyCode === this.KEYS.G && activeUnit.actions.indexOf("goTo") >= 0) {
                    this.initPathFindingSearch(this.hoveredTile, {el: mapUI.canvas, event: "mousedown"});
                }
            }
        }.bind(this));

        // Unit movement with right click
        window.addEventListener("contextmenu", function (e : MouseEvent) {
            e.preventDefault();
        });

        // Right click path finding
        mapUI.canvas.addEventListener("mousedown", function (e : MouseEvent) {
            var coords : number[];

            if (this.preventUserInput()) { return; }

            if (e.button === 2 && game.activeUnit && !mapUI.pathFindingSearch) { // Right click only! Active unit only! But not if Go To mode is already active
                e.preventDefault();

                // Find path to clicked tile
                coords = mapUI.pixelsToCoords(e.layerX, e.layerY);

                // If click doesn't start on map, ignore it
                if (!game.map.validCoords(coords)) {
                    return;
                }

                this.initPathFindingSearch(coords, {el: document, event: "mouseup"});
            }
        }.bind(this));

        // Actions bar at the bottom
        chromeUI.elBottomActions.addEventListener("click", function (e : MouseEvent) {
            var el;

            if (this.preventUserInput()) { return; }

            el = <HTMLElement> e.target;
            if (el && el.dataset.action) {
                e.preventDefault();
                game.activeUnit[el.dataset.action](el.dataset.arg);
                chromeUI.onHoverAction(); // Reset hover display, since stuff might have changed
            }
        }.bind(this));
        chromeUI.elBottomActions.addEventListener("mouseover", function (e : MouseEvent) {
            var el;

            if (this.preventUserInput()) { return; }

            el = <HTMLElement> e.target;
            if (el && el.dataset.action) {
                e.preventDefault();
                chromeUI.onHoverAction(el.dataset.action, el.dataset.arg);
            }
        }.bind(this));
        chromeUI.elBottomActions.addEventListener("mouseout", function (e : MouseEvent) {
            var el;

            if (this.preventUserInput()) { return; }

            el = <HTMLElement> e.target;
            if (el && el.dataset.action) {
                e.preventDefault();
                
                chromeUI.onHoverAction();
            }
        }.bind(this));
    }

    // Handles path finding search for "Go To" button, "G" and "Right Click"
    // setPathOn is the event to listen on for actually starting the unit on the selected path. So
    // for right click and hold, it's "mouseup".
    initPathFindingSearch(coords : number[], setPathOn : {el; event : string;}) {
        var mouseMoveWhileDown : (e : MouseEvent) => void, setPath : (e : MouseEvent) => void;

        // Don't activate twice
        if (mapUI.pathFindingSearch) { return; }

        game.map.pathFinding(game.activeUnit, coords);

        // Let mapUI know that we're searching for paths, so it doesn't draw any others (like current paths)
        mapUI.pathFindingSearch = true;

        // Disable normal left click actions until pathFinding is done
        mapUI.canvas.removeEventListener("mousedown", this.leftClickOnMap.bind(this));

        // Find paths to hovered tile as button remains down
        mouseMoveWhileDown = function (e : MouseEvent) {
            var coordsNew : number[];

            coordsNew = mapUI.pixelsToCoords(e.layerX, e.layerY);

            if (!coordsNew) {
                // Delete currently displayed path
                coords = null;
                game.map.pathFinding();
            } else if (!coords || (coords[0] !== coordsNew[0] || coords[1] !== coordsNew[1])) {
                coords = coordsNew;
                game.map.pathFinding(game.activeUnit, coords);
            }
        };
        mapUI.canvas.addEventListener("mousemove", mouseMoveWhileDown);

        // Move unit to the tile hovered over when the setPathOn event occurs
        setPath = function (e : MouseEvent) {
            var coordsNew : number[];

            e.preventDefault();

            mapUI.pathFindingSearch = false;

            // Only update coordinates if the target is the map (i.e. not minimap, action buttons, etc, which would have different coordinates)
            if (e.target === mapUI.canvas) {
                coordsNew = mapUI.pixelsToCoords(e.layerX, e.layerY);
            }

            // Don't need to render map here at all (like by calling game.map.pathFinding)
            // because that'll happen in game.activeUnit.initiatePath no matter what

            if (coordsNew && (!coords || (coords[0] !== coordsNew[0] || coords[1] !== coordsNew[1]))) {
                coords = coordsNew;
            }

            if (game.activeUnit) {
                game.activeUnit.initiatePath(coords); // Set unit on path
            }

            mapUI.canvas.removeEventListener("mousemove", mouseMoveWhileDown);
            setPathOn.el.removeEventListener(setPathOn.event, setPath);

            // Re-enable normal left click functions
            mapUI.canvas.addEventListener("mousedown", this.leftClickOnMap.bind(this));
        }.bind(this);
        setPathOn.el.addEventListener(setPathOn.event, setPath);
    }

    initHoverTile() {
        this.hoveredTile = [-1, -1]; // Dummy value for out of map

        mapUI.canvas.addEventListener("mousemove", function (e : MouseEvent) {
            var coords : number[];

            coords = mapUI.pixelsToCoords(e.layerX, e.layerY);

            if (coords) {
                // Over a tile
                if (coords[0] !== this.hoveredTile[0] || coords[1] !== this.hoveredTile[1]) {
                    // Only update if new tile
                    this.hoveredTile = coords;
                    chromeUI.onHoverTile(game.getTile(this.hoveredTile));
                }
            } else {
                // Not over tile, over some other part of the canvas
                this.hoveredTile = [-1, -1];
                chromeUI.onHoverTile();
            }
        }.bind(this));
        mapUI.canvas.addEventListener("mouseout", function (e : MouseEvent) {
            this.hoveredTile = [-1, -1];
            chromeUI.onHoverTile();
        }.bind(this));
    }

    private leftClickOnMap (e : MouseEvent) {
        var i : number, coords : number[], currentMetric : number, maxMetric : number, unit, units : Units.Unit[];

        if (this.preventUserInput()) { return; }

        if (e.button === 0) { // Left click only!
            coords = mapUI.pixelsToCoords(e.layerX, e.layerY);

            if (game.map.validCoords(coords)) {
                units = game.getTile(coords).units;

                // Find the strongest unit with moves left
                maxMetric = -Infinity;
                for (i = 0; i < units.length; i++) {
                     // Sort by criteria: 1. if active already; 2. if currentMovement > 0; 3. currentStrength
                    currentMetric = units[i].currentStrength;
                    if (units[i].currentMovement > 0) { currentMetric += 100; }
                    if (units[i].active || (units[i].group && units[i].group.active)) { currentMetric += 1000; }

                    if (currentMetric > maxMetric && units[i].owner === config.PLAYER_ID) { // Only select user's units
                        unit = units[i];
                        maxMetric = currentMetric;
                    }
                }

                if (unit) {
                    if (e.altKey) { // In GNOME, alt+click is captured for window dragging, but alt+ctrl+click works for this
                        // Create group of all units on tile with moves and activate it
                        Units.addUnitsToNewGroup(config.PLAYER_ID, units);
                    } else if (e.ctrlKey) {
                        // Create group of all units on tile with moves and same type as top unit and activate it
                        Units.addUnitsWithTypeToNewGroup(config.PLAYER_ID, units, unit.type);
                    } else {
                        // Normal left click: select top unit or group
                        if (unit.group) {
                            unit.group.activate(false);
                        } else {
                            unit.activate(false);
                        }
                    }
                } else {
                    // None of the user's units are on this tile, so pan to it
                    // This is disabled for three reasons:
                    // 1. It's generally not that useful
                    // 2. BUG where Go To mode inappropriately activates this
                    // 3. BUG where clicks on transparent chrome inappropriately activate this
//                    mapUI.goToCoords(coords);
                }
            }
        }
    }

    // if one of your units is on the clicked tile, activate it and DO NOT CENTER THE MAP
    // if one of your units is not on the clicked tile, center the map
    initMapClick() {
        mapUI.canvas.addEventListener("click", this.leftClickOnMap.bind(this));

        mapUI.miniCanvas.addEventListener("mousedown", function (e : MouseEvent) {
            var coords : number[], miniMapPan : (e : MouseEvent) => void, miniMapPanStop : (e : MouseEvent) => void;

            if (this.preventUserInput()) { return; }

            if (e.button === 0) { // Left click only!
                e.preventDefault();

                coords = mapUI.miniPixelsToCoords(e.layerX, e.layerY);

                if (game.map.validCoords(coords)) {
                    mapUI.goToCoords(coords);
                }

                // Pan as click is held and mouse is moved
                miniMapPan = function (e : MouseEvent) {
                    var coords : number[];

                    coords = mapUI.miniPixelsToCoords(e.layerX, e.layerY);

                    if (game.map.validCoords(coords)) {
                        mapUI.goToCoords(coords);
                    }
                };
                mapUI.miniCanvas.addEventListener("mousemove", miniMapPan);

                // Stop panning when mouse click ends
                miniMapPanStop = function (e : MouseEvent) {
                    mapUI.miniCanvas.removeEventListener("mousemove", miniMapPan);
                    document.removeEventListener("mouseup", miniMapPanStop);
                };
                document.addEventListener("mouseup", miniMapPanStop);
            }
        }.bind(this));
    }

    initGameActions() {
        document.addEventListener("keydown", function (e : KeyboardEvent) {
            if (this.preventUserInput()) { return; }

            if (e.keyCode === this.KEYS.ENTER) {
                if (game.turnID === config.PLAYER_ID && !game.moveUnits()) {
                    game.nextPlayer();
                }
            }
        }.bind(this));
    }

    initUnitIcons() {
        // Unit icons at the bottom
        chromeUI.elBottomUnits.addEventListener("click", function (e : MouseEvent) {
            var activeUnit : Units.Unit, activeGroup : Units.Group, clickedId : number, clickedOwner : number, clickedSid : number, el : any, i : number, newGroup : Units.Group, newUnits : Units.Unit[], units : Units.Unit[], type : string;

            if (this.preventUserInput()) { return; }

            el = <HTMLElement> e.target;
            el = <any> el.parentNode;
            if (el && el.dataset.id) {
                e.preventDefault();

                // Metadata from clicked icon
                clickedId = parseInt(el.dataset.id, 10);
                clickedOwner = parseInt(el.dataset.owner, 10);
                clickedSid = el.dataset.gid !== undefined ? parseInt(el.dataset.gid, 10) : null;

                // Only continue if clicked unit belongs to player
                if (clickedOwner !== config.PLAYER_ID) {
                    return;
                }

                // Sanity check, could happen due to fast clicking
                if (!game.activeUnit) {
                    return;
                }

                // List of all units on the tile
                units = game.getTile(game.activeUnit.coords).units;

                // Handle all the different key modifiers
                if (e.altKey) { // In GNOME, alt+click is captured for window dragging, but alt+ctrl+click works for this
                    Units.addUnitsToNewGroup(clickedOwner, units);
                } else if (e.ctrlKey && e.shiftKey) {
                    type = game.units[clickedOwner][clickedId].type;

                    if (game.activeUnit instanceof Units.Unit) {
                        // Individual unit is active
                        // Create a group with the active unit and all units of the clicked type with currentMovement > 0

                        activeUnit = <Units.Unit> game.activeUnit; // So TypeScript knows it's not a group


                        // Find all units of type
                        newUnits = [activeUnit];
                        units.forEach(function (unit) {
                            if (unit.currentMovement > 0 && unit.type === type && unit.id !== activeUnit.id) { // Skip activeUnit!
                                newUnits.push(unit);

                                // Remove from current group, if it exists
                                if (unit.group) {
                                    unit.group.remove(unit.id, false);
                                }
                            }
                        });

                        // New group with units of type and activeUnit
                        newGroup = new Units.Group(clickedOwner, newUnits);
                        newGroup.activate(false);
                    } else if (game.activeUnit instanceof Units.Group) {
                        // Unit group is active
                        // Add all units of the clicked type with currentMovement > 0 to that group

                        activeGroup = <Units.Group> game.activeUnit; // So TypeScript knows it's not an individual unit

                        // Find units of type that aren't already in group
                        newUnits = [];
                        units.forEach(function (unit) {
                            if (unit.currentMovement > 0 && unit.type === type && (!unit.group || unit.group.id !== activeGroup.id)) {
                                newUnits.push(unit);

                                // Remove from current group, if it exists
                                if (unit.group) {
                                    unit.group.remove(unit.id, false);
                                }
                            }
                        });

                        if (newUnits.length > 0) {
                            activeGroup.add(newUnits);

                            // Redraw everything, since there is no Unit.activate call here to do that otherwise
                            chromeUI.onUnitActivated();
                            mapUI.render();
                        }
                    } else {
                        // No unit active (like if they all got separateed above)
                        newGroup = new Units.Group(clickedOwner, newUnits);
                        newGroup.activate(false);
                    }
                } else if (e.ctrlKey) {
                    Units.addUnitsWithTypeToNewGroup(clickedOwner, units, game.units[clickedOwner][clickedId].type);
                } else if (e.shiftKey) {
                    if (game.activeUnit instanceof Units.Unit) {
                        // Individual unit is active
                        if (game.activeUnit.id !== clickedId) {
                            // If clicked unit is not the active unit, add it to a new group with clicked unit
                            newGroup = new Units.Group(clickedOwner, [<Units.Unit> game.activeUnit, game.units[clickedOwner][clickedId]]);
                            newGroup.activate(false);
                        }
                    } else if (game.activeUnit instanceof Units.Group) {
                        activeGroup = <Units.Group> game.activeUnit; // So TypeScript knows it's not an individual unit
                        // Unit group is active
                        if (activeGroup === game.units[clickedOwner][clickedId].group) {
                            // Clicked unit is in the active group, remove it from that group
                            activeGroup.remove(clickedId);
                        } else {
                            // Clicked unit is not in the active group, add it to that group
                            activeGroup.add([game.units[clickedOwner][clickedId]]);
                        }
                        // Redraw everything, since there is no Unit.activate call here to do that otherwise
                        chromeUI.onUnitActivated();
                        mapUI.render();
                    }
                } else {
                    if (clickedSid !== null) {
                        // Clicked unit is in a group
                        if (game.activeUnit.id === clickedSid) {
                            // Clicked unit is member of active group, so separate it and activate clicked unit
                            game.groups[clickedOwner][clickedSid].separate(false);
                            game.units[clickedOwner][clickedId].activate(false);
                        } else {
                            // Clicked unit is in an inactive group, so activate the group
                            game.groups[clickedOwner][clickedSid].activate(false);
                        }
                    } else {
                        // Clicked unit is not in group, so just activate it
                        game.units[clickedOwner][clickedId].activate(false);
                    }
                }
            }
        }.bind(this));
        chromeUI.elBottomUnits.addEventListener("mouseover", function (e : MouseEvent) {
            var el;

            el = <HTMLElement> e.target;
            el = <any> el.parentNode;
            if (el && el.dataset.id) {
                e.preventDefault();
                chromeUI.onHoverUnitIcon(parseInt(el.dataset.owner, 10), parseInt(el.dataset.id, 10));
            }
        });
        chromeUI.elBottomUnits.addEventListener("mouseout", function (e : MouseEvent) {
            var el;

            el = <HTMLElement> e.target;
            el = <any> el.parentNode;
            if (el && el.dataset.id) {
                e.preventDefault();
                chromeUI.onHoverUnitIcon();
            }
        });
    }
}