var MatrixGraph = require ('./MatrixGraph');
var support     = require ('./Support');


function GridGraph() {
  MatrixGraph.call(this);

  this.isColorBar    = true;
  this.isValueLegend = false;
}
support.derive(GridGraph, MatrixGraph);


GridGraph.prototype._gridLine = function(graph3d, ctx, from, to) {
  if (to === undefined) return;

  var zAvg = (from.point.z + to.point.z) / 2;
  var hue  = graph3d.calcHue(zAvg);

  ctx.lineWidth   = graph3d._getStrokeWidth(from) * 2;
  ctx.strokeStyle = graph3d._hsv2rgb(h, 1, 1);
  ctx.beginPath();
  ctx.moveTo(from.screen.x, from.screen.y);
  ctx.lineTo(to.screen.x  , to.screen.y  );
  ctx.stroke();
};


GridGraph.prototype.redrawPoint = function(graph3d, ctx, point) {
  if (point === undefined) return;

  ctx.lineJoin = 'round';
  ctx.lineCap  = 'round';

  var right = point.pointRight;
  var top   = point.pointTop;

  this._gridLine(graph3d, ctx, point, right);
  this._gridLine(graph3d, ctx, point, top);
};


module.exports = GridGraph;
