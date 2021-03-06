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

    var factorialCache : number[] = [];
    export function factorial(n : number) : number {
        if (n === 0 || n === 1) {
            return 1;
        }
        if (factorialCache[n] > 0) {
            return factorialCache[n];
        }

        factorialCache[n] = n * factorial(n - 1)

        return factorialCache[n];
    }

    // Binomial distribution
   export function binomialProb(n, k, p) {
        return factorial(n) / (factorial(k) * factorial(n - k)) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    };
}