# Barbarian Conquest

A 2X (eXplore and eXterminate) minigame built on a partial web-based port of
Civilization 4.

Your goal is to capture the barbarian city. Use your scout, warrior, archer,
chariot, spearman, and axeman to explore the island, find the barbarian city,
and conquer it.

Copyright (C) Jeremy Scheff. All rights reserved.

* Email: jdscheff@gmail.com

* Website: http://barbconq.com/

* Development website: https://github.com/dumbmatter/barbconq

## License

This program is free software: you can redistribute it and/or modify it under
the terms of the **GNU Affero General Public License version 3** as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE.  See the GNU Affero General Public License for more
details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.

## Installing and Running

If you just want to play the game, go to http://barbconq.com/

If you want to hack at the code, it's pretty straightforward. Open `index.html`
in your browser and you are playing the game. The game is written in
[TypeScript]http://www.typescriptlang.org/), so you have to compile it to see
the result of any changes you make. To do this, first install TypeScript
(version 1.0.1 is the latest at the time I'm writing this):

    $ npm install -g typescript

Then use TypeScript to compile barbconq by running the Makefile from this
folder:

    $ make

After that, you should see your changes reflected after reloading `index.html`.

For production, I use [UglifyJS](https://github.com/mishoo/UglifyJS). You can
install it with:

    $ npm install -g uglify-js

Then, after compiling the TypeScript code above, minify with this command:

    $ make minify

There are some unit tests related to ensuring that the battle odds are accurate
and exactly match those from Civilization 4 (it would be nice to have more
tests...). To run the tests:

    $ make check

## Long-Term Plans

Would it be possible to completely clone Civilization 4 in TypeScript? If that
question intrigues you, please get in touch with me.
