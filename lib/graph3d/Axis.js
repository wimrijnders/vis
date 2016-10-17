var Point2d    = require('./Point2d');
var Point3d    = require('./Point3d');
var StepNumber = require('./StepNumber');


function drawAxisLabelX(graph3d, ctx, point3d, text, armAngle, yMargin) {
  if (yMargin === undefined) {
    yMargin = 0;
  }

  var point2d = graph3d._convert3Dto2D(point3d);

  if (Math.cos(armAngle * 2) > 0) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    point2d.y += yMargin;
  }
  else if (Math.sin(armAngle * 2) < 0){
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
  }
  else {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
  }

  ctx.fillStyle = graph3d.axisColor;
  ctx.fillText(text, point2d.x, point2d.y);
}


function drawAxisLabelY(graph3d, ctx, point3d, text, armAngle, yMargin) {
  if (yMargin === undefined) {
    yMargin = 0;
  }

  var point2d = graph3d._convert3Dto2D(point3d);

  if (Math.cos(armAngle * 2) < 0) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    point2d.y += yMargin;
  }
  else if (Math.sin(armAngle * 2) > 0){
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
  }
  else {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
  }

  ctx.fillStyle = graph3d.axisColor;
  ctx.fillText(text, point2d.x, point2d.y);
}


function drawAxisLabelZ(graph3d, ctx, point3d, text, offset) {
  if (offset === undefined) {
    offset = 0;
  }

  var point2d = graph3d._convert3Dto2D(point3d);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = graph3d.axisColor;
  ctx.fillText(text, point2d.x - offset, point2d.y);
};


/**
 * Redraw the axis
 */
function redraw(graph3d) {
  var ctx    = graph3d.getContext();

  // Local aliases to avoid having to add 'graph3d.' all the time
  var xRange = graph3d.xRange;
  var yRange = graph3d.yRange;
  var zRange = graph3d.zRange;
  var xStep  = graph3d.xStep;
  var yStep  = graph3d.yStep;
  var zStep  = graph3d.zStep;

  var gridColor = graph3d.gridColor;
  var axisColor = graph3d.axisColor;

  var from;
  var to;
  var text;
  var xText;
  var yText;
  var zText;
  var offset;
  var xOffset;
  var yOffset;
  var prettyStep;
  var step;

  // TODO: get the actual rendered style of the containerElement
  //ctx.font = graph3d.containerElement.style.font;
  ctx.font = 24 / graph3d.camera.getArmLength() + 'px arial';

  // calculate the length for the short grid lines
  var gridLenX   = 0.025 / graph3d.scale.x;
  var gridLenY   = 0.025 / graph3d.scale.y;
  var textMargin = 5 / graph3d.camera.getArmLength(); // px
  var armAngle   = graph3d.camera.getArmRotation().horizontal;
  var armVector  = new Point2d(Math.cos(armAngle), Math.sin(armAngle));

  // draw x-grid lines
  ctx.lineWidth = 1;
  prettyStep = (graph3d.defaultXStep === graph3d);
  step = new StepNumber(xRange.min, xRange.max, xStep, prettyStep);
  step.start();
  if (step.getCurrent() < xRange.min) {
    step.next();
  }

  while (!step.end()) {
    var x = step.getCurrent();

    if (graph3d.showGrid) {
      from = new Point3d(x, yRange.min, zRange.min);
      to   = new Point3d(x, yRange.max, zRange.min);
      graph3d._line3d(ctx, from, to, gridColor);
    }
    else {
      from = new Point3d(x, yRange.min           , zRange.min);
      to   = new Point3d(x, yRange.min + gridLenX, zRange.min);
      graph3d._line3d(ctx, from, to, axisColor);

      from = new Point3d(x, yRange.max           , zRange.min);
      to   = new Point3d(x, yRange.max - gridLenX, zRange.min);
      graph3d._line3d(ctx, from, to, axisColor);
    }

    yText       = (armVector.x > 0) ? yRange.min : yRange.max;
    var point3d = new Point3d(x, yText, zRange.min);
    var msg     = '  ' + graph3d.xValueLabel(step.getCurrent()) + '  ';
		drawAxisLabelX(graph3d, ctx, point3d, msg, armAngle, textMargin);

    step.next();
  }

  // draw y-grid lines
  ctx.lineWidth = 1;
  prettyStep = (graph3d.defaultYStep === undefined);
  step = new StepNumber(yRange.min, yRange.max, yStep, prettyStep);
  step.start();
  if (step.getCurrent() < yRange.min) {
    step.next();
  }

  var textPoint;

  while (!step.end()) {
    var y = step.getCurrent();

    if (graph3d.showGrid) {
      from = new Point3d(xRange.min, y, zRange.min);
      to   = new Point3d(xRange.max, y, zRange.min);
      graph3d._line3d(ctx, from, to, gridColor);
    }
    else {
      from = new Point3d(xRange.min           , y, zRange.min);
      to   = new Point3d(xRange.min + gridLenY, y, zRange.min);
      graph3d._line3d(ctx, from, to, axisColor);

      from = new Point3d(xRange.max           , y, zRange.min);
      to   = new Point3d(xRange.max - gridLenY, y, zRange.min);
      graph3d._line3d(ctx, from, to, axisColor);
    }

    var point3d   = new Point3d(
      (armVector.y > 0) ? xRange.min : xRange.max,
      y,
      zRange.min
    );
    var msg       = '  ' + graph3d.yValueLabel(y) + '  ';
		drawAxisLabelY(graph3d, ctx, point3d, msg, armAngle, textMargin);

    step.next();
  }

  // draw z-grid lines and axis
  ctx.lineWidth = 1;
  prettyStep = (graph3d.defaultZStep === undefined);
  step = new StepNumber(zRange.min, zRange.max, zStep, prettyStep);
  step.start();
  if (step.getCurrent() < zRange.min) {
    step.next();
  }

	// Following also used to draw z-label below
  xText = (armVector.x > 0) ? xRange.min : xRange.max;
  yText = (armVector.y < 0) ? yRange.min : yRange.max;

  var from2d;
  while (!step.end()) {
    var z = step.getCurrent();

    // TODO: make z-grid lines really 3d?
    from   = new Point3d(xText, yText, z);
    from2d = graph3d._convert3Dto2D(from);
    to     = new Point2d(from2d.x - textMargin, from2d.y);
    graph3d._line(ctx, from2d, to, axisColor);

    var msg = graph3d.zValueLabel(z) + ' ';
    drawAxisLabelZ(graph3d, ctx, from, msg, 5);

    step.next();
  }

  ctx.lineWidth = 1;
  from = new Point3d(xText, yText, zRange.min);
  to   = new Point3d(xText, yText, zRange.max);
  graph3d._line3d(ctx, from, to, axisColor);

  // draw x-axis
  ctx.lineWidth = 1;
  // line at yMin
  from = new Point3d(xRange.min, yRange.min, zRange.min);
  to   = new Point3d(xRange.max, yRange.min, zRange.min);
  graph3d._line3d(ctx, from, to, axisColor);

  // line at ymax
  from = new Point3d(xRange.min, yRange.max, zRange.min);
  to   = new Point3d(xRange.max, yRange.max, zRange.min);
  graph3d._line3d(ctx, from, to, axisColor);

  // draw y-axis
  ctx.lineWidth = 1;
  // line at xMin
  from = new Point3d(xRange.min, yRange.min, zRange.min);
  to   = new Point3d(xRange.min, yRange.max, zRange.min);
  graph3d._line3d(ctx, from, to, axisColor);

  // line at xMax
  from = new Point3d(xRange.max, yRange.min, zRange.min);
  to   = new Point3d(xRange.max, yRange.max, zRange.min);
  graph3d._line3d(ctx, from, to, axisColor);

  // draw x-label


  var xLabel = graph3d.xLabel;
  if (xLabel.length > 0) {
    yOffset = 0.1 / graph3d.scale.y;

    var point = new Point3d(
      xRange.center(),
      (armVector.x > 0) ? yRange.min - yOffset: yRange.max + yOffset,
      zRange.min
    );

    drawAxisLabelX(graph3d, ctx, point, xLabel, armAngle);
  }

  // draw y-label
  var yLabel = graph3s.yLabel;
  if (yLabel.length > 0) {
    xOffset = 0.1 / graph3d.scale.x;

    var point = new Point3d(
      (armVector.y > 0) ? xRange.min - xOffset : xRange.max + xOffset,
      yRange.center(),
      zRange.min
    );

    drawAxisLabelY(graph3d, ctx, point, yLabel, armAngle);
  }

  // draw z-label
  var zLabel = graph3d.zLabel;
  if (zLabel.length > 0) {
    // TODO: relate to the max width of the values on the z axis?
    var offset = 30;  // pixels.

    zText   = zRange.center();
    var point3d = new Point3d(xText, yText, zText);
    drawAxisLabelZ(graph3d, ctx, point3d, zLabel, offset);
  }
};


module.exports.redraw = redraw;
