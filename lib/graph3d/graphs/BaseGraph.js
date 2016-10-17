var Legend  = require('../Legend');
var Point3d = require('../Point3d');
var support = require ('./Support');


function BaseGraph() {
}


BaseGraph.prototype.adjustForBarWidth = function() {};


BaseGraph.prototype.drawLegend = function(graph3d, ctx, options) {
  Legend.drawLegend(graph3d, ctx, options, this.isColorBar, this.isValueLegend);
};


BaseGraph.prototype.pointFromData = function(dataGroup, dataItem) {
  var dg = dataGroup;

  var point = new Point3d();
  point.x = dataItem[dg.colX] || 0;
  point.y = dataItem[dg.colY] || 0;
  point.z = dataItem[dg.colZ] || 0;

  if (dg.colValue !== undefined) {
    point.value = dataItem[dg.colValue] || 0;
  }

  return point;
};


BaseGraph.prototype.createDataPoint = function(dataGroup, point) {
  var z = dataGroup.absoluteRanges.z.min;

  var obj = {};
  obj.point  = point;
  obj.bottom = new Point3d(point.x, point.y, z);
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
BaseGraph.prototype.getDataPoints = function(dataGroup, data) {
  var dg         = dataGroup;
  var dataPoints = [];

  // copy all values from the google data table to a list with Point3d objects
  for (var i = 0; i < data.length; i++) {
    var point = this.pointFromData(dg, data[i]);
    var obj   = this.createDataPoint(dg, point);
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


module.exports = BaseGraph;
