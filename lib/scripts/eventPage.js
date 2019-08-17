import { ContextMenu } from './services/contextMenu';
import { localData } from './utils/defaultStorage';

var contextMenu = new ContextMenu(),
  translatedWords = {},
  greyIcon = chrome.extension.getURL('assets/img/128_grey.png'),
  defaultIcon = chrome.extension.getURL('assets/img/128.png'),
  activeContextMenuIds = ['speakTheWord', 'blacklistWebsite', 'searchForSimilarWords', 'translateSentence', 'whitelistWebsite'];

/**
 * Set up default data and store it in `chrome.storage.localData`
 */
function initializeLocalStorage() {
  chrome.storage.local.set(localData);
}

/**
 * Setup local data storage and context menus
 */
function setup() {
  initializeLocalStorage();
  chrome.contextMenus.create({
    'title': 'MindTheWord',
    'id': 'parent',
    'contexts': ['selection', 'page']
  });
  chrome.contextMenus.create({
    'title': 'Speak The Word',
    'parentId': 'parent',
    'contexts': ['selection'],
    'id': 'speakTheWord'
  });
  chrome.contextMenus.create({
    'title': 'Search For Similar Words',
    'parentId': 'parent',
    'contexts': ['selection'],
    'id': 'searchForSimilarWords'
  });
  chrome.contextMenus.create({
    'title': 'Google Search',
    'parentId': 'searchForSimilarWords',
    'contexts': ['selection'],
    'id': 'searchForSimilarWordsOnGoogle'
  });
  chrome.contextMenus.create({
    'title': 'Bing Search',
    'parentId': 'searchForSimilarWords',
    'contexts': ['selection'],
    'id': 'searchForSimilarWordsOnBing'
  });
  chrome.contextMenus.create({
    'title': 'Google Image Search',
    'parentId': 'searchForSimilarWords',
    'contexts': ['selection'],
    'id': 'searchForSimilarWordsOnGoogleImages'
  });
  chrome.contextMenus.create({
    'title': 'Thesaurus.com',
    'parentId': 'searchForSimilarWords',
    'contexts': ['selection'],
    'id': 'searchForSimilarWordsOnThesaurus'
  });
  chrome.contextMenus.create({
    'title': 'Translate Sentence',
    'parentId': 'parent',
    'contexts': ['selection'],
    'id': 'translateSentence'
  });
}

/**
 * Enable or disable all context menus
 * @param {boolean} value - true or false
 */
function setContextMenus(value) {
  for (let id in activeContextMenuIds) {
    chrome.contextMenus.update(activeContextMenuIds[id], {
      enabled: value
    });
  }
}

/**
 * Update context menu according to page
 * @param {string} url - active tab URL
 */
function updateContextMenu(url) {
  chrome.storage.local.get(['activation', 'blacklist'], (result) => {
    var activation = result.activation;
    if (activation === false) {
      setContextMenus(false);
    } else {
      setContextMenus(true);
    }
  });
}

/**
 * Checks if URL is changed. Call `updateContextMenu` if
 * new URL is not blank or chrome URL.
 * @param {Integer} tabId - tab identifier
 * @param {Object} changeInfo - change information
 * @param {Object} tab - tab information
 */
function checkURLChange(tabId, changeInfo, tab) {
  if (changeInfo.url || changeInfo.status === 'complete') {
    if (/chrome.*\:\/\//.test(changeInfo.url) === false) {
      updateContextMenu(changeInfo.url);
    } else {
      setContextMenus(false);
    }
  }
}

/**
 * Checks the current active tab has a valid URL and
 * calls `updateContextMenu` if true.
 * @param {Object} activeInfo - information about active tab
 */
function checkActiveTabChange(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (/chrome.*\:\/\//.test(tab.url) === false) {
      updateContextMenu(tab.url);
    } else {
      setContextMenus(false);
    }
  });
}

/**
 * Click event handler for context menu. Calls appropriate
 * functions from ContextMenu class.
 * @param {Object} info -
 * @param {Object} tabs -
 */
function contextMenuClickHandler(info, tab) {
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, (tabs) => {
    var tabURL = tabs[0].url;
    switch (info.menuItemId) {
      case 'searchForSimilarWordsOnThesaurus':
        contextMenu.searchForSimilarWords(info.selectionText, 'thesaurus');
        break;
      case 'searchForSimilarWordsOnGoogle':
        contextMenu.searchForSimilarWords(info.selectionText, 'google');
        break;
      case 'searchForSimilarWordsOnBing':
        contextMenu.searchForSimilarWords(info.selectionText, 'bing');
        break;
      case 'searchForSimilarWordsOnGoogleImages':
        contextMenu.searchForSimilarWords(info.selectionText, 'googleImages');
        break;
      case 'speakTheWord':
        chrome.storage.local.set({ 'utterance': info.selectionText }, function() {
          contextMenu.speakTheWord();
        });
        break;
      case 'translateSentence':
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'getTranslatedWords',
            action: 'storeSelection'
          }, (response) => {
            if (response) {
              contextMenu.translateSentence(info.selectionText, response.translatedWords)
                .then((translationData) => {
                  chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'showTranslatedSentence',
                    data: translationData
                  });
                })
                .catch((e) => {
                  console.error('Error in obtaining translations', e);
                });
            }
          });
        });
        break;
      default:
        console.error('Wrong context menu id');
    }
  });
}

//On first installation, load default Data and initialize context menu
chrome.runtime.onInstalled.addListener(setup);

// context menu handlers
chrome.contextMenus.onClicked.addListener(contextMenuClickHandler);

// update context menu if URL is changed
chrome.tabs.onUpdated.addListener(checkURLChange);

// update context menu if active tab is changed
chrome.tabs.onActivated.addListener(checkActiveTabChange);

// message listeners
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message === 'message_on') {
    chrome.storage.local.get(null,function (obj){
      chrome.browserAction.setIcon({path: defaultIcon});
      chrome.browserAction.setBadgeText({text:String(obj.numberOfTranslatedWords)});
      chrome.browserAction.setBadgeBackgroundColor({color: [48,63, 159,1.0]});
    });
  }
  if (message === 'message_off') {
    chrome.browserAction.setIcon({path: greyIcon});
    chrome.browserAction.setBadgeText({text:String('')});
  }
  if (message === 'speakTheWord') {
    contextMenu.speakTheWord();
  }
});

chrome.runtime.onInstalled.addListener(function(details){
  if(details.reason === 'install' || details.reason === 'update'){
    chrome.storage.local.set({
      'newInstallUpdate': true
    });
  }
});

// omnibox functionality
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  text = text.replace(' ', '');
  var suggestions = [
    {
      content: 'chrome-extension://jaodmdnaglgheeibgdcgdbhljooejiha/views/options.html#/' + text,
      description: text
    },
    {
      content: 'chrome-extension://jaodmdnaglgheeibgdcgdbhljooejiha/views/options.html#/home',
      description: 'Home | Activity'
    }, {
      content: 'chrome-extension://jaodmdnaglgheeibgdcgdbhljooejiha/views/options.html#/quiz',
      description: 'Quiz | Practice your language skills based on real world questions'
    }, {
      content: 'chrome-extension://jaodmdnaglgheeibgdcgdbhljooejiha/views/options.html#/translation-settings',
      description: 'Translation Settings'
    }, {
      content: 'chrome-extension://jaodmdnaglgheeibgdcgdbhljooejiha/views/options.html#/blacklisting',
      description: 'Blacklist / Whitelist'
    }, {
      content: 'chrome-extension://jaodmdnaglgheeibgdcgdbhljooejiha/views/options.html#/learning',
      description: 'Learnt / Saved Translations'
    }, {
      content: 'chrome-extension://jaodmdnaglgheeibgdcgdbhljooejiha/views/options.html#/advanced-settings',
      description: 'Advanced Settings'
    }, {
      content: 'chrome-extension://jaodmdnaglgheeibgdcgdbhljooejiha/views/options.html#/backup',
      description: 'Backup'
    }, {
      content: 'chrome-extension://jaodmdnaglgheeibgdcgdbhljooejiha/views/options.html#/hovercard',
      description: 'Information on Hovercards'
    }, {
      content: 'chrome-extension://jaodmdnaglgheeibgdcgdbhljooejiha/views/options.html#/statistics',
      description: 'Statistics'
    }, {
      content: 'https://gitlab.com/aossie/MindTheWord',
      description: 'Project URL | Contribute Us'
    }
  ];

  chrome.omnibox.setDefaultSuggestion({description:suggestions[0].description});

  suggestions.shift();
  suggest(suggestions);
}
);

// process entered URL from omnibox
chrome.omnibox.onInputEntered.addListener(text  => {
  chrome.tabs.getSelected(null, tab => {
    chrome.tabs.update(tab.id, {url: text});
  });
});