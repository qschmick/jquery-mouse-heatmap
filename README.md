# jquery-mouse-heatmap
jQuery plugin to track mouse movements across the screen and then either redraw those movements, generate a heatmap, or save tracking back to server.

Examples:
$('#elementID').mouseTracker();  // This starts the tracker on the specified element

$('#elementID').mouseTracker('drawHeatMap'); // This will overlay a canvas on the element and display the heat map data visually

$('#elementID').mouseTracker('drawLiveContent'); // This will attach an image and then move through the recorded movements in actual time to display the users interactions
