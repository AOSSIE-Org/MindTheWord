import { YandexTranslate } from './services/yandexTranslate';
import { AzureTranslate } from './services/azureTranslate';
import { GoogleTranslate } from './services/googleTranslate';
import { getCurrentMonth, getCurrentDay } from './utils/dateAndTimeHelpers';
import { yandexLanguages } from './utils/languages.js';
import { azureLanguages } from './utils/languages.js';
import { googleLanguages } from './utils/languages.js';
import { DictionaryObject } from './services/yandexDictionary';

import _ from 'lodash';


/** Class for content scriptcontroller */
export class ContentScript {
  /**
     * Initialize ContentScript object
     * @constructor
     */
  constructor() {
    this.srcLang = '';
    this.targetLang = '';
    this.ngramMin = 1;
    this.ngramMax = 1;
    this.tMap = {};
    this.filteredTMap = {};
    this.selectedRegion = {};
    this.countedWords = {};
    this.totalWordsLanguage = 0;
    this.finishTranslation = false;
    this.pageFirstLoad = true;
  }

  /**
     * Filter pre-processed DOMs
     */
  filterDoms() {
    var dom = this.allparagraphs,
      filteredDoms = [],
      safePermit = 3000, // higher than this would cause performance issues
      domLength = dom.length;
    var loopStart = domLength > safePermit ? domLength - safePermit : 0;
    for (let i = loopStart; i < domLength; i++) {  // execute last 3000 DOMs only.
      let e = dom[i].classList;
      if (!e.contains('mtwProcessed'))
        if (!e.contains('hc-preview') && !e.contains('hc-details')) {
          filteredDoms.push(dom[i]);
        }
    }
    this.allparagraphsFiltered = filteredDoms;
  }


  /**
     * Initializes parameters
     */
  initialize(res) {
    this.ngramMin = res.ngramMin;
    this.ngramMax = res.ngramMax;
    this.srcLang = res.sourceLanguage;
    this.cwAvailable = res.cwAvailable;
    this.cwMap = res.cwMap;
    this.targetLanguage = res.targetLanguage;
    this.userDefinedTranslations = JSON.parse(res.userDefinedTranslations);
    this.translationProbability = res.translationProbability;
    this.userBlacklistedWords = res.userBlacklistedWords;
    this.translator = res.translatorService;
    this.yandexTranslatorApiKey = res.yandexTranslatorApiKey;
    this.azureTranslatorApiKey = res.azureTranslatorApiKey;
    this.googleTranslatorApiKey = res.googleTranslatorApiKey;
    this.translated = true;
    this.learntWords = res.learntWords;
    this.userDefinedOnly = res.userDefinedOnly;
    this.useCommonWordsOnly = res.useCommonWordsOnly;
    this.stats = res.stats;
    this.wordToggles = res.wordToggles;
    this.oneWordTranslation = res.oneWordTranslation;
    this.detailsApiKey = res.detailsApiKey;
    this.optionalAPI = res.optionalAPI;
    this.allparagraphs = document.querySelectorAll('p,div,a');
    if (this.finishTranslation && !this.pageFirstLoad) {
      this.filterDoms();
    } else if (this.pageFirstLoad) { // prevent DOMFiltering on first load, to avoid content skips for non-lazy loading pages
      this.pageFirstLoad = false;
      this.allparagraphsFiltered = this.allparagraphs;
    }
    this.numberOfTranslatedWordsOnPage = 0;
    var check_array = [];
    for (var i = 0; i < this.allparagraphsFiltered.length; i++) {
      check_array.push(1);
    }
    this.check_array = check_array; // For checking if element has been processed
    this.custom_icon = []; // For storing image link for Hover-Card
    this.custom_icon.push(chrome.extension.getURL('assets/img/speak.png'));
    this.custom_icon.push(chrome.extension.getURL('assets/img/learnt.png'));
    this.custom_icon.push(chrome.extension.getURL('assets/img/visual.png'));
    this.custom_icon.push(chrome.extension.getURL('assets/img/info.png'));
    this.custom_icon.push(chrome.extension.getURL('assets/img/save.png'));
    this.custom_icon.push(chrome.extension.getURL('assets/img/blacklist.png'));
    // images for hover cards
    this.custom_icon.push(chrome.extension.getURL('assets/img/rare.png'));
    this.custom_icon.push(chrome.extension.getURL('assets/img/occasionally.png'));
    this.custom_icon.push(chrome.extension.getURL('assets/img/common.png'));
    this.custom_icon.push(chrome.extension.getURL('assets/img/tick_green.png'));
    this.custom_icon.push(chrome.extension.getURL('assets/img/cross_red.png'));
    this.custom_icon.push(chrome.extension.getURL('assets/img/more.png'));
    DictionaryObject.setValues(this.detailsApiKey, 'en');
    
  }

  /**
     * Loads data from storage and calls appropriate
     * functions as per the settings.
     */
  translate() {
    var countedWords = this.getAllWords(this.ngramMin, this.ngramMax);
    this.countedWords = countedWords;
    var filteredWords;
    if (this.userDefinedOnly === true) {
      filteredWords = this.filterToUserDefined(countedWords,
        this.translationProbability,
        this.userDefinedTranslations,
        this.userBlacklistedWords);
      let tMap = {};
      for (let word in filteredWords) {
        tMap[word] = this.userDefinedTranslations[word];
      }
      this.processTranslations(tMap, this.userDefinedTranslations);
    } else {
      if (this.cwAvailable === true && this.useCommonWordsOnly === true) {
        var filteredWords = this.filter(countedWords,
          this.translationProbability,
          this.userDefinedTranslations,
          this.userBlacklistedWords);
        var cwMatch = {};
        for (var i in filteredWords) {
          if (this.cwMap[i]) {
            cwMatch[i] = this.cwMap[i];
          }
        }
        this.processTranslations({}, this.userDefinedTranslations, cwMatch);
      } else if (this.cwAvailable === true) {
        this.fetchTranslations(countedWords);
      }  else {
        this.getCommonWords().then((cwList) => {
          if(cwList){
            var translator = this.getTranslator();
            testConnection(translator.testurl);
            translator.getTranslations(cwList)
              .then((tMap) => {
                this.cwMap = tMap;
                chrome.storage.local.set({ cwAvailable: true, cwMap: this.cwMap });
                this.cwAvailable = true;
                this.fetchTranslations(countedWords);
              })
              .catch((e) => {
                console.error('[MTW]', e);
                this.fetchTranslations(countedWords);
              });
          }
          else{
            this.fetchTranslations(countedWords);
          }
        })
          .catch((error) => {
            this.fetchTranslations(countedWords);
          });
      }
    }
  }

  /**
     * @param {Object} countedWords - all the words on the page
     */
  fetchTranslations(countedWords) {
    var filteredWords = this.filter(countedWords,
      this.translationProbability,
      this.userDefinedTranslations,
      this.userBlacklistedWords);
    var cwMatch = {};
    var cwNotMatch = {};
    for (var i in filteredWords) {
      if (this.cwMap[i]) {
        cwMatch[i] = this.cwMap[i];
      } else {
        cwNotMatch[i] = 1;
      }
    }
    var translator = this.getTranslator();
    testConnection(translator.testurl);
    translator.getTranslations(cwNotMatch)
      .then((tMap) => {
        this.processTranslations(tMap, this.userDefinedTranslations, cwMatch);
      })
      .catch((e) => {
        console.error('[MTW]', e);
      });
  }

  /**
     * Returns the current translator object.
     * @returns {Object} translatorObject corresponding to active translator
     */
  getTranslator() {
    let translatorObject = {};
    switch (this.translator) {
      case 'Yandex':
        translatorObject = new YandexTranslate(this.yandexTranslatorApiKey, this.srcLang, this.targetLanguage);
        break;
      case 'Azure':
        translatorObject = new AzureTranslate(this.azureTranslatorApiKey, this.srcLang, this.targetLanguage);
        break;
      case 'Google':
        translatorObject = new GoogleTranslate(this.googleTranslatorApiKey, this.srcLang, this.targetLanguage);
        break;
      default:
        console.error('No such translator supported');
    }
    return translatorObject;
  }

  /**
     * Returns the current translator object.
     * @param {String} src - source language
     * @param {String} target - target language
     * @returns {Object} translatorObject corresponding to active translator
     */
  getTranslatorInv(src, target) {
    let translatorObject = {};
    switch (this.translator) {
      case 'Yandex':
        translatorObject = new YandexTranslate(this.yandexTranslatorApiKey, src, target);
        break;
      case 'Bing':
        translatorObject = new BingTranslate(this.bingTranslatorApiKey, src, target);
        break;
      case 'Google':
        translatorObject = new GoogleTranslate(this.googleTranslatorApiKey, src, target);
        break;
      default:
        console.error('No such translator supported');
    }
    return translatorObject;
  }

  /**
     * Inject CSS file containing MTW styles into the page.
     * @param {string} cssStyle - stringified CSS style
     */
  injectCSS(cssStyle) {
    try {
      // insert MTW styles
      var style = document.createElement('link');
      style.rel = 'stylesheet';
      style.type = 'text/css';
      style.href = chrome.extension.getURL('/assets/css/MTWStyles.css');
      document.getElementsByTagName('head')[0].appendChild(style);

      // insert main mtwTranslatedWord stylesheet
      var mtwStyle = document.createElement('style');
      document.head.appendChild(mtwStyle);
      mtwStyle.sheet.insertRule('span.mtwTranslatedWord {' + cssStyle + '}', 0);

    } catch (e) {
      console.debug(e);
    }
  }

  getCommonWords(){
    var commonWordsURI = chrome.extension.getURL('./common/' + this.srcLang + '.json');
    return fetch(commonWordsURI)
      .then(function(result) {
        return result.json();
      })
      .then(function(result) {
        var cwList = {};
        for (var i in result.words) {
          cwList[result.words[i]] = 1;
        }
        return cwList;
      });
  }

  /**
     * Retrieve all the words from current page
     * @param {number} ngramMin - minimum ngram for translation
     * @param {number} ngramMax - maximum ngram for translation
     * @returns {Object} countedWords - object with word counts
     */
  getAllWords(ngramMin, ngramMax) {
    var countedWords = {};
    var j = 0;
    var paragraphs = [];
    for (var i = 0; i < this.allparagraphsFiltered.length; i++) {
      if (this.isInViewport(this.allparagraphsFiltered[i]) && this.check_array[i]
      && !this.allparagraphsFiltered[i].classList.contains('mtwProcessed')) {
        this.allparagraphsFiltered[i].className += ' mtwProcessed';
        paragraphs.push(this.allparagraphsFiltered[i]);
        this.check_array[i] = 0;
      }
    }
    this.paragraphs = paragraphs;
    for (var i = 0; i < paragraphs.length; i++) {
      var words = paragraphs[i].innerText;
      if (this.clkTest(words)) {
        words = words.replace(/\d|\s|[()]/g, '').split('').filter(v => v !== '');
      } else {
        words = words.split(/\s|,|[.()]|\d/g);
      }
      for (var j = 0; j < words.length; j++) {
        for (var b = ngramMin; b <= ngramMax; b++) {
          var word = words.slice(j, j + b).join(' ');
          if (!(word in countedWords)) {
            countedWords[word] = 0;
          }
          countedWords[word] += 1;
        }
      }
    }
    return countedWords;
  }

  isInViewport(elem) {
    var bounding = elem.getBoundingClientRect();
    return (
      bounding.top >= 0 &&
            bounding.left >= 0 &&
            bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  filterToUserDefined(countedWords, translationProbability, userDefinedTranslations, userBlacklistedWords) {
    var blackListReg = new RegExp(userBlacklistedWords);
    var a = this.toList(userDefinedTranslations, (word, count) => {
      return 1;
    });
    var b = this.toList(countedWords, (word, count) => {
      return 1;
    });
    var countedWordsList = this.intersect(a, b);
    return this.toMap(countedWordsList);
  }

  filter(countedWords, translationProbability, userDefinedTranslations, userBlacklistedWords) {
    var blackListReg = new RegExp(userBlacklistedWords);
    var punctuationReg = new RegExp(/[\.,\/#\!\$%\^&\*;:{}=\\\_`~()\?@\d\+\-]/g);
    var countedWordsList = this.shuffle(this.toList(countedWords, (word, count) => {
      if (this.clkTest(word))

        return !!word && word !== '' && !/\d/.test(word) && // no empty words
                !blackListReg.test(word.toLowerCase()) && // no blacklisted words
                !punctuationReg.test(word.toLowerCase()); // no punctuation marksreturn !!word && word.length >= 2 && // no words that are too short
      else
        return word !== '' && !/\d/.test(word) && // no empty words
                    !blackListReg.test(word.toLowerCase()) && // no blacklisted words
                    !punctuationReg.test(word.toLowerCase()); // no punctuation marks
    }));
    var targetLength = Math.floor((Object.keys(countedWordsList).length * translationProbability) / 100);
    return this.toMap(countedWordsList.slice(0, targetLength - 1));
  }

  containsIllegalCharacters(s) {
    return /[0-9{}.,;:]/.test(s);
  }

  /**
     * Perform various functions on translations
     * @param {Object} translationMap - word wise translation object
     */
  processTranslations(translationMap, userDefinedTMap, cwMatch) {
    var filteredTMap = {};
    for (var w in translationMap) {
      if (w !== translationMap[w] && translationMap[w] !== '' && !userDefinedTMap[w] && !this.containsIllegalCharacters(translationMap[w])) {
        filteredTMap[w] = translationMap[w];
      }
    }

    // Matching from Common Words
    for (w in cwMatch) {
      if (w !== cwMatch[w] && cwMatch[w] !== '' && !userDefinedTMap[w] && !this.containsIllegalCharacters(cwMatch[w])) {
        filteredTMap[w] = cwMatch[w];
      }
    }

    // Matching from User Defined Words
    for (w in userDefinedTMap) {
      if (w !== userDefinedTMap[w]) {
        filteredTMap[w] = userDefinedTMap[w];
      }
    }

    //filter out learnt words
    if (this.learntWords.length > 2) {
      let learntWordsReg = new RegExp(this.learntWords);
      Object.keys(filteredTMap).forEach(function(key) {
        if (learntWordsReg.test(filteredTMap[key].toLowerCase())) {
          delete filteredTMap[key];
        }
      });
    }

    //for difficulty buckets feature
    this.filteredTMap = filteredTMap;

    //for quiz feature
    chrome.storage.local.set({ 'translatedWordsForQuiz': JSON.stringify(this.filteredTMap) });

    let numberOfTranslatedWords = Object.keys(filteredTMap).length;
    this.numberOfTranslatedWordsOnPage += numberOfTranslatedWords;

    let numberOfTranslatedCharacters = 0;
    Object.keys(filteredTMap).forEach(function(e, i) {
      numberOfTranslatedCharacters += e.length;
    });

    //total number of words translated
    this.stats['totalWordsTranslated'] += numberOfTranslatedWords;
    //number of words characters translated by each service in the current month
    var currentMonth = getCurrentMonth();
    var currentDay = getCurrentDay();
    var date = new Date;
    var date = new Date;

    var year = date.getFullYear();
    var month = date.getMonth();
    var nowDate = date.getDate();
    var dateForm = month + '-' + nowDate + '-' + year;

    var wordsEveryDay = [];
    chrome.storage.local.get(['nOfWordsTransEveryDay'], function(result) {
      
      if(result.nOfWordsTransEveryDay === undefined){
        chrome.storage.local.set({ 'nOfWordsTransEveryDay': [] });
      }
      else{

        wordsEveryDay = result.nOfWordsTransEveryDay;
      }
      var toCheck = true;
      for(var i = 0;i < wordsEveryDay.length; i++){
        if(wordsEveryDay[i][0] === dateForm){

          wordsEveryDay[i][1] += numberOfTranslatedWords;
          toCheck = false;
        }
      }
      if(toCheck){

        var wordsToday = [dateForm, numberOfTranslatedWords];
        wordsEveryDay.push(wordsToday);
      }


      chrome.storage.local.set({ 'nOfWordsTransEveryDay': wordsEveryDay });

    });

    // [0] => number of words, [1] => number of characters
    if (!(currentMonth in this.stats['translatorWiseWordCount'][0])) {
      this.stats['translatorWiseWordCount'][0] = {};
      this.stats['translatorWiseWordCount'][0][currentMonth] = {
        'Yandex': [0, 0, 0],
        'Google': [0, 0, 0],
        'Azure': [0, 0, 0]
      };
    }

    if (!(currentDay in this.stats['translatorWiseWordCount'][1])) {
      this.stats['translatorWiseWordCount'][1] = {};
      this.stats['translatorWiseWordCount'][1][currentDay] = {
        'Yandex': [0, 0, 0],
        'Google': [0, 0, 0],
        'Azure': [0, 0, 0]
      };
    }

    if (!this.userDefinedOnly) {
      this.stats['translatorWiseWordCount'][0][currentMonth][this.translator][0] += numberOfTranslatedWords;
      this.stats['translatorWiseWordCount'][0][currentMonth][this.translator][1] += numberOfTranslatedCharacters;
      this.stats['translatorWiseWordCount'][0][currentMonth][this.translator][2] += numberOfTranslatedCharacters;
      this.stats['translatorWiseWordCount'][1][currentDay][this.translator][0] += numberOfTranslatedWords;
      this.stats['translatorWiseWordCount'][1][currentDay][this.translator][1] += numberOfTranslatedCharacters;
      this.stats['translatorWiseWordCount'][1][currentDay][this.translator][2] += numberOfTranslatedCharacters;
      chrome.storage.local.set({ 'stats': this.stats });
      chrome.storage.local.set({ 'numberOfTranslatedWords': JSON.stringify(this.numberOfTranslatedWordsOnPage) });
    }

    //number of words translated for active pattern
    chrome.storage.local.get(['savedPatterns'], function(result) {
      var savedPatterns = JSON.parse(result.savedPatterns);
      for (var i = 0; i < savedPatterns.length; i++) {
        if (savedPatterns[i][3]) {
          savedPatterns[i][5] += numberOfTranslatedWords;
          chrome.storage.local.set({ 'savedPatterns': JSON.stringify(savedPatterns) });
          chrome.runtime.sendMessage('message_on');
          break;
        }
      }
    });
    if (Object.keys(filteredTMap).length !== 0) {
      var paragraphs = this.paragraphs;
      if (this.oneWordTranslation) {
        for (var i = 0; i < paragraphs.length; i++) {
          this.translateOneWord(paragraphs[i], filteredTMap, this.invertMap(filteredTMap));
        }
      } else {
        for (var i = 0; i < paragraphs.length; i++) {
          this.translateDeep(paragraphs[i], filteredTMap, this.invertMap(filteredTMap));
        }
      }
    }

    // adding word frequency counters
    var wordFrequencyPromise = new Promise((resolve, reject) => {
      var allTranslated =  document.querySelectorAll('.mtwTranslatedWord, .mtwTranslatedWorde, .mtwTranslatedWordn, .mtwTranslatedWordh'),
        nativeWords = [],  // storing language specific words
        totalWordsLanguage;  // language specific counter for calculating rarity ratio
      chrome.storage.local.get(['wordFrequencyCorpus','totalWordsperLanguage'], (wordObjectList) => {
        nativeWords = wordObjectList.wordFrequencyCorpus;
        totalWordsLanguage = wordObjectList.totalWordsperLanguage;

        for(var i=0; i< allTranslated.length; i++) {
          let spanNode = allTranslated[i], found=false;
          for(var j =0; j< nativeWords.length; j++) {

            if(spanNode.innerText === nativeWords[j].word) {
              found = true; // for check if the language selected is present in the list 
              nativeWords[j].count = parseInt(nativeWords[j].count) + 1;
              break;
            }
          }

          if(found===false) {
            let word = spanNode.innerText,
              wordObject = {
                targetLang:'',
                word:'',
                count:1,
              };
            wordObject.targetLang = this.targetLanguage;
            wordObject.word = word;
            nativeWords.push(wordObject); // create first node for new target language
          }
        }

        if (totalWordsLanguage.length===0) {
          totalWordsLanguage.push({ targetLang: this.targetLanguage, count: allTranslated.length });
          this.totalWordsLanguage = allTranslated.length;
        }
        for(var x=0;x< totalWordsLanguage.length; x++ ){
          if(totalWordsLanguage[x].targetLang===this.targetLanguage) {
            totalWordsLanguage[x].count += allTranslated.length;
            this.totalWordsLanguage = totalWordsLanguage[x].count;
            break;
          }
          else if(totalWordsLanguage[x].targetLang !== this.targetLanguage && x === (totalWordsLanguage.length-1)) {
            totalWordsLanguage.push({ targetLang: this.targetLanguage, count: allTranslated.length });
            this.totalWordsLanguage = allTranslated.length;
          }
        }
        chrome.storage.local.set({ wordFrequencyCorpus: nativeWords });
        chrome.storage.local.set({ totalWordsperLanguage: totalWordsLanguage });
        resolve(nativeWords);
        reject('[MTW] translated words not found');
      });
    });
    wordFrequencyPromise.then((nativeWords) => {
    // Adding buttons and frequency counters to Hover-Card
      chrome.storage.local.get(['learntWords', 'translatedWordsForQuiz'], wordsListObj => {
        let wordsList = wordsListObj.learntWords,
          wordsArray= wordsList.replace('(','').replace(')','').split('|'),
          s = this.hoverTranslations,
          hoverBackground='', // background color code depending on rarity
          onPageQuizID = 0;
        var paragraphs = this.paragraphs;

        for (let a = 0; a < paragraphs.length; a++) {
          var translatedWords = paragraphs[a].querySelectorAll('.mtwTranslatedWord, .mtwTranslatedWorde, .mtwTranslatedWordn, .mtwTranslatedWordh');
          for (let i = 0; i < translatedWords.length; i++) {
            let word = translatedWords[i].getAttribute('data-original');
            if (!(wordsArray.includes(word))) { // if word is not learnt
              var hoverHTML = '<p>'+ translatedWords[i].getAttribute('data-original') + '</p>';
              for(var k =0; k< nativeWords.length; k++) {
                if (nativeWords[k].word === translatedWords[i].getAttribute('data-translated')){
                  if(Math.round(( nativeWords[k].count / this.totalWordsLanguage ) * 1000) <= 1) { // in 1000 words change this to 1000 from 100
                    hoverHTML += '<img src="'+ this.custom_icon[6]+'" class="tags-rare">';
                    hoverBackground='#FFEBEE';
                  }
                  else if(Math.round(( nativeWords[k].count / this.totalWordsLanguage ) * 100) >= 4) {
                    hoverHTML += '<img src="'+ this.custom_icon[8]+'" class="tags-common">';
                    hoverBackground = '#F1F8E9';
                  }
                  else {
                    hoverHTML += '<img src="'+ this.custom_icon[7]+'" class="tags-occasional">';
                    hoverBackground = '#FFFDE7';
                  }
                }
              }
              hoverHTML += '<img style="cursor:pointer;" class="mtwSpeak" data-translated="' + translatedWords[i].getAttribute('data-translated') + '" src="' + this.custom_icon[0] + '">';
              if (this.detailsApiKey && this.optionalAPI) {
                hoverHTML += '<img style="cursor:pointer;" class="moreInformation" data-original="' + translatedWords[i].getAttribute('data-original') + '" src="'+ this.custom_icon[11] +'">';
              }
              hoverHTML += '<img style="cursor:pointer;" class="mtwMarkAsLearnt mtwHovercardBelow" data-original="' + translatedWords[i].getAttribute('data-original') + '" src="' + this.custom_icon[1] + '">';
              hoverHTML += '<img style="cursor:pointer;" class="mtwSaveTranslation mtwHovercardBelow" data-translated="' + translatedWords[i].getAttribute('data-translated') + '" data-original="' + translatedWords[i].getAttribute('data-original') + '" src="' + this.custom_icon[4] + '">';
              hoverHTML += '<img style="cursor:pointer;" class="mtwBlacklistWord mtwHovercardBelow" data-original="' + translatedWords[i].getAttribute('data-original') + '" src="' + this.custom_icon[5] + '">';
              hoverHTML += '<img style="cursor:pointer;" class="mtwWordInfo mtwHovercardBelow" data-translated="' + translatedWords[i].getAttribute('data-translated') + '" src="' + this.custom_icon[3] + '">';
              hoverHTML += '<img style="cursor:pointer;" class="mtwVisualHint mtwHovercardBelow" data-translated="' + translatedWords[i].getAttribute('data-translated') + '" src="' + this.custom_icon[2] + '">';
              $(translatedWords[i]).hovercard({
                detailsHTML: hoverHTML,
                width: 250,
                background: hoverBackground
              });
            } else {
              let word = translatedWords[i].getAttribute('data-translated'),
                wordNativeLang = translatedWords[i].getAttribute('data-original'),
                wordsLearnt = JSON.parse(wordsListObj.translatedWordsForQuiz) ;

              function getPosition(length) { // get the index of adding wrong translations
                return Math.floor(Math.random() * length);
              }
              function filterKeys(obj) {
                let filteredList = {};
                for(let x in obj) {
                  if (obj.hasOwnProperty(x)) {
                    if(obj[x].length >= 4) {
                      filteredList[x] = obj[x];
                    }
                  }
                }
                return filteredList;
              }
              let filteredlist = filterKeys(wordsLearnt),
                options = new Array(4),
                correctAnsOption = Math.round(Math.random() * 4);
              options[correctAnsOption] = word;
              // assign options to the array
              for(let u = 0; u < 4; u++) {
                if (u !== correctAnsOption) {
                  options[u] = getPosition(Object.keys(filteredlist).length);
                }
              }
              let opt = 0, count = 0;
              for(let keys in filteredlist) {
                if(filteredlist.hasOwnProperty(keys)) {
                  switch(count) {
                    case options[0] :
                      options[0] = filteredlist[keys];
                      opt++;
                      break;
                    case options[1] :
                      options[1] = filteredlist[keys];
                      opt++;
                      break;
                    case options[2] :
                      options[2] = filteredlist[keys];
                      opt++;
                      break;
                    case options[3] :
                      options[3] = filteredlist[keys];
                      opt++;
                      break;
                    default :
                      if(opt === correctAnsOption)
                        opt++;
                  }
                  if( opt === 4) break;
                  count++;
                }
              }
              var hoverHTML = '<p>Choose <strong>correct</strong> Translations:</p><div>';
              for(let j=0;j< options.length; j++) {
                if (j === correctAnsOption) {
                  hoverHTML += '<b class="onPageQuiz-default">' + (j+1) + '.</b> <span class="answer_correct_'+ onPageQuizID +` onPageQuiz-default">
                    <span id="correct-`+ j.toString() +'" name="quiz" value="'+ options[j] +'">'+ options[j] + '</span>'
                    +' <img id="answer_sym_" src="'+ this.custom_icon[9]+ '" style="height:25px;display: none;position:absolute;right:18px;margin-top:-23px;"/></span><br/>' ;
                }
                else {
                  hoverHTML += '<b class="onPageQuiz-default">' + (j+1) + '.</b> <span class="answer_wrong_'+ onPageQuizID +' onPageQuiz-default"><span id="wrong-'+ j.toString()
                  +'" name="quiz" value="'+ options[j] +'">'+ options[j] + '</span>'+' <img id="answer_sym_" src="'
                  + this.custom_icon[10]+ '" style="height:20px;margin-top:-20px;display: none;position:absolute;right:20px;"/></span><br/>' ;
                }
              }
              onPageQuizID++;
              hoverHTML += '<span class="tag-learnt-marked">Learnt</span>';
              hoverHTML += '</div>';
              translatedWords[i].innerHTML = '<span style="color:blue;font-weight:bold;">'+translatedWords[i].getAttribute('data-original') +' </span>';
              $(translatedWords[i]).hovercard({
                detailsHTML: hoverHTML,
                width: 300
              });
            }
          }
        }
        this.postProcessing();
      });
    })
      .catch((e)=>{
        console.warn(e);
      });
  }

  /**
   * Adds event listeners to the buttons inthe hovercards
   */
  postProcessing(){
    var paragraphs = this.paragraphs; //getting paragraphs in the current viewport

    for (let i = 0; i < paragraphs.length; i++) {

      //Event Listener for Speak
      var buttonList = paragraphs[i].querySelectorAll('.mtwSpeak');
      if (buttonList.length) {
        for (let i = 0; i < buttonList.length; i++) {
          if(!buttonList[i].classList.contains('done')){
            buttonList[i].addEventListener('click', function() {
              var utterance = this.getAttribute('data-translated');
              chrome.storage.local.set({ 'utterance': utterance }, function() {
                chrome.runtime.sendMessage('speakTheWord');
              });
            });
            buttonList[i].className += ' done';
          }
        }
      }

      //Event Listener for MarkAsLearnt
      buttonList = paragraphs[i].querySelectorAll('.mtwMarkAsLearnt');
      if (buttonList.length) {
        for (let i = 0; i < buttonList.length; i++) {
          if(!buttonList[i].classList.contains('done')){
            buttonList[i].addEventListener('click', function() {
            
              var wordLearnt = this.getAttribute('data-original');
              chrome.storage.local.get(['learntWords'], function(result) {

                var learntWords = result.learntWords;
                var learntWordsArr = learntWords.slice(1, -1).split('|');
                var updatedLearntWords = learntWords;

                var exist = false;
                for(var q = 0; q < learntWordsArr.length; q++){
                  if(learntWordsArr[q] === wordLearnt){
                    exist = true;
                  }
                }
                if(!exist){
                  if (learntWords.length === 2) {
                    updatedLearntWords = '(' + wordLearnt + ')';
                  } else {
                    updatedLearntWords = updatedLearntWords.split(')')[0] + '|' + wordLearnt + ')';
                  }

                  var snackBar = document.createElement('div');
                  snackBar.setAttribute('style','left: 0px;right: 0px;margin-left:auto;margin-right:auto;max-width:40%;background-color:#4ea03b;z-index:10000;border-radius:7.5px;color:white;bottom: 5%;position:fixed;padding:15px;text-align:center;box-shadow: 0 1.5px 4px rgba(0, 0, 0, 0.24), 0 1.5px 6px rgba(0, 0, 0, 0.12);');
                  var snackContent = document.createElement('p');
                  snackContent.setAttribute('style','margin-top:0px;margin-bottom:0px;');
                  snackContent.innerText = '\'' + wordLearnt + '\' learnt';

                  var undo = document.createElement('p');
                  undo.setAttribute('style','font-weight:bold;cursor: pointer;margin-top:0px;margin-bottom:0px;');
                  undo.setAttribute('snack_original',wordLearnt);
                  undo.innerText = 'Undo';

                  undo.addEventListener('click', function() {//Undo the change
                    var toUndo = undo.getAttribute('snack_original');
                    chrome.storage.local.get(['learntWords'], function(re) {
                      var arrChange = re.learntWords;
                      if(arrChange.indexOf('|') === -1){
                        arrChange = arrChange.replace(toUndo, '');
                      }
                      else{
                        arrChange = arrChange.replace('|' + toUndo, '');
                      }
                      
                      chrome.storage.local.set({'learntWords': arrChange});
                    });

                  });

                  chrome.storage.local.set({
                    'learntWords': updatedLearntWords
                  });

                  snackBar.appendChild(snackContent);
                  snackBar.appendChild(undo);

                  document.getElementsByTagName('body')[0].appendChild(snackBar);

                  setTimeout(function () {
                    snackBar.parentNode.removeChild(snackBar);
                  }, 3000);
                }
                

                
              });
              
            
            });
          }
          buttonList[i].className += ' done';
            
        }
      }
      

      //Event Listener for SaveTranslation
      buttonList = paragraphs[i].querySelectorAll('.mtwSaveTranslation');
      if (buttonList.length) {
        for (let i = 0; i < buttonList.length; i++) {
          if(!buttonList[i].classList.contains('done')){
            buttonList[i].addEventListener('click', function() {
              var originalText = this.getAttribute('data-original');
              var translatedText = this.getAttribute('data-translated');
              chrome.storage.local.get(['savedTranslations'], function(result) {
                let updatedSavedTranslations = JSON.parse(result.savedTranslations);

                var exist = false;
                for(var key in updatedSavedTranslations){
                  if(key === originalText){
                    exist = true;
                  }
                }
                if(!exist){
                  updatedSavedTranslations[originalText] = translatedText;
                  
                  var snackBar = document.createElement('div');
                  snackBar.setAttribute('style','left: 0px;right: 0px;margin-left:auto;margin-right:auto;max-width:40%;background-color:#f19b42;z-index:10000;border-radius:7.5px;color:white;bottom: 5%;position:fixed;padding:15px;text-align:center;box-shadow: 0 1.5px 4px rgba(0, 0, 0, 0.24), 0 1.5px 6px rgba(0, 0, 0, 0.12);');
                  var snackContent = document.createElement('p');
                  snackContent.setAttribute('style','margin-top:0px;margin-bottom:0px;');
                  snackContent.innerText = '\'' + originalText + '\' saved';

                  var undo = document.createElement('p');
                  undo.setAttribute('style','font-weight:bold;cursor: pointer;margin-top:0px;margin-bottom:0px;');
                  undo.setAttribute('snack_original',originalText);
                  undo.innerText = 'Undo';

                  undo.addEventListener('click', function() {//Undo the change
                    var toUndo = undo.getAttribute('snack_original');
                    chrome.storage.local.get(['savedTranslations'], function(re) {
                      var arrChange = JSON.parse(re.savedTranslations);
                      if(arrChange[originalText] !== undefined){
                        delete arrChange[originalText];
                      }
                      
                      chrome.storage.local.set({'savedTranslations': JSON.stringify(arrChange)});
                    });

                  });

                  chrome.storage.local.set({ 'savedTranslations': JSON.stringify(updatedSavedTranslations) });

                  snackBar.appendChild(snackContent);
                  snackBar.appendChild(undo);

                  document.getElementsByTagName('body')[0].appendChild(snackBar);

                  setTimeout(function () {
                    snackBar.parentNode.removeChild(snackBar);
                  }, 3000);
                }

                

              });
            });
            buttonList[i].className += ' done';
          }
        }
      }

      //Event Listener for BlacklistWord
      buttonList = paragraphs[i].querySelectorAll('.mtwBlacklistWord');
      if (buttonList.length) {
        for (let i = 0; i < buttonList.length; i++) {
          if(!buttonList[i].classList.contains('done')){
            buttonList[i].addEventListener('click', function() {
              var wordToBeBlacklisted = this.getAttribute('data-original');
              chrome.storage.local.get('userBlacklistedWords', function(result) {
                var currentUserBlacklistedWords = result.userBlacklistedWords;
                var blacklistedWords = [];
                blacklistedWords = currentUserBlacklistedWords.slice(1, -1).split('|');
                var updatedBlacklistedWords = '';
                //to avoid duplication
                if (blacklistedWords.indexOf(wordToBeBlacklisted) === -1) {
                  //incase of empty current black list
                  if (!currentUserBlacklistedWords) {
                    updatedBlacklistedWords = '(' + wordToBeBlacklisted + ')';
                  } else {
                    updatedBlacklistedWords = currentUserBlacklistedWords.split(')')[0] + '|' + wordToBeBlacklisted + ')';
                  }
                }

                var snackBar = document.createElement('div');
                snackBar.setAttribute('style','left: 0px;right: 0px;margin-left:auto;margin-right:auto;max-width:40%;background-color:#d5446a;z-index:10000;border-radius:7.5px;color:white;bottom: 5%;position:fixed;padding:15px;text-align:center;box-shadow: 0 1.5px 4px rgba(0, 0, 0, 0.24), 0 1.5px 6px rgba(0, 0, 0, 0.12);');
                var snackContent = document.createElement('p');
                snackContent.setAttribute('style','margin-top:0px;margin-bottom:0px;');
                snackContent.innerText = '\'' + wordToBeBlacklisted + '\' blacklisted';

                var undo = document.createElement('p');
                undo.setAttribute('style','font-weight:bold;cursor: pointer;margin-top:0px;margin-bottom:0px;');
                undo.setAttribute('snack_original',wordToBeBlacklisted);
                undo.innerText = 'Undo';

                undo.addEventListener('click', function() {//Undo the change
                  var toUndo = undo.getAttribute('snack_original');
                  chrome.storage.local.get(['userBlacklistedWords'], function(re) {
                    var arrChange = re.userBlacklistedWords;
                    if(arrChange.indexOf('|') === -1){
                      arrChange = arrChange.replace(toUndo, '');
                    }
                    else{
                      arrChange = arrChange.replace('|' + toUndo, '');
                    }
                    
                    chrome.storage.local.set({'userBlacklistedWords': arrChange});
                  });

                });

                chrome.storage.local.set({
                  'userBlacklistedWords': updatedBlacklistedWords
                });

                snackBar.appendChild(snackContent);
                snackBar.appendChild(undo);

                document.getElementsByTagName('body')[0].appendChild(snackBar);

                setTimeout(function () {
                  snackBar.parentNode.removeChild(snackBar);
                }, 3000);

              }); 
            });
            buttonList[i].className += ' done';
          }
        }
      }

      //Event Listener for WordInfo
      buttonList = paragraphs[i].querySelectorAll('.mtwWordInfo');
      if (buttonList.length) {
        var targetLanguage = this.targetLanguage;
        for (let i = 0; i < buttonList.length; i++) {
          if(!buttonList[i].classList.contains('done')){
            buttonList[i].addEventListener('click', function() {
              var word = this.getAttribute('data-translated');
              var searchUrl = 'http://' + targetLanguage + '.wiktionary.org/wiki/' + word;
              window.open(searchUrl);
            });
            buttonList[i].className += ' done';
          }
        }
      }

      //Event Listener for VisualHint
      buttonList = paragraphs[i].querySelectorAll('.mtwVisualHint');
      if (buttonList.length) {
        var targetLanguage = this.targetLanguage;
        for (let i = 0; i < buttonList.length; i++) {
          if(!buttonList[i].classList.contains('done')){
            buttonList[i].addEventListener('click', function() {
              var word = this.getAttribute('data-translated');
              var searchUrl = 'http://www.google.com/search?lr=lang_' + targetLanguage + '&q=' + word + '&tbm=isch';
              window.open(searchUrl);
            });
            buttonList[i].className += ' done';
          }
        }
      }

      //Events on the hovercards actions
      buttonList = paragraphs[i].querySelectorAll('[class^=answer_correct]');
      if (buttonList.length) {
        for (let j = 0; j < buttonList.length; j++) {
          if(!buttonList[j].classList.contains('done')){
            buttonList[j].addEventListener('click', function() {
              this.innerHTML = this.innerHTML.replace('display: none;', 'display: block;');
              this.style = 'background-color: #55BB38; color: white; border-radius: 2px; padding: 2px 4px 2px 4px; font-weight: bold';
            });
            buttonList[j].className += ' done';
          }
        }
      }

      buttonList = paragraphs[i].querySelectorAll('[class^=answer_wrong]');
      if (buttonList.length) {
        for (let j = 0; j < buttonList.length; j++) {
          if(!buttonList[j].classList.contains('done')){
            buttonList[j].addEventListener('click', function() {
              this.innerHTML = this.innerHTML.replace('display: none;', 'display: block;');
              this.style = 'background-color: #D20026; color: white; border-radius: 2px; padding: 2px 4px 2px 4px; font-weight: bold';
            });
            buttonList[j].className += ' done';
          }
        }
      }

      // for detailed information
      buttonList = paragraphs[i].querySelectorAll('.moreInformation');
      if (buttonList.length) {

        let translatorInv = this.getTranslatorInv(this.srcLang, 'en'),
          translator = this.getTranslatorInv('en', this.srcLang),
          srcLang = this.srcLang; // since dictionary works on english

        for (let j = 0; j  < buttonList.length; j++) {
          if (!buttonList[j].classList.contains('done')) {
            buttonList[j].addEventListener('click', function() {

              let originalWord = this.getAttribute('data-original'),
                parentElement = this.parentNode;
              if (srcLang === 'en') {
                DictionaryObject.setText(originalWord);
                let result = DictionaryObject.getDetails();
                result.then(res => {
                  let dicEntries = res.def;
                  if (dicEntries.length) {
                    let details = '<hr/><span class="hc-info-details">';
                    dicEntries.forEach(obj => {
                      let count = 0, tranlations = obj.tr;
                      details +=
                      '<b>Type: '+obj.pos+'</b><br/>Use Case:';
                      tranlations.forEach(tr => {
                        count++;
                        details += '<br> &nbsp;'+count+'. <b>Word:</b> '+tr.text+' &nbsp; <b>Type:</b> '+tr.pos;
                        if (tr.syn) {
                          details += '<br/><i class="hc-info-details-syn"> <b>Synonyms:</b> ';
                          let synAr = tr.syn, k = 0;
                          synAr.forEach(syn => {
                            k++;
                            details += syn.text;
                            if (k !== synAr.length)
                              details += ', ';
                          });
                          details += '</i>';
                        }
                      });
                    });
                    details += '</span>';
                    parentElement.innerHTML += details;
                    parentElement.style.width = '300px';
                  } else {
                    let details = '<hr/><span class="hc-info-details-not"><b>Details Not Available</b></span>';
                    parentElement.innerHTML += details;
                  }
                });
              } else {
                // if srcLang is not english

                function filterString(str) {
                  return str.replace(/["{},:]/g, ' ');
                }
                let wordArr = {};
                wordArr[originalWord] = 1;
                translatorInv.getTranslations(wordArr).then(engArr => {
                  let wordEnglish = engArr[originalWord];
                  DictionaryObject.setText(wordEnglish);
                  let result = DictionaryObject.getDetails();
                  result.then(res => {
                    let dicEntries = JSON.stringify(res),
                      translationArr = [
                        'Type', 'Uses', 'Word', 'Synonyms', 'Details', 'Not', 'Available'
                      ], exceptions = [
                        'tr', 'ts', 'syn', '[', ']', 'def', 'head', 'text', 'pos'
                      ], map = {
                        'Type': 1, 'Uses': 1, 'Word': 1, 'Synonyms': 1, 'Details': 1, 'Not': 1, 'Available': 1
                      };
                    let formattedStr = filterString(dicEntries).split(' ');
                    formattedStr.forEach(word => {
                      if (!translationArr.includes(word) && word.length && !exceptions.includes(word)) {
                        translationArr.push(word);
                        map[word] = 1;
                      }
                    });
                    translator.getTranslations(map).then(trans => {
                      // response in source language

                      for (let key in trans) {
                        dicEntries = dicEntries.replace(new RegExp(key, 'g'), trans[key]);
                      }
                      dicEntries = JSON.parse(dicEntries);
                      dicEntries = dicEntries.def;
                      if (dicEntries.length) {
                        let details = '<hr/><span class="hc-info-details">';
                        dicEntries.forEach(obj => {
                          let count = 0, tranlations = obj.tr;
                          details +=
                          '<b>'+ trans['Type'] +': '+obj.pos+'</b><br/>'+ trans['Uses'] + ':';
                          tranlations.forEach(tr => {
                            count++;
                            details += '<br> &nbsp;'+count+'. <b>'+ trans['Word'] +':</b> '+tr.text+' &nbsp; <b>'+ trans['Type'] +':</b> '+tr.pos;
                            if (tr.syn) {
                              details += '<br/><i class="hc-info-details-syn"> <b>'+ trans['Synonyms'] +':</b> ';
                              let synAr = tr.syn, k = 0;
                              synAr.forEach(syn => {
                                k++;
                                details += syn.text;
                                if (k !== synAr.length)
                                  details += ', ';
                              });
                              details += '</i>';
                            }
                          });
                        });
                        details += '</span>';
                        parentElement.innerHTML += details;
                        parentElement.style.width = '300px';
                      } else {
                        let details = '<hr/><span class="hc-info-details-not"><b>'+ trans['Details'] + ' '+ trans['Not'] + ' '+
                            trans['Available'] +'</b></span>';
                        parentElement.innerHTML += details;
                      }
                    });

                  });
                });
              }
            });
            buttonList[j].className += ' done';
          }
        }
      }
    }
    this.finishTranslation = true;
  }

  /**
     * Translate one word in each sentence for a  paragraph.
     * NOTE: The words are split by sentences and not by spaces
     * to prevent inconsistent reforming of paragraphs due to
     * rogue spaces.
     * @param {Object} paragraph - Paragraph nodeType
     * @param {Object} filteredTMap - filtered translation map
     * @param {Object} iMap - HTML element for each translated word
     */
  translateOneWord(paragraph, filteredTMap, iMap) {
    for (let i in paragraph.childNodes) {
      if (paragraph.childNodes[i].nodeType === 3) {
        if (!/^\s*$/.test(paragraph.childNodes[i].textContent)) {
          if ((this.srcLang === yandexLanguages.Chinese) || (this.srcLang === azureLanguages['Chinese Simplified']) || (this.srcLang === azureLanguages['Chinese Traditional']) || (this.srcLang === yandexLanguages.Japanese)  || (this.srcLang === googleLanguages['Chinese Simplified']) || (this.srcLang === googleLanguages['Chinese Traditional'])) {
            let sentences = paragraph.childNodes[i].textContent.split('。');
            for (let j in sentences) {
              let words = sentences[j].split('');
              words = _.shuffle(words);
              for (let k in words) { // loop interrupted after one word is found
                if (filteredTMap[words[k]]) {
                  let x = sentences[j].replace(words[k], ' ' + iMap[filteredTMap[words[k]]]+ '<sup class="countPage">('
                      +this.countedWords[words[k]]+')</sup>' + ' ');
                  sentences[j] = x;
                  break;
                }
              }
            }
            var newNode = document.createElement('span');
            newNode.className = 'mtwProcessed';
            newNode.innerHTML = sentences.join('。');
            paragraph.replaceChild(newNode, paragraph.childNodes[i]);
          } else {
            var sentences;
            if (this.srcLang === yandexLanguages.Hindi) {
              sentences = paragraph.childNodes[i].textContent.split('।');
            } else if (this.srcLang === yandexLanguages.Armenian) {
              sentences = paragraph.childNodes[i].textContent.split(':');
            } else {
              sentences = paragraph.childNodes[i].textContent.split('.');
            }
            for (let j in sentences) {
              let words = sentences[j].split(' ');
              var shuffleIndices = _.shuffle(Array.apply(null, { length: words.length }).map(Function.call, Number));
              for (let k in words) { // loop interrupted after one word is found
                if (filteredTMap[words[shuffleIndices[k]]]) {
                  words[shuffleIndices[k]] = iMap[filteredTMap[words[shuffleIndices[k]]]] + '<sup class="countPage">(' 
                    + this.countedWords[words[shuffleIndices[k]]]+')</sup>';
                  break;
                }
              }
              sentences[j] = words.join(' ');
            }
            var newNode = document.createElement('span');
            newNode.className = 'mtwProcessed';
            if (this.srcLang === yandexLanguages.Hindi) {
              newNode.innerHTML = sentences.join('।');
            } else if (this.srcLang === yandexLanguages.Armenian) {
              newNode.innerHTML = sentences.join(':');
            } else {
              newNode.innerHTML = sentences.join('.');
            }
            paragraph.replaceChild(newNode, paragraph.childNodes[i]);
          }
        }
      }
    }
  }

  /**
       * Replaces source words with translated words
       * @param {Object} node - paragraph HTML node
       * @param {Object} tMap - translationMap
       * @param {Object} iTMap - HTML element for each translated word
       */
  translateDeep(paragraph, filteredTMap, iMap) {
    for (let i in paragraph.childNodes) {
      if (paragraph.childNodes[i].nodeType === 3) {
        if (!/^\s*$/.test(paragraph.childNodes[i].textContent)) {
          if ((this.srcLang === yandexLanguages.Chinese) || (this.srcLang === azureLanguages['Chinese Simplified']) || (this.srcLang === azureLanguages['Chinese Traditional']) || (this.srcLang === yandexLanguages.Japanese) || (this.srcLang === googleLanguages['Chinese Simplified']) || (this.srcLang === googleLanguages['Chinese Traditional'])) {
            let words = paragraph.childNodes[i].textContent.split('');
            let toBeTranslated = Math.floor(words.length * this.translationProbability / 100);
            let actualCount = 0;
            for (let k in words) { // loop interrupted after one wordlimit is crossed
              if (filteredTMap[words[k]]) {
                words[k] = ' ' + iMap[filteredTMap[words[k]]] + '<sup class="countPage">('+this.countedWords[words[k]]+')</sup>' + ' ';
                actualCount += 1;
              }
              if (actualCount >= toBeTranslated) {
                break;
              }
            }
            var newNode = document.createElement('span');
            newNode.className = 'mtwProcessed';
            newNode.innerHTML = words.join(' ');
            paragraph.replaceChild(newNode, paragraph.childNodes[i]);
          } else {
            let words = paragraph.childNodes[i].textContent.split(' ');
            let toBeTranslated = Math.floor(words.length * this.translationProbability / 100);
            let actualCount = 0;
            for (let k in words) { // loop interrupted after one wordlimit is crossed
              if (filteredTMap[words[k]]) {
                words[k] = iMap[filteredTMap[words[k]]] + '<sup class="countPage">('+ this.countedWords[words[k]] +')</sup>' ;
                actualCount += 1;
              }
              if (actualCount >= toBeTranslated) {
                break;
              }
            }
            var newNode = document.createElement('span');
            newNode.className = 'mtwProcessed';
            newNode.innerHTML = words.join(' ');
            paragraph.replaceChild(newNode, paragraph.childNodes[i]);
          }
        }
      }
    }
  }

  /**
     * Forms HTML element for each translated word
     * @param {Object} map - translation map
     * @returns {Object} iMap - HTML node for each translation
     */
  invertMap(map) {
    var iMap = {};
    for (var e in map) {
      iMap[map[e]] = '<span data-sl="' + this.srcLang +
                '" data-tl="' + this.targetLanguage +
                '" data-query="' + e +
                '" data-original="' + e +
                '" data-translated="' + map[e];


      iMap[map[e]] = iMap[map[e]] + '" class="mtwTranslatedWord"';
      iMap[map[e]] = iMap[map[e]] +
                '>' + map[e] +
                '</span>';
    }

    return iMap;
  }

  /**
     * Toggles all the translated words in the active page.
     * To be called from `popup.js`
     */
  toggleAllElements() {
    this.translated = !this.translated;
    var words = document.querySelectorAll('.mtwTranslatedWord, .mtwTranslatedWorde, .mtwTranslatedWordn, .mtwTranslatedWordh');
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      if (isNaN(word.innerText)) { //isNaN returns true if parameter does NOT contain a number
        word.innerText = (this.translated) ? word.dataset.translated : word.dataset.original;
      }
    }
  }

  /**********************utils*******************************/

  /**
     * Remove special characters
     * @param {string} str - source string
     * @returns {string} str - escaped string
     */
  escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
  }

  /**
     * Convert object to list
     * @param {Object} map - translation map
     * @param {function} filter
     */
  toList(map, filter) {
    var list = [];
    for (var item in map) {
      if (filter(item, map[item])) {
        list.push(item);
      }
    }
    return list;
  }

  shuffle(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  }

  /**
     * Convert array to object
     * @param {Array} list
     * @returns {Object} map
     */
  toMap(list) {
    var map = {};
    for (var i = 0; i < list.length; i++) {
      map[list[i]] = 1;
    }
    return map;
  }

  intersect() {
    var i,
      all,
      shortest,
      nShortest,
      n,
      len,
      ret = [],
      obj = {},
      nOthers;
    nOthers = arguments.length - 1;
    nShortest = arguments[0].length;
    shortest = 0;
    for (i = 0; i <= nOthers; i++) {
      n = arguments[i].length;
      if (n < nShortest) {
        shortest = i;
        nShortest = n;
      }
    }
    for (i = 0; i <= nOthers; i++) {
      n = (i === shortest) ? 0 : (i || shortest); //Read the shortest array first. Read the first array instead of the shortest
      len = arguments[n].length;
      for (var j = 0; j < len; j++) {
        var elem = arguments[n][j];
        if (obj[elem] === i - 1) {
          if (i === nOthers) {
            ret.push(elem);
            obj[elem] = 0;
          } else {
            obj[elem] = i;
          }
        } else if (i === 0) {
          obj[elem] = 0;
        }
      }
    }
    return ret;
  }


  sendError(message) {
    if (message === '')
      message = 'Could not connect to ' + this.translator + ' Service .\nIt may be temporarily unavailable  or you may be experiencing  internet connection problems ';

    var date = new Date();

    var data = {
      message: message,
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      url: window.location.href
    };

    chrome.runtime.sendMessage(data, function(response) {
      if (Notification.permission !== 'granted') {
        Notification.requestPermission(function(permission) {
          // If the user accepts, resend notification
          if (permission === 'granted') {
            notify(message, '/views/options.html');
          }
        });
      }

      notify(message, '/views/options.html');

    });
  }


  clkTest(str) {
    var clk_main = new RegExp('[\u4E00-\u9FFF]');
    var clk_extension = new RegExp('[\u3400-\u4DBF]');
    var clk_strokes = new RegExp('[\u31C0-\u31EF]');
    var clk_symbols_punctuation = new RegExp('[\u3000-\u303F]');
    return (clk_main.test(str) || clk_extension.test(str) || clk_strokes.test(str) || clk_symbols_punctuation.test(str));
  }

  findWordsToday(toBeChecked, arr) {
    var returnVal = -1;
    for(var i = 1; i < arr.length; i++){
      if((arr[i][0]).toLowerCase() === toBeChecked.toLowerCase()){
        returnVal = i;
      }
    }
    return returnVal;
  }

  checkWordsTransToday(arr){
    var date = new Date;
    var year = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDate();
    var dateForm = day + '--' + month + '--' +  year;

    if(dateForm !== arr[0]){
      arr = [dateForm];
    }

    return arr;
  }

}

function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this,
      args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

var MTWTranslator = new ContentScript();

chrome.storage.local.get(null, (res) => {
  window.localStorage.setItem('extensionID', res.extensionID);
  if (res.activation === true) {
    var blacklistWebsiteReg = new RegExp(res.blacklist);
    if (blacklistWebsiteReg.test(document.URL) && res.blacklist !== '()') {
      console.log('[MTW] Blacklisted website');
    } else if (res.doNotTranslate === true) {
      console.log('[MTW] Do Not Translate selected.');
    } else if ((res.srcLang === '' || res.targetLanguage === '') && res.userDefinedOnly === false) {
      console.log('[MTW] No active pattern. Please select a pattern in the options page.');
    } else {
      if (res.useCommonWordsOnly === true) {
        console.log('[MTW] Using Common Words for Translation Only.');
      }
      MTWTranslator.initialize(res);
      window.onload = () => {
        function sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
        if (MTWTranslator.finishTranslation) {
          let previousParagraphs = MTWTranslator.allparagraphs;
          var targetNode = document.body, scanCount = 0, allow = true;
          var config = { attributes: true, childList: true, subtree: true };
          let observeChanges = new MutationObserver((List, obs) => {
            List.forEach(node => {
              try {
                let e = node.addedNodes[0].classList, // each event emits only a single node
                  len = node.addedNodes.length;
                if (node.type === 'childList' && len && allow && MTWTranslator.finishTranslation && !e.contains('mtwProcessed')) {
                  scanCount++;
                  if (scanCount >= (previousParagraphs.length)/20) {
                    allow = false;
                    obs.disconnect();
                    if (MTWTranslator.finishTranslation) { // check if existing translation is in process
                      scanCount = 0;
                      sleep(1000).then(() => {
                        MTWTranslator.initialize(res);
                        scanCount = 0;
                        obs.observe(targetNode, config);
                        allow = true;
                        return;
                      });
                    }
                    else if (!MTWTranslator.finishTranslation || scanCount >= (previousParagraphs.length)/20) {
                      scanCount = 0;
                    }
                  }
                } else if (node.type === 'subtree' && len) {
                  scanCount++;
                } else if (node.type === 'characterData' && len) {
                  scanCount++;
                }
              } catch(e) {
                return;
              }
            });
          });
          observeChanges.observe(targetNode, config);
        }
      };

      MTWTranslator.injectCSS(res.translatedWordStyle);
      MTWTranslator.translate();
      var scrollingFn = debounce(function() {
        if (MTWTranslator.finishTranslation) {
          MTWTranslator.translate();
          MTWTranslator.finishTranslation = false;
        }
      }, 250, false);
      window.addEventListener('scroll', scrollingFn);
    }
  } else {
    console.log('[MTW] Switched off');
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === 'toggleAllElements') {
    MTWTranslator.toggleAllElements();
  } else if (request.type === 'getTranslatedWords') {
    if (request.action === 'storeSelection') {
      MTWTranslator.selectedRegion = window.getSelection().getRangeAt(0);
    }
    sendResponse({ translatedWords: MTWTranslator.filteredTMap });
  } else if (request.type = 'showTranslatedSentence') {
    let anchor = document.createElement('span');
    let dummy = document.createElement('span');
    dummy.innerText = request.data;
    dummy.classList.add('popover');
    dummy.classList.add('noselect');
    anchor.appendChild(dummy);
    anchor.classList.add('anchor');
    MTWTranslator.selectedRegion.insertNode(anchor);

    function handler(e) {
      this.removeEventListener('click', handler);
      anchor.parentNode.removeChild(anchor);
    }
    window.addEventListener('click', handler);
  }
});

function notify(message, url) {

  var extensionID = window.localStorage.getItem('extensionID');
  var baseUrl = 'chrome-extension://' + extensionID;

  var notification = new Notification('Mind The Word', {
    icon: baseUrl + '/assets/img/48.png',
    body: message,
  });

  notification.onclick = function() {
    window.open(url);
    this.close();
  };

  setTimeout(function() {
    notification.close();
  }, 10000);
}


var attempts = 1;
var time;
var timer;


/**
 * Generate the time interval
 */
function generateInteval() {
  return (Math.pow(2, attempts) - 1) * 1000;
}


/**
 * Test the connection
 * @param {url} string - url of the translator service to connect to
 */
function testConnection(url) {
  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function() {

    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.statusText !== '' || xhr.status === 200) {
        connection('success', url);
        return;
      } else {
        time = generateInteval(attempts);
        attempts++;
        reset = true;
        connection('fail', url, time);
        return;
      }
    }
  };

  xhr.open('GET', url);
  xhr.send();
}

/**
 * Handle the connection status
 * @param {status} string - status of connection
 * @param {url} string - url of the translator service to connect to
 * @param {time} string - time interval for next connection
 */
function connection(status, url = '', time = '') {

  var tempTime = parseInt(time / 1000);
  var mtwReconnectTime = document.getElementById('mtw-reconnect-time');
  var mtwConnectionHead = document.getElementById('mtw-connection-head');
  var mtwReconnect = document.getElementById('mtw-reconnect-now');

  if (status === 'success') {
    if (mtwConnectionHead) {
      mtwConnectionHead.parentNode.removeChild(mtwConnectionHead);
    }
  } else if (mtwConnectionHead) {
    clearInterval(timer);
    if (status === 'fail') {

      timer = setInterval(function() {
        if (tempTime === 0) {
          mtwReconnectTime.innerHTML = 'Connecting';
          mtwReconnect.style.display = 'none';
          testConnection(url);
          clearInterval(timer);
          return;
        }
        mtwReconnectTime.innerHTML = 'Could not connect to Translator Service Reconnecting in ' + tempTime + 's  &nbsp;....&nbsp;';
        mtwReconnect.style.display = 'inline';
        tempTime--;
      }, 1000);
    } else {
      mtwReconnectTime.innerHTML = 'Connection Successful';
      mtwReconnect.style.display = 'none';
      mtwConnectionHead.style.background = 'green';

      setTimeout(function() {
        mtwConnectionHead.parentNode.removeChild(mtwConnectionHead);
      }, 500);
    }
  } else {
    mtwConnectionHead = document.createElement('div');
    var styleConnectionHead = 'position: fixed; top:0;width: 100%; display: flex; justify-content: center; align-items: center; background: red; padding: 0.5em 0; color: white !important; font-size: 0.9em; z-index: 1000;';
    mtwConnectionHead.setAttribute('id', 'mtw-connection-head');
    mtwConnectionHead.setAttribute('style', styleConnectionHead);
    mtwConnectionHead.innerHTML = '<div><strong>MTW:</strong>  <span id="mtw-reconnect-time">Could not connect to Translator Service Reconnecting in ' + tempTime + 's  &nbsp;....&nbsp;</span><span id="mtw-reconnect-now"  style="cursor:pointer;"><strong>Reconnect Now</strong></span> </div> <span id="mtw-connection-cross" style="position: absolute; right: 1em; font-size: 1.2em;cursor:pointer;">✕</span> </div>';
    if (status === 'fail')
      document.querySelector('body').appendChild(mtwConnectionHead);


    mtwReconnectTime = document.getElementById('mtw-reconnect-time');
    mtwReconnect = document.getElementById('mtw-reconnect-now');
    mtwConnectCross = document.getElementById('mtw-connection-cross');

    try {
      mtwReconnect.addEventListener('click', function() {
        attempts = 1;
        mtwReconnectTime.innerHTML = 'Connecting';
        mtwReconnect.style.display = 'none';
        testConnection(url);
      });

      mtwConnectCross.addEventListener('click', function() {
        attempts = 1;
        mtwConnectionHead.parentNode.removeChild(mtwConnectionHead);
      });
    } catch (e) {
      console.log(e);
    }
    testConnection(url);
  }
}
