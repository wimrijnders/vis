/**
 * Module for determining the dimensions of DOM element in a dynamic way.
 *
 * This allows for proper resizing in a responsive layout.
 *
 * Code in this module adapted from project [Chart.js](https://github.com/chartjs/Chart.js)
 */


/**
 * Private helper function to convert max-width/max-height values that
 * may be percentages into a number
 *
 * @param {number|string} styleValue
 * @param {object} node
 * @param {string} parentProperty
 * @returns {number} value for max-width/height
 * @private
 */
function parseMaxStyle(styleValue, node, parentProperty) {
  var valueInPixels;
  if (typeof styleValue === 'string') {
    valueInPixels = parseInt(styleValue, 10);

    if (styleValue.indexOf('%') !== -1) {
      // percentage * size in dimension
      valueInPixels = valueInPixels / 100 * node.parentNode[parentProperty];
    }
  } else {
    valueInPixels = styleValue;
  }

  return valueInPixels;
}


/**
 * Returns if the given value contains an effective constraint.
 *
 * @param {object} value
 * @returns {boolean} true if contains a constraint 
 * @private
 */
function isConstrainedValue(value) {
  return value !== undefined && value !== null && value !== 'none';
}


/**
 * Private helper to get a constraint dimension
 *
 * @param {object} domNode  the node to check the constraint on
 * @param {string} maxStyle  the style that defines the maximum for the direction we are using
 *                           (maxWidth / maxHeight)
 * @param {string} percentageProperty  property of parent to use when calculating width as a percentage
 * @returns {string|number}  value of constraint dimension
 * @see http://www.nathanaeljones.com/blog/2013/reading-max-width-cross-browser
 * @private
 */
function getConstraintDimension(domNode, maxStyle, percentageProperty) {
  var view = document.defaultView;
  var parentNode = domNode.parentNode;
  var constrainedNode = view.getComputedStyle(domNode)[maxStyle];
  var constrainedContainer = view.getComputedStyle(parentNode)[maxStyle];
  var hasCNode = isConstrainedValue(constrainedNode);
  var hasCContainer = isConstrainedValue(constrainedContainer);
  var infinity = Number.POSITIVE_INFINITY;

  if (hasCNode || hasCContainer) {
    return Math.min(
      hasCNode ? parseMaxStyle(constrainedNode, domNode, percentageProperty) : infinity,
      hasCContainer ? parseMaxStyle(constrainedContainer, parentNode, percentageProperty) : infinity);
  }

  return 'none';
}


/**
 * returns Number or undefined if no constraint
 *
 * @param {object} domNode  the node to check the constraint on
 * @returns {string|number}
 * @private
 */
function getConstraintWidth(domNode) {
  return getConstraintDimension(domNode, 'max-width', 'clientWidth');
}


/**
 * returns Number or undefined if no constraint
 *
 * @param {object} domNode  the node to check the constraint on
 * @returns {string|number}
 * @private
 */
function getConstraintHeight(domNode) {
  return getConstraintDimension(domNode, 'max-height', 'clientHeight');
}


/**
 * @param {object} el  the element to get the style from
 * @param {string} property  name of property to access
 * @returns {string|number}
 * @private
 */
function getStyle(el, property) {
  return el.currentStyle ?
    el.currentStyle[property] :
    document.defaultView.getComputedStyle(el, null).getPropertyValue(property);
}


/**
 * @param {object} domNode  the node to use
 * @returns {number} value of width
 * @private
 */
function getMaximumWidth(domNode) {
  var container = domNode.parentNode;
  if (!container) {
    return domNode.clientWidth;
  }

  var paddingLeft = parseInt(getStyle(container, 'padding-left'), 10);
  var paddingRight = parseInt(getStyle(container, 'padding-right'), 10);
  var w = container.clientWidth - paddingLeft - paddingRight;
  var cw = getConstraintWidth(domNode);
  return isNaN(cw) ? w : Math.min(w, cw);
}


/**
 * @param {object} domNode  the node to use
 * @returns {number} value of height
 * @private
 */
function getMaximumHeight(domNode) {
  var container = domNode.parentNode;
  if (!container) {
    return domNode.clientHeight;
  }

  var paddingTop = parseInt(getStyle(container, 'padding-top'), 10);
  var paddingBottom = parseInt(getStyle(container, 'padding-bottom'), 10);
  var h = container.clientHeight - paddingTop - paddingBottom;
  var ch = getConstraintHeight(domNode);
  return isNaN(ch) ? h : Math.min(h, ch);
}


/**
 * Helper class to determine the size of the `Network` element in a dynamic layout
 */
class DynamicResize {

  /**
   * Determine the new width and height of the passed DOM element
   *
   * @param {object} frame DOM element to resize
   * @param {number} aspectRatio the ratio to maintain between height and width.
   *                             A zero value disables the aspect ratio.
   * @returns {Array.<number>} new width and height returned in an array
   */
  static determineSize(frame, aspectRatio = 0) {
    // Set to 0 because for the case of a canvas element the size defaults to 300x150
    // if the element is collapsed
    var newWidth = Math.max(0, Math.floor(getMaximumWidth(frame)));
    var newHeight = Math.max(0, Math.floor(aspectRatio ? newWidth / aspectRatio : getMaximumHeight(frame)));

    return [newWidth, newHeight];
  }
}


export default DynamicResize;
