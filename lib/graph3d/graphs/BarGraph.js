var BarParentGraph = require ('./BarParentGraph');
var support        = require ('./Support');


function BarGraph() {
  this.isColorBar      = true;
  this.isValueLegend   = false;
}
support.derive(BarGraph, BarParentGraph);


BarGraph.prototype.getColor = function(graph3d, point) {
  var hue  = graph3d.calcHue(point.point.z);

  return {
    color      : graph3d._hsv2rgb(hue, 1, 1),
    borderColor: graph3d._hsv2rgb(hue, 1, 0.8)
  };
};


module.exports = BarGraph;
