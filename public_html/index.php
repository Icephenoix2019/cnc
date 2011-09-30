<?php
require "../main.php";
?>
<!DOCTYPE html>
<!--

/**
 * Main CnC HTML document
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @package CnC
 */

-->
<html>
  <head>
    <title>CnC</title>

    <!-- Stylesheets -->
    <link rel="stylesheet" type="text/css" href="/css/main.css" />

    <script type="text/javascript">
      (function(undefined) {
        // Make sure everything runs without a debugging console
        if ( (window.console === undefined) || (!window.console) ) {
          window.console = {
            log      : function() {},
            info     : function() {},
            error    : function() {},
            group    : function() {},
            groupEnd : function() {}
          };
        }
       })();
    </script>


    <!-- JavaScript -->
    <script type="text/javascript" src="/js/config.js"></script>
    <script type="text/javascript" src="/js/vendor.js"></script>
    <script type="text/javascript" src="/js/utils.js"></script>
    <script type="text/javascript" src="/js/canvas.js"></script>
    <script type="text/javascript" src="/js/main.js"></script>
  </head>
  <body>
    <!-- Sidebar -->
    <div id="Sidebar">
      <div id="MiniMap">
        <!-- Canvas -->
        <div id="MiniMapRect"></div>
      </div>
      <div id="Debugging">
        <div>Map: <span id="GUI_Map">null</span></div>
        <div>FPS: <span id="GUI_FPS">0</span></div>
        <div>Objects: <span id="GUI_Objects">0</span></div>
      </div>
    </div>

    <!-- Main Container -->
    <div id="Main">
      <div id="Map"><!-- Canvas --></div>
      <div id="Rectangle"><!-- Empty --></div>
    </div>
  </body>
</html>
