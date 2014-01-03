 ;(function () {

    "use strict";

    // Create a safe reference to the DrawMeAKanji object for use below.
    var Dmak = function (text, options) {
        this.text = text;
        this.options = extend(Dmak.options, options);
        this.strokes = [];
        this.papers = [];
        this.pointer = 0;
        this.timeouts = [];

        if (!this.options.skipLoad) {
            var loader = new DmakLoader(this.options.uri);
            loader.load(text, function (strokes) {
                this.setStrokes(strokes);
                this.options.loaded(this.strokes);
                if (this.options.autoplay) {
                    this.render();
                }
            }.bind(this));
        }
    };

    // Current version.
    Dmak.VERSION = '0.1';

    Dmak.options = {
        uri: '',
        skipLoad: false,
        autoplay: true,
        height: 109,
        width: 109,
        step: 0.03,
        element: 'draw',
        stroke: {
            animated: true,
            attr: {
                'active': '#F92672',
                'stroke': "#272822",
                'stroke-width': 3,
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round'
            }
        },
        grid: {
            show: true,
            attr: {
                'stroke': '#CCCCCC',
                'stroke-width': 0.5,
                'stroke-dasharray': "--"
            }
        },
        loaded: function () {
        },
        erased: function () {
        },
        drew: function () {
        }
    };

    Dmak.fn = Dmak.prototype = {

        setStrokes: function (strokes) {
            this.strokes = preprocessStrokes(strokes);
            this.papers = giveBirthToRaphael(strokes.length);
            if (this.options.grid.show) {
                showGrid(this.papers);
            }
        },

        /**
         * Clean all strokes on papers.
         */
        erase: function (end) {
            // Cannot have two rendering process for
            // the same draw. Keep it cool.
            if (this.timeouts.length) {
                return false;
            }

            // Don't go behind the beginning.
            if (this.pointer <= 0) {
                return false;
            }

            if (typeof end === "undefined") {
                end = 0;
            }

            do {
                this.pointer--;
                this.strokes[this.pointer].object.remove();
                this.strokes[this.pointer].object = null;
                this.options.erased(this.pointer);
            }
            while (this.pointer > end);
        },

        /**
         * All the magic happens here.
         */
        render: function (end) {

            // Cannot have two rendering process for
            // the same draw. Keep it cool.
            if (this.timeouts.length) {
                return false;
            }

            if (typeof end === "undefined") {
                end = this.strokes.length;
            } else if (end > this.strokes.length) {
                return false;
            }

            var delay = 0;
            var func = function (that) {
                createStroke(that.papers[that.strokes[that.pointer].char], that.strokes[that.pointer]);
                that.pointer++;
                that.timeouts.shift();
                that.options.drew(that.pointer);
            };

            for (var i = this.pointer; i < end; i++) {
                if (delay <= 0) {
                    func(this);
                } else {
                    var t = setTimeout(func, delay, this);
                    this.timeouts.push(t);
                }
                delay += this.strokes[i].duration;
            }
        },

        /**
         * Pause rendering
         */
        pause: function () {
            for (var i = 0; i < this.timeouts.length; i++) {
                window.clearTimeout(this.timeouts[i]);
            }
            this.timeouts = [];
        },

        /**
         * Wrap the erase function to remove the x last strokes.
         */
        eraseLastStrokes: function (nbStrokes) {
            this.erase(this.pointer - nbStrokes);
        },

        /**
         * Wrap the render function to render the x next strokes.
         */
        renderNextStrokes: function (nbStrokes) {
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
    var preprocessStrokes = function (strokes) {
        var s = [];
        for (var i = 0; i < strokes.length; i++) {
            for (var j = 0; j < strokes[i].length; j++) {
                var length = Raphael.getTotalLength(strokes[i][j]);
                var stroke = {
                    'char': i,
                    'length': length,
                    'duration': length * Dmak.options.step * 1000,
                    'path': strokes[i][j],
                    'object': null
                };
                s.push(stroke);
            }
        }

        return s;
    };

    /**
     * Init Raphael paper objects
     */
    var giveBirthToRaphael = function (nbChar) {
        var papers = [];
        for (var i = 0; i < nbChar; i++) {
            var paper = new Raphael(Dmak.options.element, Dmak.options.width + "px", Dmak.options.height + "px");
            paper.canvas.setAttribute("class", "dmak-svg");
            papers.push(paper);
        }
        return papers.reverse();
    };

    /**
     * Draw the background grid
     */
    var showGrid = function (papers) {
        for (var i = 0; i < papers.length; i++) {
            papers[i].path("M" + (Dmak.options.width / 2) + ",0 L" + (Dmak.options.width / 2) + "," + Dmak.options.height).attr(Dmak.options.grid.attr);
            papers[i].path("M0," + (Dmak.options.height / 2) + " L" + Dmak.options.width + "," + (Dmak.options.height / 2)).attr(Dmak.options.grid.attr);
        }
    };

    /**
     * Draw a single stroke ; drawing can be animated if set as so.
     */
    var createStroke = function (paper, stroke) {
        stroke.object = paper.path(stroke.path);
        stroke.object.attr(Dmak.options.stroke.attr);
        if (Dmak.options.stroke.animated) {
            animateStroke(stroke);
        }
    };

    /**
     * Animate stroke drawing.
     * Based on the great article wrote by Jake Archibald
     * http://jakearchibald.com/2013/animated-line-drawing-svg/
     */
    var animateStroke = function (stroke) {
        stroke.object.attr({'stroke': Dmak.options.stroke.attr.active});
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
        setTimeout(function () {
            // The stroke object may have been already erased when we reach this timeout
            if (stroke.object === null) {
                return;
            }
            stroke.object.node.style.stroke = Dmak.options.stroke.attr.stroke;
            stroke.object.node.style.transition = stroke.object.node.style.WebkitTransition = 'stroke 400ms ease';
        }, stroke.duration);
    };

    /**
     * Simplistic helper function for extending objects
     */
    var extend = function (defaults, replacement) {
        if (arguments.length != 2) {
            throw new Error('Missing arguments in extend function');
        }
        var result = defaults;
        for (var key in replacement) {
            if (typeof result[key] === 'object') {
                result[key] = extend(result[key], replacement[key]);
            } else if (result.hasOwnProperty(key)) {
                result[key] = replacement[key];
            }
        }
        return result;
    };

    window.Dmak = Dmak;
}());
