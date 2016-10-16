var BaseGraph = require ('./BaseGraph');
var support   = require ('./Support');


function LineGraph() {
  BaseGraph.call(this);

  this.doSort = false;
}
support.derive(LineGraph, BaseGraph);


/**
 * Override of parent method
 */
LineGraph.prototype.getDataPoints = function(graph3d, data) {
  console.log('Called LineGraph.prototype.getDataPoints()');

  var dataPoints = [];

  // copy all values from the google data table to a list with Point3d objects
  for (var i = 0; i < data.length; i++) {
    var point = this.pointFromData(graph3d, data[i]);
    var obj   = this.createDataPoint(graph3d, point);

    // Add next point for line drawing
    if (i > 0) {
      dataPoints[i - 1].pointNext = obj;
    }

    dataPoints.push(obj);
  }

  return dataPoints;
};


LineGraph.prototype.initDraw = function(graph3d, ctx) {
  console.log('Called LineGraph.prototype.initDraw()');

};


LineGraph.prototype.redrawPoint = function(graph3d, ctx, point) {
  if (point.pointNext === undefined) return;

  ctx.lineWidth   = graph3d._getStrokeWidth(point);
  ctx.lineJoin    = 'round';
  ctx.lineCap     = 'round';
  ctx.strokeStyle = graph3d.dataColor.stroke;

  graph3d._line(ctx, point.screen, point.pointNext.screen);
};


/**
 * Override for method in parent class.
 */
LineGraph.prototype.drawLegend = function(graph3d, ctx) {
  // Do nothing; no legend for this style handler.
};

module.exports = LineGraph;
