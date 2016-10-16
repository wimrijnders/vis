var BarParentGraph = require ('./BarParentGraph');
var support        = require ('./Support');


function BarSizeGraph() {
  this.isColorBar    = false;
  this.isValueLegend = false;
}
support.derive(BarSizeGraph, BarParentGraph);


BarSizeGraph.prototype.getColor = function(graph3d, point) {
  return {
    color      : graph3d.dataColor.fill,
    borderColor: graph3d.dataColor.stroke
  };
};


/**
 * Override for method in parent class.
 */
BarSizeGraph.prototype.redrawPoint = function(graph3d, ctx, point) {
  // calculate size for the bar
  var numer  = (point.point.value - graph3d.valueMin);
  var denom  = (graph3d.valueMax  - graph3d.valueMin);
  var factor = numer/denom * 0.8 + 0.2;

  var dg     = graph3d.dataGroup;
  var xWidth = dg.xBarWidth / 2 * factor;
  var yWidth = dg.yBarWidth / 2 * factor;

  this.drawBar(graph3d, ctx, point, xWidth, yWidth);
};


module.exports = BarSizeGraph;
