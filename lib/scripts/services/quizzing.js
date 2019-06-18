import { YandexTranslate } from '../services/yandexTranslate';
import { AzureTranslate } from '../services/azureTranslate';
import { GoogleTranslate } from '../services/googleTranslate';
import { testConnection } from '../mtw';

export class QuizzingSentence {
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
  }

  setHeads() {
    this.$scope.srcLang = this.srcLang;
    this.$scope.targetLang = this.targetLang;
  }

  createQuestions() {
    chrome.storage.local.get('quizQuestionsStore', res => {
      res = res.quizQuestionsStore;
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
