# target: all - Default target. Currently just compiles the TypeScript files into JavaScript.
all: clean build-js

# target: minify - Minify CSS and JS and put it in the gen folder for production.
minify: minify-js

# target: check - Run unit tests
check:
	./node_modules/karma/bin/karma start karma.conf.js

# target: install-npm-deps - Install npm dependencies to node_modules
install-npm-deps:
	sudo npm install # Not sure why sudo is needed, but it is on my computer


### Targets below here are generally just called from the targets above.

# target: build-js - Compiles the TypeScript files into JavaScript
build-js:
	tsc --target ES5 --sourcemap --out gen/app.js ts/app.ts

# target: minify-js - Minify and overwrite compiled TypeScript output
minify-js:
	# cd is needed because uglifyjs fails to propagate TS sourcemaps when called on files in subfolders
	cd gen; uglifyjs app.js --source-map app.js.map --in-source-map app.js.map -o app.js

# target: clean - Delete files generated by `make all`.
clean:
	rm -f gen/app.js
	rm -f gen/app.js.map



###

.PHONY: all build-js clean