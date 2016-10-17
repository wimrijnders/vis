var Axis       = require('./Axis');
var Camera     = require('./Camera');
var DataGroup  = require('./DataGroup');
//var DataSet    = require('../DataSet');
var DataView   = require('../DataView');
var Emitter    = require('emitter-component');
//var Filter     = require('./Filter');
var Graph      = require('./graphs/Graph');
var Point2d    = require('./Point2d');
var Point3d    = require('./Point3d');
//var Range      = require('./Range');
var Settings   = require('./Settings');
var Slider     = require('./Slider');
//var StepNumber = require('./StepNumber');
var util       = require('../util');



// --------------------------------
// Class Graph3d
// --------------------------------


/**
 * @constructor Graph3d
 * Graph3d displays data in 3d.
 *
 * Graph3d is developed in javascript as a Google Visualization Chart.
 *
 * @param {Element} container   The DOM element in which the Graph3d will
 *                              be created. Normally a div element.
 * @param {DataSet | DataView | Array} [data]
 * @param {Object} [options]
 */
function Graph3d(container, data, options) {
  if (!(this instanceof Graph3d)) {
    throw new SyntaxError('Constructor must be called with the new operator');
  }

  Graph.init();

  // create variables and set default values
  this.containerElement = container;

  Settings.setDefaults(this);

  // TODO: set eye.z about 3/4 of the width of the window?
  this.eye = new Point3d(0, 0, -1);

  //this.dataTable  = null;  // The original data table
  this.dataPoints = null; // The table with point objects

  // TODO: customize axis range

  // create a frame and canvas
  this.create();

  // apply options (also when undefined)
  this.setOptions(options);

  this.dataGroup = new DataGroup();
  this.dataGroup.init(this);

  // apply data
  if (data) {
    this.setData(data);
  }
}


// Extend Graph3d with an Emitter mixin
Emitter(Graph3d.prototype);


/**
 * Calculate the scaling values, dependent on the range in x, y, and z direction
 */
Graph3d.prototype._setScale = function() {
  this.scale = this.dataGroup.getScale();

  // keep aspect ration between x and y scale if desired
  if (this.keepAspectRatio) {
    if (this.scale.x < this.scale.y) {
      //noinspection JSSuspiciousNameCombination
      this.scale.y = this.scale.x;
    }
    else {
      //noinspection JSSuspiciousNameCombination
      this.scale.x = this.scale.y;
    }
  }

  // scale the vertical axis
  this.scale.z *= this.verticalRatio;
  // TODO: can this be automated? verticalRatio?

  // determine scale for (optional) value
  if (this.valueRange !== undefined) {
    this.scale.value = 1 / this.valueRange.range();
  }

  // position the camera arm
  var center = this.dataGroup.getCenter();
  center.x = center.x * this.scale.x;
  center.y = center.y * this.scale.y;
  center.z = center.z * this.scale.z;
  this.camera.setArmLocation(center.x, center.y, center.z);
};


/**
 * Convert a 3D location to a 2D location on screen
 *
 * http://en.wikipedia.org/wiki/3D_projection
 *
 * @param {Point3d} point3d   A 3D point with parameters x, y, z
 * @return {Point2d} point2d  A 2D point with parameters x, y
 */
Graph3d.prototype._convert3Dto2D = function(point3d) {
  var translation = this._convertPointToTranslation(point3d);
  return this._convertTranslationToScreen(translation);
};



/**
 * Convert a 3D location its translation seen from the camera
 * http://en.wikipedia.org/wiki/3D_projection
 * @param {Point3d} point3d    A 3D point with parameters x, y, z
 * @return {Point3d} translation A 3D point with parameters x, y, z This is
 *                   the translation of the point, seen from the
 *                   camera
 */
Graph3d.prototype._convertPointToTranslation = function(point3d) {
  var cameraLocation = this.camera.getCameraLocation();
  var cameraRotation = this.camera.getCameraRotation();

  var ax = point3d.x * this.scale.x;
  var ay = point3d.y * this.scale.y;
  var az = point3d.z * this.scale.z;

  var cx = cameraLocation.x;
  var cy = cameraLocation.y;
  var cz = cameraLocation.z;

  // calculate angles
  var sinTx = Math.sin(cameraRotation.x);
  var cosTx = Math.cos(cameraRotation.x);
  var sinTy = Math.sin(cameraRotation.y);
  var cosTy = Math.cos(cameraRotation.y);
  var sinTz = Math.sin(cameraRotation.z);
  var cosTz = Math.cos(cameraRotation.z);

  // calculate translation
  var factor0 = (sinTz * (ay - cy) + cosTz * (ax - cx));
  var factor1 = (cosTy * (az - cz) + sinTy * factor0);
  var factor2 = (cosTz * (ay - cy) - sinTz * (ax - cx));

  var dx      = cosTy * factor0 - sinTy * (az - cz);
  var dy      = sinTx * factor1 + cosTx * factor2;
  var dz      = cosTx * factor1 - sinTx * factor2;

  return new Point3d(dx, dy, dz);
};


/**
 * Convert a translation point to a point on the screen
 * @param {Point3d} translation   A 3D point with parameters x, y, z This is
 *                    the translation of the point, seen from the
 *                    camera
 * @return {Point2d} point2d    A 2D point with parameters x, y
 */
Graph3d.prototype._convertTranslationToScreen = function(translation) {
  var ex = this.eye.x;
  var ey = this.eye.y;
  var ez = this.eye.z;
  var dx = translation.x;
  var dy = translation.y;
  var dz = translation.z;

  // calculate position on screen from translation
  var bx;
  var by;
  if (this.showPerspective) {
    bx = (dx - ex) * (ez / dz);
    by = (dy - ey) * (ez / dz);
  } else {
    bx = dx * -(ez / this.camera.getArmLength());
    by = dy * -(ez / this.camera.getArmLength());
  }

  // shift and scale the point to the center of the screen
  // use the width of the graph to scale both horizontally and vertically.
  return new Point2d(
    this.xcenter + bx * this.frame.canvas.clientWidth,
    this.ycenter - by * this.frame.canvas.clientWidth
  );
};



////////////////////////////////////////////////////
// Following preserved for compatibility (for now)
////////////////////////////////////////////////////

/**
 * Enumerate the available styles.
 *
 * This definition retained for external compatibility
 * (It should be internal, but you never know)
 */
Graph3d.STYLE = Graph.STYLE;


Graph3d.prototype._getDataPoints = function(data) {
  return this.dataGroup._graphHandler.getDataPoints(this, data);
}


Graph3d.prototype._dataPointFromXY = function(x, y) {
  return this.dataGroup.dataPointFromXY(this, x, y);
};


Graph3d.prototype.getDistinctValues = function(values, column) {
  this.dataGroup.getDistinctValues(values, column);
};


////////////////////////////////////////////////////
// End preserved for compatibility
////////////////////////////////////////////////////


/**
 * Initialize the data from the data table. Calculate minimum and maximum values
 * and column index values
 *
 * @param {Array | DataSet | DataView} rawData   The data containing the items for the Graph.
 * @param {Number}     style   Style Number
 */
Graph3d.prototype._dataInitialize = function(rawData) {
  var dg = this.dataGroup;

  dg.dataInitialize(rawData);

  this.showLegend = dg.showLegend || Settings.DEFAULTS.ShowLegend;

  //TODO: Get the absolute min and max of all data groups here
  // For now, there is just one data group, so copy over.
  this.xRange = dg.xRange;
  this.yRange = dg.yRange;
  this.zRange = dg.zRange;
  this.xStep  = dg.xStep;
  this.yStep  = dg.yStep;
  this.zStep  = dg.zStep;

  this.valueRange = dg.valueRange;

  // set the scale dependent on the ranges.
  this._setScale();
};


/**
 * Create the main frame for the Graph3d.
 * This function is executed once when a Graph3d object is created. The frame
 * contains a canvas, and this canvas contains all objects like the axis and
 * nodes.
 */
Graph3d.prototype.create = function () {
  // remove all elements from the container element.
  while (this.containerElement.hasChildNodes()) {
    this.containerElement.removeChild(this.containerElement.firstChild);
  }

  this.frame = document.createElement('div');
  this.frame.style.position = 'relative';
  this.frame.style.overflow = 'hidden';

  // create the graph canvas (HTML canvas element)
  this.frame.canvas = document.createElement( 'canvas' );
  this.frame.canvas.style.position = 'relative';
  this.frame.appendChild(this.frame.canvas);

  var noCanvas = document.createElement( 'DIV' );
  noCanvas.style.color      = 'red';
  noCanvas.style.fontWeight =  'bold' ;
  noCanvas.style.padding    =  '10px';
  noCanvas.innerHTML =  'Error: your browser does not support HTML canvas';
  this.frame.canvas.appendChild(noCanvas);

  this.frame.filter = document.createElement( 'div' );
  this.frame.filter.style.position = 'absolute';
  this.frame.filter.style.bottom   = '0px';
  this.frame.filter.style.left     = '0px';
  this.frame.filter.style.width    = '100%';
  this.frame.appendChild(this.frame.filter);

  // add event listeners to handle moving and zooming the contents
  var me = this;
  var onmousedown  = function (event) {me._onMouseDown(event);};
  var ontouchstart = function (event) {me._onTouchStart(event);};
  var onmousewheel = function (event) {me._onWheel(event);};
  var ontooltip    = function (event) {me._onTooltip(event);};
  // TODO: these events are never cleaned up... can give a 'memory leakage'

  util.addEventListener(this.frame.canvas, 'keydown'   , onkeydown);
  util.addEventListener(this.frame.canvas, 'mousedown' , onmousedown);
  util.addEventListener(this.frame.canvas, 'touchstart', ontouchstart);
  util.addEventListener(this.frame.canvas, 'mousewheel', onmousewheel);
  util.addEventListener(this.frame.canvas, 'mousemove' , ontooltip);

  // add the new graph to the container element
  this.containerElement.appendChild(this.frame);
};


/**
 * Set a new size for the graph
 * @param {string} width   Width in pixels or percentage (for example '800px'
 *             or '50%')
 * @param {string} height  Height in pixels or percentage  (for example '400px'
 *             or '30%')
 */
Graph3d.prototype.setSize = function(width, height) {
  this.frame.style.width  = width;
  this.frame.style.height = height;

  this._resizeCanvas();
};


/**
 * Resize the canvas to the current size of the frame
 */
Graph3d.prototype._resizeCanvas = function() {
  var canvas = this.frame.canvas;

  canvas.style.width  = '100%';
  canvas.style.height = '100%';

  canvas.width  = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // adjust with for margin
  this.frame.filter.style.width = (canvas.clientWidth - 2*10) + 'px';
};


/**
 * Start animation
 */
Graph3d.prototype.animationStart = function() {
  if (!this.frame.filter || !this.frame.filter.slider)
    throw new Error('No animation available');

  this.frame.filter.slider.play();
};


/**
 * Stop animation
 */
Graph3d.prototype.animationStop = function() {
  if (!this.frame.filter || !this.frame.filter.slider) return;

  this.frame.filter.slider.stop();
};


/**
 * Resize the center position based on the current values in
 * DEFAULTS.XCenter and DEFAULTS.YCenter
 * (which are strings with a percentage or a value in pixels).
 *
 * The center positions are the variables this.xCenter
 * and this.yCenter
 */
Graph3d.prototype._resizeCenter = function() {
  var me    = this;
  var parse = function(value) {
    var ret;

    if (value.charAt(value.length - 1) === '%') {
      ret = parseFloat(value) / 100 * me.frame.canvas.clientWidth;
    } else {
      ret = parseFloat(value); // supposed to be in px
    }

    return ret;
  };

  this.xcenter = parse(Settings.DEFAULTS.XCenter);
  this.ycenter = parse(Settings.DEFAULTS.YCenter);
};


/**
 * Set the rotation and distance of the camera
 * @param {Object} pos   An object with the camera position. The object
 *             contains three parameters:
 *             - horizontal {Number}
 *             The horizontal rotation, between 0 and 2*PI.
 *             Optional, can be left undefined.
 *             - vertical {Number}
 *             The vertical rotation, between 0 and 0.5*PI
 *             if vertical=0.5*PI, the graph is shown from the
 *             top. Optional, can be left undefined.
 *             - distance {Number}
 *             The (normalized) distance of the camera to the
 *             center of the graph, a value between 0.71 and 5.0.
 *             Optional, can be left undefined.
 */
Graph3d.prototype.setCameraPosition = function(pos) {
  if (pos === undefined) {
    return;
  }

  if (pos.horizontal !== undefined && pos.vertical !== undefined) {
    this.camera.setArmRotation(pos.horizontal, pos.vertical);
  }

  if (pos.distance !== undefined) {
    this.camera.setArmLength(pos.distance);
  }

  this.redraw();
};


/**
 * Retrieve the current camera rotation
 * @return {object}   An object with parameters horizontal, vertical, and
 *          distance
 */
Graph3d.prototype.getCameraPosition = function() {
  var pos      = this.camera.getArmRotation();
  pos.distance = this.camera.getArmLength();

  return pos;
};


/**
 * Load data into the 3D Graph
 */
Graph3d.prototype._readData = function(data) {
  // read the data
  this._dataInitialize(data);

  this.dataPoints = this.dataGroup.readData();

  if (this.dataGroup.hasFilter()) {
    // draw the filter
    this._redrawFilter();
  } else {
    this.frame.filter.slider = undefined;
  }
};


/**
 * Replace the dataset of the Graph3d
 * @param {Array | DataSet | DataView} data
 */
Graph3d.prototype.setData = function (data) {
  this._readData(data);
  this.redraw();

  // start animation when option is true
  if (this.animationAutoStart && this.dataGroup.hasFilter()) {
    this.animationStart();
  }
};


/**
 * Update the options. Options will be merged with current options
 * @param {Object} options
 */
Graph3d.prototype.setOptions = function (options) {
  this.animationStop();
  Settings.merge(options, this);
  this.setSize(this.width, this.height);

  // re-load the data
  if (this.dataTable) {
    this.setData(this.dataTable);
  }

  // start animation when option is true
  if (this.animationAutoStart && this.dataGroup.hasFilter()) {
    this.animationStart();
  }
};


/**
 * Redraw the Graph.
 */
Graph3d.prototype.redraw = function() {
  if (this.dataPoints === undefined) {
    throw new Error('Graph data not initialized');
  }

  this._resizeCanvas();
  this._resizeCenter();
  this._redrawSlider();
  this._redrawClear();
  Axis.redraw(this);
  Graph.redraw(this);
  this._redrawInfo();
  this._redrawLegend();
};


/**
 * Clear the canvas before redrawing
 */
Graph3d.prototype._redrawClear = function() {
  var canvas = this.frame.canvas;
  var ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
};


/**
 * Redraw the legend based on size, dot color, or surface height
 */
Graph3d.prototype._redrawLegend = function() {
  //Return without drawing anything, if no legend is specified
  if (this.showLegend !== true) return;

  var ctx       = this.getContext();
  ctx.lineWidth = 1;
  ctx.font      = '14px arial'; // TODO: put in options

  this.dataGroup.drawLegend(this, ctx);
};


/**
 * Redraw the filter
 */
Graph3d.prototype._redrawFilter = function() {
  this.frame.filter.innerHTML = '';

  if (!this.dataGroup.hasFilter()) {
    throw new Error('No filter data available.');
  }

  var dataFilter = this.dataGroup.dataFilter;

  var options = {
    'visible': this.showAnimationControls
  };

  var slider = new Slider(this.frame.filter, options);
  this.frame.filter.slider = slider;

  // TODO: css here is not nice here...
  this.frame.filter.style.padding = '10px';

  slider.setValues(dataFilter.values);
  slider.setPlayInterval(this.animationInterval);

  // create an event handler
  var me = this;
  var onchange = function () {
    var index = slider.getIndex();

    dataFilter.selectValue(index);  // NB defined above
    me.dataPoints = dataFilter._getDataPoints();

    me.redraw();
  };
  slider.setOnChangeCallback(onchange);
};


/**
 * Redraw the slider
 */
Graph3d.prototype._redrawSlider = function() {
  if (this.frame.filter.slider !== undefined) {
    this.frame.filter.slider.redraw();
  }
};


/**
 * Redraw common information
 */
Graph3d.prototype._redrawInfo = function() {
  var msg = this.dataGroup.getFilterMessage();
  if (msg === undefined) {
    return;
  }

  var ctx = this.getContext();
  ctx.font         = '14px arial'; // TODO: put in options
  ctx.lineStyle    = 'gray';
  ctx.fillStyle    = 'gray';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';

  var x   = this.margin;
  var y   = this.margin;
  ctx.fillText(msg, x, y);
};


Graph3d.prototype._line = function(ctx, from, to, strokeStyle) {
  if (strokeStyle !== undefined) {
    ctx.strokeStyle = strokeStyle;
  }

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x  , to.y  );
  ctx.stroke();
}


Graph3d.prototype._line3d = function(ctx, from, to, strokeStyle) {
  //console.log('Called line3d');

  var from2d = this._convert3Dto2D(from);
  var to2d   = this._convert3Dto2D(to);

  this._line(ctx, from2d, to2d, strokeStyle);
}





/**
 * Calculate Hue from the given z-value.
 *
 * At zMin the hue is 240, at zMax the hue is 0
 */
Graph3d.prototype.calcHue = function(zValue) {
  var tmpHue = (zValue - this.zRange.min) * this.scale.z;
  var hue    = (1 - tmpHue / this.verticalRatio) * 240;

  return hue;
};


/**
 * Get the colors for a particular value of field 'value' of the point.
 */
Graph3d.prototype.getValueColor = function(point) {
  // calculate the color based on the value
  var tmpHue = (point.point.value - this.valueRange.min);
  var hue    = (1 - tmpHue * this.scale.value) * 240;

  return {
    color      : this._hsv2rgb(hue, 1, 1),
    borderColor: this._hsv2rgb(hue, 1, 0.8)
  };
};


/**
 * Calculate the color based on the given value.
 * @param {Number} h   Hue, a value be between 0 and 360
 * @param {Number} s   Saturation, a value between 0 and 1
 * @param {Number} v   Value, a value between 0 and 1
 */
Graph3d.prototype._hsv2rgb = function(h, s, v) {
  var c  = v * s;
  var hi = Math.floor(h/60);  // hi = 0,1,2,3,4,5
  var x  = c * (1 - Math.abs(((h/60) % 2) - 1));

  var r;
  var g;
  var b;
  switch (hi) {
    case 0: r = c; g = x; b = 0; break;
    case 1: r = x; g = c; b = 0; break;
    case 2: r = 0; g = c; b = x; break;
    case 3: r = 0; g = x; b = c; break;
    case 4: r = x; g = 0; b = c; break;
    case 5: r = c; g = 0; b = x; break;

    default: r = 0; g = 0; b = 0; break;
  }

  return 'RGB('
    + parseInt(r*255) + ','
    + parseInt(g*255) + ','
    + parseInt(b*255)
    + ')';
};


Graph3d.prototype._getStrokeWidth = function(point) {
  var width = this.dataColor.strokeWidth;

  if (point !== undefined) {
    if (this.showPerspective) {
      return 1 / -point.trans.z * width;
    }
    else {
      return -(this.eye.z / this.camera.getArmLength()) * width;
    }
  }

  return width;
};


/**
 * Start a moving operation inside the provided parent element
 * @param {Event}     event     The event that occurred (required for
 *                  retrieving the  mouse position)
 */
Graph3d.prototype._onMouseDown = function(event) {
  event = event || window.event;

  // check if mouse is still down (may be up when focus is lost for example
  // in an iframe)
  if (this.leftButtonDown) {
    this._onMouseUp(event);
  }

  // only react on left mouse button down
  this.leftButtonDown = event.which ? (event.which === 1) : (event.button === 1);
  if (!this.leftButtonDown && !this.touchDown) return;

  // get mouse position (different code for IE and all other browsers)
  this.startMouseX = getMouseX(event);
  this.startMouseY = getMouseY(event);

  this.startStart = new Date(this.start);
  this.startEnd   = new Date(this.end);
  this.startArmRotation = this.camera.getArmRotation();

  this.frame.style.cursor = 'move';

  // add event listeners to handle moving the contents
  // we store the function onmousemove and onmouseup in the graph, so we can
  // remove the eventlisteners lateron in the function mouseUp()
  var me = this;
  this.onmousemove = function (event) {me._onMouseMove(event);};
  this.onmouseup   = function (event) {me._onMouseUp(event);};
  util.addEventListener(document, 'mousemove', me.onmousemove);
  util.addEventListener(document, 'mouseup', me.onmouseup);
  util.preventDefault(event);
};


/**
 * Perform moving operating.
 * This function activated from within the funcion Graph.mouseDown().
 * @param {Event}   event  Well, eehh, the event
 */
Graph3d.prototype._onMouseMove = function (event) {
  event = event || window.event;

  // calculate change in mouse position
  var diffX = parseFloat(getMouseX(event)) - this.startMouseX;
  var diffY = parseFloat(getMouseY(event)) - this.startMouseY;

  var horizontalNew = this.startArmRotation.horizontal + diffX / 200;
  var verticalNew   = this.startArmRotation.vertical + diffY / 200;

  var snapAngle = 4; // degrees
  var snapValue = Math.sin(snapAngle / 360 * 2 * Math.PI);

  // snap horizontally to nice angles at 0pi, 0.5pi, 1pi, 1.5pi, etc...
  //
  // The -0.001 is to take care that the vertical axis
  // is always drawn at the left front corner
  if (Math.abs(Math.sin(horizontalNew)) < snapValue) {
    horizontalNew = Math.round((horizontalNew / Math.PI)) * Math.PI - 0.001;
  }
  if (Math.abs(Math.cos(horizontalNew)) < snapValue) {
    var tmp = (Math.round((horizontalNew/ Math.PI - 0.5)) + 0.5);
    horizontalNew = tmp * Math.PI - 0.001;
  }

  // snap vertically to nice angles
  if (Math.abs(Math.sin(verticalNew)) < snapValue) {
    verticalNew = Math.round((verticalNew / Math.PI)) * Math.PI;
  }
  if (Math.abs(Math.cos(verticalNew)) < snapValue) {
    verticalNew = (Math.round((verticalNew/ Math.PI - 0.5)) + 0.5) * Math.PI;
  }

  this.camera.setArmRotation(horizontalNew, verticalNew);
  this.redraw();

  // fire a cameraPositionChange event
  var parameters = this.getCameraPosition();
  this.emit('cameraPositionChange', parameters);

  util.preventDefault(event);
};


/**
 * Stop moving operating.
 * This function activated from within the funcion Graph.mouseDown().
 * @param {event}  event   The event
 */
Graph3d.prototype._onMouseUp = function (event) {
  this.frame.style.cursor = 'auto';
  this.leftButtonDown = false;

  // remove event listeners here
  util.removeEventListener(document, 'mousemove', this.onmousemove);
  util.removeEventListener(document, 'mouseup',   this.onmouseup);
  util.preventDefault(event);
};


/**
 * After having moved the mouse, a tooltip should pop up when
 * the mouse is resting on a data point
 *
 * @param {Event}  event   A mouse move event
 */
Graph3d.prototype._onTooltip = function (event) {
  if (!this.showTooltip) {
    return;
  }

  var delay        = 300; // ms
  var boundingRect = this.frame.getBoundingClientRect();
  var mouseX       = getMouseX(event) - boundingRect.left;
  var mouseY       = getMouseY(event) - boundingRect.top;

  if (this.tooltipTimeout) {
    clearTimeout(this.tooltipTimeout);
  }

  // (delayed) display of a tooltip only if no mouse button is down
  if (this.leftButtonDown) {
    this._hideTooltip();
    return;
  }

  if (this.tooltip && this.tooltip.dataPoint) {
    // tooltip is currently visible
    var dataPoint = this._dataPointFromXY(mouseX, mouseY);
    if (dataPoint !== this.tooltip.dataPoint) {
      // datapoint changed
      if (dataPoint) {
        this._showTooltip(dataPoint);
      }
      else {
        this._hideTooltip();
      }
    }
  } else {
    // tooltip is currently not visible
    var me = this;
    this.tooltipTimeout = setTimeout(function () {
      me.tooltipTimeout = null;

      // show a tooltip if we have a data point
      var dataPoint = me._dataPointFromXY(mouseX, mouseY);
      if (dataPoint) {
        me._showTooltip(dataPoint);
      }
    }, delay);
  }
};


/**
 * Event handler for touchstart event on mobile devices
 */
Graph3d.prototype._onTouchStart = function(event) {
  this.touchDown = true;

  var me = this;
  this.ontouchmove = function (event) {me._onTouchMove(event);};
  this.ontouchend  = function (event) {me._onTouchEnd(event);};
  util.addEventListener(document, 'touchmove', me.ontouchmove);
  util.addEventListener(document, 'touchend', me.ontouchend);

  this._onMouseDown(event);
};


/**
 * Event handler for touchmove event on mobile devices
 */
Graph3d.prototype._onTouchMove = function(event) {
  this._onMouseMove(event);
};


/**
 * Event handler for touchend event on mobile devices
 */
Graph3d.prototype._onTouchEnd = function(event) {
  this.touchDown = false;

  util.removeEventListener(document, 'touchmove', this.ontouchmove);
  util.removeEventListener(document, 'touchend',   this.ontouchend);

  this._onMouseUp(event);
};


/**
 * Event handler for mouse wheel event, used to zoom the graph
 * Code from http://adomas.org/javascript-mouse-wheel/
 * @param {event}  event   The event
 */
Graph3d.prototype._onWheel = function(event) {
  if (!event) /* For IE. */
    event = window.event;

  // retrieve delta
  var delta = 0;
  if (event.wheelDelta) { /* IE/Opera. */
    delta = event.wheelDelta/120;
  } else if (event.detail) { /* Mozilla case. */
    // In Mozilla, sign of delta is different than in IE.
    // Also, delta is multiple of 3.
    delta = -event.detail/3;
  }

  // If delta is nonzero, handle it.
  // Basically, delta is now positive if wheel was scrolled up,
  // and negative, if wheel was scrolled down.
  if (delta) {
    var oldLength = this.camera.getArmLength();
    var newLength = oldLength * (1 - delta / 10);

    this.camera.setArmLength(newLength);
    this.redraw();

    this._hideTooltip();
  }

  // fire a cameraPositionChange event
  var parameters = this.getCameraPosition();
  this.emit('cameraPositionChange', parameters);

  // Prevent default actions caused by mouse wheel.
  // That might be ugly, but we handle scrolls somehow
  // anyway, so don't bother here..
  util.preventDefault(event);
};


/**
 * Test whether a point lies inside given 2D triangle
 * @param {Point2d} point
 * @param {Point2d[]} triangle
 * @return {boolean} Returns true if given point lies inside or on the edge of the triangle
 * @private
 */
Graph3d.prototype._insideTriangle = function (point, triangle) {
  var a = triangle[0];
  var b = triangle[1];
  var c = triangle[2];

  function sign (x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
  }

  var as = sign((b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x));
  var bs = sign((c.x - b.x) * (point.y - b.y) - (c.y - b.y) * (point.x - b.x));
  var cs = sign((a.x - c.x) * (point.y - c.y) - (a.y - c.y) * (point.x - c.x));

  // each of the three signs must be either equal to each other or zero
  return (as === 0 || bs === 0 || as === bs) &&
    (bs === 0 || cs === 0 || bs === cs) &&
    (as === 0 || cs === 0 || as === cs);
};




/**
 * Display a tooltip for given data point
 * @param {Object} dataPoint
 * @private
 */
Graph3d.prototype._showTooltip = function (dataPoint) {
  var content;
  var line;
  var dot;

  if (!this.tooltip) {
    content = document.createElement('div');
    content.style.position = 'absolute';
    content.style.padding = '10px';
    content.style.border = '1px solid #4d4d4d';
    content.style.color = '#1a1a1a';
    content.style.background = 'rgba(255,255,255,0.7)';
    content.style.borderRadius = '2px';
    content.style.boxShadow = '5px 5px 10px rgba(128,128,128,0.5)';

    line = document.createElement('div');
    line.style.position = 'absolute';
    line.style.height = '40px';
    line.style.width = '0';
    line.style.borderLeft = '1px solid #4d4d4d';

    dot = document.createElement('div');
    dot.style.position = 'absolute';
    dot.style.height = '0';
    dot.style.width = '0';
    dot.style.border = '5px solid #4d4d4d';
    dot.style.borderRadius = '5px';

    this.tooltip = {
      dataPoint: null,
      dom: {
        content: content,
        line: line,
        dot: dot
      }
    };
  } else {
    content = this.tooltip.dom.content;
    line  = this.tooltip.dom.line;
    dot   = this.tooltip.dom.dot;
  }

  this._hideTooltip();

  this.tooltip.dataPoint = dataPoint;
  if (typeof this.showTooltip === 'function') {
    content.innerHTML = this.showTooltip(dataPoint.point);
  }
  else {
    content.innerHTML = '<table>' +
      '<tr><td>'
      + this.xLabel + ':</td><td>'
      + dataPoint.point.x
      + '</td></tr>' +
      '<tr><td>'
      + this.yLabel + ':</td><td>'
      + dataPoint.point.y
      + '</td></tr>' +
      '<tr><td>'
      + this.zLabel + ':</td><td>'
      + dataPoint.point.z + '</td></tr>' +
      '</table>';
  }

  content.style.left  = '0';
  content.style.top   = '0';
  this.frame.appendChild(content);
  this.frame.appendChild(line);
  this.frame.appendChild(dot);

  // calculate sizes
  var contentWidth  = content.offsetWidth;
  var contentHeight = content.offsetHeight;
  var lineHeight    = line.offsetHeight;
  var dotWidth      = dot.offsetWidth;
  var dotHeight     = dot.offsetHeight;

  var maxLeft = Math.max(dataPoint.screen.x - contentWidth / 2, 10);
  var left    = Math.min(maxLeft, this.frame.clientWidth - 10 - contentWidth);

  line.style.left    = dataPoint.screen.x + 'px';
  line.style.top     = (dataPoint.screen.y - lineHeight) + 'px';
  content.style.left = left + 'px';
  content.style.top  = (dataPoint.screen.y - lineHeight - contentHeight) + 'px';
  dot.style.left     = (dataPoint.screen.x - dotWidth / 2) + 'px';
  dot.style.top      = (dataPoint.screen.y - dotHeight / 2) + 'px';
};


/**
 * Hide the tooltip when displayed
 * @private
 */
Graph3d.prototype._hideTooltip = function () {
  if (!this.tooltip) {
    return;
  }

  this.tooltip.dataPoint = null;

  for (var prop in this.tooltip.dom) {
    if (this.tooltip.dom.hasOwnProperty(prop)) {
      var elem = this.tooltip.dom[prop];
      if (elem && elem.parentNode) {
        elem.parentNode.removeChild(elem);
      }
    }
  }
};


Graph3d.prototype.getContext = function () {
  var canvas = this.frame.canvas;
  return canvas.getContext('2d');
};


/**--------------------------------------------------------------------------**/


/**
 * Get the horizontal mouse position from a mouse event
 * @param {Event} event
 * @return {Number} mouse x
 */
function getMouseX (event) {
  if ('clientX' in event) return event.clientX;
  return event.targetTouches[0] && event.targetTouches[0].clientX || 0;
}

/**
 * Get the vertical mouse position from a mouse event
 * @param {Event} event
 * @return {Number} mouse y
 */
function getMouseY (event) {
  if ('clientY' in event) return event.clientY;
  return event.targetTouches[0] && event.targetTouches[0].clientY || 0;
}

module.exports = Graph3d;
