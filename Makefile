MAKE="make"
TAR="tar"
GREP="grep"
NODE="node"
NPM="npm"
TMPDIR := $(shell mktemp -d)

all: builddirs npm_dependencies htmlmin min-css min-js

htmlmin:
	$(NODE) $(CURDIR)/node_modules/.bin/html-minifier --collapse-whitespace --decode-entities --remove-attribute-quotes --remove-comments \
	$(CURDIR)/static/index.html \
	> $(CURDIR)/build/index.html
	
min-css:
	$(NODE) $(CURDIR)/node_modules/.bin/purifycss -w ['.list-unstyled', '.media', '.my-*', '.rounded', '.small', '.message', '.media-body', '.mt-*', '.mb-*'] -m \
	$(CURDIR)/node_modules/bootstrap/dist/css/bootstrap.css \
	$(CURDIR)/static/own.css \
	$(CURDIR)/static/index.html \
	> $(CURDIR)/build/all.min.css

min-js:
	$(NODE) $(CURDIR)/node_modules/.bin/uglifyjs --compress --mangle -- \
	$(CURDIR)/node_modules/jquery/dist/jquery.slim.js \
	$(CURDIR)/static/own.js \
	> $(CURDIR)/build/all.min.js
	
clean:
	rm -rvf $(CURDIR)/node_modules 
	rm -rvf $(CURDIR)/build
	
npm_dependencies:
	$(NPM) install

builddirs:
	mkdir -p $(CURDIR)/build