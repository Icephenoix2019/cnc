/**
 * Main CnC Libraries etc
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @package CnC
 */

/**
 * CanvasElement - Create a Canvas element
 * @class
 */
var CanvasElement = Class.extend({

  _canvas   : null,
  _context  : null,

  init : function(root, width, height) {
    var canvas             = document.createElement("canvas");
    canvas.width           = width;
    canvas.height          = height;
    canvas.style.position  = "absolute";

    if ( canvas ) {
      if ( root ) {
        root = document.getElementById(root);
        root.appendChild(canvas);
      } else {
        root = document.createDocumentFragment();
        root.appendChild(canvas);
      }

      this._canvas   = canvas;
      this._context  = canvas.getContext('2d');
    }
  },

  destroy : function() {
    this._canvas = null;
  },

  clear : function() {

  },

  move : function(x, y) {
    this._canvas.style.top  = (y + "px");
    this._canvas.style.left = (x + "px");
  },

  append : function(img, x, y) {
    this._context.drawImage(img, x, y);
  },

  save : function(type) {
    type = type || "image/png";
    return this._canvas.toDataURL(type);
  }

});