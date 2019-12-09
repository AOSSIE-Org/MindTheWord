import angular from 'angular';
import $ from 'jquery';
import bootstrap from 'bootstrap';
import { startFrom } from '../filters/startFrom';
import { Chart } from '../../assets/js/Chart.min.js';

/** Class for newtab page angular controller */
export class NewTabCtrl {
  /**
   * Initialize options page data and jQuery
   * @constructor
   * @param {Object} $scope - Angular scope
   * @param {Object} $timeout - Angular timeout
   */
  constructor($scope, $timeout) {
    this.wallpaperCollectionList = [
      {
        name: 'Landscapes',
        src: '../../assets/img/wallpaperCollection/landscape.jpg'
      },
      {
        name: 'Art',
        src: '../../assets/img/wallpaperCollection/art.jpg'
      },
      {
        name: 'Cityscapes',
        src: '../../assets/img/wallpaperCollection/cityscape.jpg'
      },
      {
        name: 'Seascapes',
        src: '../../assets/img/wallpaperCollection/seascape.jpg'
      },
      {
        name: 'Sky',
        src: '../../assets/img/wallpaperCollection/sky.jpg'
      },
      {
        name: 'Texture',
        src: '../../assets/img/wallpaperCollection/texture.jpg'
      }
    ];
    this.CityscapesCollection = [
      {
        src: '../assets/img/CityscapesCollection/1.jpg'
      },
      {
        src: '../assets/img/CityscapesCollection/2.jpg'
      },
      {
        src: '../assets/img/CityscapesCollection/3.jpg'
      },
      {
        src: '../assets/img/CityscapesCollection/4.jpg'
      },
      {
        src: '../assets/img/CityscapesCollection/5.jpg'
      },
      {
        src: '../assets/img/CityscapesCollection/6.jpg'
      },
      {
        src: '../assets/img/CityscapesCollection/7.jpg'
      },
      {
        src: '../assets/img/CityscapesCollection/8.jpg'
      },
      {
        src: '../assets/img/CityscapesCollection/9.jpg'
      }
    ];
    this.LandscapesCollection = [
      {
        src: '../assets/img/LandscapesCollection/1.jpg'
      },
      {
        src: '../assets/img/LandscapesCollection/2.jpg'
      },
      {
        src: '../assets/img/LandscapesCollection/3.jpg'
      },
      {
        src: '../assets/img/LandscapesCollection/4.jpg'
      },
      {
        src: '../assets/img/LandscapesCollection/5.jpg'
      },
      {
        src: '../assets/img/LandscapesCollection/6.jpg'
      },
      {
        src: '../assets/img/LandscapesCollection/7.jpg'
      },
      {
        src: '../assets/img/LandscapesCollection/8.jpg'
      },
      {
        src: '../assets/img/LandscapesCollection/9.jpg'
      }
    ];
    this.SkyCollection = [
      {
        src: '../assets/img/SkyCollection/1.jpg'
      },
      {
        src: '../assets/img/SkyCollection/2.jpg'
      },
      {
        src: '../assets/img/SkyCollection/3.jpg'
      },
      {
        src: '../assets/img/SkyCollection/4.jpg'
      },
      {
        src: '../assets/img/SkyCollection/5.jpg'
      },
      {
        src: '../assets/img/SkyCollection/6.jpg'
      },
      {
        src: '../assets/img/SkyCollection/7.jpg'
      },
      {
        src: '../assets/img/SkyCollection/8.jpg'
      },
      {
        src: '../assets/img/SkyCollection/9.jpg'
      }
    ];
    this.TextureCollection = [
      {
        src: '../assets/img/TextureCollection/1.jpg'
      },
      {
        src: '../assets/img/TextureCollection/2.jpg'
      },
      {
        src: '../assets/img/TextureCollection/3.jpg'
      },
      {
        src: '../assets/img/TextureCollection/4.jpg'
      },
      {
        src: '../assets/img/TextureCollection/5.jpg'
      },
      {
        src: '../assets/img/TextureCollection/6.jpg'
      },
      {
        src: '../assets/img/TextureCollection/7.jpg'
      },
      {
        src: '../assets/img/TextureCollection/8.jpg'
      },
      {
        src: '../assets/img/TextureCollection/9.jpg'
      }
    ];
    this.ArtCollection = [
      {
        src: '../assets/img/ArtCollection/1.jpg'
      },
      {
        src: '../assets/img/ArtCollection/2.jpg'
      },
      {
        src: '../assets/img/ArtCollection/3.jpg'
      },
      {
        src: '../assets/img/ArtCollection/4.jpg'
      },
      {
        src: '../assets/img/ArtCollection/5.jpg'
      },
      {
        src: '../assets/img/ArtCollection/6.jpg'
      },
      {
        src: '../assets/img/ArtCollection/7.jpg'
      },
      {
        src: '../assets/img/ArtCollection/8.jpg'
      },
      {
        src: '../assets/img/ArtCollection/9.jpg'
      }
    ];
    this.SeascapesCollection = [
      {
        src: '../assets/img/SeascapesCollection/1.jpg'
      },
      {
        src: '../assets/img/SeascapesCollection/2.jpg'
      },
      {
        src: '../assets/img/SeascapesCollection/3.jpg'
      },
      {
        src: '../assets/img/SeascapesCollection/4.jpg'
      },
      {
        src: '../assets/img/SeascapesCollection/5.jpg'
      },
      {
        src: '../assets/img/SeascapesCollection/6.jpg'
      },
      {
        src: '../assets/img/SeascapesCollection/7.jpg'
      },
      {
        src: '../assets/img/SeascapesCollection/8.jpg'
      },
      {
        src: '../assets/img/SeascapesCollection/9.jpg'
      }
    ];
    this.backgroundConfigData = [
      {
        type: 'wallpaperList',
        header: 'Select a Collection',
        result: this.wallpaperCollectionList
      }
    ];
    this.searchEngineName = 'Google';
    this.searchEngines = {
      Google: 'http://www.google.com/search',
      Bing: 'https://www.bing.com/search'
    };
    this.searchEngineOptions = [
      {
        name: 'Google',
        icon: '../assets/img/GoogleIcon.png'
      },
      {
        name: 'Bing',
        icon: '../assets/img/BingIcon.png'
      }
    ];
    this.quickLinks = [];
    this.newsArticles = [];
    this.showStatisticsPopup = true;
    this.iconColours = [
      '(66,133,244)',
      '(219,68,55)',
      '(244,160,0)',
      '(15,157,88)'
    ];
    this.newsApiKey = false;
    this.currentLayout = 'main';
    this.setup();
  }
  //Sets up various services at the start of page
  setup() {
    var result = localStorage.getItem('background-image');
    //Set background image
    if (result) {
      this.backgroundImage = result;
    } else {
      this.backgroundImage = '../assets/img/SkyCollection/6.jpg';
    }
    //Get search engine used last time
    result = localStorage.getItem('search-engine');
    if (result) {
      this.searchEngineName = result;
    }
    $('.middle form').attr('action', this.searchEngines[this.searchEngineName]); // Change search engine
    //Get quick links from localStorage
    result = localStorage.getItem('quickLinks');
    if (result) {
      this.quickLinks = JSON.parse(result);
    }
    this.setupQuickLinks(); // Sets up the direct links to saved websites
    this.setupNews(); 
    this.setupStatistics();
  }

  //Show statistics on click of popup 'View your progress with  MindtheWord'
  setupStatistics() {
    $('.stats-toggle').on('click', () => {
      this.changeLayout();
      this.currentLayout = 'stats';
      $('#statistics-container').css('display', 'block');
      var wordsTranslatedArea = document
        .getElementById('wordsTranslatedArea')
        .getContext('2d');
      var isTranslatedDataAvailable = true;
      chrome.storage.local.get(['nOfWordsTransEveryDay'], function(result) {
        isTranslatedDataAvailable = false;
        if (Object.keys(result).length === 0) {
          if (!isSavedPatternsAvailable && !isTranslatedDataAvailable) {
            $('#no-stats-indicator').css('display', 'block');
          } else {
            $('#no-stats-indicator').css('display', 'none');
          }
          $('#wordsTranslatedArea').css('display', 'none');
          return;
        }
        $('#wordsTranslatedArea').css('display: block');
        isTranslatedDataAvailable = true;
        var storeDataArr = result.nOfWordsTransEveryDay;
        var datePast30 = [];
        var wordsPast30 = [];
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        var dateForm = new Date(month + '-' + day + '-' + year);
        for (var i = 0; i < storeDataArr.length; i++) {
          var aDate = storeDataArr[i][0].split('-');
          aDate = new Date(aDate[0] + '-' + aDate[1] + '-' + aDate[2]);
          var daysBetween = parseInt(
            Math.abs(dateForm - aDate) / 1000 / 60 / 60 / 24
          );

          if (daysBetween <= 30) {
            datePast30.push(storeDataArr[i][0]);
            wordsPast30.push(storeDataArr[i][1]);
          }
        }
        var lineChart = new Chart(wordsTranslatedArea, {
          type: 'line',
          data: {
            labels: datePast30,
            datasets: [
              {
                label: '',
                backgroundColor: 'rgba(255,255,255, 0.5)',
                hoverBackgroundColor: '#fff',
                hoverBorderColor: '#fff',
                borderColor: '#fff',
                data: wordsPast30
              }
            ]
          },
          options: {
            legends: {
              labels: {
                fontColor: 'white'
              }
            },
            title: {
              display: true,
              text: 'Number of words translated',
              fontColor: 'white',
              fontSize: 18
            },
            scales: {
              xAxes: [
                {
                  gridLines: {
                    display: false
                  },
                  ticks: {
                    fontColor: 'white',
                    fontSize: 20
                  }
                }
              ],
              yAxes: [
                {
                  gridLines: {
                    display: false
                  },
                  ticks: {
                    fontColor: 'white',
                    fontSize: 20
                  }
                }
              ]
            }
          }
        });
      });
      var isSavedPatternsAvailable = true;
      chrome.storage.local.get(['savedPatterns'], function(result) {
        console.log(result, 'savedpatterns', result.savedPatterns === '[]');
        isSavedPatternsAvailable = false;
        if (result.savedPatterns === '[]') {
          if (!isSavedPatternsAvailable && !isTranslatedDataAvailable) {
            $('#no-stats-indicator').css('display', 'block'); //If no statistics are available, display 'No statistics available'
          } else {
            $('#no-stats-indicator').css('display', 'none');
          }
          $('#languageDistribution').css('display', 'none');
          return;
        }
        $('#languageDistribution').css('display: block');
        isSavedPatternsAvailable = true;
        var data = JSON.parse(result.savedPatterns);
        var labels = [];
        var percentConversions = [];
        var totalConversions = 0; //in percent
        data.forEach(i => {
          labels.push(i[1][1]);
          percentConversions.push(i[2]);
          totalConversions += parseInt(i[2]);
        });
        labels.push(data[0][0][1]); //for browser language used
        percentConversions.push(100 - totalConversions);
        Chart.defaults.global.legend.display = false;
        var pieChart = new Chart(languageDistribution, {
          type: 'pie',
          data: {
            labels: labels,
            datasets: [
              {
                label: '',
                backgroundColor: 'rgba(255,255,255, 0.5)',
                hoverBackgroundColor: '#fff',
                hoverBorderColor: '#fff',
                borderColor: '#fff',
                data: percentConversions
              }
            ]
          },
          options: {
            legends: {
              labels: {
                fontColor: 'white'
              }
            },
            title: {
              display: true,
              text: 'Language distribution',
              fontColor: 'white',
              fontSize: 18
            }
          }
        });
      });
    });
  }

  changeSearchEngine(searchEngine) {
    localStorage.setItem('search-engine', searchEngine);
    this.searchEngineName = searchEngine;
    $('.middle form').attr('action', this.searchEngines[this.searchEngineName]);
  }

  changeBackgroundImage(newSrc) {
    localStorage.setItem('background-image', newSrc);
    this.backgroundImage = newSrc;
    this.backgroundConfigData = [
      {
        type: 'wallpaperList',
        header: 'Select a Collection',
        result: this.wallpaperCollectionList
      }
    ];
    $('#customiseModal [data-dismiss="modal"]').click();
  }

  //When the modal opens to change the background color, decide whether to show wallpaper types list or particular wallpapers
  changeBackgroundConfigData(type, data) {
    if (type === 'wallpaperList') {
      this.backgroundConfigData = [
        {
          type: 'wallpaperList',
          header: 'Select a Collection',
          result: this.wallpaperCollectionList
        }
      ];
    } else {
      this.backgroundConfigData = [
        {
          type: 'collectionList',
          header: 'Select an image',
          result: this[data]
        }
      ];
    }
  }

  setupQuickLinks() {
    var storedLinks = JSON.parse(localStorage.getItem('quickLinks'));
    var _this = this;
    if (!storedLinks) return;
    storedLinks.forEach(link => {
      $.ajax({
        url: link.url + '/favicon.ico',
        cache: false,
        xhr: function() {
          // Seems like the only way to get access to the xhr object
          var xhr = new XMLHttpRequest();
          xhr.responseType = 'blob';
          return xhr;
        },
        success: function(data) {
          var url = window.URL || window.webkitURL;
          var src = url.createObjectURL(data);
          var element = `<a href='${link.url}' class='tile' ><div class='background-image quickLinks-icon' style='background-image: url('${src}')'></div><div class='quick-link-name'>${link.name}</div></a>`;
          $('#quick-links').append(element);
        },
        error: function(e) {
          console.log('reached', e);
          var randomNumber = Math.floor(Math.random() * 3); //from 0 to 3
          var iconColour = _this.iconColours[randomNumber];
          var element = `<a href='${link.url}' class='tile'><div class='background-image quickLinks-icon' style='background-color: rgb${iconColour}; color: #fff'>${link.name[0]}</div><div class='quick-link-name'>${link.name}</div></a>`;
          $('#quick-links').append(element);
        }
      });
    });
  }

  //Method to show warnings
  showWarning(text) {
    $('.alert-warning span').text(text);
    $('.alert-warning').show();
    setTimeout(() => {
      $('alert-warning span').text('');
      $('.alert-warning').hide();
    }, 3000);
  }

  addQuickLink() {
    var name = $('#quicklink-name-input').val();
    var link = $('#quicklink-url-input').val();
    if(!name){
      this.showWarning('Please add a name to the link');
      return;
    }
    if(!link){
      this.showWarning('Please add a URL to the link');
      return;
    }
    if(link.indexOf('http') === -1){
      this.showWarning('Please use https in the URL');
      return;
    }
    var doesLinkAlreadyExist = false;
    this.quickLinks.forEach(item => {
      if (item.url === link) {
        this.showWarning('Already exists');
        doesLinkAlreadyExist = true;
      }
    });
    if (doesLinkAlreadyExist) return;
    this.quickLinks.push({
      name: name,
      url: link
    });
    localStorage.setItem('quickLinks', JSON.stringify(this.quickLinks));
    $('#quickLinksModal').modal('toggle');
    var _this = this;
    $.ajax({
      url: link + '/favicon.ico',
      cache: false,
      xhr: function() {
        // Seems like the only way to get access to the xhr object
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        return xhr;
      },
      success: function(data) {
        var url = window.URL || window.webkitURL;
        var src = url.createObjectURL(data);
        var element = `<a href='${link.url}' class='tile'><div class='background-image quickLinks-icon' style='background-image: url('${src}')'></div><div class='quick-link-name'>${name}</div></a>`;
        $('#quick-links').append(element);
      },
      error: function(e) {
        var randomNumber = Math.floor(Math.random() * 3); //from 0 to 3
        var iconColour = _this.iconColours[randomNumber];
        var element = `<a href='${link.url}' class='tile'><div class='background-image quickLinks-icon' style='background-color: rgb${iconColour}; color: #fff;'>${name[0]}</div><div class='quick-link-name'>${name}</div></a>`;
        $('#quick-links').append(element);
      }
    });
    $('#quickLinksModal').modal('toggle');
  }

  //Change layout to show services
  changeLayout() {
    this.changeLayoutToOriginal();
    var _this = this;
    $('#return-to-original-layout').on('click', () => {
      _this.currentLayout = 'main';
      _this.changeLayoutToOriginal();
    });
    $('.bottom-middle').hide();
    $('.middle').css({
      top: '5%',
      left: '2%',
      transform: 'unset'
    });
    var maxH = $('body').height() - $('#quick-links').offset().top;
    var h = $('#quick-links .tile').length * 85; // If sufficient height is available, set it to 80px each
    if (maxH > h) {
      $('#quick-links').css({
        flexDirection: 'column',
        display: 'flex',
        height: h + 'px'
      });
    } else {
      $('#quick-links').css({
        flexDirection: 'column',
        display: 'flex',
        height: maxH
      });
    }
    $('#quick-links .tile').css({
      flexGrow: 1
    });
    $('#quick-links').css({
      width: 'fit-content',
      overflowY: 'scroll'
    });
    //var left = $('#quick-links').width();
    var top = (2 / 100) * $('body').height();
    $('#services-container').css({
      display: 'flex',
      top: top + 'px'
    });
  }
  //Revert to original layout
  changeLayoutToOriginal() {
    $('#services-container, #statistics-container, #newsApiForm, #services-container').css({display: 'none'});
    $('.article').addClass('hidden');
    $('.middle').css({
      top: '25%',
      left: '50%',
      transform: 'translate(-50%)'
    });
    $('#quick-links').css({
      display: 'inline-block',
      height: 'unset'
    });
  }

  //Show news on click of button, available in Quick links sections
  setupNews() {
    var _this = this;
    this.newsApiKey = localStorage.getItem('newsApiKey');
    $('#news-btn').on('click', () => {
      if (this.currentLayout === 'news') return;
      this.currentLayout = 'news';
      this.changeLayout();
      $('.article').removeClass('hidden');
      $('#newsApiForm').css('display', 'block');
      $('#submitNewApiKey').on('click', () => {
        _this.newsApiKey = $('#newsApiKeyInput').val();
        if (!_this.newsApiKey) {
          _this.showWarning('Please enter a valid NewsApi key');
          return;
        }
        localStorage.setItem('newsApiKey', _this.newsApiKey);
        $('#news-btn').click();
      });
      $('#newsApiKeyInput').val(_this.newsApiKey);
      if (!this.newsApiKey) return;
      $('#services-container .loader').css('display', 'block');
      $.ajax({
        url: `https://newsapi.org/v2/top-headlines?country=us&apiKey=${_this.newsApiKey}`,
        cache: false,
        success: function(data) {
          data.articles.forEach(item => {
            $.ajax({
              url: item.urlToImage,
              xhr: function() {
                // Seems like the only way to get access to the xhr object
                var xhr = new XMLHttpRequest();
                xhr.responseType = 'blob';
                return xhr;
              },
              success: result => {
                var url = window.URL || window.webkitURL;
                item.urlToImage = url.createObjectURL(result);
                _this.newsArticles.push(item);
                var elem = `<div class='article'><div class='headlines'><h3>${item.title}</h3><a href='${item.url}' target='_blank'><h4>${item.description}</h4></a></div><div class='background-image' style='background-image: url('${item.urlToImage}')' /></div></div>`;
                $('#newsApiForm').before(elem);
                $('#services-container .loader').css('display', 'none');
              }
            });
          });
        }
      });
    });
  }
}

angular
  .module('MTWNewTab', [])
  .controller('NewTabCtrl', NewTabCtrl)
  .filter('startFrom', startFrom);

