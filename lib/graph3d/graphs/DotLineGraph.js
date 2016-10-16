var Point3d    = require('../Point3d');
var PointGraph = require ('./PointGraph');
var support    = require ('./Support');


function DotLineGraph() {
  this.isColorBar      = true;
  this.isValueLegend   = false;
}
support.derive(DotLineGraph, PointGraph);


DotLineGraph.prototype.redrawPoint =
function(graph3d, ctx, point) {
  // draw a vertical line from the bottom to the graph value
  var from = graph3d._convert3Dto2D(point.bottom);
  ctx.lineWidth = 1;
  ctx.strokeStyle = graph3d.gridColor;
  graph3d._line(ctx, from, point.screen);

  this.parent().redrawPoint.call(this, graph3d, ctx, point);
};


module.exports = DotLineGraph;
