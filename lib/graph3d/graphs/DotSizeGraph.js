var Point3d    = require('../Point3d');
var PointGraph = require ('./PointGraph');
var support    = require ('./Support');


function DotSizeGraph() {
  this.isColorBar      = false;
  this.isValueLegend   = true;
};
support.derive(DotSizeGraph, PointGraph);


/**
 * Override of parent method.
 */
DotSizeGraph.prototype.getColor = function(graph3d, point) {
  return {
    color      : graph3d.dataColor.fill,
    borderColor: graph3d.dataColor.stroke
  };
};


DotSizeGraph.prototype.redrawPoint =
function(graph3d, ctx, point) {
  var g        = graph3d;

  // calculate size of the circle
  var tmpSize  = (point.point.value - g.valueMin) / (g.valueMax - g.valueMin);
  var dotSize  = this.getDotSize(graph3d);
  var size     = dotSize/2 + 2*dotSize * tmpSize;

  this.drawCircle(graph3d, ctx, point, size);
  //this.parent().redrawPoint.call(this, graph3d, ctx, point, size);
};


/**
 * Override for method in parent class.
 */
DotSizeGraph.prototype.drawLegend = function(graph3d, ctx) {
  // Overrides for this particular style handler
  var dotSize = this.getDotSize(graph3d);

  var overrides = {
    width   : dotSize / 2 + dotSize *2,   // px
    widthMin: dotSize / 2                 // px
  };

  PointGraph.prototype.drawLegend.call(this, graph3d, ctx, overrides);
};


module.exports = DotSizeGraph;
