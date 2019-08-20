# Mind The Word

### Student - Harkishen Singh

### Links
1. Project: https://gitlab.com/aossie/MindTheWord/
2. Web Store: https://chrome.google.com/webstore/detail/mind-the-word/fabjlaokbhaoehejcoblhahcekmogbom

## General
The aim of this project was:

    1. provide automated testing for the entire project covering all the functional and non-functional aspects

    2. help the user to maintain a check on his learning activities and to help him understand how the extension is helping him in his language learning skills

    3. improving and widening the scope of quizzing to provide a real-world experience to practice his overall language skills

    4. make quizzing personalized and specific to the user so that he or she could work on the respective weak points and concentrate on the same

    5. help the user to understand the implementation of the extension in live web-pages by representing a working model of the project on a sample HTML snippet

    6. provide support for other browser platforms like Firefox and Edge

    7. integrate with chrome omnibox and improve the interactiveness of the project

## Technical aspect

Mind The Word has been developed using the following technologies:

1. AngularJS
2. VanillaJS including XMLHttpRequests
3. chrome APIs
4. Visualisation of activity using [D3.js](https://d3js.org/)
5. Gulp (for building the project)
6. JSPM (package management)
7. Selenium (automated testing)
8. Docker (testing environment)

Related Gitlab Issue GSoC-2019 [Links](https://gitlab.com/aossie/MindTheWord/issues?scope=all&utf8=%E2%9C%93&state=all&label_name[]=GSOC-Harkishen-Singh)

Functional implementation of the project
### 1. Add support for continous integration and test the overall project both functionally as well as non-functionally

Mind The Word is completely based on web technologies. Hence, in order to carry out end-to-end testing, [selenium-webdriver](https://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/) was used along with chromium browser to carry out basic tests in a fedora environment inside a [docker container](https://hub.docker.com/r/harkishen/mindtheword_ci_image_fedora). For visualisation of tests, we have used mochawesome as a reporter. [Explanatory Link](https://drive.google.com/file/d/1t-EuxekZ9A-nyQpZ9kpsVAJy9rV0_b4d/view).

### 2. Activity Progress Chart

Mind The Word is well suited for long usage, as functionalities like word frequency and quizzing (proposed) become personalized after a span of time. Users who have been learning through the extension for a long time might find it difficult to keep a track of their learning activities.

The entire implementation has been done in pure javascript with the help of [D3.js](https://d3js.org/).

**Explanation**

A record of the -
1. websites visited
2. words translated in each website
3. words marked as learnt, saved
4. number of quizzes taken and its performance

could be easily saved as an each day activity. These stats is represented dynamically on
a chart as bubbles.
The bubble representation is carried out on a scale where the x-axis represents the day
and date, and the y-axis represents the scale of words translated and accordingly, the Bubbles (with colored border) have been adjusted on the y-scale along with an appropriate color scale, denoting the translations done on that day. Note that this representation of value on y-scale is a dependent value, meaning the heights or value of y-axis for the earlier bubbles (or past days) are adjusted according to each day’s performance. This is similar to GitHub where the number of commits made is represented by the intensity of color scale which is dependent on the color assigned to the day having maximum contributions. 

The representation is an unshaded area connected graph, with dots or bubbles and
straight lines using d3.js to visualize the entire data. The entire representation is 
x-axis scrollable and has a fixed domain of 30 days.

### 3.  Improved and Personalised Quizzing

Quizzing in this project has been personalized by using [Anki's method](https://apps.ankiweb.net/) ([explanatory video](https://youtu.be/QS2G-k2hQyg)) and by implementing [Sørensen–Dice's coefficient](https://en.wikipedia.org/wiki/S%C3%B8rensen%E2%80%93Dice_coefficient). Further, the quizzing scope has been widened to all spheres of language usage - writing, oral (using [speechSynthesis w3c](https://w3c.github.io/speech-api/speechapi.html#tts-section)) and aural (using [speechRecognition w3c](https://w3c.github.io/speech-api/speechapi.html#speechreco-section)).

### 4. Example explanation of translation settings

At the top of the translation.html page, a dummy HTML snippet as an
example layout is provided, as an exact mimic of the webpage during the browsing.
The translated sentence in accordance with the configuration he selected, appears in the snippet after rendering the text throught the `ContentScript` class. This gives him the exact clear picture of how the actual translation will look like during the browsing. This includes the use of hover cards and its entire functionality, color combination, on the page quiz and other relevant details.

### 5. Support for other browser platforms

Inorder to provide support to other browser platforms and re-use the existing code for chrome, we have used a gulp task to convert the extension source code from chrome to the web-extension standards by replacing `chrome` with `browser` and providing necessary changes to the `manifest` as per the browser.

## Link to Merge Requests

1. [!405 CI-based Unit and End to End Testing](https://gitlab.com/aossie/MindTheWord/merge_requests/405)

2. [!406 Adds support for mochawesome as reporter in mocha](https://gitlab.com/aossie/MindTheWord/merge_requests/406)

3. [!407 Adds support for Activity progress chart](https://gitlab.com/aossie/MindTheWord/merge_requests/407)

4. [!408 Adds support for quizzing in sentences and paragraphs along with multi-section view for quizzing](https://gitlab.com/aossie/MindTheWord/merge_requests/408)

5. [!409 Adds support for oral quiz](https://gitlab.com/aossie/MindTheWord/merge_requests/409)

6. [!410 Adds support for aural practice in quizzing](https://gitlab.com/aossie/MindTheWord/merge_requests/410)

7. [!411 Adds support for Anki like quizzing](https://gitlab.com/aossie/MindTheWord/merge_requests/411)

8. [!412 Adds support for personalised quizzing using Machine Learning](https://gitlab.com/aossie/MindTheWord/merge_requests/412) *(unmerged)*

9. [!413 Adds support for Explanation of Translation Settings via HTML snippet](https://gitlab.com/aossie/MindTheWord/merge_requests/413)

10. [!414 Adds support for Firefox](https://gitlab.com/aossie/MindTheWord/merge_requests/414) *(unmerged)*

11. [!415 Instructions for porting the Mind The Word extension to the Edge platform](https://gitlab.com/aossie/MindTheWord/merge_requests/415) *(unmerged)*

12. [!416 Support for Omnibox operations in Mind The Word](https://gitlab.com/aossie/MindTheWord/merge_requests/416)

13. [!417 Adds support for interactive extension icon](https://gitlab.com/aossie/MindTheWord/merge_requests/417)

14. [!419 Documenting the code](https://gitlab.com/aossie/MindTheWord/merge_requests/419)
