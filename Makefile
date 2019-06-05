MAKE="make"
TAR="tar"
GREP="grep"
NODE="node"
NPM="npm"
TMPDIR := $(shell mktemp -d)

all: dirs npm_dependencies min-html min-css min-js genkey

min-html:
	$(NODE) $(CURDIR)/node_modules/.bin/html-minifier --collapse-whitespace --decode-entities --remove-attribute-quotes --remove-comments \
	$(CURDIR)/static/index.html \
	> $(CURDIR)/build/index.html
	$(NODE) $(CURDIR)/node_modules/.bin/html-minifier --collapse-whitespace --decode-entities --remove-attribute-quotes --remove-comments \
	$(CURDIR)/static/login.html \
	> $(CURDIR)/build/login.html
	$(NODE) $(CURDIR)/node_modules/.bin/html-minifier --collapse-whitespace --decode-entities --remove-attribute-quotes --remove-comments \
	$(CURDIR)/static/register.html \
	> $(CURDIR)/build/register.html
	
min-css:
	$(NODE) $(CURDIR)/node_modules/.bin/purifycss -w ['.list-unstyled', '.media', '.my-*', '.rounded', '.small', '.message', '.media-body', '.mt-*', '.mb-*'] -m \
	$(CURDIR)/node_modules/bootstrap/dist/css/bootstrap.css \
	$(CURDIR)/static/own.css \
	$(CURDIR)/static/index.html \
	$(CURDIR)/static/login.html \
	> $(CURDIR)/build/all.min.css

min-js:
	$(NODE) $(CURDIR)/node_modules/.bin/uglifyjs --compress --mangle -- \
	$(CURDIR)/node_modules/jquery/dist/jquery.slim.js \
	$(CURDIR)/static/own.js \
	> $(CURDIR)/build/all.min.js

genkey:
ifeq (,$(wildcard $(CURDIR)/private/key.json))
	printf '{\n	"key": "'$$(openssl rand -base64 45)'"\n}\n' >> $(CURDIR)/private/key.json
endif
	
clean:
	rm -rvf $(CURDIR)/node_modules 
	rm -rvf $(CURDIR)/build
	
npm_dependencies:
	$(NPM) install

dirs:
	mkdir -p $(CURDIR)/build $(CURDIR)/private
