import angular from 'angular';
import $ from 'jquery';
import bootstrap from 'bootstrap';
import bootstrapcolorpicker from '../../assets/js/bootstrap-colorpicker.min.js';
import { startFrom } from '../filters/startFrom';
import * as lang from '../utils/languages';
import { localData } from '../utils/defaultStorage';
import { saveFile } from '../utils/saveFile';
import { getCurrentMonth, getCurrentDay } from '../utils/dateAndTimeHelpers';
import { localizeHtmlPage } from '../utils/localizeHelper';
import { QuizzingSentence, QuizzingOral, QuizzingAural } from '../services/quizzing';
import { ProgressActivity } from '../utils/progressActivity';

/** Class for option page angular controller */
export class OptionCtrl {
  /**
     * Initialize options page data and jQuery
     * @constructor
     * @param {Object} $scope - Angular scope
     * @param {Object} $timeout - Angular timeout
     */
  constructor($scope, $timeout) {
    this.$timeout = $timeout;
    this.$scope = $scope;
    this.patterns = {};
    this.logMessages = [];
    this.key = '';
    this.blacklistedWords = [];
    this.learntWords = [];
    this.learntWordPage = 0;
    this.blacklistedWebsites = [];
    this.blacklistWordPage = 0;
    this.blacklistWebsitePage = 0;
    this.translator = '';
    this.userDefinedTranslationList = [];
    this.userDefinedTranslations = {};
    this.userDefinedTranslationPage = 0;
    this.yandexTranslatorApiKey = '';
    this.googleTranslatorApiKey = '';
    this.azureTranslatorApiKey = '';
    this.minWordLength = 3;
    this.ngramMin = 1;
    this.ngramMax = 1;
    this.cssOptions = [];
    this.percentage = '15';
    this.original = '';
    this.translated = '';
    this.newBlacklistWord = '';
    this.newlearntWord = '';
    this.newBlacklistWebsite = '';
    this.voiceName = 'Google US English';
    this.pitch = 1.0;
    this.volume = 0.5;
    this.rate = 1.0;
    this.languages = {};
    this.savedTranslations = {};
    this.savedTranslationList = [];
    this.savedTranslationPage = 0;
    this.userDefinedOnly = false;
    this.doNotTranslate = false;
    this.useCommonWordsOnly = false;
    this.stats = {};
    this.optionalAPI = '';
    this.activationToggles = 0;
    this.wordToggles = 0;
    this.translatedWordsForQuiz = {};
    this.quizAnswers = [];
    this.pageReload = function() { window.location.reload(true); };
    this.keyAlert = false;
    this.numberOfApiCalls = {};
    this.currentMonth = getCurrentMonth();
    this.currentDay = getCurrentDay();
    this.yandexDailyLimit;
    this.yandexMonthlyLimit;
    this.getData();
    this.setup();
    this.handleNetworkError();
    this.$scope.srcLang = this.srcLang;
    this.$scope.targetLang = this.targetLang;
    this.$scope.CommonButtonStyle = {
      'background-color': 'rgb(237, 215, 255)',
      'cursor': 'not-allowed',
      'pointer-events': 'none'
    };
    this.initiateActivityProgress();

  }

  initiateActivityProgress() {
    if (document.getElementById('activity-progress-chart') !== null) {
      chrome.storage.local.get(['activityProgressStore'], res => {
        this.obj = new ProgressActivity('#activity-progress-chart', 2000, 400, 800);
        this.obj.generate(res.activityProgressStore);
      });
    } else {
      setTimeout(() => {
        this.initiateActivityProgress();
      }, 1000);
    }
  }

  getData() {
    chrome.storage.local.get(null, (data) => {
      console.log(data);
      this.logMessages = JSON.parse(data.logMessages);
      this.patterns = JSON.parse(data.savedPatterns);
      this.key = data.yandexTranslatorApiKey;

      this.blacklistedWords = data.userBlacklistedWords.slice(1, -1).split('|').filter(function(n) { return n !== ''; });
      this.blacklistedWebsites = data.blacklist.slice(1, -1).split('|').filter(function(n) { return n !== ''; });

      this.detailsApiKey = data.detailsApiKey;
      this.translatorService = data.translatorService;
      this.userDefinedTranslations = JSON.parse(data.userDefinedTranslations);
      this.userDefinedTranslationList = this.toList(this.userDefinedTranslations);
      this.yandexTranslatorApiKey = data.yandexTranslatorApiKey;
      this.googleTranslatorApiKey = data.googleTranslatorApiKey;
      this.azureTranslatorApiKey = data.azureTranslatorApiKey;
      this.minWordLength = data.minimumSourceWordLength;
      this.ngramMin = data.ngramMin;
      this.ngramMax = data.ngramMax;
      this.cssOptions = data.translatedWordStyle.split(';');
      this.translatedWordStyle = data.translatedWordStyle;
      let playbackOptions = JSON.parse(data.playbackOptions);
      this.voiceName = playbackOptions.voiceName;
      this.pitch = playbackOptions.pitch;
      this.volume = playbackOptions.volume;
      this.rate = playbackOptions.rate;
      this.learntWords = data.learntWords.slice(1, -1).split('|');
      //remove empty strings from the array in case learntWords is empty
      this.learntWords = this.learntWords.filter(function(n) { return n !== ''; });
      this.savedTranslations = JSON.parse(data.savedTranslations);
      this.savedTranslationList = this.toList(this.savedTranslations);
      this.userDefinedOnly = data.userDefinedOnly;
      this.doNotTranslate = data.doNotTranslate;
      this.useCommonWordsOnly = data.useCommonWordsOnly;
      this.srcLang = data.sourceLanguage;
      this.targetLang = data.targetLanguage;
      this.stats = data.stats;
      this.activationToggles = data.activationToggles;
      this.wordToggles = data.wordToggles;
      this.translatedWordsForQuiz = JSON.parse(data.translatedWordsForQuiz);
      this.oneWordTranslation = data.oneWordTranslation;
      this.optionalAPI = data.optionalAPI;
      //randomly selected 10 words for the quiz
      this.randomTranslatedWordsForQuiz = this.randomlySelectTenWords(this.translatedWordsForQuiz);
      this.translatedWordsExist = Object.keys(this.randomTranslatedWordsForQuiz).length === 0 ? false : true;
      this.quizOptions = this.getShuffledValues(this.randomTranslatedWordsForQuiz);
      this.date = new Date();
      this.yandexMonthlyLimit = this.getYandexLimit('monthly');
      this.yandexDailyLimit = this.getYandexLimit('daily');
      this.setKeyAlert();
      this.intializeStyleOptions();
      this.blurCommonWordsButton();
      this.QuizzingSentence = new QuizzingSentence(
        'quiz-sentence-question',
        this.srcLang,
        this.targetLang,
        this.$scope,
        this.translatorService,
        this.yandexTranslatorApiKey,
        this.googleTranslatorApiKey,
        this.azureTranslatorApiKey
      );
      this.QuizzingOral = new QuizzingOral(
        'messageUserSpeechID',
        this.srcLang,
        this.targetLang,
        this.$scope,
        this.translatorService,
        this.yandexTranslatorApiKey,
        this.googleTranslatorApiKey,
        this.azureTranslatorApiKey
      );
      this.QuizzingAural = new QuizzingAural(
        'quiz-aural-question',
        this.srcLang,
        this.targetLang,
        this.$scope,
        this.translatorService,
        this.yandexTranslatorApiKey,
        this.googleTranslatorApiKey,
        this.azureTranslatorApiKey
      );
      this.$timeout(() => {
        this.$scope.$apply();
      });
      // this.blurCommonWordsButton();

    });
  }

  getYandexLimit(period) {
    if (this.stats['translatorWiseWordCount'][0][this.currentMonth]) {
      var limit;
      switch (period) {
        case 'monthly':
          limit = (this.stats['translatorWiseWordCount'][0][this.currentMonth]['Yandex'][2] / 10000000) * 100;
          break;
        case 'daily':
          limit = (this.stats['translatorWiseWordCount'][1][this.currentDay]['Yandex'][2] / 1000000) * 100;
          break;
      }
      if (limit > 100) {
        return 100.00;
      } else
        return parseFloat(limit).toFixed(2);
    }
  }

  getShuffledValues(obj) {
    var dataArray = Object.keys(obj).map(function(k) { return obj[k]; });
    for (var i = dataArray.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = dataArray[i];
      dataArray[i] = dataArray[j];
      dataArray[j] = temp;
    }
    return dataArray;
  }

  setup() {

    localizeHtmlPage();

    $('#text-colorpicker').colorpicker().on('changeColor', (data) => {
      this.setTextColor(data);
    });
    $('#bg-colorpicker').colorpicker().on('changeColor', (data) => {
      this.setBackgroundColor(data);
    });
    $(function() {
      $('[data-toggle="tooltip"]').tooltip();
    });
  }

  status(text, duration, fade, type) {
    (function(text, duration, fade) {
      var status = document.createElement('div');
      status.className = 'alert alert-' + type + ' fixed-bottom';
      status.innerText = text;
      var prev_status = document.getElementById('status');
      while(prev_status.hasChildNodes())
      {
        prev_status.removeChild(prev_status.firstElementChild);
      }
      prev_status.appendChild(status);

      setTimeout(() => {
        var opacity = 1,
          ntrvl = setInterval(() => {
            if (opacity <= 0.01) {
              clearInterval(ntrvl);
            }
            status.style.opacity = opacity;
            opacity -= (1 / fade);
          }, 1);
      }, (duration - fade));
    })(text, duration, fade);
  }

  save(data, successMessage) {
    chrome.storage.local.set(data, (error) => {
      if (error) {
        this.status('Error Occurred. Please refresh.', 1000, 100, 'danger');
      } else {
        if (successMessage.length) {
          this.status(successMessage, 1000, 100, 'success');
        }
      }
    });
  }

  range(number) {
    return new Array(Math.ceil(number / 4));
  }

  hashRange(hash) {
    return new Array(Math.ceil((Object.keys(hash).length) / 4));
  }

  randomlySelectTenWords(translatedWords) {
    var keys = Object.keys(translatedWords);
    this.translatedWordsExist = keys.length === 0 ? false : true;
    var result = {};
    for (var i = 0; i < 10; i++) {
      let randomKey = keys[Math.round(Math.random() * (keys.length - 0) + 0)];
      if (typeof randomKey !== 'undefined') {
        result[randomKey] = translatedWords[randomKey];
      }
      let index = keys.indexOf(randomKey);
      if (index > -1) {
        keys.splice(index, 1);
      }
    }
    return result;
  }

  /*****************************PATTERN FUNCTIONS*****************************/

  activatePattern(index) {
    if (this.hasKey(this.patterns[index][4])) {
      this.status('You do not have a key to for the translator', 2000, 100, 'danger');
    } else {
      this.deactivatePatterns();
      this.patterns[index][3] = true;
      this.userDefinedOnly = false;
      this.doNotTranslate = false;
      this.translatorService = this.patterns[index][4];
      this.save({
        translatorService: this.patterns[index][4],
        translationProbability: this.patterns[index][2],
        sourceLanguage: this.patterns[index][0][0],
        targetLanguage: this.patterns[index][1][0],
        savedPatterns: JSON.stringify(this.patterns),
        userDefinedOnly: false,
        cwAvailable: false,
        cwMap: false,
        doNotTranslate: false
      }, 'Activated Pattern');
    }
    this.$timeout(() => {
      this.$scope.$apply();
    });
    this.getData();
    this.blurCommonWordsButton();
  }

  createPattern() {
    if (this.srcLang === undefined || this.targetLang === undefined) {
      this.status('Please select a valid language', 1000, 100, 'danger');
    } else {
      var patterns = this.patterns,
        src = [],
        trg = [],
        prb,
        duplicateInput = false, //to check duplicate patterns
        translator = this.translator;

      src[0] = document.getElementById('srcLang');
      src[1] = this.srcLang;
      src[2] = src[0].children[src[0].selectedIndex].text;
      trg[0] = document.getElementById('targetLang');
      trg[1] = this.targetLang;
      trg[2] = trg[0].children[trg[0].selectedIndex].text;
      prb = this.percentage;

      for (var index in patterns) {
        if (patterns[index][0][0] === src[1] && patterns[index][1][0] === trg[1] && patterns[index][2] === prb && patterns[index][4] === translator) {
          duplicateInput = true;
          this.status('Pattern already exists', 1000, 100, 'danger');
        }
      }
      if (duplicateInput === false) {
        this.deactivatePatterns();
        this.doNotTranslate = false;
        this.userDefinedOnly = false;
        this.patterns.push([
          [src[1], src[2]],
          [trg[1], trg[2]],
          prb,
          true,
          translator,
          0
        ]);
        this.translatorService = translator;
        this.$timeout(() => {
          this.$scope.$apply();
        });
        this.save({
          savedPatterns: JSON.stringify(this.patterns),
          doNotTranslate: false,
          userDefinedOnly: false,
          translatorService: translator,
          translationProbability: prb,
          cwAvailable: false,
          cwMap: false,
          sourceLanguage: src[1],
          targetLanguage: trg[1]
        }, 'Created New Pattern');
      }
    }
    this.blurCommonWordsButton();
  }

  deletePattern(index, event) {
    event.stopPropagation();
    var activatedPattern = -1;
    for (let i in this.patterns) {
      if (this.patterns[i][3] === true) {
        activatedPattern = i;
      }
    }
    if (index === parseInt(activatedPattern)) {
      if (this.oneWordTranslation) {
        this.toggleOneWordTranslation();
      }
      this.deleteActivationData();
    }
    this.patterns.splice(index, 1);
    this.$timeout(() => {
      this.$scope.$apply();
    });
    this.save({
      savedPatterns: JSON.stringify(this.patterns)
    }, 'Deleted Pattern');
    this.getData();
    this.blurCommonWordsButton();
  }

  deleteActivationData() {
    this.translatorService = '';
    // using chrome storage because we don't want any message to be displayed
    chrome.storage.local.set({
      translatorService: '',
      translationProbability: '',
      sourceLanguage: '',
      targetLanguage: ''
    });
  }

  changeTranslator() {
    switch (this.translator) {
      case 'Yandex':
        this.languages = lang.yandexLanguages;
        break;
      case 'Google':
        this.languages = lang.googleLanguages;
        break;
      case 'Azure':
        this.languages = lang.azureLanguages;
        break;
      default:
        this.key = '';
    }
    this.$timeout(() => {
      this.$scope.$apply();
    });
  }

  changeApiKey(translator) {
    var stats = this.stats;
    switch (translator) {
      case 'Yandex':
        if (/^\s*$/.test(this.yandexTranslatorApiKey) && this.translatorService === 'Yandex') {
          this.deactivatePatterns();
          this.toggleDoNotTranslate();
        }
        if (stats['translatorWiseWordCount'][0][this.currentMonth]) {
          stats['translatorWiseWordCount'][0][this.currentMonth]['Yandex'][2] = 0;
          stats['translatorWiseWordCount'][1][this.currentDay]['Yandex'][2] = 0;
        }
        /* split is used to remove the extra strings that get added
                at the ended of the copied Yandex key*/
        this.save({
          yandexTranslatorApiKey: this.yandexTranslatorApiKey.split(' ')[0],
          'stats': stats
        }, 'Updated Yandex API Key');
        break;
      case 'Google':
        if (/^\s*$/.test(this.googleTranslatorApiKey) && this.translatorService === 'Google') {
          this.deactivatePatterns();
          this.toggleDoNotTranslate();
        }
        if (stats['translatorWiseWordCount'][0][this.currentMonth]) {
          stats['translatorWiseWordCount'][0][this.currentMonth]['Google'][2] = 0;
          stats['translatorWiseWordCount'][1][this.currentDay]['Google'][2] = 0;
        }
        this.save({
          googleTranslatorApiKey: this.googleTranslatorApiKey,
          'stats': stats
        }, 'Updated Google API key');
        break;
      case 'Azure':
        if (/^\s*$/.test(this.azureTranslatorApiKey) && this.translatorService === 'Azure') {
          this.deactivatePatterns();
          this.toggleDoNotTranslate();
        }
        this.save({
          azureTranslatorApiKey: this.azureTranslatorApiKey
        }, 'Updated Azure API Key');
        break;
      default:
        console.error('No such translator supported');
    }
    this.blurCommonWordsButton();
  }

  setDetailsApi() {
    if (this.detailsApiKey) {
      this.save({
        detailsApiKey: this.detailsApiKey
      }, 'Updated Details API Key');
    }
  }

  deactivatePatterns() {
    for (let i in this.patterns) {
      this.patterns[i][3] = false;
    }
  }

  toggleOptionalAPI() {
    chrome.storage.local.set({optionalAPI: this.optionalAPI});
  }

  toggleDoNotTranslate() {
    this.deactivatePatterns();
    this.doNotTranslate = true;
    this.userDefinedOnly = false;
    this.oneWordTranslation = false;
    this.useCommonWordsOnly = false;
    this.save({
      translatorService: '',
      translationProbability: '',
      sourceLanguage: '',
      targetLanguage: '',
      savedPatterns: JSON.stringify(this.patterns),
      doNotTranslate: true,
      useCommonWordsOnly: false,
      userDefinedOnly: false,
      oneWordTranslation: false
    }, 'Turned off Translations');
    this.$timeout(() => {
      this.$scope.$apply();
    });
  }

  toggleUserDefinedOnly() {
    this.deactivatePatterns();
    this.userDefinedOnly = true;
    this.doNotTranslate = false;
    this.oneWordTranslation = false;
    this.useCommonWordsOnly = false;
    this.save({
      translatorService: '',
      translationProbability: '',
      sourceLanguage: '',
      targetLanguage: '',
      savedPatterns: JSON.stringify(this.patterns),
      doNotTranslate: false,
      useCommonWordsOnly: false,
      userDefinedOnly: true,
      oneWordTranslation: false
    }, 'User Defined Translations only');
    this.$timeout(() => {
      this.$scope.$apply();
    });
  }

  toggleOneWordTranslation() {
    if (this.translatorService === '') {
      this.status('Please select a Pattern', 1000, 100, 'danger');
    } else {
      this.userDefinedOnly = false;
      this.doNotTranslate = false;
      this.useCommonWordsOnly = false;
      this.oneWordTranslation = !this.oneWordTranslation;
      this.save({
        doNotTranslate: false,
        userDefinedOnly: false,
        useCommonWordsOnly: false,
        oneWordTranslation: this.oneWordTranslation
      }, 'Toggle one word per sentence');
      this.$timeout(() => {
        this.$scope.$apply();
      });
    }
  }

  toggleCommonWordsOnly() {
    if (this.translatorService === '') {
      this.status('Please select a Pattern', 1000, 100, 'danger');
    } else {
      this.userDefinedOnly = false;
      this.doNotTranslate = false;
      this.oneWordTranslation = false;
      this.useCommonWordsOnly = !this.useCommonWordsOnly;
      this.save({
        doNotTranslate: false,
        userDefinedOnly: false,
        oneWordTranslation: false,
        useCommonWordsOnly: this.useCommonWordsOnly
      }, 'Toggle Common Words Only');
      this.$timeout(() => {
        this.$scope.$apply();
      });
    }
  }

  blurCommonWordsButton() {
    var commonWordsURI = chrome.extension.getURL('../common/' + this.srcLang + '.json');
    var commonWords = fetch(commonWordsURI)
      .then(function(result) {
        return result.json();
      })
      .then(function(result) {
        return result;
      }).catch(() => {
        return 'not found';
      });
    commonWords.then(response => {
      if (response !== 'not found') {
        this.$scope.CommonButtonStyle = '';
      } else {
        this.$scope.CommonButtonStyle = {
          'background-color': 'rgb(237, 215, 255)',
          'cursor': 'not-allowed',
          'pointer-events': 'none'
        };
        this.save({
          useCommonWordsOnly: false
        }, '');
        this.$timeout(() => {
          this.$scope.$apply();
        });
      }
    });
  }

  setKeyAlert() {
    switch (this.translatorService) {
      case 'Google':
        if (this.googleTranslatorApiKey === '') {
          this.keyAlert = true;
        }
        break;
      case 'Yandex':
        if (this.yandexTranslatorApiKey === '') {
          this.keyAlert = true;
        }
        break;
      case 'Azure':
        if (this.azureTranslatorApiKey === '') {
          this.keyAlert = true;
        }
        break;
    }
    this.$timeout(() => {
      this.$scope.$apply();
    });
  }

  hasKey(translator) {
    switch (translator) {
      case 'Google':
        return /^\s*$/.test(this.googleTranslatorApiKey);
      case 'Yandex':
        return /^\s*$/.test(this.yandexTranslatorApiKey);
      case 'Azure':
        return /^\s*$/.test(this.azureTranslatorApiKey);
      default:

    }
  }

  noKeys() {
    if (!/^\s*$/.test(this.googleTranslatorApiKey) || !/^\s*$/.test(this.yandexTranslatorApiKey) || !/^\s*$/.test(this.azureTranslatorApiKey)) {
      return false;
    }
    return true;
  }
  /******************************************************************************/

  updatePlaybackOptions() {
    var playbackOpts = JSON.stringify({
      'volume': this.volume,
      'rate': this.rate,
      'voiceName': this.voiceName,
      'pitch': this.pitch
    });
    this.save({ playbackOptions: playbackOpts }, 'Updated Playback Options');
  }

  /************************ BLACKLISTING FUNCTIONS ****************************/

  addBlackListedWord() {
    if (/^\s*$/.test(this.newBlacklistWord) === false && this.blacklistedWords.indexOf(this.newBlacklistWord) === -1) {
      this.blacklistedWords.push(this.newBlacklistWord.trim());
      this.newBlacklistWord = '';
      this.blacklistWordPage = this.range(this.blacklistedWords.length).length - 1;
      this.$timeout(() => {
        this.$scope.$apply();
      });
      this.save({
        userBlacklistedWords: '(' + this.blacklistedWords.join('|') + ')'
      }, 'Blacklisted Word');
    }
  }

  removeBlackListedWord(word) {
    this.blacklistedWords.splice(this.blacklistedWords.indexOf(word), 1);
    // check if the word is last on the page
    if (this.blacklistedWords.length % 4 === 0) {
      this.blacklistWordPage -= 1;
    }
    this.$timeout(() => {
      this.$scope.$apply();
    });
    this.save({
      userBlacklistedWords: '(' + this.blacklistedWords.join('|') + ')'
    }, 'Whitelisted Word');
  }

  addBlackListedWebsite() {
    if (/^\s*$/.test(this.newBlacklistWebsite) === false && this.blacklistedWebsites.indexOf(this.newBlacklistWebsite) === -1) {
      this.blacklistedWebsites.push(this.newBlacklistWebsite.trim());
      this.newBlacklistWebsite = '';
      this.blacklistWebsitePage = this.range(this.blacklistedWebsites.length).length - 1; //set to last page
      this.$timeout(() => {
        this.$scope.$apply();
      });
      this.save({
        blacklist: '(' + this.blacklistedWebsites.join('|') + ')'
      }, 'Blacklisted Website');
    }
  }

  removeBlackListedWebsite(website) {
    this.blacklistedWebsites.splice(this.blacklistedWebsites.indexOf(website), 1);
    // check if the website is last on the page
    if (this.blacklistedWebsites.length % 4 === 0) {
      this.blacklistWebsitePage -= 1;
    }
    this.$timeout(() => {
      this.$scope.$apply();
    });
    this.save({
      blacklist: '(' + this.blacklistedWebsites.join('|') + ')'
    }, 'Whitelisted Website');
  }

  updateWordToggles() {
    this.save({
      wordToggles: this.wordToggles
    }, 'Updated Maximum Word Toggles');
  }

  updateActivationToggles() {
    this.save({
      activationToggles: this.activationToggles
    }, 'Updated Maximum Activation Toggles');
  }

  /*****************************************************************************/
  /************************ USER TRANSLATION FUNCTIONS ****************************/

  toList(data) {
    let list = [];
    for (let i in data) {
      list.push([i, data[i]]);
    }
    return list;
  }

  addUserDefinedTranslation() {
    if (/^\s*$/.test(this.original) === false && /^\s*$/.test(this.translated) === false) {
      this.userDefinedTranslations[this.original] = this.translated;
      this.userDefinedTranslationList = this.toList(this.userDefinedTranslations);
      this.userDefinedTranslationPage = this.range(this.userDefinedTranslationList.length).length - 1;
      this.original = '';
      this.translated = '';
      this.$timeout(() => {
        this.$scope.$apply();
      });
      this.save({
        userDefinedTranslations: JSON.stringify(this.userDefinedTranslations)
      }, 'Added Translation');
    }
  }

  removeUserDefinedTranslation(original) {
    delete this.userDefinedTranslations[original];
    this.userDefinedTranslationList = this.toList(this.userDefinedTranslations);
    if (this.userDefinedTranslationList.length % 4 === 0) {
      this.userDefinedTranslationPage -= 1;
    }
    this.$timeout(() => {
      this.$scope.$apply();
    });
    this.save({
      userDefinedTranslations: JSON.stringify(this.userDefinedTranslations)
    }, 'Removed Translation');
  }

  saveTranslation() {
    if (/^\s*$/.test(this.original) === false && /^\s*$/.test(this.translated) === false) {
      this.savedTranslations[this.original] = this.translated;
      this.savedTranslationList = this.toList(this.savedTranslations);
      this.savedTranslationPage = this.range(this.savedTranslationList.length).length - 1;
      this.original = '';
      this.translated = '';
      this.$timeout(() => {
        this.$scope.$apply();
      });
      this.save({
        savedTranslations: JSON.stringify(this.savedTranslations)
      }, 'Added Translation');
    }
  }

  removeSavedTranslation(original) {
    delete this.savedTranslations[original];
    this.savedTranslationList = this.toList(this.savedTranslations);
    if (this.savedTranslationList.length % 4 === 0) {
      this.savedTranslationPage -= 1;
    }
    this.$timeout(() => {
      this.$scope.$apply();
    });
    this.save({
      savedTranslations: JSON.stringify(this.savedTranslations)
    }, 'Removed Translation');
  }

  /*****************************************************************************/

  /************************ LEARNT WORDS FUNCTIONS ****************************/

  addLearntWord() {
    if (/^\s*$/.test(this.newLearntWord) === false && this.learntWords.indexOf(this.newLearntWord) === -1) {
      this.learntWords.push(this.newLearntWord.trim());
      this.newLearntWord = '';
      this.learntWordPage = this.range(this.learntWords.length).length - 1;
      this.$timeout(() => {
        this.$scope.$apply();
      });
      this.save({
        learntWords: '(' + this.learntWords.join('|') + ')'
      }, 'New learnt word added');
    }
  }

  removeLearntWord(word) {
    this.learntWords.splice(this.learntWords.indexOf(word), 1);
    // TODO: check pagination!
    // check if the word is last on the page
    if (this.learntWords.length % 4 === 0) {
      this.learntWordPage -= 1;
    }
    this.$timeout(() => {
      this.$scope.$apply();
    });
    this.save({
      learntWords: '(' + this.learntWords.join('|') + ')'
    }, 'Removed from learnt list');
  }

  /*****************************************************************************/

  /************************ WORD CONFIGURATION FUNCTIONS ****************************/

  setMinWordLength() {
    // add error checks
    this.save({ minimumSourceWordLength: this.minWordLength }, 'Changed minimum Word Length');
  }

  setNgramMin() {
    // error checks
    this.save({ ngramMin: this.ngramMin }, 'Changed minimum N-gram');
  }

  setNgramMax() {
    // error checks
    this.save({ ngramMax: this.ngramMax }, 'Changed maximum N-gram');
  }

  /****************************************************************************/

  /************************ STATS FUNCTIONS ****************************/

  resetTotalWordCount() {
    this.stats.totalWordsTranslated = 0;
    this.save({ stats: this.stats }, 'Total translated word count has been reset');
  }

  /*****************************************************************************/

  /************************ DEFAULT COLOR SETTINGS ****************************/
  defaultColor()
  { this.textColor = 'rgba(255,153,0,1)';
    this.backColor =  'rgba(256, 100, 50, 0)';
    this.cssOptions[1] = 'color: rgba(255,153,0,1)';
    this.translatedWordStyle = this.cssOptions.join(';');
    this.$timeout(() => {
      this.$scope.$apply();
    });
    this.cssOptions[2] = 'background-color: rgba(256, 100, 50, 0)';
    this.translatedWordStyle = this.cssOptions.join(';');
    this.$timeout(() => {
      this.$scope.$apply();
    });
    // calling chrome.storage directly because we don't want success message
    chrome.storage.local.set({ translatedWordStyle: this.cssOptions.join(';') });
  }

  /****************************************************************************/

  /************************ ADJUSTMENT FUNCTIONS ****************************/

  intializeStyleOptions() {
    this.textColor = this.cssOptions[1].split(':')[1];
    this.backColor = this.cssOptions[2].split(':')[1];
  }

  setTextColor(data) {
    this.cssOptions[1] = 'color:' + data.color.toHex();
    this.translatedWordStyle = this.cssOptions.join(';');
    this.$timeout(() => {
      this.$scope.$apply();
    });
    // calling chrome.storage directly because we don't want success message
    chrome.storage.local.set({ translatedWordStyle: this.cssOptions.join(';') });
  }

  setBackgroundColor(data) {
    this.cssOptions[2] = 'background-color:' + data.color.toHex();
    this.translatedWordStyle = this.cssOptions.join(';');
    this.$timeout(() => {
      this.$scope.$apply();
    });
    // calling chrome.storage directly because we don't want success message
    chrome.storage.local.set({ translatedWordStyle: this.cssOptions.join(';') });
  }

  /**************************************************************************/

  /****************************** BACKUP FUNCTIONS ***********************/

  resetConfig() {
    chrome.storage.local.clear();
    chrome.storage.local.set(localData);
    window.location.reload();
  }

  deleteKeys() {
    this.yandexTranslatorApiKey = '';
    this.googleTranslatorApiKey = '';
    this.azureTranslatorApiKey = '';
    this.save({
      yandexTranslatorApiKey: '',
      googleTranslatorApiKey: '',
      azureTranslatorApiKey: ''
    }, 'Removed all API Keys');
    this.$timeout(() => {
      this.$scope.$apply();
    });
  }

  backupAll() {
    chrome.storage.local.get(null, (data) => {
      saveFile(data, 'mtw_config.txt');
    });
  }

  validateKeysFile(data) {
    if ('googleTranslatorApiKey' in data && 'azureTranslatorApiKey' in data && 'yandexTranslatorApiKey' in data) {
      return true;
    } else {
      return false;
    }
  }

  scanCheckbox() {
    var statusAllSettings = document.getElementById('backup-allSettings').checked,
      statusAllKeys = document.getElementById('backup-allKeys').checked,
      statusAllLearnt= document.getElementById('backup-allLearnt').checked,
      statusAllSaved = document.getElementById('backup-allSaved').checked,
      fileStore = {
        'keys': {
          'azureTranslatorApiKey':'',
          'googleTranslatorApiKey': '',
          'yandexTranslatorApiKey': ''
        },
        'saved': '',
        'learnt': ''
      };

    if (!statusAllSettings && !statusAllKeys && !statusAllLearnt && !statusAllSaved) { // when none of the checkbox is checked
      alert('No options selected! Please select the required option to backup');
    } else if (statusAllSettings) {
      this.backupAll();
    } else {
      if (statusAllKeys) {
        chrome.storage.local.get(['googleTranslatorApiKey', 'azureTranslatorApiKey', 'yandexTranslatorApiKey'], (data) => {
          fileStore.keys.azureTranslatorApiKey = data.azureTranslatorApiKey;
          fileStore.keys.yandexTranslatorApiKey = data.yandexTranslatorApiKey;
          fileStore.keys.googleTranslatorApiKey = data.googleTranslatorApiKey;
        });
      }
      if (statusAllLearnt) {
        chrome.storage.local.get('learntWords', (data) => {
          fileStore.learnt = data.learntWords;
        });
      }
      if (statusAllSaved) {
        chrome.storage.local.get('savedTranslations', (data) => {
          fileStore.saved = data.savedTranslations;
        });
      }
      setTimeout(() => {
        saveFile(JSON.stringify(fileStore), 'mtw_backup.txt');
      }, 1000);
    }
  }

  validateSavedTrans(data) {
    if ('saved' in data) {
      return true;
    } else {
      return false;
    }
  }

  validateLearntWords(data) {
    if ('learnt' in data) {
      return true;
    } else {
      return false;
    }
  }

  restoreKeys() {
    let fileInput = document.getElementById('restores-file');

    fileInput.addEventListener('change', (e) => {
      let file = fileInput.files[0],
        textType = /text.*/;

      if (file.type.match(textType)) {
        let reader = new FileReader();
        reader.onload = (e) => {
          var data = JSON.parse(reader.result);
          data = JSON.parse(data);
          if (this.validateKeysFile(data.keys) && this.validateLearntWords(data) && this.validateSavedTrans(data)) {
            if (data.keys.azureTranslatorApiKey.length || data.keys.yandexTranslatorApiKey.length || data.keys.googleTranslatorApiKey.length) {
              this.googleTranslatorApiKey = data.keys.googleTranslatorApiKey;
              this.azureTranslatorApiKey = data.keys.azureTranslatorApiKey;
              this.yandexTranslatorApiKey = data.keys.yandexTranslatorApiKey;
              this.save(data.keys, 'Restored keys from file');
              this.$timeout(() => {
                this.$scope.$apply();
              });
            } if (data.learnt.length > 2) { // default null case is "()"
              this.learntWords = data.learnt;
              this.save({learntWords: data.learnt}, 'Restored Learnt Words from file');
              this.$timeout(() => {
                this.$scope.$apply();
              });
            } if (data.saved.length) {
              this.savedTranslations = data.saved;
              this.save({savedTranslations: data.saved}, 'Restored Saved Translations from file');
              this.$timeout(() => {
                this.$scope.$apply();
              });
            }
          } else {
            this.status('Corrupted File.', 2000, 100, 'danger');
          }
        };
        reader.readAsText(file);
      } else {
        this.status('Unsupported file format.', 2000, 100, 'danger');
      }
    });

    fileInput.click();
  }

  validateConfigFile(data) {
    if (Object.keys(localData).length !== Object.keys(data).length) {
      return false;
    }
    for (let i in localData) {
      if (i in data) {
        continue;
      } else {
        return false;
      }
    }
    return true;
  }

  restoreAll() {
    let fileInput = document.getElementById('config-file');

    fileInput.addEventListener('change', (e) => {
      let file = fileInput.files[0],
        textType = /text.*/;

      if (file.type.match(textType)) {
        let reader = new FileReader();
        reader.onload = (e) => {
          var config = JSON.parse(reader.result);
          if (this.validateConfigFile(config)) {
            this.save(config, 'Restored configuration from file');
            window.location.reload();
          } else {
            this.status('Corrupted File.', 2000, 100, 'danger');
          }
        };
        reader.readAsText(file);
      } else {
        this.status('Unsupported file format.', 2000, 100, 'danger');
      }
    });

    fileInput.click();
  }

  /**************************************************************************/

  /****************************** QUIZ FUNCTIONS ***********************/

  checkAnswer(index) {
    var words = Object.keys(this.randomTranslatedWordsForQuiz);
    if (this.quizAnswers[index] === this.randomTranslatedWordsForQuiz[words[index]]) {
      angular.element('#incorrect-result-' + index).hide();
      angular.element('#correct-result-' + index).show();
    } else {
      angular.element('#correct-result-' + index).hide();
      angular.element('#incorrect-result-' + index).show();
    }
  }

  generateNewQuiz() {
    this.randomTranslatedWordsForQuiz = this.randomlySelectTenWords(this.translatedWordsForQuiz);
    this.translatedWordsExist = Object.keys(this.randomTranslatedWordsForQuiz).length === 0 ? false : true;
    this.quizOptions = this.getShuffledValues(this.randomTranslatedWordsForQuiz);
  }
  /**************************************************************************/

  handleNetworkError() {
    var $this = this;
    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        if ($this.logMessages.indexOf(request) === -1) {

          $this.logMessages.push(request);

          $this.$timeout(() => {
            $this.$scope.$apply();
          });

          $this.save({
            logMessages: JSON.stringify($this.logMessages)
          }, 'Added Log');
        }

        sendResponse({ status: 1 });
      });
  }

  removeLogMessage(index) {
    this.logMessages.splice(index, 1);

    this.$timeout(() => {
      this.$scope.$apply();
    });

    this.save({
      logMessages: JSON.stringify(this.logMessages)
    }, 'Removed Log');
  }

  /**************************************************************************/

  /****************************** DASHBOARD FUNCTIONS ***********************/

  generateStats() {
    var wordsTranslatedArea = document.getElementById('wordsTranslatedArea').getContext('2d');
    var wordsTransPatterns = document.getElementById('wordsTransPatterns').getContext('2d');

    var wordsTransMonthYandex = this.stats['translatorWiseWordCount'][0][getCurrentMonth()]['Yandex'][0];
    var wordsTransMonthGoogle = this.stats['translatorWiseWordCount'][0][getCurrentMonth()]['Google'][0];
    var wordsTransMonthAzure = this.stats['translatorWiseWordCount'][0][getCurrentMonth()]['Azure'][0];

    var generateButton = document.getElementById('generateButton');

    var nOfLearntWords = document.getElementById('nOfLearntWords');
    var nOfBlacklistedWords = document.getElementById('nOfBlacklistedWords');
    var nOfSavedWords = document.getElementById('nOfSavedWords');
    var nOfTotalWords = document.getElementById('nOfTotalWords');
    var nOfBlacklistedWeb = document.getElementById('nOfBlacklistedWeb');
    var nOfUserDefined = document.getElementById('nOfUserDefined');

    if(generateButton.innerText === 'GENERATE'){
      generateButton.innerText = 'REFRESH';
    }

    var date = new Date;
    var year = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDate();
    var dateForm = new Date(month + '-' + day + '-' + year);
    var today = month + '-' + day + '-' + year;

    var daysArr = [];
    for(var i = 0; i < day; i++){
      daysArr.push(i + 1);
    }

    nOfLearntWords.innerText = this.learntWords.length;
    nOfBlacklistedWords.innerText = this.blacklistedWords.length;
    nOfSavedWords.innerText = this.savedTranslationList.length;
    nOfTotalWords.innerText = this.stats['totalWordsTranslated'];
    nOfBlacklistedWeb.innerText = this.blacklistedWebsites.length;
    nOfUserDefined.innerText = this.userDefinedTranslationList.length;

    chrome.storage.local.get(['nOfWordsTransEveryDay'], function(result) {
      var storeDataArr = result.nOfWordsTransEveryDay;
      var datePast30 = [];
      var wordsPast30 = [];

      for(var i = 0; i < storeDataArr.length;i++){

        var aDate = storeDataArr[i][0].split('-');
        aDate = new Date(aDate[0] + '-' + aDate[1] + '-' + aDate[2]);
        var daysBetween = parseInt(Math.abs(dateForm - aDate) / 1000 / 60 / 60 / 24);

        if(daysBetween <= 30){
          datePast30.push(storeDataArr[i][0]);
          wordsPast30.push(storeDataArr[i][1]);
        }
      }

      var chart = new Chart(wordsTranslatedArea, {
        type: 'line',
        data: {
          labels: datePast30,
          datasets: [{
            label: 'Number of words translated',
            backgroundColor: 'rgba(93, 147, 223, 0.5)',
            borderColor: 'rgb(51, 108, 232)',
            data: wordsPast30,
          }]
        },
        options: {
          legends: {
            labels : {
              fontColor: 'white',
            }
          },
          scales: {
            xAxes: [{
              gridLines: {
                display:false
              }
            }],
            yAxes: [{
              gridLines: {
                display:false
              }
            }]
          }
        }
      });
    });

    chrome.storage.local.get(['savedPatterns'], function(result) {
      var sPatterns = JSON.parse(result.savedPatterns);
      var patternsLabel = [];
      var patternsData = [];
      var patternsBackColor = [];
      var patternsBorderColor = [];

      for(var i = 0; i < sPatterns.length; i++){
        var nPattern = sPatterns[i][0][1] + ' to ' + sPatterns[i][1][1] + ' in ' + sPatterns[i][4];
        patternsLabel.push(nPattern);
        patternsData.push(sPatterns[i][5]);
        patternsBackColor.push('rgba(255, 255, 255, 0.5)');
        patternsBorderColor.push('rgba(255, 255, 255, 1)');

      }

      var myChart = new Chart(wordsTransPatterns, {
        type: 'bar',
        data: {
          labels: patternsLabel,
          datasets: [{
            label: '# of words by translators',
            data: patternsData,
            backgroundColor: patternsBackColor,
            borderColor: patternsBorderColor,
            borderWidth: 1
          }]
        },
        options: {
          legend: {
            labels : {
              fontColor: 'white',
            }
          },
          maintainAspectRatio: false,
          scales: {
            xAxes: [{
              ticks: {
                beginAtZero: true,
                fontColor: 'white'
              },
              gridLines: {
                drawBorder: false,
                display:false
              }
            }],
            yAxes: [{
              ticks: {
                beginAtZero: true,
                callback: function(value, index, values) {
                  return '';
                },
              },
              gridLines: {
                drawBorder: false,
                display:false
              }
            }]
          }
        }
      });

    });
  }

  quizPrimCheck() {
    let temp;

    // aural quiz
    chrome.tts.getVoices(voices => {
      if (voices.length === 0) {
        this.$scope.supportQuizAural = false;
      } else {
        this.$scope.supportQuizAural = true;
      }
    });

    // oral quiz
    temp = new webkitSpeechRecognition();
    if (temp === undefined) {
      this.$scope.supportQuizOral = false;
    } else {
      this.$scope.supportQuizOral = true;
    }
  }

  initialiseQuizWrapper() {
    this.quizPrimCheck();
    this.$scope.quizSimpleWordTranslation = false;
    this.$scope.quizSentenceTranslation = false;
    this.$scope.quizOralTranslation = false;
    this.$scope.quizAuralTranslation = false;
    this.$scope.quizSection = true;
    this.$scope.showResultQuizOral = false;
  }

  updateQuizSection(stats) {
    console.log(this.quizAddress);
    switch(stats) {
      case 'simpleWordQuiz':
        this.$scope.quizSection = false;
        this.$scope.quizSimpleWordTranslation = true;
        this.$scope.showListeningLabel = false;
        break;

      case 'quizSentence':
        this.$scope.quizSection = false;
        this.$scope.quizSentenceTranslation = true;
        document.getElementById('quiz-sentence-question').innerHTML = '';
        this.QuizzingSentence.setHeads();
        this.QuizzingSentence.createQuestions();
        break;
      
      case 'quizOral':
        this.$scope.quizSection = false;
        this.$scope.quizOralTranslation = true;
        this.QuizzingOral.initMessageDiv();
        this.QuizzingOral.setQuestions(this.translatedWordsForQuiz);
        break;

      case 'quizAural':
        this.$scope.quizSection = false;
        this.$scope.quizAuralTranslation = true;
        this.QuizzingAural.setQuestionWords(this.translatedWordsForQuiz);
        break;
    }
  }

  iterateQuizOralCount(val) {
    this.$scope.showListeningLabel = this.QuizzingOral.iterateOralCount(val);
  }

  quizValidateAnswer(code) {
    switch(code) {
      case 'quiz-oral-done':
        this.$scope.quizOralResult = this.QuizzingOral.checkAnswer(document.getElementById('messageUserSpeechID').value);
        this.$scope.showResultQuizOral = true;
        break;
    }
  }

  speak() {
    let t = document.getElementById('quiz-aural-question').getAttribute('answer');
    this.QuizzingAural.playAudio(t, this.targetLang);
  }

}

angular.module('MTWOptions', ['lazy-scroll'])
  .controller('OptionCtrl', OptionCtrl)
  .filter('startFrom', startFrom);