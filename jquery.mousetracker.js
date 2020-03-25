(function($){
    
    var heatColors = {};
    
    $.mouseTracker = function(el, options){
        // To avoid scope issues, use 'base' instead of 'this'
        // to reference this class from internal events and functions.
        var base;
        if(typeof options === "string"){
            base = $(el).data("mouseTracker");
            switch(options){
                case 'drawLiveContent':
                    base.drawLiveContent();
                    break;
                case 'drawHeatMap':
                    base.drawHeatMap();
                    break;
                case 'saveData':
                    base.saveData();
                    break;
            }
        } else {
            base = this;
            // Access to jQuery and DOM versions of element
            base.el = el;
            base.$el = $(el);
            // Add a reverse reference to the DOM object
            base.$el.data("mouseTracker",base);
        }
        
        base.init = function(){
            base.options = $.extend({},$.mouseTracker.defaultOptions, options);
            base.movements = [];
            base.max = 0;
            base.movementLocations = [];
            base.url = location.href;
            base.baseTime = 0;
            base.needsRedraw = false;
            
            window.unload = base.saveMouseData;
            
            base.$el.mousemove(function(event){
               base.logMouse(event); 
            });
            
            if(jQuery.isEmptyObject(heatColors)){
                for(var colorIndex = 0; colorIndex < 101; colorIndex++){
                    if(colorIndex <= 50){
                        heatColors[100-colorIndex] = {color: (colorIndex * 5 < 16 ? "#FF0" : "#FF") + base.decToHex(colorIndex * 5) + "00" };
                    } else {
                        heatColors[100-colorIndex] = {color: ((colorIndex - 50) * 5 < 239 ? "#" : "#0") + base.decToHex((colorIndex - 50) * 5) + "FF00" };
                    }
                }
            }
        };
        
        base.saveData = function(){
            if(base.options.url.length > 0 && base.options.saveTrackerData){
                $.ajax({
                    type: "POST",
                    url: base.options.url,
                    data: { mouseTracker: base }
                });
            }
        };
        
        base.drawHeatMap = function(){
            if(base.needsRedraw){
                var height = base.$el.height();
                var width = base.$el.width();
                
                var heatMapCanvas = base.$el.find('.heatMapCanvas')[0];
                if(typeof heatMapCanvas === 'undefined'){
                    base.el.style.position = 'relative';
                    heatMapCanvas = document.createElement('CANVAS');
                    heatMapCanvas.className = 'heatMapCanvas';
                    heatMapCanvas.style.position = 'absolute';
                    heatMapCanvas.style.top = 0;
                    heatMapCanvas.style.left = 0;
                    heatMapCanvas.style.width = width;
                    heatMapCanvas.style.height = height;
                    heatMapCanvas.height = height;
                    heatMapCanvas.width = width;
                    heatMapCanvas.style.zIndex = 999999;
                    base.$el.append(heatMapCanvas);
                }
                
                var ctx = heatMapCanvas.getContext("2d");
                var movementLocations = base.movementLocations;
                
                ctx.clearRect(0, 0, width, height);
                for(var xID in movementLocations){
                    for(var yID in movementLocations[xID]){
                        var count = movementLocations[xID][yID];
                        colorNdx = Math.round((count/base.max)*100);
                        ctx.fillStyle = heatColors[colorNdx].color;
                        ctx.fillRect(xID,yID,1,1);
                    }
                }
            }
            base.needsRedraw = false;
        }
        
        base.logMouse = function(e){
            var x = (Math.round(e.clientX - base.$el.offset().left));
            var y = (Math.round(e.clientY - base.$el.offset().top));
            base.movements.push({x:x, y:y, time: Date.now()});
            
            var movementLocations = base.movementLocations;
            for(var horMove = -3; horMove <= 3; horMove++){
                for(var vertMove = -3; vertMove <= 3; vertMove++){
                    var xID = x + horMove;
                    var yID = y + vertMove;
                    if(typeof movementLocations[xID] === "undefined")
                        movementLocations[xID] = [];
                    if(typeof movementLocations[xID][yID] === "undefined")
                        movementLocations[xID][yID] = 1;
                    else
                        movementLocations[xID][yID]++;
                        
                    if(movementLocations[xID][yID] > base.max)
                        base.max = movementLocations[xID][yID];
                }
            }
            base.needsRedraw = true;
        };
        
        base.drawLiveContent = function(ticks, curNdx){
            var movements = base.movements;
            if(movements.length > 0){ // ensure we have movements to draw
                if(typeof ticks === "undefined")
                    ticks = 0;
                else
                    ticks++;
                if(typeof curNdx === "undefined")
                    curNdx = 0;
                
                var img = base.$el.find('.mouseImage')[0];
                if(typeof img === "undefined"){
                    img = document.createElement("IMG");
                    img.className = "mouseImage";
                    img.src = base.options.cursorUrl; //TODO: move to global options
                    img.style.position = "absolute";
                    base.$el.append(img);
                }
                img.style.left = movements[curNdx].x;
                img.style.top = movements[curNdx].y;
                
                if(base.baseTime === 0){
                    base.baseTime = movements[0].time;
                }
                if(typeof movements[curNdx+1] !== "undefined"){ //check that we have more data to display
                    if(movements[curNdx+1].time <= baseTime + ticks){ //check if we have spent the appropriate amount of time displaying cur position, if so
                        curNdx++; //move to next elements
                    }
                } else {
                    alert("End of recorded data."); //inform user that recorded mouse movements have ended
                    return; //end loop
                }
                
                setTimeout(function(){
                    base.drawLiveContent(ticks, curNdx);
                },1);
            }
        }
        
        base.decToHex = function(dec){
            var hexVals = ["A","B","C","D","E","F"];
            var base = 16;
            var quotient = dec;
            var result = "";
            if(quotient === 0){
                return "0";
            }
            while(quotient !== 0){
                var mod = quotient % base;
                quotient = Math.floor(quotient / base);
                if(mod > 9)
                    mod = hexVals[mod-10]
                result = mod + result;
            }
            return result;
        }
        
        if(typeof options !== "string")
            base.init();
    };
    
    $.mouseTracker.defaultOptions = {
        url: '',
        cursorUrl: '',
        saveTrackerData: true
    };
    
    $.fn.mouseTracker = function(options){
        return this.each(function(){
            (new $.mouseTracker(this, options));
        });
    };
    
})(jQuery);
