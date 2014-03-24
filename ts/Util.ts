// Random - utility functions like Python's random module

module Random {
    export function choice<T>(x : T[]) : T {
        return x[Math.floor(Math.random() * x.length)];
    }
}

// Util - general utility functions

module Util {
    export function round(value : number, precision : number = 0) : string {
        return value.toFixed(precision);
    }

    // Bound x between min and max
    export function bound(x : number, min : number, max : number) : number {
        if (x > max) {
            return max;
        }
        if (x < min) {
            return min;
        }
        return x;
    }

    /**
     * Clones an object.
     * 
     * Taken from http://stackoverflow.com/a/3284324/786644
     */
    export function deepCopy(obj) {
        var key, retVal;

        if (typeof obj !== "object" || obj === null) { return obj; }
        if (obj.constructor === RegExp) { return obj; }

        retVal = new obj.constructor();
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                retVal[key] = deepCopy(obj[key]);
            }
        }
        return retVal;
    }
}