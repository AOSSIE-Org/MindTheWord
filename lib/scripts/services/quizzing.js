import { YandexTranslate } from '../services/yandexTranslate';
import { AzureTranslate } from '../services/azureTranslate';
import { GoogleTranslate } from '../services/googleTranslate';
import { testConnection } from '../mtw';
import { webSpeechLanguages } from '../utils/languages';
import { ResponsiveVoiceLanguages } from './responsiveVoiceLanguages';
import * as lang from '../utils/languages';

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

    console.log(lang.azureLanguages);
    let iterator = lang.azureLanguages;
    for (let l in iterator) {
      console.log(l+ ' '+ iterator[l]);
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
    chrome.storage.local.get('quizQuestionsStore', res => {
      res = res.quizQuestionsStore;
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
        let processedText = this.processText(res[minID]['text']);
        this.getTMaps(processedText).then((tMap, rej) => {
          let originalText = res[minID]['text'], c = 0;
          for (let originalWord in tMap) {
            c++;
            originalText = originalText.replace(
              ' '+ originalWord +' ',
              ' <span class="quiz-sentence-questions-class" translated-word="'+ tMap[originalWord] +'" original-word="'+ originalWord +'"></span> '
              + '<sub>( '+ originalWord +' ) </sub> '
            );
            if (c === Object.keys(tMap).length) {
              let ele = document.createElement('p');
              ele.innerHTML = originalText;
              document.getElementById(this.parentElementID).appendChild(ele);
              res[minID]['shown']++;
              this.assignDropDownLists(tMap);
              chrome.storage.local.set({ 'quizQuestionsStore': res });
              let doneButton = document.createElement('button');
              doneButton.className = 'btn btn-success';
              doneButton.innerHTML = 'Done';
              doneButton.style.marginRight = '90%';
              document.getElementById(this.parentElementID).appendChild(doneButton);
              doneButton.onclick = function() {
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

  setQuestions(q) {
    this.questions = q;
    let len = Object.keys(q).length;
    let questionNumber = Math.floor(Math.random() * len),
      c = 0,
      question = '',
      ele = document.getElementById('quiz-oral-question'),
      answer = '';
    ele.innerHTML = '';
    for (let i in q) {
      if (c === questionNumber) {
        question = i;
        answer = q[i];
      } else {
        c++;
      }
    }
    ele.innerHTML = question;
    document.getElementById('quiz-oral-question-translation').innerHTML = 'Translated Word: ' + answer;
    ele.setAttribute('answer', answer);
    ele.style.fontWeight = 'bold';
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

  setQuestionWords(q) {
    if (Object.keys(q).length !== 0) {
      this.$scope.disableAuralQuiz = false;
      this.questions = q;
      let len = Object.keys(q).length;
      let questionNumber = Math.floor(Math.random() * len),
        c = 0,
        question = '',
        ele = document.getElementById('quiz-aural-question'),
        answer = '';
      ele.innerHTML = '';
      for (let i in q) {
        if (c === questionNumber) {
          question = i;
          answer = q[i];
          break;
        } else {
          c++;
        }
      }
      ele.innerHTML = question;
      ele.setAttribute('answer', answer);
      this.setOptionsWords(q, len, questionNumber, answer);
    } else {
      this.$scope.disableAuralQuiz = true;
    }
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
      let  divElem = document.createElement('span');
      divElem.style.marginLeft = '12%';
      divElem.style.padding = '7px 7px 7px 0px';
      divElem.style.borderRadius = '8px';
      let option = document.createElement('span'),
        img = document.createElement('img');
      option.innerHTML = (i + 1) + '. ' + optionsArr[i];
      option.style.marginLeft = '1%';
      option.onmouseover = () => {
        divElem.style.backgroundColor = '#DCEDC8';
      };
      option.onmouseout = () => {
        divElem.style.backgroundColor = '#fff';
      };
      if (i === correctAnswerIndex) {
        option.onclick = () => {
          document.getElementById('__ans_img_' + optionsArr[i]).style.display = 'inline';
          divElem.style.backgroundColor = 'rgb(85, 187, 56)';
          divElem.style.color = '#fff';
          divElem.style.fontWeight = 'bold';
          option.onmouseout = () => {};
          option.onmouseover = () => {};
        };
        img.src = this.icons[1];
        img.style.height = '25px';
        img.style.display = 'none';
        img.style.paddingTop = '4px';
        img.id = '__ans_img_' + optionsArr[i];
        img.style.marginLeft = '10px';
        divElem.appendChild(option);
        divElem.appendChild(img);
        parentElement.appendChild(divElem);
      } else {
        option.onclick = () => {
          document.getElementById('__ans_img_' + optionsArr[i]).style.display = 'inline';
          divElem.style.backgroundColor = 'rgb(210, 0, 38)';
          divElem.style.color = '#fff';
          divElem.style.fontWeight = 'bold';
          option.onmouseout = () => {};
          option.onmouseover = () => {};
          // chBox.checked = true;
        };
        img.src = this.icons[0];
        img.style.height = '20px';
        img.style.display = 'none';
        img.id = '__ans_img_' + optionsArr[i];
        img.style.marginLeft = '10px';
        divElem.appendChild(option);
        divElem.appendChild(img);
        parentElement.appendChild(divElem);
      }
    }
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
