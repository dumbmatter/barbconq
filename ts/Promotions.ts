interface Promotion {
    name : string;
    abbrev : string;

    // Bonuses given by the promotion
    bonuses : {[name : string] : number};

    // Categories of units (like "melee", "archery", etc) that can get this promotion
    categories : string[];

    // Prerequisites for the promotion.
    // Each entry in the array contains an array of requirements that enable the promotion.
    // So "and" prereqs can be encoded like:
    //     [["combat3", "militaryScience"]]
    // and "or" prereqs can be encoded like:
    //     [["combat2"], ["drill2"]]
    prereqs : string[][];
};

interface Promotions {
    [slug : string] : Promotion;
};

// IMPORTANT:
// When adding a promotion here, make sure you also add support for it in ChromeUI.bonusText,
// Combat.Battle.getAppliedBonuses, Combat.Battle.applyBonuses, and anywhere else that the
// effect of the bonus is applied.
var promotions : Promotions = {
    cityRaider1: {
        name: "City Raider I",
        abbrev: "CR1",
        bonuses: {
            cityAttack: 20
        },
        categories: ["melee", "siege", "armored"],
        prereqs: []
    },
    cityRaider2: {
        name: "City Raider II",
        abbrev: "CR1",
        bonuses: {
            cityAttack: 25
        },
        categories: ["melee", "siege", "armored"],
        prereqs: [["cityRaider1"]]
    },
    cityRaider3: {
        name: "City Raider III",
        abbrev: "CR3",
        bonuses: {
            cityAttack: 30,
            gunpowder: 10
        },
        categories: ["melee", "siege", "armored"],
        prereqs: [["cityRaider2"]]
    },
    cityGarrison1: {
        name: "City Garrison I",
        abbrev: "CG1",
        bonuses: {
            cityDefense: 20
        },
        categories: ["archery", "gunpowder"],
        prereqs: []
    },
    cityGarrison2: {
        name: "City Garrison II",
        abbrev: "CG2",
        bonuses: {
            cityDefense: 25
        },
        categories: ["archery", "gunpowder"],
        prereqs: [["cityGarrison1"]]
    },
    cityGarrison3: {
        name: "City Garrison III",
        abbrev: "CG3",
        bonuses: {
            cityDefense: 30,
            melee: 10
        },
        categories: ["archery", "gunpowder"],
        prereqs: [["cityGarrison2"]]
    },
    combat1: {
        name: "Combat I",
        abbrev: "Co1",
        bonuses: {
            strength: 10
        },
        categories: ["recon", "archery", "mounted", "melee", "gunpowder", "armored", "helicopter", "naval", "air"],
        prereqs: []
    },
    combat2: {
        name: "Combat II",
        abbrev: "Co2",
        bonuses: {
            strength: 10
        },
        categories: ["recon", "archery", "mounted", "melee", "gunpowder", "armored", "helicopter", "naval", "air"],
        prereqs: [["combat1"]]
    },
    combat3: {
        name: "Combat III",
        abbrev: "Co3",
        bonuses: {
            strength: 10
        },
        categories: ["recon", "archery", "mounted", "melee", "gunpowder", "armored", "helicopter", "naval", "air"],
        prereqs: [["combat2"]]
    },
    combat4: {
        name: "Combat IV",
        abbrev: "Co4",
        bonuses: {
            strength: 10
        },
        categories: ["recon", "archery", "mounted", "melee", "gunpowder", "armored", "helicopter", "naval", "air"],
        prereqs: [["combat3"]]
    },
    combat5: {
        name: "Combat V",
        abbrev: "Co5",
        bonuses: {
            strength: 10
        },
        categories: ["recon", "archery", "mounted", "melee", "gunpowder", "armored", "helicopter", "naval", "air"],
        prereqs: [["combat4"]]
    },
    cover: {
        name: "Cover",
        abbrev: "Cov",
        bonuses: {
            archery: 25
        },
        categories: ["archery", "melee", "gunpowder"],
        prereqs: [["combat1"], ["drill1"]]
    },
    drill1: {
        name: "Drill I",
        abbrev: "Dr1",
        bonuses: {
            firstStrikeChances: 1
        },
        categories: ["archery", "siege", "armored", "helicopter", "naval"],
        prereqs: [[]]
    },
    drill2: {
        name: "Drill II",
        abbrev: "Dr2",
        bonuses: {
            firstStrikes: 1
        },
        categories: ["archery", "siege", "armored", "helicopter", "naval"],
        prereqs: [["drill1"]]
    },
    drill3: {
        name: "Drill III",
        abbrev: "Dr3",
        bonuses: {
            firstStrikeChances: 2
        },
        categories: ["archery", "siege", "armored", "helicopter", "naval"],
        prereqs: [["drill2"]]
    },
    drill4: {
        name: "Drill IV",
        abbrev: "Dr4",
        bonuses: {
            firstStrikes: 2,
            mounted: 10
        },
        categories: ["archery", "siege", "armored", "helicopter", "naval"],
        prereqs: [["drill3"]]
    },
    flanking1: {
        name: "Flanking I",
        abbrev: "Fl1",
        bonuses: {
            retreat: 10
        },
        categories: ["mounted", "armored", "helicopter", "naval"],
        prereqs: [[]]
    },
    flanking2: {
        name: "Flanking II",
        abbrev: "Fl2",
        bonuses: {
            retreat: 10
        },
        categories: ["mounted", "armored", "helicopter", "naval"],
        prereqs: [["flanking1"]]
    },
    formation: {
        name: "Formation",
        abbrev: "Frm",
        bonuses: {
            mounted: 25
        },
        categories: ["archery", "mounted", "melee", "gunpowder"],
        prereqs: [["combat2"], ["drill2"]]
    },
    guerilla1: {
        name: "Guerilla I",
        abbrev: "Gr1",
        bonuses: {
            hillsDefense: 20
        },
        categories: ["recon", "archery", "gunpowder"],
        prereqs: []
    },
    guerilla2: {
        name: "Guerilla II",
        abbrev: "Gr2",
        bonuses: {
            hillsDefense: 30,
            doubleMovementHills: 1
        },
        categories: ["recon", "archery", "gunpowder", "melee"],
        prereqs: [["guerilla1"]]
    },
    guerilla3: {
        name: "Guerilla III",
        abbrev: "Gr3",
        bonuses: {
            hillsAttack: 25,
            retreat: 50
        },
        categories: ["archery", "gunpowder", "melee"],
        prereqs: [["guerilla2"]]
    },
    mobility: {
        name: "Mobility",
        abbrev: "Mbl",
        bonuses: {
            mobility: 1
        },
        categories: ["mounted", "armored"],
        prereqs: [["flanking2"]]
    },
    sentry: {
        name: "Sentry",
        abbrev: "Snt",
        bonuses: {
            visibilityRange: 1
        },
        categories: ["recon", "mounted", "helicopter", "naval"],
        prereqs: [["combat3"], ["flanking1"]]
    },
    shock: {
        name: "Shock",
        abbrev: "Shk",
        bonuses: {
            melee: 25
        },
        categories: ["archery", "mounted", "melee", "siege"],
        prereqs: [["combat1"], ["drill1"]]
    },
    woodsman1: {
        name: "Woodsman I",
        abbrev: "Wd1",
        bonuses: {
            forestDefense: 20
        },
        categories: ["recon", "melee", "gunpowder"],
        prereqs: []
    },
    woodsman2: {
        name: "Woodsman II",
        abbrev: "Wd2",
        bonuses: {
            forestDefense: 30,
            doubleMovementForest: 1
        },
        categories: ["recon", "melee", "gunpowder"],
        prereqs: [["woodsman1"]]
    },
    woodsman3: {
        name: "Woodsman III",
        abbrev: "Wd3",
        bonuses: {
            firstStrikes: 2,
            forestAttack: 25
        },
        categories: ["melee", "gunpowder"],
        prereqs: [["woodsman2"]]
    }
};