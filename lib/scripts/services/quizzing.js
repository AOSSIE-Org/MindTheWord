import { YandexTranslate } from '../services/yandexTranslate';
import { AzureTranslate } from '../services/azureTranslate';
import { GoogleTranslate } from '../services/googleTranslate';
import { testConnection } from '../mtw';
import { webSpeechLanguages } from '../utils/languages';
import { ResponsiveVoiceLanguages } from './responsiveVoiceLanguages';
import * as lang from '../utils/languages';
import { compareTwoStrings, findBestMatch } from '../utils/matchStrings';

export class QuizzingSentence { // servers as a base class for other quizzing types as well
  constructor(parentElementID, srcLang, targetLang, $scope, translator, yandexKey, googleKey, azureKey) {
    this.parentElementID = parentElementID;
    this.srcLang = srcLang;
    this.targetLang = targetLang;
    this.$scope = $scope;
    this.translator = translator;
    this.yandexKey = yandexKey;
    this.googleKey = googleKey;
    this.azureKey = azureKey;
    this.icons = [];
    this.icons.push(chrome.extension.getURL('assets/img/cross_red.png'));
    this.icons.push(chrome.extension.getURL('assets/img/tick_green.png'));
    this.langObject = null;
  }

  combineLanguages () {
    let temp = {};

    let iterator = lang.azureLanguages;
    for (let l in iterator) {
      temp[l] = iterator[l];
    }

    iterator = lang.googleLanguages;
    for (let l in iterator) {
      temp[l] = iterator[l];
    }

    iterator = lang.yandexLanguages;
    for (let l in iterator) {
      temp[l] = iterator[l];
    }

    return temp;
  }

  setHeads() {
    let lang = this.combineLanguages();
    for (let l in lang) {
      if (lang[l] === this.srcLang) {
        this.$scope.srcLang = l;
      }
      if (lang[l] === this.targetLang) {
        this.$scope.targetLang = l;
      }
    }
  }

  createQuestions() {
    chrome.storage.local.get(['quizQuestionsStore', 'anki'], resStore => {
      let res = resStore.quizQuestionsStore,
        Anki = JSON.parse(resStore.anki);
      let toList = questionList => {
        let temp = [];
        for (let i in questionList) {
          temp.push(questionList[i]['text']);
        }
        return temp;
      };
      let deleteNode = n => {
        for (let i in res) {
          let text = res[i]['text'];
          if (text === n) {
            delete res[i];
          }
        }
      };
      if (Object.keys(res).length === 0) {
        document.getElementById('quiz-sentence-question').innerHTML = 'No data found. Please use the extension in order to practice the quiz.';
      } else {
        let min = 10000, minID = '';
        for (let keys in res) {
          if (res[keys]['shown'] < min) {
            minID = keys;
            min = res[keys]['shown'];
          }
        }
        let quizCount = parseInt(Anki['quiz-sentence']['count']),
          originalQuestion = '',
          originalText = '';
        let temp = minID;
        try {
          if (quizCount / 5 === 1) {
            originalText = Anki['quiz-sentence']['medium'][Object.keys(Anki['quiz-sentence']['medium'])[0]];
            minID = Object.keys(Anki['quiz-sentence']['medium'])[0];
            quizCount = -1;
          } else if (quizCount / 2 === 1) {
            originalText = Anki['quiz-sentence']['hard'][Object.keys(Anki['quiz-sentence']['hard'])[0]];
            minID = Object.keys(Anki['quiz-sentence']['hard'])[0];
          } else {
            originalText = generateQuestionsMatching(toList(res), Anki, 'sentence');
            deleteNode(originalText);
          }
        } catch(e) {
          minID = temp;
          originalText = res[minID]['text'];
        }

        if (originalText === undefined || originalText === '') {
          // for case in which either of the medium or hard level is void of questions at its respective count
          minID = temp;
          originalText = res[minID]['text'];
        }
        let processedText = this.processText(originalText);
        this.getTMaps(processedText).then((tMap, rej) => {
          document.getElementById(this.parentElementID).innerHTML = '';
          let c = 0;
          originalQuestion = originalText;
          for (let originalWord in tMap) {
            c++;
            originalText = originalText.replace(
              ' '+ originalWord +' ',
              ' <span class="quiz-sentence-questions-class" translated-word="'+ tMap[originalWord] +'" original-word="'+ originalWord +'"></span> '
              + '<sub>( '+ originalWord +' ) </sub> '
            );
            if (c === Object.keys(tMap).length) { // execute at last iteration
              let ele = document.createElement('p');
              ele.innerHTML = originalText;
              ele.id = 'quiz-sentence-question-anki-id';
              ele.setAttribute('is-anki', 'false');
              ele.setAttribute('anki-ques-id', minID);
              document.getElementById(this.parentElementID).appendChild(ele);
              res[minID]['shown']++;
              this.assignDropDownLists(tMap);
              chrome.storage.local.set({ 'quizQuestionsStore': res });
              let doneButton = document.createElement('button');
              doneButton.className = 'btn btn-success';
              doneButton.innerHTML = 'Done';
              doneButton.style.marginRight = '90%';
              document.getElementById(this.parentElementID).appendChild(doneButton);
              var self = this;
              doneButton.onclick = () => {

                // anki support
                let SelectRatingAnki = document.createElement('p');
                SelectRatingAnki.textContent = 'Please select the difficulty level of the quiz: ';
                let optionsSelect = document.createElement('select');
                optionsSelect.style.backgroundColor = '#fff';
                optionsSelect.style.borderRadius = '5px';
                optionsSelect.id = 'anki-quiz-sentence-rating';
                let op1 = document.createElement('option'),
                  op2 = document.createElement('option'),
                  op3 = document.createElement('option');
                op1.text = 'easy'; op1.value = 'easy';
                op2.text = 'medium'; op2.value = 'medium';
                op3.text = 'hard'; op3.value = 'hard';
                optionsSelect.appendChild(op1);
                optionsSelect.appendChild(op2);
                optionsSelect.appendChild(op3);

                SelectRatingAnki.appendChild(optionsSelect);
                document.getElementById(self.parentElementID).appendChild(SelectRatingAnki);
                let nextButton = document.createElement('button');
                nextButton.textContent = 'Next';
                nextButton.className = 'btn btn-success';
                nextButton.onclick = () => {
                  let ankiLevel = document.getElementById('anki-quiz-sentence-rating').value;
                  // delete old records
                  delete Anki['quiz-sentence']['medium'][minID];
                  delete Anki['quiz-sentence']['hard'][minID];

                  if (ankiLevel !== 'easy') {
                    Anki['quiz-sentence'][ankiLevel][minID] = originalQuestion;
                    Anki['quiz-sentence']['count'] = parseInt(quizCount) + 1;
                  }
                  chrome.storage.local.set({ 'anki': JSON.stringify(Anki) });
                  self.createQuestions();
                };
                document.getElementById(self.parentElementID).appendChild(nextButton);

                let optionDOMsParent = document.getElementsByClassName('quiz-sentence-questions-class'),
                  optionsDOM = document.getElementsByClassName('quiz-sentence-question-options');
                for (let i = 0, j = 0; i < optionDOMsParent.length && j < optionsDOM.length; i++, j++) {
                  let element = optionDOMsParent[i],
                    eleOption = optionsDOM[j];
                  let translatedWord = element.getAttribute('translated-word'),
                    elementValue = eleOption.value;
                  if (translatedWord === elementValue) {
                    document.getElementById('quiz-' + element.getAttribute('original-word') + '-tick').style.display = 'inline';
                  } else {
                    document.getElementById('quiz-' + element.getAttribute('original-word') + '-cross').style.display = 'inline';
                  }
                }
              };
            }
          }
        });
      }
    });
  }

  getTranslator() {
    let translatorObject = {};
    switch (this.translator) {
      case 'Yandex':
        translatorObject = new YandexTranslate(this.yandexKey, this.srcLang, this.targetLang);
        break;
      case 'Azure':
        translatorObject = new AzureTranslate(this.azureKey, this.srcLang, this.targetLang);
        break;
      case 'Google':
        translatorObject = new GoogleTranslate(this.googleKey, this.srcLang, this.targetLang);
        break;
      default:
        console.error('No such translator supported');
    }
    return translatorObject;
  }

  getTMaps(maps) {
    return new Promise((resolve, reject) => {
      var translator = this.getTranslator();
      testConnection(translator.testurl);
      translator.getTranslations(maps)
        .then((tMap) => {
          resolve(tMap);
        })
        .catch((e) => {
          reject('[MTW]', e);
        });
    });
  }

  processText(text) {
    let arr = text.split('.'), list = {};
    for (let sent in arr) {
      let wordsArr = arr[sent].split(' ');
      let len = wordsArr.length;
      let pos1 = Math.floor(Math.random() * len),
        pos2 = Math.floor(Math.random() * len);
      list[wordsArr[pos1]] = pos1;
      list[wordsArr[pos2]] = pos2;
    }
    return list;
  }

  assignDropDownLists(tMap) {
    let eles = document.getElementsByClassName('quiz-sentence-questions-class');
    for(let ele = 0; ele < eles.length; ele++) {
      let element = eles[ele];
      let originalWord = eles[ele].getAttribute('original-word');
      let selectElement = document.createElement('select');
      selectElement.className = 'quiz-sentence-question-options';
      for (let keys in tMap) {
        let option = document.createElement('option');
        option.value = tMap[keys];
        option.text = tMap[keys];
        selectElement.appendChild(option);
        option = null;
      }
      selectElement.value = '';
      try {
        element.appendChild(selectElement);
        let imgElementr = document.createElement('img');
        imgElementr.src = this.icons[0];
        imgElementr.style.height = '20px';
        imgElementr.style.display = 'none';
        imgElementr.id = 'quiz-' + originalWord + '-cross';
        let imgElementt = document.createElement('img');
        imgElementt.src = this.icons[1];
        imgElementt.style.height = '25px';
        imgElementt.style.display = 'none';
        imgElementt.id = 'quiz-' + originalWord + '-tick';
        element.appendChild(imgElementr);
        element.appendChild(imgElementt);
      } catch(e) {}
    }
  }
}

export class QuizzingOral extends QuizzingSentence {
  constructor(parentElementID, srcLang, targetLang, $scope, translator, yandexKey, googleKey, azureKey) {
    super(parentElementID, srcLang, targetLang, $scope, translator, yandexKey, googleKey, azureKey);
    this.setHeads();
    this.speech = new webkitSpeechRecognition();
    this.iteration = 0;
    this.messageUserSpeech = document.getElementById('messageUserSpeechID');
    this.speech.continous = true;
    this.speech.lang = 'en-IN';
    this.supportedLanguages = webSpeechLanguages;
    this.count = 0;
    this.eleList = document.createElement('select');
    this.eleList.style.borderRadius = '6px';
    this.eleList.style.backgroundColor = '#fff';
    this.eleList.style.margin = '10px';
    this.questions;

    this.eleList.onchange = () => {
      this.speech.lang = this.eleList.value;
    };

  }

  setQuestions() {
    chrome.storage.local.get(['anki', 'translatedWordsForQuiz'], res => {
      this.messageUserSpeech.value = '';
      let ankiStore = JSON.parse(res.anki),
        q = JSON.parse(res.translatedWordsForQuiz);
      let len = Object.keys(q).length;
      let Anki = ankiStore['quiz-oral'],
        question = '',
        answer = '',
        ele = document.getElementById('quiz-oral-question'),
        count = parseInt(ankiStore['quiz-oral']['count']);
      ele.innerHTML = '';

      if (count / 5 === 1) {
        question = Object.keys(Anki['medium'])[0];
        answer = Anki['medium'][question];
        count = 0;
      } else if (count / 2 === 1) {
        question = Object.keys(Anki['hard'])[0];
        answer = Anki['hard'][question];
      }
      if (question === undefined || answer === undefined || question === '' || answer === '') {
        let match = generateQuestionsMatching(q, ankiStore, 'oral');
        if (match !== '') {
          question = match.question;
          answer = match.answer;
        } else {
          let questionNumber = Math.floor(Math.random() * len),
            c = 0;
          for (let i in q) {
            if (c === questionNumber) {
              question = i;
              answer = q[i];
              break;
            } else {
              c++;
            }
          }
        }
      }
      ele.innerHTML = question;
      document.getElementById('quiz-oral-question-translation').innerHTML = 'Translated Word: ' + answer;
      count = parseInt(count) + 1;
      ankiStore['quiz-oral']['count'] = count;

      chrome.storage.local.set({ 'anki': JSON.stringify(ankiStore) });
      ele.setAttribute('answer', answer);
      ele.style.fontWeight = 'bold';
    });
  }

  initMessageDiv() {
    this.messageUserSpeech = document.getElementById('messageUserSpeechID');
    this.messageUserSpeech.value = '';
    for (let opt in webSpeechLanguages) {
      let eleOption = document.createElement('option');
      eleOption.value = opt;
      eleOption.text = webSpeechLanguages[opt];
      eleOption.id = '__' + opt;
      this.eleList.appendChild(eleOption);
    }
    document.getElementById('quiz-oral-lang-div').appendChild(this.eleList);

    // functionality for done button
    let self = this;
    document.getElementById('quiz-oral-done').addEventListener('click', () => {
      document.getElementById('quiz-oral-result-show').style.display = 'inline';

      // anki support
      let SelectRatingAnki = document.createElement('p');
      SelectRatingAnki.textContent = 'Please select the difficulty level of the quiz: ';
      SelectRatingAnki.style.margin = '10px';
      let optionsSelect = document.createElement('select');
      optionsSelect.style.backgroundColor = '#fff';
      optionsSelect.style.borderRadius = '5px';
      optionsSelect.id = 'anki-quiz-sentence-rating';
      let op1 = document.createElement('option'),
        op2 = document.createElement('option'),
        op3 = document.createElement('option');
      op1.text = 'easy'; op1.value = 'easy';
      op2.text = 'medium'; op2.value = 'medium';
      op3.text = 'hard'; op3.value = 'hard';
      optionsSelect.appendChild(op1);
      optionsSelect.appendChild(op2);
      optionsSelect.appendChild(op3);

      SelectRatingAnki.id = 'quiz-oral-select-rating';
      SelectRatingAnki.appendChild(optionsSelect);
      document.getElementById('quiz-oral-area').appendChild(SelectRatingAnki);

      // set anki questions
      let nextButton = document.createElement('button');
      nextButton.className = 'btn btn-success';
      nextButton.textContent = 'Next';
      nextButton.id = 'quiz-oral-next-id';

      nextButton.onclick = () => {
        document.getElementById('quiz-oral-result-show').style.display = 'none';
        let ankiLevel = document.getElementById('anki-quiz-sentence-rating').value;
        chrome.storage.local.get('anki', res => {
          let Anki = JSON.parse(res.anki),
            answerQuiz = document.getElementById('quiz-oral-question').getAttribute('answer'),
            question = document.getElementById('quiz-oral-question').innerText;

          // delete old records
          delete Anki['quiz-oral']['medium'][question];
          delete Anki['quiz-oral']['hard'][question];

          if (ankiLevel !== 'easy') {
            Anki['quiz-oral'][ankiLevel][question] = answerQuiz;
          }
          chrome.storage.local.set({ 'anki': JSON.stringify(Anki) });
          document.getElementById('quiz-oral-area').removeChild(nextButton);
          document.getElementById('quiz-oral-area').removeChild(SelectRatingAnki);

          self.setQuestions();
        });
      };
      document.getElementById('quiz-oral-area').appendChild(nextButton);
    });
  }

  checkAnswer(answer) {
    let originalAnswer = document.getElementById('quiz-oral-question').getAttribute('answer');
    if (answer === originalAnswer) {
      return true;
    }
    return false;
  }

  iterateOralCount(val) {
    this.count += val;
    if (this.count % 2 !== 0) {
      this.messageUserSpeech.value = '';
      this.speech.start();
      let messageArea = this.messageUserSpeech;
      this.speech.onresult = function (eve) {
        if (eve.results.length > 0) { // marks presence of transcripted words
          messageArea.value += eve.results[eve.results.length - 1][0].transcript;
        }
      };
      return true;
    }
    this.speech.stop();
    return false;
  }
}

export class QuizzingAural extends QuizzingSentence {
  constructor(parentElementID, srcLang, targetLang, $scope, translator, yandexKey, googleKey, azureKey) {
    super(parentElementID, srcLang, targetLang, $scope, translator, yandexKey, googleKey, azureKey);
    this.setHeads();
  }

  setQuestionWords() {
    chrome.storage.local.get(['anki', 'translatedWordsForQuiz'], res => {
      let q = JSON.parse(res.translatedWordsForQuiz),
        ankiStore = JSON.parse(res.anki);
      let Anki = ankiStore['quiz-aural'];
      if (Object.keys(q).length !== 0) {
        this.$scope.disableAuralQuiz = false;
        this.questions = q;
        let len = Object.keys(q).length;
        let question = '',
          answer = '',
          questionNumber = 0,
          ele = document.getElementById('quiz-aural-question'),
          count = parseInt(ankiStore['quiz-aural']['count']);
        ele.innerHTML = '';

        if (count / 5 === 1) {
          question = Object.keys(Anki['medium'])[0];
          answer = Anki['medium'][question];
          count = 0;
        } else if (count / 2 === 1) {
          question = Object.keys(Anki['hard'])[0];
          answer = Anki['hard'][question];
        }
        if (question === undefined || answer === undefined || question === '' || answer === '') {
          let match = generateQuestionsMatching(q, ankiStore, 'aural');
          if (match !== '') {
            question = match.question;
            answer = match.answer;
          } else {
            let questionNumber = Math.floor(Math.random() * len),
              c = 0;
            for (let i in q) {
              if (c === questionNumber) {
                question = i;
                answer = q[i];
                break;
              } else {
                c++;
              }
            }
          }
        }

        ele.innerHTML = question;
        ele.setAttribute('answer', answer);
        count = parseInt(count) + 1;
        ankiStore['quiz-aural']['count'] = count;

        chrome.storage.local.set({ 'anki': JSON.stringify(ankiStore) });
        this.setOptionsWords(q, len, questionNumber, answer);
      } else {
        this.$scope.disableAuralQuiz = true;
      }
    });
  }

  setOptionsWords(q, len, exceptIndex, question) {
    const Options = 4;
    let correctAnswerIndex = Math.floor(Math.random() * Options),
      optionsArr = [];
    for (let i = 0; i < Options; i++) {
      let index;
      while (true) {
        index = Math.floor(Math.random() * len);
        if (index !== exceptIndex) {
          break;
        }
      }
      if (i === correctAnswerIndex) {
        optionsArr.push(question);
      } else {
        let c = 0;
        for (let j in q) {
          if (c === index) {
            optionsArr.push(q[j]);
            break;
          }
          c++;
        }
      }
    }
    // creating options DOMs
    let parentElement = document.getElementById('quiz-aural-options');
    parentElement.innerHTML = '';
    for (let i = 0; i < optionsArr.length; i++) {
      let chBox = document.createElement('input'),
        divElem = document.createElement('div');
      divElem.style.marginLeft = '2%';
      chBox.type = 'checkbox';
      chBox.id = '__ans_' + optionsArr[i];
      let option = document.createElement('span'),
        img = document.createElement('img');
      option.innerHTML = optionsArr[i];
      option.style.marginLeft = '1%';
      if (i === correctAnswerIndex) {
        chBox.onclick = () => {
          document.getElementById('__ans_img_' + optionsArr[i]).style.display = 'inline';
        };
        option.onclick = () => {
          document.getElementById('__ans_img_' + optionsArr[i]).style.display = 'inline';
          chBox.checked = true;
        };
        img.src = this.icons[1];
        img.style.height = '25px';
        img.style.display = 'none';
        img.id = '__ans_img_' + optionsArr[i];
        img.style.marginLeft = '10px';
        divElem.appendChild(chBox);
        divElem.appendChild(option);
        divElem.appendChild(img);
        parentElement.appendChild(divElem);
      } else {
        chBox.onclick = () => {
          document.getElementById('__ans_img_' + optionsArr[i]).style.display = 'inline';
        };
        option.onclick = () => {
          document.getElementById('__ans_img_' + optionsArr[i]).style.display = 'inline';
          chBox.checked = true;
        };
        img.src = this.icons[0];
        img.style.height = '20px';
        img.style.display = 'none';
        img.id = '__ans_img_' + optionsArr[i];
        img.style.marginLeft = '10px';
        divElem.appendChild(chBox);
        divElem.appendChild(option);
        divElem.appendChild(img);
        parentElement.appendChild(divElem);
      }
    }

    let doneButton = document.createElement('button');
    doneButton.className = 'btn btn-success';
    doneButton.id = 'quiz-aural-done';
    doneButton.textContent = 'Done';

    let self = this;
    doneButton.onclick = () => {
      // anki support
      let SelectRatingAnki = document.createElement('p');
      SelectRatingAnki.textContent = 'Please select the difficulty level of the quiz: ';
      SelectRatingAnki.style.margin = '10px';

      let optionsSelect = document.createElement('select');
      optionsSelect.style.backgroundColor = '#fff';
      optionsSelect.style.borderRadius = '5px';
      optionsSelect.id = 'anki-quiz-sentence-rating';

      let op1 = document.createElement('option'),
        op2 = document.createElement('option'),
        op3 = document.createElement('option');
      op1.text = 'easy'; op1.value = 'easy';
      op2.text = 'medium'; op2.value = 'medium';
      op3.text = 'hard'; op3.value = 'hard';
      optionsSelect.appendChild(op1);
      optionsSelect.appendChild(op2);
      optionsSelect.appendChild(op3);

      SelectRatingAnki.className = 'quiz-aural-select-rating';
      SelectRatingAnki.appendChild(optionsSelect);
      document.getElementById('quiz-aural-area').appendChild(SelectRatingAnki);

      // set anki questions
      let nextButton = document.createElement('button');
      nextButton.className = 'btn btn-success quiz-aural-next-class';
      nextButton.textContent = 'Next';

      nextButton.onclick = () => {
        document.getElementById('quiz-oral-result-show').style.display = 'none';
        let ankiLevel = document.getElementById('anki-quiz-sentence-rating').value;
        chrome.storage.local.get('anki', res => {
          let Anki = JSON.parse(res.anki),
            answerQuiz = document.getElementById('quiz-aural-question').getAttribute('answer'),
            question = document.getElementById('quiz-aural-question').innerText;

          // delete old records
          delete Anki['quiz-aural']['medium'][question];
          delete Anki['quiz-aural']['hard'][question];

          if (ankiLevel !== 'easy') {
            Anki['quiz-aural'][ankiLevel][question] = answerQuiz;
          }
          chrome.storage.local.set({ 'anki': JSON.stringify(Anki) });
          document.getElementById('quiz-aural-area').removeChild(nextButton);
          document.getElementById('quiz-aural-area').removeChild(SelectRatingAnki);

          self.setQuestionWords();
        });
        parentElement.removeChild(doneButton);
      };
      document.getElementById('quiz-aural-area').appendChild(nextButton);
    };
    parentElement.appendChild(doneButton);
  }

  playAudio(text, lang) {
    let speech = new SpeechSynthesisUtterance();
    speech.text = text;
    speech.rate = 0.8;
    let langs = speechSynthesis.getVoices();
    for (let x in langs) {
      if (langs[x].lang.includes(lang)) {
        speech.lang = langs[x].lang;
        speechSynthesis.speak(speech);
        break;
      }
    }
  }
}

function generateQuestionsMatching(questions, ankiStore, code) {
  var toList = (map) => {
    let temp = [];
    for (let i in map) {
      temp.push(i);
    }
    return temp;
  };
  var toListkeys = (map) => {
    let temp = [];
    for (let i in map) {
      temp.push(map[i]);
    }
    return temp;
  };
  var filterTarget = (t, list) => {
    for (let i in list) {
      if (list[i] === t) {
        list.splice(i, 1);
      }
    }
    return list;
  };
  switch (code) {
    case 'oral':
    case 'aural':
      code = 'quiz-' + code;
      let anki = ankiStore[code];
      if (Object.keys(anki['medium']).length > Object.keys(anki['hard']).length) {
        let list = toList(questions);
        try {
          if (Object.keys(anki['medium'])[0].length !== '') {
            let question = findBestMatch(Object.keys(anki['medium'])[0], filterTarget(Object.keys(anki['medium'])[0], list)).bestMatch.target;
            let answer = questions[question];
            delete questions[question];
            chrome.storage.local.set({ 'translatedWordsForQuiz': JSON.stringify(questions) });
            return {
              'question': question,
              'answer': answer
            };
          }
          else return '';
        } catch(e) {
          return '';
        }
      } else {
        let list = toList(questions);
        try {
          if (Object.keys(anki['hard'])[0].length !== '') {
            let question = findBestMatch(Object.keys(anki['hard'])[0], filterTarget(Object.keys(anki['hard'])[0], list)).bestMatch.target;
            let answer = questions[question];
            delete questions[question];
            chrome.storage.local.set({ 'translatedWordsForQuiz': JSON.stringify(questions) });
            return {
              'question': question,
              'answer': answer
            };
          }
          else return '';
        } catch(e) {
          return '';
        }
      }
      break;

    case 'sentence':
      code = 'quiz-' + code;
      anki = ankiStore[code];
      if (Object.keys(anki['medium']).length > Object.keys(anki['hard']).length) {
        let list = questions,
          listKeys = toListkeys(anki['medium']);
        try {
          if (Object.keys(anki['medium'])[0].length !== '') {
            return findBestMatch(anki['medium'][Object.keys(anki['medium'])[0]], filterTarget(
              anki['medium'][Object.keys(anki['medium'])[0]],
              list
            )).bestMatch.target;
          } else return '';
        } catch(e) {
          return '';
        }
      } else {
        let list = questions,
          listKeys = toListkeys(anki['hard']);
        try {
          if (Object.keys(anki['hard'])[0].length !== '') {
            return findBestMatch(anki['hard'][Object.keys(anki['hard'])[0]], filterTarget(
              anki['hard'][Object.keys(anki['hard'])[0]],
              list
            )).bestMatch.target;
          }
          else return '';
        } catch(e) {
          return '';
        }
      }
      break;
  }
}
