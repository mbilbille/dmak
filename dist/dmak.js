/*
 *  Draw me a kanji - v0.1.0
 *  A funny drawer for your Japanese writings
 *  https://github.com/mbilbille/dmak
 *
 *  Made by Matthieu Bilbille
 *  Under MIT License
 */
 ;(function () {

    "use strict"

    // Create a safe reference to the DrawMeAKanji object for use below.
    var dmak = function(text, options) {
        this.text = text;
        this.options  = extend(dmak.options, options);
        this.strokes = [];
        this.papers = [];
        this.pointer  = 0;
        this.timeouts = [];

        if(!this.options.skipLoad) {
            var loader = new dmakLoader(this.options.uri);
            loader.load(text, function(strokes) {
                this.setStrokes(strokes);
            }.bind(this));
        }
    };

    // Current version.
    dmak.VERSION = '0.1';

    dmak.options = {
        uri : '',
        skipLoad : false,
        height : 109,
        width : 109,
        step : 0.03,
        duration : 750,
        element : 'draw',
        stroke : {
            animated : true,
            attr : {
                'active': '#F92672',
                'stroke' : "#272822",
                'stroke-width' : 4,
                'stroke-linecap' : 'round',
                'stroke-linejoin' : 'round'
            }
        },
        grid : {
            show: true,
            attr : {
                'stroke': '#CCCCCC',
                'stroke-width' : 0.5,
                'stroke-dasharray' : "--"
            }
        }
    };

    dmak.fn = dmak.prototype = {
        
        setStrokes: function(strokes) {
            this.strokes = preprocessStrokes(strokes);
            this.papers   = giveBirthToRaphael(strokes.length);
            if(this.options.grid.show) {
                showGrid(this.papers);
            }
        },

        /**
         * Clean all strokes on papers.
         */
        erase: function(end) {
            // Cannot have two rendering process for
            // the same draw. Keep it cool.
            if(this.timeouts.length) {
                return false;
            }

            // Don't go behind the beginning.
            if(this.pointer <= 0) {
                return false;
            }

            if(typeof end === "undefined") {
                end = 0;
            }

            do {
                this.pointer--;
                this.strokes[this.pointer].object.remove();
                this.strokes[this.pointer].object = null;
            }
            while(this.pointer > end)
        },

        /**
         * All the magic happens here.
         */
        render: function(end) {

            // Cannot have two rendering process for
            // the same draw. Keep it cool.
            if(this.timeouts.length) {
                return false;
            }
        
            if(typeof end === "undefined") {
                end = this.strokes.length;
            }
            else if(end > this.strokes.length) {
                return false;
            }

            var delay = 0;
            for (var i = this.pointer; i < end; i++) {
                var t = setTimeout(function(that){
                    createStroke(that.papers[that.strokes[that.pointer].char], that.strokes[that.pointer]);
                    that.pointer++;
                    that.timeouts.shift();
                }, delay, this);
                delay += this.strokes[i].duration;
                this.timeouts.push(t);
            }
        },

        /**
         * Pause rendering
         */
        pause: function(end) {
            for (var i = 0; i < this.timeouts.length; i++) {
                window.clearTimeout(this.timeouts[i]);
            }
            this.timeouts = [];
        },

        /**
         * Wrap the erase function to remove the x last strokes.
         */
        eraseLastStrokes: function(nbStrokes){
            this.erase(this.pointer - nbStrokes);
        },

        /**
         * Wrap the render function to render the x next strokes.
         */
        renderNextStrokes: function(nbStrokes){
            this.render(this.pointer + nbStrokes);
        }

    };

    // HELPERS

    /**
     * Flattens the array of strokes ; 3D > 2D
     * and does some preprocessing while looping
     * through all the strokes:
     *  - Maps to a character index
     *  - Calculates path length
     */
    var preprocessStrokes = function(strokes) {
        var s = [];
        for(var i = 0; i < strokes.length; i++) {
            for (var j = 0; j < strokes[i].length; j++) {
                var length = Raphael.getTotalLength(strokes[i][j]);
                var stroke = {
                    'char' : i,
                    'length' : length,
                    'duration' : length * dmak.options.step * 1000,
                    'path' : strokes[i][j],
                    'object' : null
                }
                s.push(stroke);
            }
        }

        return s;
    }

    /**
     * Init Raphael paper objects
     */
    var giveBirthToRaphael = function(nbChar) {
        var papers = []
        for(var i = 0; i < nbChar; i++) {
            var paper = new Raphael(dmak.options.element, dmak.options.width + "px", dmak.options.height +"px");
            paper.canvas.setAttribute("class","dmak-svg");
            papers.push(paper);
        }

        return papers.reverse();
    }

    /**
     * Draw the background grid
     */
    var showGrid = function(papers) {
        for(var i = 0; i < papers.length; i++) {
            papers[i].path("M" + (dmak.options.width / 2) + ",0 L" + (dmak.options.width / 2) + "," + dmak.options.height).attr(dmak.options.grid.attr);
            papers[i].path("M0," + (dmak.options.height / 2) + " L" + dmak.options.width + "," + (dmak.options.height / 2)).attr(dmak.options.grid.attr);
        }
    }

    /**
     * Draw a single stroke ; drawing can be animated if set as so.
     */
    var createStroke = function(paper, stroke) {
        stroke.object = paper.path(stroke.path);
        stroke.object.attr(dmak.options.stroke.attr);
        if(dmak.options.stroke.animated) {
            animateStroke(stroke);
        }
    }

    /**
     * Animate stroke drawing.
     * Based on the great article wrote by Jake Archibald
     * http://jakearchibald.com/2013/animated-line-drawing-svg/
     */
    var animateStroke = function(stroke) {
        stroke.object.attr({'stroke' : dmak.options.stroke.attr.active});
        stroke.object.node.style.transition = stroke.object.node.style.WebkitTransition = 'none';
        // Set up the starting positions
        stroke.object.node.style.strokeDasharray = stroke.length + ' ' + stroke.length;
        stroke.object.node.style.strokeDashoffset = stroke.length;
        // Trigger a layout so styles are calculated & the browser
        // picks up the starting position before animating
        stroke.object.node.getBoundingClientRect();
        stroke.object.node.style.transition = stroke.object.node.style.WebkitTransition = 'stroke-dashoffset ' + stroke.duration + 'ms ease';
        // Go!
        stroke.object.node.style.strokeDashoffset = '0';
        // Revert back to the options color when the animation is done.
        setTimeout(function(){
            // The stroke object may have been already erased when we reach this
            // timeout
            if(stroke.object == null) {
                return;
            }
            stroke.object.node.style.stroke = dmak.options.stroke.attr.stroke;
            stroke.object.node.style.transition = stroke.object.node.style.WebkitTransition = 'stroke 400ms ease';
        }, stroke.duration);
    };

    /**
     * Simplistic helper function for extending objects
     */
    var extend = function (defaults, replacement) {
        if(arguments.length != 2) {
            throw new Error('Missing arguments in extend function');
        }

        var result = defaults;
        for(var key in replacement) {
            if(replacement.hasOwnProperty(key)) {
                result[key] = replacement[key];
            }
        }
        
        return result;
    };

    window.dmak = dmak;
}());

 ;(function () {

    "use strict"

    // Create a safe reference to the DrawMeAKanji object for use below.
    var dmakLoader = function(uri) {
        this.uri     = uri;
    };

    // Gather SVG data information for a given set of characters.
    // By default this action is done while instanciating the Word
    // object, but it can be skipped, see above 
    dmakLoader.prototype.load = function (text, callback) {
        var done = 0;
        var paths = [];
        var nbChar = text.length;
        var done = 0;
        for(var i = 0; i < nbChar; i++ ) {
            loadSvg(this.uri, i, text.charCodeAt(i).toString(16), {

                done: function(index, data) {
                    paths[index] = data;
                    done++;
                    if(done === nbChar){
                        callback(paths);
                    }
                },
                error: function(msg) {
                    console.log('Error', msg);
                }
            });
        }
    };

    // Try to load a SVG file matching the given char code.
    // @thanks to the incredible work made by KanjiVG 
    // @see: http://kanjivg.tagaini.net
    function loadSvg(uri, index, charCode, callbacks) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", uri + "0" + charCode + ".svg", true);  
        xhr.onreadystatechange = function () {  
            if (xhr.readyState === 4) {  
                if (xhr.status === 200) {  
                    callbacks.done(index, parseResponse(xhr.response));
                } else {
                    callbacks.error(xhr.statusText);
                }  
            }  
        };  
        xhr.send();
    };

    // Parse the SVG data to only keep paths data.
    function parseResponse(response) {
        var parser = new DOMParser();
        var elements = parser.parseFromString(response, "application/xml").querySelectorAll('path');
        var paths = [];
        for (var i = 0; i < elements.length; i++) {
            paths.push(elements[i].getAttribute('d'));
        };
        return paths;
    }

    window.dmakLoader = dmakLoader;
}());
