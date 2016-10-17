var DataSet      = require('../DataSet');
var DataView     = require('../DataView');
var Filter       = require('./Filter');
var Graph        = require('./graphs/Graph');
var Point3d      = require('./Point3d');
var Range        = require('./Range');
var Settings     = require('./Settings');
var support      = require('./graphs/Support');

var select = support.select;     // Local alias for given function


// --------------------------------
// Class DataGroup
// --------------------------------


function DataGroup() {
};


DataGroup.prototype.init = function(options) {
  // for now, we use a ref to the passed options (i.e. the Graph3d instance)
  //this._options = options;

  this.xBarWidth     = options.xBarWidth;
  this.yBarWidth     = options.yBarWidth;
  this.style         = options.style;
  this._graphHandler = Graph.get(options.style);
};


DataGroup.prototype.getColumnRange = function(data,column) {
  var minMax = new Range();

  for (var i = 0; i < data.length; i++) {
    minMax.add(data[i][column]);
  }

  return minMax;
};


DataGroup.prototype.getDistinctValues = function(values, column) {
  var distinctValues = [];

  for (var i in values) {
    var value = values[i][column];

    if (distinctValues.indexOf(value) === -1) {
      distinctValues.push(value);
    }
  }

  return distinctValues;
};


/**
 * Initialize the data from the data table. Calculate minimum and maximum values
 * and column index values
 *
 * @param {Array | DataSet | DataView} rawData   The data containing the items for the Graph.
 * @param {Graph} graph The current Graph3d instance; only needed for Filter
 */
DataGroup.prototype.dataInitialize = function(rawData, graph3d) {
  if (rawData && Array.isArray(rawData)) {
    rawData = new DataSet(rawData);
  }

  if (rawData && !(rawData instanceof DataSet || rawData instanceof DataView)) {
    throw new Error('Array, DataSet, or DataView expected');
  }

  // unsubscribe from the dataTable
  if (this.dataSet) {
    this.dataSet.off('*', this._onChange);
  }

  var data = rawData.get();
  if (data.length === 0)
    return;

  this.dataSet   = rawData;
  this.dataTable = data;


  // subscribe to changes in the dataset
  var me = this;
  this._onChange = function () {
    me.setData(me.dataSet);
  };
  this.dataSet.on('*', this._onChange);

  // determine the location of x,y,z,value,filter columns
  this.colX      = 'x';
  this.colY      = 'y';
  this.colZ      = 'z';

  var xRange = this.getColumnRange(data, this.colX);
  var yRange = this.getColumnRange(data, this.colY);
  var zRange = this.getColumnRange(data, this.colZ);

  // For Bar graphs, take bar dimensions into account
  this._graphHandler.adjustForBarWidth(this, data, xRange, yRange);

  var DEFAULTS = Settings.DEFAULTS;

  // calculate minimums and maximums
  var DEFAULTSTEPS = 5;

  xRange.override(DEFAULTS.XMin, DEFAULTS.XMax);
  this.xStep = select(DEFAULTS.XStep, xRange.range()/DEFAULTSTEPS);

  yRange.override(DEFAULTS.YMin, DEFAULTS.YMax);
  this.yStep = select(DEFAULTS.YStep, yRange.range()/DEFAULTSTEPS);

  zRange.override(DEFAULTS.ZMin, DEFAULTS.ZMax);
  this.zStep = select(DEFAULTS.ZStep, zRange.range()/DEFAULTSTEPS);

  this.xRange = xRange;
  this.yRange = yRange;
  this.zRange = zRange;

  if (data[0].hasOwnProperty('style')) {
    this.colValue  = 'style';

    var valueRange = this.getColumnRange(data, this.colValue);
    valueRange.override(DEFAULTS.ValueMin, DEFAULTS.ValueMax);

    this.valueRange = valueRange;
  }

  // these styles default to having legends
  var isLegendGraphStyle = this.style === Graph.STYLE.DOTCOLOR
                        || this.style === Graph.STYLE.DOTSIZE;

  this.showLegend = isLegendGraphStyle;

  // check if a filter column is provided
  if (data[0].hasOwnProperty('filter')) {
    var colFilter = 'filter';

    if (this.dataFilter === undefined) {
      this.dataFilter = new Filter(this, colFilter, graph3d);
      this.dataFilter.setOnLoadCallback(function() {graph3d.redraw();});
    }
  }
};


DataGroup.prototype.getScale = function() {
  return new Point3d(
    1 / this.xRange.range(),
    1 / this.yRange.range(),
    1 / this.zRange.range()
  );
};


DataGroup.prototype.getCenter = function() {
  return new Point3d(
    this.xRange.center(),
    this.yRange.center(),
    this.zRange.center()
  );
};


DataGroup.prototype.getDataPoints = function(dataGroup, data) {
  if (dataGroup === null || dataGroup === undefined) {
    dataGroup = this;
  }

  if (data === undefined) {
    data = this.dataTable;
  }

  return this._graphHandler.getDataPoints(dataGroup, data);
}


DataGroup.prototype.drawLegend = function(graph3d, ctx) {
  this._graphHandler.drawLegend(graph3d, ctx);
};


DataGroup.prototype.readData = function() {
  var dataPoints;

  if (this.dataFilter) {
    dataPoints = this.dataFilter._getDataPoints();
  } else {
    dataPoints = this.getDataPoints();
  }

  return dataPoints;
};


DataGroup.prototype.hasFilter = function() {
  return (this.dataFilter !== undefined);
};


/**
 * Find a data point close to given screen position (x, y)
 * @param {Number} x
 * @param {Number} y
 * @return {Object | null} The closest data point or null if not close to any data point
 * @private
 */
DataGroup.prototype.dataPointFromXY = function(graph3d, x, y) {
  return this._graphHandler.dataPointFromXY(graph3d, x, y);
};


DataGroup.prototype.getFilterMessage = function() {
  if (!this.hasFilter()) {
    return undefined;
  }

  return this.dataFilter.getLabel()
       + ': ' + this.dataFilter.getSelectedValue();
};


DataGroup.prototype.getNumberOfRows = function(data) {
  if (data === undefined) {
    data = this.dataTable;
  }

  return data.length;
};


DataGroup.prototype.getNumberOfColumns = function(data) {
  debugger;

  if (data === undefined) {
    data = this.dataTable;
  }

  var counter = 0;
  for (var column in data[0]) {
    if (data[0].hasOwnProperty(column)) {
      counter++;
    }
  }
  return counter;
};


DataGroup.prototype.setAbsoluteRanges = function(graph3d) {
  this.absoluteRanges = {
    x: graph3d.xRange,
    y: graph3d.yRange,
    z: graph3d.zRange
  };
};


module.exports = DataGroup;
