import { http } from '../utils/http';

/** Class for Bing translate feature */
export class AzureTranslate {
  /**
   * Initialize options and credentials
   * @constructor
   * @param {Object} key - client_id and client_secret
   * @param {string} srcLang - source languages
   * @param {string} targetLang - target language
   */
  constructor(key, srcLang, targetLang) {
    this.srcLang = srcLang;
    this.targetLang = targetLang;
    this.key = key;
    this.options = {
      baseUrl: 'https://api.cognitive.microsofttranslator.com',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-type': 'application/json',
        'X-ClientTraceId': this.getUUID()
      },
      body: []
    };
    this.url = this.options.baseUrl + '/translate?api-version=3.0'+'&from='+this.srcLang+'&to='+this.targetLang;
    this.testurl = 'https://api.cognitive.microsofttranslator.com/languages?api-version=3.0';
  }

  /**
   * Obtains auth token, posts a request for translations
   * and returns a promise.
   * @param {Object} - list of words
   * @returns {Promise} - On resolution gives the response
   */
  getTranslations(words) {
    var promise = new Promise((resolve, reject) => {
      var Lists = this.toList(words);
      if (Lists.toString().length >= 4900) { // limitation Azure translator text API
        reject('Azure Exception. Cannot Send more than 5000 characters.');
      } else {
        this.detectLanguage(Lists.toString()).then(lang => {
          if (lang === this.srcLang) {
            this.options.body = [
              {'text': Lists.toString()}
            ];
            http(this.url)
              .post('_bing_' + JSON.stringify(this.options.body), this.options.headers)
              .then((data) => {
                let inJSON = JSON.parse(data);
                let translationsList = inJSON[0]['translations'][0]['text'].substring(-1).split(',');
                var tmap = this.mapTranslations(translationsList, words);
                resolve(tmap);
              })
              .catch((e) => {
                reject(e);
              });
          }
          else {
            resolve({});
          }
        });
      }
    });
    return promise;
  }

  detectLanguage(words) {
    return new Promise((resolve, reject) => {
      var url = 'https://api.cognitive.microsofttranslator.com/detect?api-version=3.0',
        headers = {
          'Ocp-Apim-Subscription-Key': this.key,
          'Content-type': 'application/json',
          'X-ClientTraceId': this.getUUID()
        },
        body = [{
          'Text': words
        }],
        detectedLang = '';
      http(url)
        .post('_bing_' + JSON.stringify(body), headers)
        .then((data) => {
          let inJSON = JSON.parse(data);
          detectedLang = inJSON[0]['language'];
          resolve(detectedLang);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  /**
   * Convert object to list
   * @param {Object} words - words object
   * @returns {Array} wordList - array of words
   */
  toList(words) {
    var wordList = [];
    var buff = '';
    for (let word in words) {
      try {
        buff = encodeURI(word); // checks if the word can be sent for translations
        wordList.push(word);
      } catch(e) {
        ;
      }
    }
    return wordList;
  }

  /**
   * Convert object to list
   * @returns {String} uuid - unique verification code; format -> uuidv4
   */
  getUUID() {
    var uuid = '';
    var dec2hex = [];
    for (var i=0; i<=15; i++) {
      dec2hex[i] = i.toString(16);
    }
    for (var i=1; i<=36; i++) {
      if (i===9 || i===14 || i===19 || i===24) {
        uuid += '-';
      } else if (i===15) {
        uuid += 4;
      } else if (i===20) {
        uuid += dec2hex[(Math.random()*4|0 + 8)];
      } else {
        uuid += dec2hex[(Math.random()*16|0)];
      }
    }
    return uuid;
  }

  /**
   * Creates the XML payload for Bing
   * @param {Object} words - words list
   * @returns {Object} POST payload object
   */
  formPayload(words) {
    let payload = '<TranslateArrayRequest>'
                +   '<AppId></AppId>'
                +   '<From>' + this.srcLang + '</From>'
                +   '<Texts>';
    for (let word in words) {
      payload += '<string xmlns="http://schemas.microsoft.com/2003/10/Serialization/Arrays">' + word + '</string>';
    }

    payload += '</Texts>'
            +  '<To>' + this.targetLang + '</To>'
            +  '</TranslateArrayRequest>';

    return {'payload': payload, 'xml': true};
  }

  /**
   * Returns an array of translations which is in order
   * with the source words
   * @param {string} res - response from Bing
   * @param {Object} words - word list
   * @returns {Array} translations - list of translated words
   */
  filterTranslations(res, words) {
    // parse XML response to find response string and convert to lowercase
    let xmlDoc = this.parseXML(res),
      elements = xmlDoc.getElementsByTagName('TranslatedText'),
      translations = [];

    for (var i in elements) {
      translations.push(elements[i].innerHTML);
    }

    return translations;
  }

  /**
   * Parse string into XML
   * Referred: http://stackoverflow.com/questions/7949752/cross-browser-javascript-xml-parsing
   * @param {string} xmlStr - XML response
   * @returns {Object} parsed XML
   */
  parseXML(xmlStr) {
    return (new window.DOMParser()).parseFromString(xmlStr, 'text/xml');
  }

  /**
   * Map source words to translations
   * @param {Array} translations - list of translated words
   * @param {Object} words - source words list
   * @returns {Object} tMap - translation map
   */
  mapTranslations(translations, words) {
    var tMap = {},
      i = 0,
      translatedWords = translations;

    for (let word in words) {
      // add a try catch block
      if (translatedWords[i] !== undefined) { // prevent false translations
        tMap[word] = translatedWords[i];
      }
      i++;
    }

    return tMap;
  }

  /**
   * Translate an entire input sentence
   * @param {string} text - sentence
   * @returns {Promise} promise - gives translated sentence on resolution
   */
  translateSentence(text) {
    var promise = new Promise((resolve, reject) => {
      if (text.toString().length >= 4900) { // limitation Azure translator text API
        reject('Azure Exception. Cannot Send more than 5000 characters.');
      } else {
        this.detectLanguage(text.toString()).then(lang  => {
          if (lang === this.srcLang) {
            this.options.body = [
              {'text': text.toString()}
            ];
            http(this.url)
              .post('_bing_' + JSON.stringify(this.options.body), this.options.headers)
              .then((res) => {
                let xml = this.parseXML(res);
                let sentence = xml.getElementsByTagName('string')[0].innerHTML;
                resolve(sentence);
              })
              .catch((e) => {
                reject(e);
              });
          } else {
            resolve({});
          }
        });
      }
    });
    return promise;
  }
}
