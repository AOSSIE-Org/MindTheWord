export class ProgressActivity {

  constructor(parentElementID, svgWidth, svgHeight, outerElementWidth) {
    this.parentElementID = parentElementID;
    this.dataPoints = [];
    this.outerElementWidth = outerElementWidth;
    this.svgWidth = svgWidth;
    this.svgHeight = svgHeight;
    this.upperBound = 300;
    this.container = d3.select(this.parentElementID).append('svg');
    this.dataPoints = null;
    this.xAxisUnit = 100; // for one day
    this.blockedWordsContainer = document.getElementById('ap-blocked-words');
    this.blockedWebsitesContainer = document.getElementById('ap-blocked-websites');
    this.setSecondaryContainers('ap-blocked-websites', 'ap-blocked-words');
    this.lastElementID = null;
    this.colorShades = [
      '#EBEDF0',
      '#C6E48B',
      '#7BC96F',
      '#239A3B',
      '#196127'
    ];
  }

  getDay(n) {
    switch (n) {
      case 0:
        return 'Sunday';

      case 1:
        return 'Monday';

      case 2:
        return 'Tuesday';

      case 3:
        return 'Wednesday';

      case 4:
        return 'Thursday';

      case 5:
        return 'Friday';

      case 6:
        return 'Saturday';

      default:
        throw new Error('[MTW] invalid Day code');
    }
  }

  getWordsTraslated(tMaplist) {
    let totalTranslations = 0;
    for (let i in tMaplist) {
      totalTranslations += tMaplist[i]['translation-count'];
    }
    return totalTranslations;
  }

  sort(object) {
    let k = Object.keys(object).length, list = [], temp;
    // day-number list
    for (let inst in object) {
      list.push(object[inst]['day-number']);
    }
    while (k--) {
      for (let i=0; i< list.length; i++) {
        for (let j = 0; j< list.length - 1; j++) {
          let a = list[j],
            b = list[j+1];
          if (a > b) {
            // swapping
            list[j] = list[j] + list[j+1];
            list[j+1] = list[j] - list[j+1];
            list[j] = list[j] - list[j+1];
            for (let inst in object) {
              if (object[inst]['day-number'] === a) {
                temp = object[inst];
                for (let inst2 in object) {
                  if (object[inst2]['day-number'] === b) {
                    object[inst] = object[inst2];
                    object[inst2] = temp;
                    break;
                  }
                }
                break;
              }
            }
          }
        }
      }
    }
    this.lastElementID = ((list.length - 1) * this.xAxisUnit).toString() + '_node_id';
    return object;
  }

  getColorSets(dataPoints) {
    let max = 0;
    for (let keys in dataPoints) {
      let words = this.getWordsTraslated(dataPoints[keys]['websites-visited']);
      max = words > max ? words : max;
    }
    let maxSize = Object.keys(this.colorShades).length;
    let inParts = max / maxSize,
      colors = [];
    // assign appropriate colors
    for (let keys in dataPoints) {
      let words = this.getWordsTraslated(dataPoints[keys]['websites-visited']),
        c = maxSize - 1;
      for (let j = maxSize; j > 0; j--) {
        if (words < ((j/maxSize) * max) && j !== 1) {
          --c;
          continue;
        } else {
          colors.push(this.colorShades[c--]);
          break;
        }
      }
    }
    return colors;
  }

  setDataPoints(rawPoints) {
    return new Promise((resolve, reject) => {
      this.rawPoints = this.sort(rawPoints);
      let colors = this.getColorSets(this.rawPoints);
      let temp = [], c = 0;
      for (let inst in this.rawPoints) {
        let hist = this.rawPoints[inst];
        let buffer = {
          'date': inst,
          'day': this.getDay(hist['day']),
          'words-translated': this.getWordsTraslated(hist['websites-visited']),
          'words-learnt': hist['words-learnt'],
          'saved-translation': hist['saved-translation'],
          'websites-visited': hist['websites-visited'].length,
          'day-number': hist['day-number'],
          'bubble_color': colors[c++]
        };
        temp.push(buffer);
      }
      resolve(temp);
    });
  }

  setScalingY(dataPoints) {
    let max = 0;
    for (let point in dataPoints) {
      max = parseInt(dataPoints[point]['words-translated']) > max ? parseInt(dataPoints[point]['words-translated']) : max;
    }
    this.upperBound = max > 150 ? this.upperBound : 100;
    max += this.upperBound;
    let wordsPerUnitYScale = max / this.svgHeight,
      xDivisions = this.svgHeight / 10;
    return {
      'xDivisions': xDivisions,
      'wordsPerUnitYScale': wordsPerUnitYScale
    };
  }

  generateCircles(coordinatesList, yScaleDiv) {
    let circles = this.container.selectAll('circle').data(coordinatesList).enter().append('circle');
    circles.attr('cx', (d, i) => {
      return d.x_axis * this.xAxisUnit + 15;
    }).attr('cy', d => {
      return this.svgHeight - (d.y_axis/ yScaleDiv) ;
    }).attr('r', () => {
      return 5;
    }).attr('fill', d => {
      return d.bubble_color;
    }).attr('id', (d, i) => {
      return (this.xAxisUnit * i).toString() + '_node_id';
    });
  }

  generateCurves(coordinatesList, yScaleDiv) {
    let line =  d3.line().curve(d3.curveCardinal).x(function (a,b) {
      return a.x_axis;
    }).y(function (a,b) {
      return a.y_axis;
    });

    let recompute = [];
    for (let inst in coordinatesList) {
      coordinatesList[inst].y_axis = this.svgHeight - (coordinatesList[inst].y_axis / yScaleDiv);
      coordinatesList[inst].x_axis = this.xAxisUnit * coordinatesList[inst].x_axis + 15;
    }

    this.container.append('path').attr('d', line(coordinatesList)).attr('stroke', 'black').attr('stroke-width', '2').attr('fill', 'none');
  }

  generateHovercards(coordinatesList, yScaleDiv, data) {
    let size = data.length;
    if (coordinatesList.length !== data.length) {
      throw new Error('mismatch in coordinates and data-points received');
    }
    for (let i =0; i< size; i++) {
      let element = document.createElement('div'),
        parentElement = document.getElementById((i * this.xAxisUnit) + '_node_id');
      element.id = (coordinatesList[i].x_axis * this.xAxisUnit) + '_node_id_hovercard';
      element.innerHTML = 'words-translated: <b class="key-styles">' + data[i]['words-translated'] + `</b> <br>
        words-learnt: <b class="key-styles">` + data[i]['words-learnt'] + `</b> <br>
        saved-translation: <b class="key-styles">` + data[i]['saved-translation'] + `</b> <br>
        websites-visited: <b class="key-styles">` + data[i]['websites-visited'] + '</b>';
      element.style.backgroundColor = '#fff';
      element.style.border = '1px solid pink';
      element.style.borderRadius = '10px';
      element.style.padding = '5px';
      element.style.display = 'none';
      element.style.fontSize = '13px';
      document.getElementById('activity-progress-chart').appendChild(element);
      this.container.append('text').text(data[i]['date'] + ', ' + data[i]['day'])
        .attr('x', parseInt(parentElement.getAttribute('cx')) + 10)
        .attr('y', parseInt(parentElement.getAttribute('cy')) + 10)
        .attr('font-size', 10)
        .attr('id', 'ap-' + data[i]['date'] + ', ' + data[i]['day'])
        .attr('date', data[i]['date']);
      parentElement.setAttribute('date', data[i]['date']);
      parentElement.onmousemove = function(eve) {
        eve.stopPropagation();
        let ele = document.getElementById(this.id + '_hovercard');
        ele.style.display = 'block';
        ele.style.top = this.getBoundingClientRect().top;
        ele.style.left = this.getBoundingClientRect().left;
        ele.style.position = 'absolute';
        ele.setAttribute('date', this.getAttribute('date'));
        ele.onmouseout = function() {
          this.style.display = 'none';
        };
        ele.onclick = function() {
          let date = this.getAttribute('date');
          document.getElementById('ap-websites-visited').innerHTML = '<div class="ap-websites-head"> Websites Visited</div>';
          chrome.storage.local.get('activityProgressStore', res => {
            let resp = res.activityProgressStore, count = 0;
            for (let url in resp[date]['websites-visited']) {
              let element = document.createElement('span');
              let urlLocal = resp[date]['websites-visited'][url]['url'];
              urlLocal = urlLocal.length > 30 ? urlLocal.substring(0, 27) + ' ... ' + urlLocal.substring(urlLocal.length - 6) : urlLocal;
              element.innerHTML = ++count + '. ' + urlLocal + ' <br/>';
              element.className = 'ap-list-urls';
              element.setAttribute('url', resp[date]['websites-visited'][url]['url']);
              element.setAttribute('date', date);
              element.onclick = function() {
                let url = this.getAttribute('url'),
                  date = this.getAttribute('date');
                document.getElementById('ap-websites-tMap').innerHTML = '<div class="ap-websites-head">Traslation Map</div>';
                chrome.storage.local.get('activityProgressStore', res => {
                  let resp = res.activityProgressStore;
                  let webpagesVisited = resp[date]['websites-visited'],
                    location = -1;
                  for (let web in webpagesVisited) {
                    if (webpagesVisited[web]['url'] === url) {
                      location = web;
                      break;
                    }
                  }
                  if (location !== -1) {
                    let tMap = webpagesVisited[location]['tMap'];
                    let c = 0;
                    for (let keys in tMap) {
                      let listElement = document.createElement('span');
                      listElement.innerHTML = ++c + '. <span class="key-styles">' + keys + '</span>: ' + tMap[keys] + '<br/>';
                      listElement.className = 'ap-list-tMap';
                      document.getElementById('ap-websites-tMap').appendChild(listElement);
                    }
                  } else {
                    throw new Error('Url unmatch.');
                  }
                });
              };
              document.getElementById('ap-websites-visited').appendChild(element);
            }
          });
        };
      };
    }

  }

  drawAxis(upperBoundY, count,div) {
    let x = 10;

    // y-axis
    this.container.append('line')
      .attr('x1', x).attr('y1', this.svgHeight)
      .attr('x2', x).attr('y2', 0)
      .style('stroke','black')
      .attr('stroke-width','1');

    this.container.append('line')
      .attr('x1', x).attr('y1', 0)
      .attr('x2', x + 5).attr('y2', 0)
      .style('stroke', 'black')
      .attr('stroke-width', '1')
      .attr('id', 'axis-x-' + 0);

    this.container.append('line')
      .attr('x1', x).attr('y1', 0)
      .attr('x2', 6000).attr('y2', 0)
      .style('stroke', 'pink')
      .attr('stroke-width', '1')
      .attr('id', 'axis-x-bg-' + 0);

    let labelHead = document.createElement('span');
    labelHead.innerText = Math.floor(upperBoundY * div);
    labelHead.style.position = 'absolute';
    labelHead.style.top = document.getElementById('axis-x-' + 0).getBoundingClientRect().top;
    labelHead.style.left = document.getElementById('axis-x-' + 0).getBoundingClientRect().left + 10;
    labelHead.style.fontSize = '11px';
    document.getElementById('activity-progress-chart').appendChild(labelHead);
    for (let i=1; i<= count; i++) {
      let y = Math.floor(upperBoundY * (i / count));
      this.container.append('line')
        .attr('x1', x).attr('y1', y)
        .attr('x2', x + 5).attr('y2', y)
        .style('stroke','black')
        .attr('stroke-width','1')
        .attr('id', 'axis-x-' + i);

      this.container.append('line')
        .attr('x1', x).attr('y1', y)
        .attr('x2', 6000).attr('y2', y)
        .style('stroke', 'pink')
        .attr('stroke-width', '1')
        .attr('id', 'axis-x-bg-' + i);

      let label = document.createElement('span');
      label.innerText = Math.floor((upperBoundY - y) * div);
      label.style.position = 'absolute';
      label.style.top = document.getElementById('axis-x-' + i).getBoundingClientRect().top;
      label.style.left = document.getElementById('axis-x-' + i).getBoundingClientRect().left + 10;
      label.style.fontSize = '11px';
      document.getElementById('activity-progress-chart').appendChild(label);
    }

    // x-axis
    this.container.append('line')
      .attr('x1', 0).attr('y1', this.svgHeight)
      .attr('x2', 6000).attr('y2', this.svgHeight)
      .style('stroke','black')
      .attr('stroke-width','1');

    for (let j =0; j< 6000; j+= 100) { // initialising chart for the month
      let i = j + 15;
      this.container.append('line')
        .attr('x1', i).attr('y1', this.svgHeight)
        .attr('x2', i).attr('y2', this.svgHeight - 5)
        .style('stroke','black')
        .attr('stroke-width','1')
        .attr('id', 'axis-y-' + i);

      this.container.append('line')
        .attr('x1', i).attr('y1', this.svgHeight)
        .attr('x2', i).attr('y2', 0)
        .style('stroke','pink')
        .attr('stroke-width','1')
        .attr('id', 'axis-y-bg-' + i);
    }
  }

  setSecondaryContainers(idBlockedWebsites, idBlockedWords) {
    chrome.storage.local.get('blacklist', res => {
      let webPages = res.blacklist;
      let inArr = webPages.substring(1, webPages.length -1).split('|');
      for (let i in inArr) {
        let element = document.createElement('span');
        element.innerHTML = (parseInt(i) + 1) + '. ' + inArr[i] + '<br/>';
        element.className = 'ap-list-tMap';
        document.getElementById(idBlockedWebsites).appendChild(element);
      }
    });
    chrome.storage.local.get('userBlacklistedWords', res => {
      let webPages = res.userBlacklistedWords;
      let inArr = webPages.substring(1, webPages.length -1).split('|');
      for (let i in inArr) {
        let element = document.createElement('span');
        element.innerHTML = (parseInt(i) + 1) + '. ' + inArr[i] + '<br/>';
        element.className = 'ap-list-tMap';
        document.getElementById(idBlockedWords).appendChild(element);
      }
    });
  }

  generate(rawPoints) {
    if (document.getElementById(this.parentElementID.substring(1)) !== null) {
      if (rawPoints !== null && Object.keys(rawPoints).length !== 0) {
        this.setDataPoints(rawPoints).then(res => {
          this.dataPoints = res;
          let scaleDiv = this.setScalingY(this.dataPoints);
          let coordinatesList = [];

          for (let coord in this.dataPoints) {
            let instance = {
              'x_axis': coord,
              'y_axis': this.dataPoints[coord]['words-translated'],
              'bubble_color': this.dataPoints[coord]['bubble_color']
            };
            coordinatesList.push(instance);
          }
          // graphic patterns are generated by superimposition of components
          this.generateCircles(coordinatesList, scaleDiv.wordsPerUnitYScale);
          this.generateHovercards(coordinatesList, scaleDiv.wordsPerUnitYScale, this.dataPoints);
          this.generateCurves(coordinatesList, scaleDiv.wordsPerUnitYScale);
          this.drawAxis(this.svgHeight , 5, scaleDiv.wordsPerUnitYScale);
          // horizontal scroll to the last element node
          document.getElementById(this.lastElementID).scrollIntoView();
          window.scrollTo(0,0);
        });
      } else if (Object.keys(rawPoints).length === 0) {
        let element = document.createElement('div');
        element.innerHTML = 'No Translation Data Found! Please use the extension to get the activity results.';
        element.style.textAlign = 'center';
        element.style.top = '50%';
        element.style.left = '40%';
        element.style.position = 'absolute';
        document.getElementById('activity-progress-chart').appendChild(element);
      } else {
        throw new Error('Unable to generate activity progress graph. Data-Points not found');
      }
    } else {
      setTimeout(() => {
        this.generate();
      }, 1000);
    }
  }
}
