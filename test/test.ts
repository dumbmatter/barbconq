/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />

import chai = require('chai');
var assert = chai.assert;

describe('User Model Unit Tests:', () => {
    describe('2 + 4', () => {
        it('should be 6', () => {
            assert.equal(2+4, 6);
        });

        it('should not be 7', () => {
            assert.equal(3+4, 7);
        });
    });
});