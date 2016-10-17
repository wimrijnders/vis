////////////////////////////////////////////////////////////////////////////////
// Graph Style Handlers
//
// This is the interface for accessing the particular style handlers for a given
// graph. Each style handler handles one graph type.
//
////////////////////////////////////////////////////////////////////////////////
var BarColorGraph  = require ('./BarColorGraph');
var BarGraph       = require ('./BarGraph');
var BarSizeGraph   = require ('./BarSizeGraph');
var DotColorGraph  = require ('./DotColorGraph');
var DotGraph       = require ('./DotGraph');
var DotLineGraph   = require ('./DotLineGraph');
var DotSizeGraph   = require ('./DotSizeGraph');
var GridGraph      = require ('./GridGraph');
var LineGraph      = require ('./LineGraph');
var SurfaceGraph   = require ('./SurfaceGraph');
var support        = require ('./Support');


/// enumerate the available styles
var STYLE = {
  BAR     : 0,
  BARCOLOR: 1,
  BARSIZE : 2,
  DOT     : 3,
  DOTLINE : 4,
  DOTCOLOR: 5,
  DOTSIZE : 6,
  GRID    : 7,
  LINE    : 8,
  SURFACE : 9
};


var graphHandlers = []; 


function init() {
  if (graphHandlers.length !== 0) return;

  graphHandlers[STYLE.DOT]      = new DotGraph();
  graphHandlers[STYLE.DOTLINE]  = new DotLineGraph();
  graphHandlers[STYLE.DOTCOLOR] = new DotColorGraph();
  graphHandlers[STYLE.DOTSIZE]  = new DotSizeGraph();
  graphHandlers[STYLE.LINE]     = new LineGraph();
  graphHandlers[STYLE.GRID]     = new GridGraph();
  graphHandlers[STYLE.SURFACE]  = new SurfaceGraph();
  graphHandlers[STYLE.BAR]      = new BarGraph();
  graphHandlers[STYLE.BARCOLOR] = new BarColorGraph();
  graphHandlers[STYLE.BARSIZE]  = new BarSizeGraph();
}


/**
 * Retrieve the style index from given styleName
 * @param {string} styleName  Style name such as 'dot', 'grid', 'dot-line'
 * @return {Number} styleNumber Enumeration value representing the style, or -1
 *                when not found
 */
function getStyleNumber(styleName) {
  switch (styleName) {
    case 'dot'      : return STYLE.DOT;
    case 'dot-line' : return STYLE.DOTLINE;
    case 'dot-color': return STYLE.DOTCOLOR;
    case 'dot-size' : return STYLE.DOTSIZE;
    case 'line'     : return STYLE.LINE;
    case 'grid'     : return STYLE.GRID;
    case 'surface'  : return STYLE.SURFACE;
    case 'bar'      : return STYLE.BAR;
    case 'bar-color': return STYLE.BARCOLOR;
    case 'bar-size' : return STYLE.BARSIZE;
  }

  return -1;
}


/**
 * Get the graph style handler associated with the given style.
 */
function get(style) {
  var graphHandler = graphHandlers[style];
  if (graphHandler === undefined) {
     return null;
  }

  return graphHandler;
}


function redraw(graph3d) {
  var points = graph3d.dataPoints;

  if (points === undefined || points.length <= 0) {
    throw new Error('No points passed');
  }

  var ctx          = graph3d.getContext();
  var graphHandler = graph3d.dataGroup._graphHandler;

  support.calcTranslations(graph3d, points, graphHandler.doSort);

  for (var i = 0; i < points.length; i++) {
    var point = points[i];
    if (point === undefined) continue;

    graphHandler.redrawPoint(graph3d, ctx, point);
  }
}


module.exports.STYLE          = STYLE;
module.exports.init           = init;
module.exports.get            = get;
module.exports.getStyleNumber = getStyleNumber;
module.exports.redraw         = redraw;
