// Random - utility functions like Python's random module

module Random {
    export function choice(x : any[]) {
        return x[Math.floor(Math.random() * x.length)];
    }
}