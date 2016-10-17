var BarParentGraph = require ('./BarParentGraph');
var support        = require ('./Support');


function BarColorGraph() {
  this.isColorBar    = true;
  this.isValueLegend = true;
}
support.derive(BarColorGraph, BarParentGraph);


BarColorGraph.prototype.getColor = function(graph3d, point) {
  return graph3d.getValueColor(point);
};


module.exports = BarColorGraph;
