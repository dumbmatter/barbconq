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
}