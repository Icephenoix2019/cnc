
/**
 * Main CnC Libraries etc
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @package CnC
 */
(function(undefined) {

  /////////////////////////////////////////////////////////////////////////////
  // GLOBALS
  /////////////////////////////////////////////////////////////////////////////

  // References
  var _Main     = null;
  var _Graphic  = null;
  var _Sound    = null;

  // Variables
  var _FPS      = 0;
  var _Player   = 0;

  // Debugging elements
  var _DebugMap     = null;
  var _DebugFPS     = null;
  var _DebugObjects = null;

  /////////////////////////////////////////////////////////////////////////////
  // CONSTANTS
  /////////////////////////////////////////////////////////////////////////////

  // Supported browser features
  var SUPPORT = {
    'canvas'         : (!!document.createElement('canvas').getContext),
    'audio'          : (!!document.createElement('audio').canPlayType),
    'video'          : (!!document.createElement('video').canPlayType),
    'localStorage'   : (('localStorage'   in window) && (window['localStorage']   !== null)),
    'sessionStorage' : (('sessionStorage' in window) && (window['sessionStorage'] !== null)),
    'globalStorage'  : (('globalStorage'  in window) && (window['globalStorage']  !== null)),
    'openDatabase'   : (('openDatabase'   in window) && (window['openDatabase']   !== null)),
    'WebSocket'      : (('WebSocket'      in window) && (window['WebSocket']      !== null))
  };

  // Internals
  var LOOP_INTERVAL    = (1000 / 30);
  var TILE_SIZE        = 24;
  var MINIMAP_WIDTH    = 180;
  var MINIMAP_HEIGHT   = 180;
  var SELECTION_SENSE  = 10;

  /////////////////////////////////////////////////////////////////////////////
  // HELPER FUNCTIONS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * CreateObject -- Create an object
   * @return void
   */
  var CreateObject = function(opts, player, x, y, a) {
    return new MapObject(player, x, y, a, opts);
  };

  /**
   * ObjectAction -- Perform a MapObject operation
   *
   * Select, Unselect or Move object(s)
   *
   * @return void
   */
  var ObjectAction = (function() {
    var _Selected = [];

    function SelectObjects(lst) {
      for ( var i = 0; i < lst.length; i++ ) {
        if ( lst[i].getSelectable() ) {
          lst[i].select();
        }
      }
    }

    function UnSelectObjects(lst) {
      for ( var i = 0; i < lst.length; i++ ) {
        lst[i].unselect();
      }
    }

    function MoveObjects(lst, pos) {
      for ( var i = 0; i < lst.length; i++ ) {
        lst[i].move(pos);
      }
    }

    return function (act) {
      if ( act instanceof Array ) {
        if ( _Selected.length ) {
          UnSelectObjects(_Selected);
        }

        _Selected = act;

        if ( _Selected.length ) {
          SelectObjects(_Selected);

          _Sound.play("await1");
        }
      } else if ( act instanceof Object ) {
        if ( _Selected.length ) {
          MoveObjects(_Selected, act);

          _Sound.play("ackno");
        }
      }
    };
  })();

  /////////////////////////////////////////////////////////////////////////////
  // BASE CLASSES
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Graphics -- Graphics Manager
   * @class
   */
  var Graphics = Class.extend({

    // Preloaded items
    _preloaded     : CnC.PRELOAD.gfx.items,
    _preload_count : CnC.PRELOAD.gfx.count,

    /**
     * @constructor
     */
    init : function(callback) {
      console.group("Graphics::init()");

      // Preload all images
      console.group("Preloading gfx");
      var index = 1;
      var self = this;
      for ( var i in this._preloaded ) {
        if ( this._preloaded.hasOwnProperty(i) ) {
          var src  = "/img/"  + i + ".png";

          console.log(i, src);

          s = new Image();
          s.onload = function() {
            if ( index >= self._preload_count ) {
              callback();
            }
            index++;
          };
          s.src = src;

          this._preloaded[i] = s;
        }
      }
      console.groupEnd();

      console.groupEnd();
    },

    /**
     * @destructor
     */
    destroy : function() {
      console.group("Graphics::destroy()");
      for ( var i in this._preloaded ) {
        if ( this._preloaded.hasOwnProperty(i) ) {
          if ( this._preloaded[i] ) {
            delete this._preloaded[i];
            console.log("Unloaded", i);
          }
        }
      }
      console.groupEnd();
    },

    /**
     * Get a preloaded image
     * @return Image
     */
    getImage : function(img) {
      return this._preloaded[img];
    }

  });

  /**
   * Sounds -- Sound Manager
   * @class
   */
  var Sounds = Class.extend({
    _enabled   : (CnC.CONFIG.audio_on && SUPPORT.audio),
    _codec     : "mp3",
    _ext       : "mp3",

    // Preloaded items
    _preloaded     : CnC.PRELOAD.snd.items,
    _preload_count : CnC.PRELOAD.snd.count,

    /**
     * @constructor
     */
    init : function() {

      console.group("Sounds::init()");
      if ( this._enabled ) {
        var s, t, codec;

        // Check for supported audio codec
        var types = CnC.CONFIG.audio_codecs;
        for ( s in types ) {
          if ( types.hasOwnProperty(s) ) {
            t = types[s];
            if ( (!!document.createElement('audio').canPlayType(t)) ) {
              codec = s;
              break;
            }
          }
        }

        if ( codec ) {
          this._codec = codec;
          this._ext   = codec;
        } else {
          this._enabled = false;
        }
      }

      console.log("Supported", this._enabled);
      console.log("Enabled", CnC.CONFIG.audio_on);
      console.log("Codec", this._codec, this._ext);

      // Preload audio files
      if ( this._enabled ) {
        console.group("Preloading audio");
        for ( var i in this._preloaded ) {
          if ( this._preloaded.hasOwnProperty(i) ) {
            var src  = "/snd/" + this._codec + "/" + i + "." + this._ext;

            console.log(i, src);

            s = new Audio(src);
            s.type = this._codec;
            s.preload = "auto";
            s.controls = false;
            s.autobuffer = true;
            s.loop = false;
            s.load();

            this._preloaded[i] = s;
          }
        }
        console.groupEnd();
      }

      console.groupEnd();
    },

    /**
     * @destructor
     */
    destroy : function() {
      console.group("Sounds::destroy()");
      for ( var i in this._preloaded ) {
        if ( this._preloaded.hasOwnProperty(i) ) {
          if ( this._preloaded[i] ) {
            delete this._preloaded[i];
            console.log("Unloaded", i);
          }
        }
      }
      console.groupEnd();
    },

    /**
     * Play a preloaded sound
     * @return void
     */
    play : function(snd) {
      if ( this._enabled ) {
        if ( this._preloaded[snd] ) {
          this._preloaded[snd].play();
        }
      }
    }
  });

  /**
   * Game -- Main Class
   * @class
   */
  var Game = Class.extend({

    _interval : null,
    _started  : null,
    _last     : null,
    _running  : false,
    _map      : null,

    /**
     * @constructor
     */
    init : function() {
      console.group("Game::init()");

      // Example data
      this._map = new Map();

      // Player 1
      this._map.addObject(CreateObject(CnC.MapObjects.Vehicle,  0, 50,  30));
      this._map.addObject(CreateObject(CnC.MapObjects.Vehicle,  0, 50,  90));
      this._map.addObject(CreateObject(CnC.MapObjects.Vehicle,  0, 50,  150));
      this._map.addObject(CreateObject(CnC.MapObjects.Building, 0, 143, 143));
      this._map.addObject(CreateObject(CnC.MapObjects.Unit,     0, 170, 10));
      this._map.addObject(CreateObject(CnC.MapObjects.Unit,     0, 170, 40));
      this._map.addObject(CreateObject(CnC.MapObjects.Unit,     0, 170, 70));

      // Player 2
      this._map.addObject(CreateObject(CnC.MapObjects.Vehicle,  1, 2000, 1700));
      this._map.addObject(CreateObject(CnC.MapObjects.Vehicle,  1, 2000, 1750));
      this._map.addObject(CreateObject(CnC.MapObjects.Vehicle,  1, 2000, 1800));
      this._map.addObject(CreateObject(CnC.MapObjects.Building, 1, 2000, 2000));

      console.groupEnd();
    },

    /**
     * @destructor
     */
    destroy : function() {
      console.group("Game::destroy()");

      if ( this._interval ) {
        clearInterval(this._interval);
        this._interval = null;
      }

      if ( this._map ) {
        this._map.destroy();
        this._map = null;
      }

      console.groupEnd();
    },

    /**
     * resize -- onresize event
     * @return void
     */
    resize : function() {
      if ( this._map ) {
        this._map.onResize();
      }
    },

    /**
     * loop -- main loop
     * @return void
     */
    loop : function(tick) {
      if ( this._last ) {
        _FPS = tick - this._last;
      }

      this._map.render();

      this._last = tick;

      if ( CnC.DEBUG_MODE ) {
        _DebugFPS.innerHTML = _FPS;
        _DebugObjects.innerHTML = this._map._objects.length;
      }
    },

    /**
     * Run Game
     * @return void
     */
    run : function() {
      console.group("Game::run()");

      if ( !this._running ) {
        var self = this;

        this._map.prepare();

        this._started = new Date();

        /*
        var t = (window.requestAnimationFrame       ||
                 window.webkitRequestAnimationFrame ||
                 window.mozRequestAnimationFrame    ||
                 window.oRequestAnimationFrame      ||
                 window.msRequestAnimationFrame     ||
                 null);
      */
        var t = null;

        if ( t ) {
          //var canvas = self.getCanvas();
          var frame = function() {
            var tick = ((new Date()) - self._started);
            self.loop(tick);

            t(frame/*, canvas*/);
          };

          t(frame/*, canvas*/);
        } else {
          if ( !self._interval ) {
            self._interval = setInterval(function() {
              var tick = ((new Date()) - self._started);
              self.loop(tick);
            }, LOOP_INTERVAL);
          }
        }

        this._running = true;
      }

      console.groupEnd();
    }

  });

  /////////////////////////////////////////////////////////////////////////////
  // MAP OBJECT
  /////////////////////////////////////////////////////////////////////////////

  /**
   * MapObject -- Map Object Base Class
   * FIXME: Cleanup events (redundacy)
   * TODO: Move minimap to separate class ?!
   * @class
   */
  var MapObject = CanvasObject.extend({

    // Base attributes
    _type          : -1,
    _image         : null,
    _image_loaded  : false,
    _selected      : false,
    _angle         : 0,

    // Instance attributes
    _player        : 0,
    _selectable    : true,
    _movable       : true,
    _speed         : 0,
    _turning_speed : 0,
    _strength      : 10,

    // Rendering
    _sprite        : null,
    _destination   : null,
    _heading       : null,

    /**
     * @constructor
     */
    init : function(player, x, y, ang, opts) {
      var self = this;

      // Validate input data
      var a = parseInt(ang, 10) || 0;
      var w = parseInt(opts.width, 10);
      var h = parseInt(opts.height, 10);

      console.group("MapObject::init()");
        console.log("Pos X", x);
        console.log("Pos Y", y);
      console.groupEnd();

      // Set base attributes
      this._type          = opts.type;
      this._sprite        = opts.sprite !== undefined ? opts.sprite : null;
      if ( this._sprite ) {
        this._image       = _Graphic.getImage(opts.sprite.src);
      } else {
        this._image       = opts.image  !== undefined ? _Graphic.getImage(opts.image)  : null;
      }

      // Set instance attributes
      this._player        = parseInt(player, 10);
      this._selectable    = opts.attrs.selectable !== undefined ? opts.attrs.selectable : this._selectable;
      this._movable       = opts.attrs.movable;
      this._speed         = opts.attrs.speed;
      this._turning_speed = opts.attrs.turning;
      this._strength      = opts.attrs.strength;

      // Init canvas
      this._super(w, h, x, y, a, "MapObject");
      this.__coverlay.fillStyle   = "rgba(255,255,255,0.9)";
      this.__coverlay.strokeStyle = "rgba(0,0,0,0.9)";
      this.__coverlay.lineWidth   = 1;

      // Add events
      $.addEvent(this.__overlay, "mousedown", function(ev) {
        $.preventDefault(ev);
        $.stopPropagation(ev);
      });

      $.addEvent(this.__overlay, "click", function(ev) {
        self.onClick(ev);
      }, true);
    },

    /**
     * @destructor
     */
    destroy : function() {

      // Remove events
      $.removeEvent(this.__overlay, "mousedown", function(ev) {
        $.preventDefault(ev);
        $.stopPropagation(ev);
      });
      $.removeEvent(this.__overlay, "click", function(ev) {
        self.onClick(ev);
      }, true);

      // Destroy canvas
      this._super();
    },

    /**
     * render -- Render the MapObject (CanvasObject)
     * @return void
     */
    render : function() {
      var self = this;

      var mag, dif, dir;
      // First handle rotation
      if ( this._heading !== null ) {
        if ( this._turning_speed ) {
          if ( this._heading !== this._angle ) {
            dir = $.shortestRotation(this._angle, this._heading);

            // Set direction
            if ( dir > 0 ) {
              mag = this._angle + this._turning_speed;
              if ( mag >= this._heading ) {
                mag = this._heading;
              }
            } else {
              mag = this._angle - this._turning_speed;
              if ( mag <= this._heading ) {
                mag = this._heading;
              }
            }

            this.setDirection(mag);
            this._angle = mag;
          } else {
            this._heading = null;
          }
        } else {
          this._angle   = this._heading;
          this._heading = null;
          this.setDirection(this._angle);
        }
      }
      // Then movment
      else if ( this._destination !== null ) {
        var x = this.__x;
        var y = this.__y;

        // Find direction
        var i = this._destination.x - x;
        var j = this._destination.y - y;

        // Get and check closest distance
        mag = Math.sqrt(i * i + j * j);
        dif = Math.min(mag, this._speed);

        if ( dif < this._speed ) {
          this._destination = null;
          return;
        }

        // Direction vector
        i /= mag;
        j /= mag;

        // Velocity vector
        i *= dif;
        j *= dif;

        this.setPosition(x + i, y + j, true);
      }

      this._super(function(c, cc, w, h, x, y)
      {
        if ( CnC.DEBUG_MODE ) {
          var tw = w + 20;
          var th = h + 20;

          // Select correct debugging color
          if ( self._type == CnC.OBJECT_UNIT ) {
            cc.fillStyle   = "rgba(100,255,100,0.2)";
          } else if ( self._type == CnC.OBJECT_VEHICLE ) {
            cc.fillStyle   = "rgba(100,100,255,0.2)";
          } else {
            cc.fillStyle   = "rgba(255,255,255,0.2)";
          }
          cc.strokeStyle = "rgba(0,0,0,0.9)";

          cc.beginPath();
            if ( self._type == CnC.OBJECT_BUILDING ) {
              cc.fillRect((tw/2 - w/2), (th/2 - h/2), w, h);
            } else {
              cc.arc((tw / 2), (th / 2), (w / 2), (Math.PI * 2), false);
              cc.fill();
            }
            if ( self._selected ) {
              cc.stroke();
            }
          cc.closePath();

          cc.beginPath();
            cc.moveTo((tw / 2), (th / 2));
            cc.lineTo(tw, (th / 2));
            cc.stroke();
          cc.closePath();
        }

        self.onRenderSprite();

      }, function(c, cc, w, h, x, y) {
        var tw = w + 20;
        var th = h + 20;

        // Selected rectangle indicator
        if ( self._selected ) {
          cc.strokeStyle = "rgba(255,255,255,0.9)";

          cc.beginPath();
            cc.moveTo(0, 0);
            cc.lineTo(10, 0);
            cc.moveTo(0, 0);
            cc.lineTo(0, 10);
            cc.stroke();

            cc.moveTo(tw - 10,  0);
            cc.lineTo(tw - 0, 0);
            cc.moveTo(tw - 0, 0);
            cc.lineTo(tw - 0, 10);
            cc.stroke();

            cc.moveTo(tw - 10,  th - 0);
            cc.lineTo(tw - 0, th - 0);
            cc.moveTo(tw - 0, th - 0);
            cc.lineTo(tw - 0, th - 10);
            cc.stroke();

            cc.moveTo(0, th - 0);
            cc.lineTo(10, th - 0);
            cc.moveTo(0, th - 0);
            cc.lineTo(0, th - 10);
            cc.stroke();

          cc.closePath();
        }
      });
    },

    /**
     * select -- Select the MapObject
     * @return void
     */
    select : function() {
      console.log("MapObject::select()", this);

      this._selected = true;
    },

    /**
     * unselect -- Unselect the MapObject
     * @return void
     */
    unselect : function() {
      console.log("MapObject::unselect()", this);

      this._selected = false;
    },

    /**
     * move -- Move the MapObject
     * @return void
     */
    move : function(pos) {
      if ( !this._movable || (this._player !== _Player) ) {
        return;
      }

      // Calculate positions
      var w  = this.getDimension()[0],
          h  = this.getDimension()[1],
          x1 = this.getPosition()[0] - (w / 2),
          y1 = this.getPosition()[1] - (h / 2),
          x2 = pos.x - (w / 2),
          y2 = pos.y - (h / 2);

      // Calculate rotation and distance to target
      var deg      = Math.atan2((y2-y1), (x2-x1)) * (180 / Math.PI);
      var rotation = (/*this._angle + */deg) + (x2 < 0 ? 180 : (y2 < 0 ? 360 : 0));
      var distance = Math.round(Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2)));

      console.log("MapObject::move()", pos, x2, y2, rotation, "(" + deg + ")", distance);

      // Set destination and heading
      this._destination = {
        x : pos.x - (w  /2),
        y : pos.y - (h / 2)
      };

      this._heading = parseInt(rotation, 10);
    },

    /**
     * onClick -- Click event
     * @return void
     */
    onClick : function(ev) {
      $.preventDefault(ev);
      $.stopPropagation(ev);

      ObjectAction([this]);
    },

    /**
     * onRender -- Handle sprite rendering
     * @return void
     */
    onRenderSprite : function() {
      // If we have a sprite (animation) -- do it
      if ( this._sprite ) {
        var srcX = 0;
        var srcY = 0;
        var srcW = this._sprite.cw;
        var srcH = this._sprite.ch;
        /*
        var rndA = Math.abs($.roundedAngle(this._angle, 45));
        if ( rndA ) {
          if ( this._sprite.rotation[rndA] != -1 ) {
            srcX = this._sprite.rotation[rndA];
          }
        }
        */
        this.drawClipImage(this._image, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
      }

      // Or else just display the image
      else {
        if ( this._image && !this._image_loaded ) {
          this.drawImage(this._image, 0, 0);
          this._image_loaded = true;
        }
      }
    },

    /**
     * getMovable -- Get movable state
     * @return bool
     */
    getMovable : function() {
      return this._movable;
    },

    /**
     * getSelectable -- Get selectable state
     * @return bool
     */
    getSelectable : function() {
      return this._selectable;
    },

    /**
     * getIsSelected -- Get if this MapObject is selected
     * @return bool
     */
    getIsSelected : function() {
      return this._selected;
    },

    /**
     * getIsMine -- Get if this MapObject is the current player's
     * @return bool
     */
    getIsMine : function() {
      return (this._player == _Player);
    }

  });

  /////////////////////////////////////////////////////////////////////////////
  // MAP
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Map -- Main Map Class
   * @class
   */
  var Map = CanvasObject.extend({

    // Objects etc
    _objects  : [],

    // Base attributes
    _marginX    : -1,
    _marginY    : -1,
    _sizeX      : 100,
    _sizeY      : 100,
    _posX       : 0,
    _posY       : 0,

    // DOM Elements
    _main       : null,
    _root       : null,
    _minimap    : null,
    _minirect   : null,
    _rect       : null,
    _mincanvas  : null,
    _mincontext : null,

    // Minimap variables
    _scaleX     : -1,
    _scaleY     : -1,

    // Event variables
    _selecting  : false,
    _dragging   : false,
    _scrolling  : false,
    _startX     : -1,
    _startY     : -1,

    /**
     * @constructor
     */
    init : function() {
      console.group("Map::init()");

      var w = TILE_SIZE * this._sizeX;
      var h = TILE_SIZE * this._sizeY;

      // Do some DOM stuff
      this._main     = document.getElementById("Main");
      this._root     = document.getElementById("MapContainer");
      this._minimap  = document.getElementById("MiniMap");
      this._minirect = document.getElementById("MiniMapRect");
      this._rect     = document.getElementById("Rectangle");

      this._root.style.width  = w + "px";
      this._root.style.height = h + "px";

      // Init canvas
      this._super(w, h, 0, 0, 0, "Map");

      this.__coverlay.fillStyle   = "rgba(255,255,255,0.9)";
      this.__coverlay.strokeStyle = "rgba(0,0,0,0.9)";
      this.__coverlay.lineWidth   = 0.1;

      // Init minimap canvas
      var canvas            = document.createElement('canvas');
      var context           = canvas.getContext('2d');
      canvas.className      = "MiniMapCanvas";
      canvas.width          = (MINIMAP_WIDTH);
      canvas.height         = (MINIMAP_HEIGHT);
      context.fillStyle     = "rgba(255,255,255,0.9)";
      context.strokeStyle   = "rgba(0,0,0,0.9)";
      context.lineWidth     = 1.0;

      this._mincanvas  = canvas;
      this._mincontext = context;
      this._scaleX     = this.__width / MINIMAP_WIDTH;
      this._scaleY     = this.__height / MINIMAP_HEIGHT;

      var t = $.getOffset(this._main);
      this._marginX = t.left;
      this._marginY = t.top;

      this._minimap.appendChild(canvas);

      if ( CnC.DEBUG_MODE ) {
        _DebugMap.innerHTML = (this._sizeX + "x" + this._sizeY) + (" (" + (w + "x" + h) + ")");
      }

      var self = this;

      // Map dragging and clicking
      $.addEvent(this._root, "mousedown", function(ev) {
        self._onMouseDown(ev, false);
      });
      $.addEvent(this._main, "mousedown", function(ev) {
        self._onMouseDown(ev, true);
      });
      $.addEvent(this._minimap, "mousedown", function(ev) {
        self._onMouseDown(ev, undefined, true);
      });
      $.addEvent(this._minimap, "click", function(ev) {
        self._onMouseClick(ev);
      });
      $.disableContext(this._main);
      $.disableContext(this._root);

      console.log("Size X", this._sizeX);
      console.log("Size Y", this._sizeY);
      console.log("Dimension", w, "x", h);
      console.groupEnd();
    },

    /**
     * @destructor
     */
    destroy : function() {
      for ( var i = 0; i < this._objects.length; i++ ) {
        this._objects[i].destroy();
        this._objects[i] = null;
      }

      this._mincanvas.parentNode.removeChild(this._mincanvas);
      delete this._mincontext;
      delete this._mincanvas;

      $.removeEvent(this._root, "mousedown", function(ev) {
        self._onMouseDown(ev, false);
      });
      $.removeEvent(this._main, "mousedown", function(ev) {
        self._onMouseDown(ev, true);
      });
      $.removeEvent(this._minimap, "mousedown", function(ev) {
        self._onMouseDown(ev, undefined, true);
      });
      $.removeEvent(this._minimap, "click", function(ev) {
        self._onMouseClick(ev);
      });

      this._objects = [];
    },

    /**
     * addObject -- Add a MapObject
     * @return void
     */
    addObject : function(o) {
      if ( o instanceof MapObject ) {
        this._objects.push(o);
      }
    },

    //
    // DOM EVENTS
    //

    _onMouseDown : function(ev, main, minimap) {
      var self = this;

      if ( main ) {
        // First mouse button triggers rectangle selction
        if ( $.mouseButton(ev) <= 1 ) {
          $.preventDefault(ev);
          $.stopPropagation(ev);

          var mX = $.mousePosX(ev);
          var mY = $.mousePosY(ev);
          var rX = mX - self._marginX;
          var rY = mY - self._marginY;

          this._startX = mX;
          this._startY = mY;

          this._rect.style.display = 'block';
          this._rect.style.left    = rX + 'px';
          this._rect.style.top     = rY + 'px';
          this._rect.style.width   = '0px';
          this._rect.style.height  = '0px';

          this._dragging  = false;
          this._selecting = true;
        }
      } else {
        if ( minimap ) {
          $.preventDefault(ev);
          $.stopPropagation(ev);

          this._dragging  = false;
          this._selecting = false;
          this._scrolling = true;
        } else {
          // Second mouse button triggers map moving
          if ( $.mouseButton(ev) > 1 ) {
            $.preventDefault(ev);
            $.stopPropagation(ev);

            this._startX = $.mousePosX(ev);
            this._startY = $.mousePosY(ev);

            this.onDragStart(ev, {x: this._startX, y: this._startY});

            this._rect.style.display = 'none';
            this._rect.style.top     = '0px';
            this._rect.style.left    = '0px';
            this._rect.style.width   = '0px';
            this._rect.style.height  = '0px';

            this._dragging  = true;
            this._selecting = false;
          }
        }
      }

      $.addEvent(document, "mousemove", function(ev) {
        self._onMouseMove(ev);
      });
      $.addEvent(document, "mouseup", function(ev) {
        self._onMouseUp(ev);
      });
    },

    _onMouseUp : function(ev) {
      this._rect.style.display = 'none';
      this._rect.style.top     = '0px';
      this._rect.style.left    = '0px';
      this._rect.style.width   = '0px';
      this._rect.style.height  = '0px';

      // Map dragging has ended
      if ( this._dragging ) {
        var curX = $.mousePosX(ev);
        var curY = $.mousePosY(ev);

        var diffX = curX - this._startX;
        var diffY = curY - this._startY;

        if ( diffX || diffY ) {
          this.onDragStop(ev, {x: diffX, y: diffY});
        } else {
          this.onDragStop(ev, false);
        }
      } else {
        // Selection rectangle has ended
        if ( this._selecting ) {
          var mX = $.mousePosX(ev);
          var mY = $.mousePosY(ev);

          var rx = Math.min((mX - this._marginX), (this._startX - this._marginX));
          var ry = Math.min((mY - this._marginY), (this._startY - this._marginY));
          var rw = Math.abs((mX - this._marginX) - (this._startX - this._marginX));
          var rh = Math.abs((mY - this._marginY) - (this._startY - this._marginY));

          // The rectangle to use as selection mask
          var re = {
            'x1' : Math.abs(this._posX - rx),
            'y1' : Math.abs(this._posY - ry),
            'x2' : Math.abs(this._posX - rx) + rw,
            'y2' : Math.abs(this._posY - ry) + rh
          };


          // If the rectangle is too small we want to perform an object action instead
          if ( (Math.sqrt((re.x2 - re.x1) * (re.y2 - re.y1))) > (SELECTION_SENSE) ) {
            this.onSelect(ev, re);
          } else {
            mX = Math.abs(this._posX - mX) - this._marginX;
            mY = Math.abs(this._posY - mY) - this._marginY;

            ObjectAction({x: mX, y: mY});
          }
        }
      }

      this._dragging  = false;
      this._selecting = false;
      this._scrolling = false;

      $.removeEvent(this._root, "mousemove", function(ev) {
        self._onMouseMove(ev, false);
      });

      $.removeEvent(this._main, "mouseup", function(ev) {
        self._onMouseUp(ev, true);
      });
    },

    _onMouseMove : function(ev) {
      var mX = $.mousePosX(ev);
      var mY = $.mousePosY(ev);

      // Update map position
      if ( this._dragging ) {
        var curX = $.mousePosX(ev);
        var curY = $.mousePosY(ev);

        var diffX = curX - this._startX;
        var diffY = curY - this._startY;

        this.onDragMove(ev, {x: diffX, y: diffY});
      }
      // Update selection rectangle
      else if ( this._selecting ) {
        var rx = Math.min((mX - this._marginX), (this._startX - this._marginX));
        var ry = Math.min((mY - this._marginY), (this._startY - this._marginY));
        var rw = Math.abs((mX - this._marginX) - (this._startX - this._marginX));
        var rh = Math.abs((mY - this._marginY) - (this._startY - this._marginY));

        this._rect.style.left    = (rx) + 'px';
        this._rect.style.top     = (ry) + 'px';
        this._rect.style.width   = (rw) + 'px';
        this._rect.style.height  = (rh) + 'px';
      }
      // Scroll map to minimap selection
      else if ( this._scrolling ) {
        this._onMouseClick(ev);
      }
    },

    _onMouseClick : function(ev) {
      // Center the click position for the rectangle and update scrolling
      var rel = $.getOffset(this._minimap);
      var mx  = $.mousePosX(ev) - rel.left;
      var my  = $.mousePosY(ev) - rel.top;


      // Rectangle
      var rectX = parseInt((mx - (this._minirect.offsetWidth / 2)), 10);
      var rectY = parseInt((my - (this._minirect.offsetHeight / 2)), 10);

      this._minirect.style.left = (rectX - 1) + 'px';
      this._minirect.style.top  = (rectY - 1) + 'px';

      // Map
      var scaleX = this.__width / MINIMAP_WIDTH;
      var scaleY = this.__height / MINIMAP_HEIGHT;
      var mapX = -parseInt((rectX * scaleX), 10);
      var mapY = -parseInt((rectY * scaleY), 10);

      this._root.style.left     = (mapX) + "px";
      this._root.style.top      = (mapY) + "px";

      // Update internals
      this._posX = mapX;
      this._posY = mapY;
    },

    //
    // INTERNAL EVENTS
    //

    /**
     * onDragStart -- Drag starting event
     * @return void
     */
    onDragStart : function(ev, pos) {
      this._root.style.top  = (this._posY) + "px";
      this._root.style.left = (this._posX) + "px";
    },

    /**
     * onDragStop -- Drag stopping event
     * @return void
     */
    onDragStop : function(ev, pos) {
      if ( pos === false ) {
        ObjectAction([]);
      } else {
        this._posX = this._posX + pos.x;
        this._posY = this._posY + pos.y;
      }
    },

    /**
     * onDragMove -- Drag moving event
     * @return Position
     */
    onDragMove : function(ev, pos) {
      // Move the map container
      var x = this._posX + pos.x;
      var y = this._posY + pos.y;

      this._root.style.left = (x) + "px";
      this._root.style.top  = (y) + "px";

      var w  = this._root.offsetWidth;
      var h  = this._root.offsetHeight;
      x = -((MINIMAP_WIDTH / w) * x);
      y = -((MINIMAP_HEIGHT / h) * y);

      this._minirect.style.left = (parseInt(x, 10) - 1) + 'px';
      this._minirect.style.top  = (parseInt(y, 10) - 1) + 'px';
    },

    /**
     * onResize -- Window onresize event
     * @return void
     */
    onResize : function() {
      // Resize minimap rectangle
      var scaleX = this._root.offsetWidth / this._main.offsetWidth;
      var scaleY = this._root.offsetHeight / this._main.offsetHeight;

      var rw = Math.round(MINIMAP_WIDTH / scaleX);
      var rh = Math.round(MINIMAP_HEIGHT / scaleY);

      this._minirect.style.width  = (rw) + 'px';
      this._minirect.style.height = (rh) + 'px';
    },

    /**
     * onSelect -- Selection rectangle event
     * @return void
     */
    onSelect : function(ev, rect) {
      console.group("Map::onSelect");
      console.log("Rect", rect);

      var select = [];
      for ( var i = 0; i < this._objects.length; i++ ) {
        if ( $.isInside(rect, this._objects[i].getRect()) ) {
          select.push(this._objects[i]);
        }
      }

      console.log("Hits", select.length);

      ObjectAction(select);

      console.groupEnd();
    },

    // METHODS

    /**
     * prepare -- Prepare the map (Load)
     * @return void
     */
    prepare : function() {
      console.group("Map::prepare()");

      //
      // Load tiles
      //
      var img = _Graphic.getImage("tile_desert");
      var px = 0;
      var py = 0;
      for ( var y = 0; y < this._sizeY; y++ ) {
        px = 0;
        for ( var x = 0; x < this._sizeX; x++ ) {
          this.drawImage(img, px, py);
          px += TILE_SIZE;
        }
        py += TILE_SIZE;
      }
      console.log("Created tiles", this._sizeX, "x", this._sizeY);

      //
      // Draw grid
      //
      if ( CnC.DEBUG_MODE ) {
        var cc = this.__coverlay;
        cc.beginPath();
        for ( y = 0; y < this._sizeY; y++ ) {
          cc.moveTo(0, y * TILE_SIZE);
          cc.lineTo(this.__width, y * TILE_SIZE);
        }
        for ( x = 0; x < this._sizeX; x++ ) {
          cc.moveTo(x * TILE_SIZE, 0);
          cc.lineTo(x * TILE_SIZE, this.__height);
        }
        cc.stroke();
        cc.closePath();
      }


      this._root.appendChild(this.getRoot());

      //
      // Load objects
      //
      for ( var i = 0; i < this._objects.length; i++ ) {
        this._root.appendChild(this._objects[i].getRoot());
      }
      console.log("Inserted", i, "object(s)");

      //
      // Initialize minimap
      //
      this.onResize();
      this.onDragMove(null, {x : this._posX, y : this._posY});

      console.groupEnd();
    },

    /**
     * render -- Render the Map (CanvasObject)
     * @return void
     */
    render : function() {
      // Update objects and minimap
      var cc = this._mincontext;
      var o;

      cc.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);
      for ( var i = 0; i < this._objects.length; i++ ) {
        o = this._objects[i];

        // Render minimap object
        cc.fillStyle = ( o.getIsSelected() ?
          "rgba(0,0,255,0.9)" : // Selected
          (o.getIsMine() ?
            "rgba(255,255,255,0.9)" : // Current player
            "rgba(255,0,0,0.9)") );   // Other player

        cc.fillRect(
          Math.round(o.__x / this._scaleX),
          Math.round(o.__y / this._scaleY),
          Math.round(o.__width / this._scaleX),
          Math.round(o.__height / this._scaleY) );

        if ( o.getIsSelected() ) {
          cc.stroke();
        }

        // Render object
        o.render();
      }

        /*
      if ( CnC.DEBUG_MODE ) {
        var cc = this.__coverlay;
        var rect;
        cc.clearRect(0, 0, this.__width, this.__height);
        cc.beginPath();
        for ( var y = 0; y < this._sizeY; y++ ) {
          rect = {
            x1 : 0,
            y1 : y * TILE_SIZE,
            x2 : this.__width,
            y2 : y * TILE_SIZE
          };
        }

        for ( var x = 0; x < this._sizeX; x++ ) {
          rect = {
            x1 : x * TILE_SIZE,
            y1 : 0,
            x2 : x * TILE_SIZE,
            y2 : this.__height
          };
        }
        cc.stroke();
        cc.closePath();
      }
        */

      //this._super(); // Do not call!
    }


  });

  /////////////////////////////////////////////////////////////////////////////
  // MAIN
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Window 'onload' function
   * @return void
   */
  window.onload = function() {
    // Debugging elements
    _DebugMap     = document.getElementById("GUI_Map");
    _DebugFPS     = document.getElementById("GUI_FPS");
    _DebugObjects = document.getElementById("GUI_Objects");

    console.group("window::onload()");
    console.log("Browser agent", navigator.userAgent);
    console.log("Browser features", SUPPORT);
    console.groupEnd();

    // Initialize sound engine (not required)
    _Sound = new Sounds();

    // Initialize graphics engine (required)
    if ( SUPPORT.canvas ) {
      _Graphic = new Graphics(function() {
        setTimeout(function() {
          // Initialize the Game
          _Main = new Game();
          _Main.run();
        }, 100);
      });
    } else {
      alert("Your browser is not supported!");
    }
  };

  /**
   * Window 'onunload' function
   * @return void
   */
  window.onunload = function() {
    // Unset main engine instances
    if ( _Main ) {
      _Main.destroy();
      delete _Main;
    }
    if ( _Graphic ) {
      _Graphic.destroy();
      delete _Graphic;
    }
    if ( _Sound ) {
      _Sound.destroy();
      delete _Sound;
    }

    // Unset other variables
    _DebugMap     = null;
    _DebugFPS     = null;
    _DebugObjects = null;

    window.onload   = undefined;
    window.onunload = undefined;
    window.onresize = undefined;
  };

  /**
   * Window 'onresize' function
   * @return void
   */
  window.onresize = function() {
    if ( _Main ) {
      _Main.resize();
    }
  };

})();

