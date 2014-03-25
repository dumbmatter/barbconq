describe("A test suite", function() {
    it('should fail', function() {
        game = new Game(1, 20, 40);
console.log(game);
        expect(document.getElementById("map")).not.toBeNull();
    });
});