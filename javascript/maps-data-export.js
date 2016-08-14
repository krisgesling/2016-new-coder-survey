/* CONFIGURABLE VARIABLES */
var surveyData = 'https://raw.githubusercontent.com/FreeCodeCamp/2016-new-coder-survey/master/clean-data/2016-FCC-New-Coders-Survey-Data.csv';
var worldJSON = 'https://raw.githubusercontent.com/krisgesling/d3-play/master/world-geo3-min.json';

//var surveyData = '2016-FCC-New-Coders-Survey-Data.csv';
//var worldJSON = 'world-geo2-min.json';
var width = 900;
var height = width/7*4;
var maps = ['all','gender','ethnicity','age'];
// Title of fields in dataset
var countryField = "CountryLive";
var countryAltField = "CountryCitizen";
var genderField = "Gender";
var ethnicityField = "IsEthnicMinority";
var ageField = "Age";
// defines the [type, [breakpoints between colors for map fill], description for legend, [country.properties keys for global stats], [descriptors for global stats], [keys for tooltip stats if diff from global], [descriptors for tooltip stats]
var mapFill = {
  all: ['num', [20, 100, 500, 1000],'Number of survey respondents per country of citizenship.', ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'], ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'], ['citizen', 'nonCitizen'], ['Citizen', 'Non-Citizen']],
  gender: ['percent', [0.15,0.25,0.35,0.45],'Proportion of female, trans*, agender and genderqueer respondents.', ['male', 'female', 'ATQ', 'NR'], ['Male', 'Female', 'Trans*, Genderqueer or Agender', 'No response']],
  ethnicity: ['percent', [0.20,0.3,0.4,0.6], 'Proportion of respondents who are members of an ethnic minority in their country.', ['ethnicMajority', 'ethnicity'], ['Ethnic Majority', 'Ethnic minority']],
  age: ['num', [21, 25, 29, 33], 'Average age of respondents per country.', [0, 1, 2, 3, 4, 5], [' aged 0-21', ' aged 22-25', ' aged 26-29', ' aged 30-33', ' aged 34+', ' no response']]
    };
// Color assignment - remember to also change sass variables // TODO Shift all modifiable colors to JS
var colors = {
  all: {
    spectrum: ['#c9df8a','#77ab59','#36802d','#234d20', '#112610'],
    Africa: '#17becf',
    Asia: '#ff7f0e',
    Europe: '#bcbd22',
    'North America': '#1f77b4',
    'South America': '#e377c2',
    Oceania: '#8c564b',
    citizen: '#c5b0d5',
    nonCitizen: '#d62728'
  },
  gender: {
    spectrum: ['#9777A8','#6B2A8F','#500A76','#3A0358','#1D002C'],
    female: '#FF1493',
    ATQ: '#FFFF00',
    male: '#000050',
    NR: '#fff'
  },
  ethnicity: {
    spectrum: ['#DE6862', '#FE0D00', '#B40900', '#640500', '#220200'],
    'ethnicity': '#640500',
    'ethnicMajority': '#DE6862'
  },
  age: {
    spectrum: ['#FFB86B','#FF9420','#E67800','#7F4200', '#170C00'],
    0: '#1f77b4',
    1: '#2ca02c',
    2: '#d62728',
    3: '#9467bd',
    4: '#bcbd22',
    5: '#fff'
  },
  NR: '#fff',
  water: '#add8e6',
  path: ['#333','0.2px'],
};

/* OTHER VARIABLE ASSIGNMENT */
var activeGraph = 'all';
var graphData = {};
var globalStats = {}
for (var map in mapFill) {
  for (var j = 0; j < mapFill[map][3].length; j++) {
    globalStats[mapFill[map][3][j]] = 0;
  }
}

/* FUNCTIONS */
function loadData(data) {
  // Pulls in statistics and counts them per country, as well as globally.
    // Country constructor
    function Country(displayName) {
      this.total = 0;
      this.female = 0;
      this.ATQ = 0;
      this.male = 0;
      this.NR = 0;
      this.displayName = displayName;
      this.ethnicity = 0;
      this.ethnicMajority = 0;
      this.age = [0,0,0,0,0,0];
      this.totalAges = 0;
      this.avgAge = 0;
      this.citizen = 0;
      this.nonCitizen = 0;
    }

    function countGenderByCountry(e,i,arr) {
      // Remove white spaces from Country names - required to match with worldJSON data
      var countryLookup = {
        'Bosnia & Herzegovina': 'Bosnia and Herzegovina',
        'Korea South': 'South Korea',
        'Korea North': 'North Korea',
        'Netherlands (Holland, Europe)': 'Netherlands',
        'Congo': 'Democratic Republic of the Congo',
        'Tanzania': 'United Republic of Tanzania',
        'Nambia': 'Namibia',
        'Cote D\'Ivoire': 'Ivory Coast',
        'Republic of Montenegro': 'Montenegro'
      };
      var countryNameDisplay = countryLookup[data[i][countryField]] ? countryLookup[data[i][countryField]] : data[i][countryField];
      var countryName = countryNameDisplay.replace(/\s/g, '');
      // Create new country object if not already present in graphData
      if (!graphData[countryName]) {
        graphData[countryName] = new Country(countryNameDisplay);
      }
      graphData[countryName].total++;
      // Count for nonCitizen
      if (data[i][countryField] != data[i][countryAltField]) {
        graphData[countryName].nonCitizen ++;
      } else {
        graphData[countryName].citizen ++;
      }
      // Increment relevant gender field
      switch (data[i][genderField]) {
        case 'female':
          graphData[countryName].female ++;
          break;
        case 'male':
          graphData[countryName].male ++;
          break;
        case 'trans':
        case 'agender':
        case 'genderqueer':
          graphData[countryName].ATQ ++;
          break;
        default:
          graphData[countryName].NR ++;
      }

      // Count ethnic minority status
      if (data[i][ethnicityField] == 1) {
        graphData[countryName].ethnicity ++;
      } else {
        graphData[countryName].ethnicMajority ++;
      }

      // Tally age groupings based on breakpoints defined in mapFill
      if (data[i][ageField] == 'NA') {
        graphData[countryName].age[5]++;
      } else {
        var ageRangeArr = mapFill['age'][1];
        for (var j = 0; j < ageRangeArr.length; j++) {
          if (data[i][ageField] <= ageRangeArr[j]) {
            if (ageRangeArr[j-1] && data[i][ageField] <= ageRangeArr[j-1]) {
            } else {
              graphData[countryName].age[j]++;
            }
            //globalStats[j]++;
          }
        }
        if (data[i][ageField] > ageRangeArr[ageRangeArr.length-1]) {
            graphData[countryName].age[4]++;
            //globalStats[4]++;
        }
        // Calculate average age of each country
        if (data[i][ageField] !== 'NA' && parseInt(data[i][ageField]) > 5 && parseInt(data[i][ageField]) < 100) {
          graphData[countryName].avgAge = graphData[countryName].totalAges < 1 ? parseInt(data[i][ageField]) : (graphData[countryName].avgAge * graphData[countryName].totalAges + parseInt(data[i][ageField])) / (graphData[countryName].totalAges+1);
          graphData[countryName].totalAges ++;
        }
      }
    }
    data.forEach(countGenderByCountry);
    // Calculate non-male:male gender ratio for each country
    for (var country in graphData) {
      graphData[country].ratio = (graphData[country].female+graphData[country].ATQ)/graphData[country].male;
      // Tally each countries stats for globalStats
      for (var j in graphData[country]) {
        if (globalStats[j] !== 'undefined' && graphData[country][j] !== 'undefined') {
          globalStats[j] += parseInt(graphData[country][j]);
        }
      }
      // tally age groups // BROKEN - this takes from country avg rather than raw figures.
      for (var k = 0; k < graphData[country].age.length; k++ ) {
        //if (country == 'Australia') { console.log(graphData[country].age[k]) }
        globalStats[k] += graphData[country].age[k];
      }
    }
//  console.log(graphData.Australia.age);
}
// END FUNCTION loadData

function mergeData(e,i,arr) {
  // pull all relevant data fields into worldJSON for display
  for (var key in graphData[e.properties.name]) {
    e.properties[key] = graphData[e.properties.name][key];
  }
}
// END FUNCTION mergeData

function continentCount(e, i, arr) { // must call after geo data is loaded
  if (graphData[e.properties.name]) { globalStats[e.continent] += graphData[e.properties.name].total; }
}
// END FUNCTION continentCount

function pieChart(dataSet, selector, chartColors) {
  // General use function to create a pie chart
  // config variables
  var pieWidth = 100;
  var outerRadius = pieWidth / 2;
  var innerRadius = 0;
  var color = d3.scale.category10();

  // drawing the chart
  var pie = d3.layout.pie();
  var arc = d3.svg.arc()
                  .innerRadius(innerRadius)
                  .outerRadius(outerRadius);
  var svg = d3.select(selector)
              .append('svg')
              .attr({
                width: pieWidth,
                height: pieWidth
              });
  var arcs = svg.selectAll('g.arc')
                .data(pie(dataSet))
                .enter()
                .append('g')
                .attr('class','arc')
                .attr('transform','translate(' + outerRadius + ', ' + outerRadius + ')');
  arcs.append('path')
      .attr('fill', function(d,i) {
        if (typeof(chartColors) !== 'object') {
          return color(i);
        } else {
          return chartColors[i];
        }
      })
      .attr('d',arc);
} // END pieChart function

function percentify(num,total) {
  // Just returns a number as a percentage oftype string
  var percent = Math.round( num / total * 100);
  if (percent < 10) {
    percent = Math.round( num / total * 1000) / 10;
  }
  return percent + '%';
}
// END FUNCTION percentify

function sizeChange() {
  var graphWidth = document.getElementById('gender-map').offsetWidth;
  d3.select('g').attr('transform', 'scale(' + graphWidth/900 + ")");
  d3.select('svg')
    .attr('height', graphWidth/7*4);
}
// END FUNCTION sizeChange

// TODO Change to if statement, reintegrate to parent function?
function fillToLegendConv(num) {
  switch (activeGraph) {
    case 'all':
      return num;
      break;
    case 'gender':
      return num * 100 + '%';
      break;
    default:
      return num;
  }
}
// END FUNCTION fillToLegendConv

function renderMap() {
  // Exports generated JSON object for all collated country data.
  var exportData = JSON.stringify(graphData);
  var url = 'data:text/json;charset=utf8,' + encodeURIComponent(exportData);
  window.open(url, '_blank');
  window.focus();
  d3.json(worldJSON,function(json) {
    // pulls loaded data into worldJSON
    json.features.forEach(mergeData);
    if (globalStats['North America'] == 0) { json.features.forEach(continentCount); }
    function zoomed() {
      svg.attr('transform','translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
    }
    var totalRespondents = 0;
    // Rendering and display
    var projection = d3.geo.miller()
                           .scale(width/6)
                           .center([0,30])
    ;
    var path = d3.geo.path()
                     .projection(projection);

    var color = d3.scale.quantize()
                        .range([colors.gender.female, colors.gender.ATQ, colors.gender.male]);

    var zoom = d3.behavior.zoom()
                 .scale(1)
                 .scaleExtent([1,12])
                 .on('zoom', zoomed);

    var svg = d3.select('#gender-map')
                .append('svg')
                .attr('width', '100%')
                .attr('height', height)
                .attr('id','gender-map-svg')
                .style('background', colors.water)
                .append('g')
                .call(zoom)
                .append('g');
    var legend = d3.select('#gender-map')
                   .append('div')
                   .attr('width', width + 'px')
                   .attr('id', 'map-legend')
                   .html('<p class="description">' + mapFill[activeGraph][2] + '</p>')

    // Create map legend colors and labels
    var legendColors = legend.append('div')
                   .attr('class','legend-colors');
    if (mapFill[activeGraph][0] === 'percent') {
      var legendText = ['0-' + mapFill[activeGraph][1][0] *100 + '%', mapFill[activeGraph][1][0] *100 +1 + '-' + mapFill[activeGraph][1][1] *100 + '%', mapFill[activeGraph][1][1] *100 +1 + '-' + mapFill[activeGraph][1][2] *100 + '%', mapFill[activeGraph][1][2] *100 +1 + '-' + mapFill[activeGraph][1][3] *100 + '%', mapFill[activeGraph][1][3] *100 +1 + '-100%'];
    } else if (mapFill[activeGraph][0] === 'num') {
      var legendText = ['0-' + mapFill[activeGraph][1][0], mapFill[activeGraph][1][0]+1 + '-' + mapFill[activeGraph][1][1], mapFill[activeGraph][1][1]+1 + '-' + mapFill[activeGraph][1][2], mapFill[activeGraph][1][2]+1 + '-' + mapFill[activeGraph][1][3], mapFill[activeGraph][1][3]+1 + '+'];
    }

    for (var i = 0; i < colors[activeGraph].spectrum.length; i++) {
      legendColors.append('div')
            .style('background', colors[activeGraph].spectrum[i])
            .text(legendText[i]);
    }

    var globalTotal = globalStats.ATQ + globalStats.female + globalStats.male + globalStats.NR;
    legend.append('h3')
          .text('Global statistics');
    var legendTotal = legend.append('div')
          .attr('class','legend-total');

    for (var k = 0; k < mapFill[activeGraph][3].length; k++) {
      legendTotal.append('div')
          .style('background', colors[activeGraph][mapFill[activeGraph][3][k]])
          .style('width', percentify(globalStats[mapFill[activeGraph][3][k]], globalTotal));
    }

    var globalLegend = legend.append('ul');
    //var globalStatsWidth
    console.log(globalStats);
    for (var i = mapFill[activeGraph][3].length-1; i >= 0 ; i--) {
      globalLegend.append('li')
                  .attr('style', 'color: ' + colors[activeGraph][mapFill[activeGraph][3][i]])
//                  .attr('class', 'legend-color ' + mapFill[activeGraph][3][i])
                  .html('<span>' + percentify(globalStats[mapFill[activeGraph][3][i]],globalTotal) + ' ' + mapFill[activeGraph][4][i] + '</span>');
    }
    globalLegend.append('li')
                .attr('class', 'legend-color total')
                .html('<span>' + globalTotal + ' Total</span>');

    svg.append('rect')
       .attr({
          class: 'overlay',
          width: width,
          height: height
       });

          svg.selectAll('path')
             .data(json.features)
             .enter()
             .append('path')
             .attr('d', path)
             .attr('stroke', colors['path'][0])
             .attr('stroke-width', colors['path'][1])
             .attr('id', function(d) {
               return d.id;
             })
              // Define country fill rules
             .style('fill', function(d){
                totalRespondents = d.properties.ATQ + d.properties.female + d.properties.male + d.properties.NR;

                switch (activeGraph) {
                  case 'all':
                    var fillTest = totalRespondents;
                    break;
                  case 'gender':
                    var fillTest = (d.properties.female + d.properties.ATQ)/totalRespondents;
                    break;
                  case 'ethnicity':
                    var fillTest = d.properties.ethnicity / totalRespondents;
                    break;
                  case 'age':
                    var fillTest = parseInt(d.properties.avgAge);
                    break;
                }

                if (fillTest <= mapFill[activeGraph][1][0]) {
                     return colors[activeGraph].spectrum[0];
                  } else if (fillTest <= mapFill[activeGraph][1][1]) {
                     return colors[activeGraph].spectrum[1];
                  } else if (fillTest <= mapFill[activeGraph][1][2]) {
                     return colors[activeGraph].spectrum[2];
                  } else if (fillTest <= mapFill[activeGraph][1][3]) {
                     return colors[activeGraph].spectrum[3];
                  } else if (fillTest > mapFill[activeGraph][1][3]) {
                     return colors[activeGraph].spectrum[4];
                  } else {
                      return colors['NR'];
                  }
          })
          // Everything for tooltips
          .on('mouseover',function(d) {
            var graph = d3.select('#gender-map').node();
            var mousePos = d3.mouse(graph);
            mousePos[0] = (window.innerWidth-width)/2 + mousePos[0]
            mousePos[0] = mousePos[0] < (window.innerWidth/1.5) ? mousePos[0] : mousePos[0] - 340;

            var displayName = d.properties.displayName ? d.properties.displayName : d.properties.name.replace(/([A-Z])/g, ' $1').trim();
            totalRespondents = d.properties.ATQ + d.properties.female + d.properties.male + d.properties.NR;
            totalRespondents = totalRespondents ? totalRespondents : 0;

            if (typeof(d.properties.ratio) === "undefined" || (activeGraph === 'age' && d.properties.totalAges == 0)) {
              // then custom message for no data
              var tooltipData = 'No respondents from '+displayName;
              d3.select('#em-graph')
                .style('display','none');
            } else {
              // create pie chart and legend
              var tooltipChartItems = [];
              var tooltipChartColors = [];
              switch (activeGraph) {
                case 'all':
                  var tooltipArrIndex = 5;
                  break;
                default:
                  var tooltipArrIndex = 3;
                  break;
              }
              for (var i = 0; i < mapFill[activeGraph][tooltipArrIndex].length; i++) {
                if (activeGraph == 'age') {
                  tooltipChartItems.push(d.properties.age[i]);
                } else {
                  tooltipChartItems.push(d.properties[mapFill[activeGraph][tooltipArrIndex][i]]);
                }
                tooltipChartColors.push(colors[activeGraph][mapFill[activeGraph][tooltipArrIndex][i]]);
              }
//console.log('Chart items: ' + tooltipChartItems + '. Of type: ');
//console.log(typeof(tooltipChartItems[1]));
              pieChart(tooltipChartItems, '#gender-graph', tooltipChartColors);
              var tooltipData = '<ul>';
              for (var i = 0; i < mapFill[activeGraph][tooltipArrIndex].length; i++) {
                tooltipData += '<li style="color: ' + colors[activeGraph][mapFill[activeGraph][tooltipArrIndex][i]] + '"><span>' + percentify(tooltipChartItems[i], totalRespondents) + ' ' + mapFill[activeGraph][tooltipArrIndex + 1][i] + '</span></li>';
              }
              tooltipData += '</ul>';
            }

            d3.select('#tooltip-title')
                .text(displayName + ' (' + totalRespondents + ')');
            d3.select('#gender-data')
              .html(tooltipData);
            d3.select('#tooltip').style('left', mousePos[0]+'px')
              .style('top', mousePos[1]+'px');
            // Show tooltip
            d3.select('#tooltip').classed('hidden', false);
          })
          .on('mouseout', function() {
            // Hide tooltip
            d3.select('#tooltip').classed('hidden', true);
            d3.select('#gender-graph').select('svg').remove();
            d3.select('#em-graph').select('div').remove();
            d3.select('#em-data').select('ul').remove();
          });
    sizeChange();
  });
}
// END FUNCTION renderMap


/* PRIMARY CALLS */
d3.csv(surveyData, function(data) {
  loadData(data); // pulls survey data, counts gender and calculates gender ratio per country.
  renderMap();
});


d3.select(window)
  .on("resize", sizeChange);

window.onload = function() {
  var tabs = document.getElementsByClassName('tab');
  for (var i = 0; i < tabs.length; i++) {
    var tab = tabs[i];
    tab.onclick = function() {
      document.getElementById('active-tab').removeAttribute('id');
      activeGraph = this.className.replace('tab ','');
      this.setAttribute('id','active-tab');
      d3.select('#gender-map').select('svg').remove();
      d3.select('#gender-map').select('div').remove();
      renderMap();
    }
  }
};
