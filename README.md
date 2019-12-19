MindTheWord
===========
An extension for Google Chrome that helps people learn new languages while they browse the web.

MindTheWord helps the user to easily learn the vocabulary of a new language
while browsing pages in his native language. In every web page visited, it
randomly translates a few words into the language he would like to learn.
Since only a few words are translated, it is easy to infer their meaning from
the context.
Read more in [Description.md](Description.md).

## Installation:

### Install through Chrome Web Store
[![https://chrome.google.com/webstore/detail/mind-the-word/fabjlaokbhaoehejcoblhahcekmogbom](https://developer.chrome.com/webstore/images/ChromeWebStore_BadgeWBorder_v2_340x96.png)](https://chrome.google.com/webstore/detail/mind-the-word/fabjlaokbhaoehejcoblhahcekmogbom)

### or Load by Yourself
1. Install [node.js](https://nodejs.org), [git](https://git-scm.com)
2. Clone the repository
	`git clone https://gitlab.com/aossie/MindTheWord.git`
3. Change directory to MindTheWord
	`cd MindTheWord`
4. `npm install -g jspm gulp`
5. `npm install -g minimatch@3.0.2`
6. `npm install`
7. `jspm install bootstrap=npm:bootstrap`
8. `jspm install`
9. `gulp build`
10. Loading in the respective browsers

_Note: The above installation instructions may require the superuser permissions, and hence `sudo`. You might also consider installing `gulp` locally as the latest versions require to be installed to the local repo._

#### Loading in Google Chrome
 - Open Chrome and go to `chrome://extensions`
 - Enable "Developer mode"
 - Drag  `dist/chrome` folder into the browser or click "Load unpacked extension" and select the `dist/chrome` folder.

 Note: Recent versions of chrome _(precisely after chrome 73)_ have shown CORS error in the development environment. This can be overcome by launching chrome with `google-chrome --user-data-dir --disable-web-security`. If using chromium or any other distro of chrome, use the same flags. Please ensure that while using this flag, all instances of chrome have to be closed.

#### Loading in Firefox
 - Open Firefox and type `about: debugging` in the address bar
 - Click on `Load Temporary Add-on...`
 - Navigate and select the `dist/firefox` folder.

#### Loading in Edge
 - Download and install the [Microsoft Extension Toolkit](https://www.microsoft.com/en-in/p/microsoft-edge-extension-toolkit/9nblggh4txvb)
  - Follow the [Explanatory video](https://youtu.be/d0dHdOfjhRA) to port the Chrome extension from `dist/chrome` into an `Edge` supported extension


Testing
-------
1. `npm install -g mocha`
2. `npm install selenium-webdriver mocha chromedriver chromium`
3. **[optional]** `export YANDEX_KEY="<yandex translation key>"`
4. `npm test`

### Visualisation of tests [optional]

5. `npm install mochawesome`
6. `npm run visualise`

### Using virtual display [optional]
Install [xvfb](https://www.x.org/releases/X11R7.6/doc/man/man1/Xvfb.1.xhtml) display

`xvfb-run -s "-screen 0 1920x1080x16" -a npm test`


How to Contribute
-------------
If you would like to contribute to the development of this extension, please [contact the developers](http://www.aossie.org/#contact).
In order to get started with the contribution, please refer to
[Contribute.md](https://gitlab.com/aossie/MindTheWord/blob/master/CONTRIBUTE.md)

* [Google Summer of Code](GoogleSummerOfCode.md) grants are available every year. If you would like to apply, it is never too early to [contact us](http://www.aossie.org/#contact).

Licenses
--------

* GNU-GPL-3.0

* CC-By-NC-ND [![License](https://i.creativecommons.org/l/by-nc-nd/4.0/88x31.png)](http://creativecommons.org/licenses/by-nc-nd/4.0/)
