var Point3d    = require('../Point3d');
var PointGraph = require ('./PointGraph');
var support    = require ('./Support');


function DotColorGraph() {
  this.isColorBar    = true;
  this.isValueLegend = true;
}
support.derive(DotColorGraph, PointGraph);


/**
 * Override of parent method.
 */
DotColorGraph.prototype.getColor = function(graph3d, point) {
  return graph3d.getValueColor(point);
};


module.exports = DotColorGraph;

