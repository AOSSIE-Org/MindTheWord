const bl_websitesInput = '//*[@id="new-blacklist-website"]',
  bl_wordsInput = '//*[@id="new-blacklist-word"]',
  add_bl_websites = '//*[@id="add-blacklist-website"]',
  add_bl_words = '//*[@id="add-blacklist-word"]',
  firstBlacklistWebsiteButton =
    '//*[@id="blacklist-website"]/ul/li[1]/span/button',
  firstBlacklistWordButton = '//*[@id="blacklist-words"]/ul/li[1]/span/button',
  firstBlacklistWebsiteElement = '//*[@id="blacklist-website"]/ul/li[1]',
  firstBlacklistWordElement = '//*[@id="blacklist-words"]/ul/li[1]';

module.exports = {
  bl_websitesInput: bl_websitesInput,
  bl_wordsInput: bl_wordsInput,
  add_bl_websites: add_bl_websites,
  add_bl_words: add_bl_words,
  firstBlacklistWebsiteButton: firstBlacklistWebsiteButton,
  firstBlacklistWordButton: firstBlacklistWordButton,
  firstBlacklistWebsiteElement: firstBlacklistWebsiteElement,
  firstBlacklistWordElement: firstBlacklistWordElement,
};
