import { http } from '../utils/http';

/** Class for Yandex Dictionary */
class YandexDictionary {
  constructor() {
    this.url = 'https://dictionary.yandex.net/api/v1/dicservice.json/lookup';
    this.word = '';
    this.bodyParams = {};
  }

  /**
   * Initialize options and credentials
   * @constructor
   * @param {Object} key - Yandex key
   * @param {string} srcLang - source languages
   */
  setValues(key, lang) {
    this.bodyParams = {
      key: key,
      lang: lang + '-' + lang,
      text: '',
    };
  }

  /**
   *
   * @param {String} text  - word
   */
  setText(text) {
    this.bodyParams.text = text;
  }

  /**
   * @returns {Promise} any - dictionary promise
   */
  getDetails() {
    this.url +=
      '?key=' +
      this.bodyParams.key +
      '&lang=' +
      this.bodyParams.lang +
      '&text=' +
      this.bodyParams.text;
    return new Promise((resolve, reject) => {
      http(this.url)
        .get()
        .then(result => {
          resolve(JSON.parse(result));
        })
        .catch(e => {
          reject(e);
        });
    });
  }
}

export const DictionaryObject = new YandexDictionary();
