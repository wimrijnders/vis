var Legend  = require('../Legend');
var Point3d = require('../Point3d');
var support = require ('./Support');


function BaseGraph() {
}


BaseGraph.prototype.adjustForBarWidth =
  function(graph3d, data, xRange, yRange) {};


BaseGraph.prototype.drawLegend = function(graph3d, ctx, options) {
  Legend.drawLegend(graph3d, ctx, options, this.isColorBar, this.isValueLegend);
};


BaseGraph.prototype.pointFromData = function(graph3d, dataItem) {
  var g = graph3d;

  var point = new Point3d();
  point.x = dataItem[g.colX] || 0;
  point.y = dataItem[g.colY] || 0;
  point.z = dataItem[g.colZ] || 0;

  if (g.colValue !== undefined) {
    point.value = dataItem[g.colValue] || 0;
  }

  return point;
};


BaseGraph.prototype.createDataPoint = function(graph3d, point) {
  var obj = {};
  obj.point  = point;
  obj.bottom = new Point3d(point.x, point.y, graph3d.zMin);
  obj.trans  = undefined;
  obj.screen = undefined;

  return obj;
};


/**
 * Filter the data based on the current filter
 *
 * This method for 'dot', 'dot-line', etc.
 *
 * @param {Array} data
 * @return {Array} dataPoints   Array with point objects which can be drawn on screen
 */
BaseGraph.prototype.getDataPoints = function(graph3d, data) {
  var dataPoints = [];

  // copy all values from the google data table to a list with Point3d objects
  for (var i = 0; i < data.length; i++) {
    var point = this.pointFromData(graph3d, data[i]);
    var obj   = this.createDataPoint(graph3d, point);
    dataPoints.push(obj);
  }

  return dataPoints;
};


/**
 * Find a data point close to given screen position (x, y)
 */
BaseGraph.prototype.dataPointFromXY = function(graph3d, x, y) {
  var distMax          = 100; // px
  var closestDist      = null;
  var closestDataPoint = null;

  // find the closest data point, using distance to the center of
  // the point on 2d screen
  for (var i = 0; i < graph3d.dataPoints.length; i++) {
    var dataPoint = graph3d.dataPoints[i];
    var point     = dataPoint.screen;

    if (point) {
      var distX = Math.abs(x - point.x);
      var distY = Math.abs(y - point.y);
      var dist  = Math.sqrt(distX * distX + distY * distY);

      if ((closestDist === null || dist < closestDist) && dist < distMax) {
        closestDist      = dist;
        closestDataPoint = dataPoint;
      }
    }
  }

  return closestDataPoint;
};


BaseGraph.prototype.redraw = function(graph3d, ctx, points) {
  console.log('Called BaseGraph.prototype.redraw()');

  if (points === undefined || points.length === 0) {
    return;
  }

  for (var i = 0; i < points.length; i++) {
    var point = points[i];
    if (point === undefined) continue;

    this.redrawPoint(graph3d, ctx, point);
  }
};

module.exports = BaseGraph;
