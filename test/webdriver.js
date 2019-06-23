const webdriver = require('selenium-webdriver'),
  chrome = require('selenium-webdriver/chrome'),
  until = webdriver.until,
  actionSequence = webdriver.actionSequence,
  bootstrapTourVars = require('./components/bootstrapTour_variables'),
  patternOperationsVars = require('./components/patternsCreation_variables'),
  blacklisttestVars = require('./components/blacklistTest_variables'),
  { performance } = require('perf_hooks'),
  chromium = require('chromium'),
  Key = webdriver.Key,
  By = webdriver.By;

{ 
  describe, it;
} require('selenium-webdriver/testing');

let chromeOptions = new chrome.Options(),
  driver,
  yandexTranslationKey = process.env.YANDEX_KEY;

if (yandexTranslationKey === undefined) { // key absent
  console.log('"yandexTranslationKey" not found as environment variable. Translation and lazy loading tests would be skipped.');
  yandexTranslationKey = 'randomYandexKey1';
}

// adding browser options
chromeOptions.setChromeBinaryPath('/usr/bin/chromium-browser');
chromeOptions.addArguments('--no-sandbox');
chromeOptions.addArguments('--disable-dev-shm-usage');
chromeOptions.addArguments('--disable-gpu');
chromeOptions.addArguments('--load-extension=dist/');

function reloadToHomePage() {
  describe('reset to home screen', function() {
    it('set screen as home page', (done) => {
      driver.get('chrome-extension://jaodmdnaglgheeibgdcgdbhljooejiha/views/options.html').then(() => {
        done();
      });
    });
  });
}

function scrollToElementByxPath(text) {
  element = driver.findElement(By.xpath(text));
  driver.executeScript('arguments[0].scrollIntoView()', element);
  driver.sleep(300);
};

describe('Executing tests in chrome environments', function() {
  // global test timeout
  this.timeout(180000);

  describe('Creating browser instances', () => {
    it('launching chrome instances with Mind The Word extension', (done) => {
      driver = new webdriver
        .Builder()
        .setChromeOptions(chromeOptions)
        .forBrowser('chrome')
        .build();

      driver.then(() => {
        done();
      });
    });

    it ('loading extension', (done) => {
      driver.get('chrome-extension://jaodmdnaglgheeibgdcgdbhljooejiha/views/options.html').then(() => {
        done();
      });
    });
  });

  describe('Bootstrap tour test', function() {
    it('welcome screen', (done) => {
      driver.findElement(By.xpath(bootstrapTourVars.nextWelcome)).click().then(e => {
        done();
      });
    });

    it('translation tab', (done) => {
      setTimeout(() => {
        driver.findElement(By.xpath(bootstrapTourVars.nextTranslation)).click().then(e => {
          done();
        });
      }, 500);
    });

    it('translator keys', (done) => {
      setTimeout(() => {
        driver.findElement(By.xpath(bootstrapTourVars.nextTranslatorkeys)).click().then(e => {
          done();
        });
      }, 500);
    });

    it('learning patterns', (done) => {
      setTimeout(() => {
        driver.findElement(By.xpath(bootstrapTourVars.nextCreateLP)).click().then(e => {
          done();
        });
      }, 500);
    });

    it('translation patterns', (done) => {
      setTimeout(() => {
        driver.findElement(By.xpath(bootstrapTourVars.nextTP)).click().then(e => {
          done();
        });
      }, 500);
    });
    
    it('blacklist tab', (done) => {
      setTimeout(() => {
        driver.findElement(By.xpath(bootstrapTourVars.nextBlacklistTab)).click().then(e => {
          done();
        });
      }, 500);
    });

    it('blacklist websites', (done) => {
      setTimeout(() => {
        driver.findElement(By.xpath(bootstrapTourVars.nextBW)).click().then(e => {
          done();
        });
      }, 500);
      
    });
    
    it('blacklist words', (done) => {
      setTimeout(() => {
        driver.findElement(By.xpath(bootstrapTourVars.nextBWords)).click().then(e => {
          done();
        });
      }, 500);
    });

    it('learning tab', (done) => {
      setTimeout(() => {
        driver.findElement(By.xpath(bootstrapTourVars.nextLearningTab)).click().then(e => {
          done();
        });
      }, 500);
    });

    it('saved translation', (done) => {
      setTimeout(() => {
        driver.findElement(By.xpath(bootstrapTourVars.nextSavedTranslationDiv)).click().then(e => {
          done();
        });
      }, 500);
    });

    it('learnt words', (done) => {
      setTimeout(() => {
        driver.findElement(By.xpath(bootstrapTourVars.nextLearntWordsDiv)).click().then(e => {
          done();
        });
      }, 500);
    });

    it('advance settings', (done) => {
      setTimeout(() => {
        driver.findElement(By.xpath(bootstrapTourVars.nextAdv)).click().then(e => {
          done();
        });
      }, 500);
    });

    it('backup', (done) => {
      setTimeout(() => {
        driver.findElement(By.xpath(bootstrapTourVars.nextBackUp)).click().then(e => {
          done();
        });
      }, 500);
    });

    it('quiz', (done) => {
      setTimeout(() => {
        driver.findElement(By.xpath(bootstrapTourVars.nextQuiz)).click().then(e => {
          done();
        });
      }, 500);
    });

    it('statistics', (done) => {
      setTimeout(() => {
        driver.findElement(By.xpath(bootstrapTourVars.nextStats)).click().then(e => {
          done();
        });
      }, 500);
    });

    it('contribute', (done) => {
      setTimeout(() => {
        driver.findElement(By.xpath(bootstrapTourVars.nextContribute)).click().then(e => {
          done();
        });
      }, 500);
    });

    it('finish tour', (done) => {
      setTimeout(() => {
        driver.findElement(By.xpath(bootstrapTourVars.nextTourFinish)).click().then(e => {
          done();
        });
      }, 500);
    });
    reloadToHomePage();

  });

  describe('Pattern Operations', function() {

    it('assign random api keys', (done) => {
      driver.findElement(By.xpath(patternOperationsVars.yandexInputField)).then(field1 => {
        field1.sendKeys(yandexTranslationKey);
        driver.findElement(By.xpath(patternOperationsVars.azureInputField)).then(field2 => {
          field2.sendKeys('randomAzureKey1');
          driver.findElement(By.xpath(patternOperationsVars.googleInputField)).then(field3 => {
            field3.sendKeys('randomGoogleKey1');
            // operations
            driver.manage().window().maximize();
            done();
          });
        });
      });
    });

    describe('creating patterns', function() {
      it('Yandex', (done) => {
        driver.findElement(By.xpath(patternOperationsVars.patternTranslator)).sendKeys('Yandex').then(() => {
          driver.findElement(By.xpath(patternOperationsVars.patternPercent)).sendKeys('70').then(() => {
            driver.findElement(By.xpath(patternOperationsVars.patternSrcLang)).sendKeys('English').then(() => {
              driver.findElement(By.xpath(patternOperationsVars.patternTargetLang)).sendKeys('Hindi').then(() => {
                setTimeout(() => {
                  let element = driver.findElement(By.xpath(patternOperationsVars.patternCreationDiv));
                  driver.executeScript('arguments[0].scrollIntoView()', element).then(() => {
                    driver.findElement(By.xpath(patternOperationsVars.patternCreateButton)).click().then(() => {
                      done();
                    });
                  });
                }, 500);
              });
            });
          });
        });
      });
      
      it('Azure', (done) => {
        driver.findElement(By.xpath(patternOperationsVars.patternTranslator)).sendKeys('Azure').then(() => {
          driver.findElement(By.xpath(patternOperationsVars.patternPercent)).sendKeys('60').then(() => {
            driver.findElement(By.xpath(patternOperationsVars.patternSrcLang)).sendKeys('English').then(() => {
              driver.findElement(By.xpath(patternOperationsVars.patternTargetLang)).sendKeys('Hindi').then(() => {
                setTimeout(() => {
                  let element = driver.findElement(By.xpath(patternOperationsVars.patternCreationDiv));
                  driver.executeScript('arguments[0].scrollIntoView()', element).then(() => {
                    driver.findElement(By.xpath(patternOperationsVars.patternCreateButton)).click().then(() => {
                      done();
                    });
                  });
                }, 500);
              });
            });
          });
        });
      });

      it('Google', (done) => {
        driver.findElement(By.xpath(patternOperationsVars.patternTranslator)).sendKeys('Google').then(() => {
          driver.findElement(By.xpath(patternOperationsVars.patternPercent)).sendKeys('50').then(() => {
            driver.findElement(By.xpath(patternOperationsVars.patternSrcLang)).sendKeys('English').then(() => {
              driver.findElement(By.xpath(patternOperationsVars.patternTargetLang)).sendKeys('Hindi').then(() => {
                setTimeout(() => {
                  let element = driver.findElement(By.xpath(patternOperationsVars.patternCreationDiv));
                  driver.executeScript('arguments[0].scrollIntoView()', element).then(() => {
                    driver.findElement(By.xpath(patternOperationsVars.patternCreateButton)).click().then(() => {
                      done();
                    });
                  });
                }, 500);
              });
            });
          });
        });
      });
    });

    describe('check pattern', function() {
      // reload the page to check angular modules and local chrome
      reloadToHomePage();
      it('check translation patterns', (done) => {
        driver.findElement(By.xpath(patternOperationsVars.createdYandex)).then(() => {
          // yandex pattern found
          driver.findElement(By.xpath(patternOperationsVars.createdAzure)).then(() => {
            // azure pattern found
            driver.findElement(By.xpath(patternOperationsVars.createdGoogle)).then(() => {
              // google pattern found
              done();
            });
          });
        });
      });

      it('toggling patterns', (done) => {
        // the active symbol exists on the last created pattern
        driver.executeScript('window.scrollTo(0,0)').then(() => {
          // scrolled to page top
          driver.findElement(By.xpath(patternOperationsVars.activeSymbolLastPattern)).then(() => {
            // last pattern active
            driver.findElement(By.xpath(patternOperationsVars.createdYandex)).click().then(() => {
              // activated the first pattern
              driver.findElement(By.xpath(patternOperationsVars.activeSymbolFirstPattern)).then(() => {
                // checked the first pattern to be active
                done();
              });
            });
          });
        });
      });
  
      it('deleting patterns', (done) => {
        driver.findElement(By.xpath(patternOperationsVars.deleteThirdPattern)).click().then(() => {
          // deleted third pattern
          driver.findElement(By.xpath(patternOperationsVars.deleteSecondPattern)).click().then(() => {
            // deleted second pattern
            driver.findElement(By.xpath(patternOperationsVars.deleteFirstPattern)).click().then((res) => {
              // deleted first pattern
              driver.findElement(By.xpath(patternOperationsVars.createdYandex)).then(() => {
                // failed to delete element
                throw new Error('unable to delete translation patterns');
              },(err) => {
                // element was deleted
                done();
              });
            });
          });
        });
      });
    });

  });

  describe('Blacklist functionality', function() {
    it('open blacklist page', (done) => {
      driver.findElement(By.xpath('//*[@id="blacklisting-nav"]')).click().then(() => {
        done();
      });
    });

    it('whitelisting website', (done) => {
      driver.findElement(By.xpath(blacklisttestVars.firstBlacklistWebsiteElement)).getText().then((text) => {
        driver.findElement(By.xpath(blacklisttestVars.firstBlacklistWebsiteButton)).click().then(() => {
          // removed from blacklist
          driver.findElement(By.xpath(blacklisttestVars.firstBlacklistWebsiteElement)).getText().then((text2) => {
            if (text !== text2) {
              done();
            } else {
              throw new Error('Website could not be removed from the blacklist');
            }
          });
        });
      });
    });

    it('blacklisting website', (done) => {
      driver.findElement(By.xpath(blacklisttestVars.bl_websitesInput)).sendKeys('stackoverflow.com').then(() => {
        driver.findElement(By.xpath(blacklisttestVars.add_bl_websites)).click().then(() => {
          driver.findElements(By.className('list-group-item clearfix ng-binding ng-scope')).then(elements => {
            for( var i=0; i< elements.length; i++) {
              let ele = elements[i];
              ele.getText().then((txt) => {
                if (txt === 'stackoverflow.com') { // resolve only if the recently blacklisted website exists in the blacklist
                  done();
                  return;
                }
              });
            }
          });
        });
      });
    });

    it('whitelisting words', (done) => {
      driver.findElement(By.xpath(blacklisttestVars.firstBlacklistWordElement)).getText().then((text) => {
        driver.findElement(By.xpath(blacklisttestVars.firstBlacklistWordButton)).click().then(() => {
          // removed from blacklist
          driver.findElement(By.xpath(blacklisttestVars.firstBlacklistWordElement)).getText().then((text2) => {
            if (text !== text2) {
              done();
            } else {
              throw new Error('word could not be removed from the blacklist');
            }
          });
        });
      });
    });
  
    it('blacklisting words', (done) => {
      driver.findElement(By.xpath(blacklisttestVars.bl_wordsInput)).sendKeys('this').then(() => {
        driver.findElement(By.xpath(blacklisttestVars.add_bl_words)).click().then(() => {
          driver.findElements(By.className('list-group-item clearfix ng-binding ng-scope')).then(elements => {
            for( var i=0; i< elements.length; i++) {
              let ele = elements[i];
              ele.getText().then((txt) => {
                if (txt === 'this') { // resolve only if the recently blacklisted word exists in the blacklist
                  done();
                  return;
                }
              });
            }
          });
        });
      });
    });

  });

  // only if valid key exists as environment variable
  if (yandexTranslationKey !== undefined && yandexTranslationKey !== 'randomYandexKey1') {
    describe('Testing Translations', function() {

      it('creating yandex translation API key from environment variables', (done) => {
        driver.get('chrome-extension://jaodmdnaglgheeibgdcgdbhljooejiha/views/options.html').then(() => {
          driver.findElement(By.xpath(patternOperationsVars.yandexInputField)).then((field) => {
            driver.findElement(By.xpath(patternOperationsVars.patternTranslator)).sendKeys('Yandex').then(() => {
              driver.findElement(By.xpath(patternOperationsVars.patternPercent)).sendKeys('70').then(() => {
                driver.findElement(By.xpath(patternOperationsVars.patternSrcLang)).sendKeys('English').then(() => {
                  driver.findElement(By.xpath(patternOperationsVars.patternTargetLang)).sendKeys('Hindi').then(() => {
                    setTimeout(() => {
                      let element = driver.findElement(By.xpath(patternOperationsVars.patternCreationDiv));
                      driver.executeScript('arguments[0].scrollIntoView()', element).then(() => {
                        driver.findElement(By.xpath(patternOperationsVars.patternCreateButton)).click().then(() => {
                          done();
                        });
                      });
                    }, 500);
                  });
                });
              });
            });
          });
        });
      });

      describe('Calculating Translation Time', function() {
        it('Webpage: https://www.google.co.in', (done) => {
          driver.get('https://www.google.co.in').then(() => {
            let beforeTranslation = performance.now();
            driver.wait(until.elementLocated(By.className('mtwTranslatedWord hc-name')), 15000).then(() => {
              let afterTranslation = performance.now();
              done();
              console.warn('Time taken for translation in "https://www.google.co.in": ' + (afterTranslation - beforeTranslation) + ' milliseconds');
            });
          });
        });

        it('Webpage: https://en.wikipedia.org/wiki/Delhi', (done) => {
          driver.get('https://en.wikipedia.org/wiki/Delhi').then(() => {
            let beforeTranslation = performance.now();
            driver.wait(until.elementLocated(By.className('mtwTranslatedWord hc-name')), 15000).then(() => {
              let afterTranslation = performance.now();
              done();
              console.warn('Time taken for translation in "https://en.wikipedia.org/wiki/Delhi": ' + (afterTranslation - beforeTranslation) + ' milliseconds');
            });
          });
        });
      });

      describe('Lazy Loading', function() {
        it('Newer DOMs with translation should add on scroll', (done) => {
          driver.get('https://www.facebook.com/GoogleSummerOfCode/').then(() => {
            driver.wait(until.elementLocated(By.className('mtwTranslatedWord hc-name')), 15000).then(() => {
              driver.findElements(By.className('mtwTranslatedWord hc-name')).then(elements => {
                let count = elements.length;
                setTimeout(() => {
                  driver.executeScript('window.scrollTo(0, 1000)').then(() => {
                    setTimeout(() => {
                      driver.findElements(By.className('mtwTranslatedWord hc-name')).then(elem => {
                        let newDOMs = elem.length - count;
                        if (newDOMs !== 0) {
                          done();
                          console.log('Newer DOMs: ' + newDOMs);
                        } else {
                          throw new Error('Lazy Loading functionality failed');
                        }
                      });
                    }, 3000);
                  });
                }, 2000);
              });
            });
          });
        });
      });

      describe('Hovercard Operations', function() {
        it('mark words as learnt', (done) => {
          driver.get('https://www.google.co.in').then(() => {
            driver.wait(until.elementLocated(By.className('mtwTranslatedWord hc-name')), 15000).then(() => {
              let c=0;
              // initiate random signals for marking learnt words 
              for(let i=0; i<10; i++) {
                // eslint-disable-next-line quotes
                let cmd = "document.getElementsByClassName('mtwMarkAsLearnt')[" + i + "].click()";
                driver.executeScript(cmd).then(() => {}, () => {});
              }
              setTimeout(() => {
                done();
              }, 5000);
            });
          });
            
        });

        it('verify learnt words', (done) => {
          driver.get('chrome-extension://jaodmdnaglgheeibgdcgdbhljooejiha/views/options.html').then(() => {
            driver.findElement(By.xpath('//*[@id="learning-nav"]')).click().then(() => {
              driver.findElement(By.xpath('//*[@id="learnt-words"]/ul/li[1]')).then(() => {
                done();
              });
            });
          });
        });

        it('mark as saved translation', (done) => {
          driver.get('https://www.google.co.in').then(() => {
            driver.wait(until.elementLocated(By.className('mtwTranslatedWord hc-name')), 15000).then(() => {
              let c=0;
              // initiate random signals for marking saved translations 
              for(let i=0; i<10; i++) {
                // eslint-disable-next-line quotes
                let cmd = "document.getElementsByClassName('mtwSaveTranslation')[" + i + "].click()";
                driver.executeScript(cmd).then(() => {}, () => {});
              }
              setTimeout(() => {
                done();
              }, 5000);
            });
            
          });
        
        });

        it('verify saved translations', (done) => {
          driver.get('chrome-extension://jaodmdnaglgheeibgdcgdbhljooejiha/views/options.html').then(() => {
            driver.findElement(By.xpath('//*[@id="learning-nav"]')).click().then(() => {
              driver.findElement(By.xpath('//*[@id="saved-translations"]/div[4]/table/tbody/tr[1]')).then(() => {
                done();
              });
            });
          });
        });
      });

      describe('Testing Popup.html', function() {
        it('open popup.html', (done) => {
          driver.get('chrome-extension://jaodmdnaglgheeibgdcgdbhljooejiha/views/popup.html').then(() => {
            done();
          });
        });

        it('toggle operations', (done) => {
          // assuming always the extension is in the on state when being onInstalled state
          driver.get('https://www.google.co.in').then(() => {
            driver.wait(until.elementLocated(By.className('mtwTranslatedWord hc-name')), 15000).then(() => {
              driver.get('chrome-extension://jaodmdnaglgheeibgdcgdbhljooejiha/views/popup.html').then(() => {
                driver.findElement(By.xpath('//*[@id="mtw-Activation-Container"]/div/div/label[1]')).click().then(() => {
                  driver.get('https://www.google.co.in').then(() => {
                    driver.wait(until.elementLocated(By.className('mtwTranslatedWord hc-name')), 15000).then(() => {}, () => {
                      // no translation
                      done();
                    });
                  });
                });
              });
            });
          });
            
        });
        
      });

    });
  }

  describe('Exit browser', function() {
    it('closing browser service', (done) => {
      driver.quit();
      done();
    });
  });

}); 
