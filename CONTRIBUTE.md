MTW - Contributing
==================

This package uses `jspm` to manage modules for javascript.

To have a development copy of the code, clone the repository. Run the following commands in your cloned directory.

```shell
npm install -g jspm gulp gulp-cli jsdoc karma-cli
npm install
jspm install
```

**If above commands throw an exception, then** 

LINUX/UNIX : Run the commands as 'super user'/'root'

WINDOWS : Run cmd prompt as Administrator


**Install the extension in Chrome as an unpacked extension**

Extensions can be loaded in unpacked mode by following the following steps:

1) Visit chrome://extensions
2) Enable Developer mode by ticking the checkbox in the upper-right corner.
3) Click on the "Load unpacked extension..." button.
4) Select the `./MindTheWord/dist/` directory.

**To start the chrome application**, run

```shell
gulp watch
```

**To generate docs**, run

```shell
jsdoc -c config.json
```

**To build deployment copy**
```shell
gulp build
```
This will generate a dist folder containing deployment code.

Content Script: `mtw.js`
Event Page (background script): `eventPage.js`

**To submit Merge Request**

The extension builds from the ```lib/``` folder. Please make changes in the ```lib/``` folder only while submitting the Merge Request. Any changes in the ```dist/``` folder are to be unstaged before submitting the Merge Request.
