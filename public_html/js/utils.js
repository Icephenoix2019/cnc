/**
 * Main CnC Utils etc
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @package CnC
 */

/**
 * Global helpers
 * @class
 */
var $ = (function(undefined) {

  return {
    'mousePosX' : function(ev, el) {
      return ev.clientX;
    },

    'mousePosY' : function(ev, el) {
      return ev.clientY;
    },

    'mouseButton' : function(ev) {
      var button = 1;
      if ( ev.which ) {
        button= (ev.which < 2) ? 1 : ((ev.which == 2) ? 2 : 3);
      } else {
        button= (ev.button < 2) ? 1 : ((ev.button == 4) ? 2 : 3);
      }
      return button;
    },

    'addEvent'  : function(el, ev, callback) {
      /*
      if ( el.addEventListener ) {
        el.addEventListener(ev, callback);
      } else if ( el.addEvent ) {
        el.addEvent("on" + ev, callback);
      }
      */
      el["on" + ev] = callback;
    },

    'removeEvent' : function(el, ev, callback) {
      /*
      if ( el.removeEventListener ) {
        el.removeEventListener(ev, callback);
      } else if ( el.removeEvent ) {
        el.removeEvent("on" + ev, callback);
      }
      */
      el["on" + ev] = null;
    },

    'stopPropagation' : function(ev) {
      ev.stopPropagation();
    },

    'preventDefault' : function(ev) {
      ev.preventDefault();
    },

    'disableContext' : function(el) {
      el.oncontextmenu = function() {
        return false;
      };
    }
  };

})();

/**
 * Draggable - Create a draggable element (movable)
 * TODO: addEventHandler
 * @class
 */
var Draggable = Class.extend({

  _x        : 0,
  _y        : 0,
  _root     : null,
  _active   : false,
  _position : [0, 0],
  _clickX   : -1,
  _clickY   : -1,

  init : function(root, position) {
    var self = this;

    this._root     = root;
    this._position = position;

    $.addEvent(this._root, "mousedown", function(ev) {
      if ( $.mouseButton(ev) == 3 ) {
        self._onmousedown(ev, self);
      }
    });
  },

  destroy : function() {

    $.removeEvent(this._root, "mousedown", self._onmousedown);
    $.removeEvent(window,     "mouseup",   self._onmouseup);
    $.removeEvent(window,     "mousemove", self._onmousemove);

    this._root             = null;
  },

  _onmousedown : function(ev, self) {
    $.addEvent(window, "mousemove", function(e) {
      self._onmousemove(e, self);
    });
    $.addEvent(window, "mouseup", function(e) {
      self._onmouseup(e, self);
    });

    self._active = true;
    self._clickX = $.mousePosX(ev);
    self._clickY = $.mousePosY(ev);
  },

  _onmousemove : function(ev, self) {
    if ( self._active ) {
      self._x = (self._position[0] + ($.mousePosX(ev) - self._clickX));
      self._y = (self._position[1] + ($.mousePosY(ev) - self._clickY));

      self._root.style.left = (self._x) + "px";
      self._root.style.top  = (self._y) + "px";
    }
  },

  _onmouseup : function(ev, self) {
    self._active = false;
    self._position = [
      self._x,
      self._y
    ];

    $.removeEvent(window, "mouseup",   self._onmouseup);
    $.removeEvent(window, "mousemove", self._onmousemove);
  }

});

