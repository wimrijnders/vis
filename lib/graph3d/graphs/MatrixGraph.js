var BaseGraph = require ('./BaseGraph');
var Point3d   = require('../Point3d');
var support   = require ('./Support');


function MatrixGraph() {
  BaseGraph.call(this);
}
support.derive(MatrixGraph, BaseGraph);


/**
 * fill in the pointers to the neighbors in the data matrix elements.
 */
function setNeighbors(dataMatrix) {
  for (var x = 0; x < dataMatrix.length; x++) {
    for (var y = 0; y < dataMatrix[x].length; y++) {
      var d = dataMatrix[x][y];
      if (!d) continue;

      if (x < dataMatrix.length-1) {
        d.pointRight = dataMatrix[x+1][y];
      } else {
        d.pointRight = undefined;
      }

      if (y < dataMatrix[x].length-1) {
        d.pointTop = dataMatrix[x][y+1];
      } else {
        d.pointTop = undefined;
      }

      d.pointCross =
        (x < dataMatrix.length-1 && y < dataMatrix[x].length-1) ?
          dataMatrix[x+1][y+1] :
          undefined;
    }
  }
}


/**
 * Override of method in parent class.
 */
MatrixGraph.prototype.getDataPoints = function(dataGroup, data) {
  var dg = dataGroup;

  // TODO: store the created matrix dataPoints in the filters
  //       instead of reloading each time
  var point;
  var dataPoints = [];

  var colX = dg.colX;
  var colY = dg.colY;
  var colZ = dg.colZ;

  // copy all values from the google data table to a matrix
  // the provided values are supposed to form a grid of (x,y) positions

  // create two lists with all present x and y values
  // TODO: Check if this can be done with getDistinctValues()
  var dataX   = [];
  var dataY   = [];
  var numRows = dg.getNumberOfRows(data);

  for (var i = 0; i < numRows; i++) {
    var x = data[i][colX] || 0;
    var y = data[i][colY] || 0;

    if (dataX.indexOf(x) === -1) {
      dataX.push(x);
    }
    if (dataY.indexOf(y) === -1) {
      dataY.push(y);
    }
  }

  var sortNumber = function (a, b) {
    return a - b;
  };
  dataX.sort(sortNumber);
  dataY.sort(sortNumber);

  // create a grid, a 2d matrix, with all values.
  var dataMatrix = [];   // temporary data matrix
  for (var i = 0; i < data.length; i++) {
    var point = new Point3d();
    point.x = data[i][colX] || 0;
    point.y = data[i][colY] || 0;
    point.z = data[i][colZ] || 0;

    var obj = {};
    obj.point  = point;

    // TODO: dg.zMin in following, this correct?; Might need to be graph3d.zMin
    obj.bottom = new Point3d(point.x, point.y, dg.zMin);
    obj.trans  = undefined;
    obj.screen = undefined;

    // TODO: implement Array().indexOf() for Internet Explorer
    var xIndex = dataX.indexOf(point.x);
    var yIndex = dataY.indexOf(point.y);

    if (dataMatrix[xIndex] === undefined) {
      dataMatrix[xIndex] = [];
    }

    dataMatrix[xIndex][yIndex] = obj;

    dataPoints.push(obj);
  }

  setNeighbors(dataMatrix);

  return dataPoints;
};




module.exports = MatrixGraph;
