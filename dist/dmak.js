/*
 *  Draw Me A Kanji - v0.3.1
 *  A funny drawer for your Japanese writings
 *  http://drawmeakanji.com
 *
 *  Made by Matthieu Bilbille
 *  Under MIT License
 */
 ;(function () {

	"use strict";

	// Create a safe reference to the DrawMeAKanji object for use below.
	var Dmak = function (text, options) {
		this.text = text;
		// Fix #18 clone `default` to support several instance in parallel
		this.options = assign(clone(Dmak.default), options);
		this.strokes = [];
		this.papers = [];
		this.pointer = 0;
		this.timeouts = {
			play : [],
			erasing : [],
			drawing : []
		};

		if (!this.options.skipLoad) {
			var loader = new DmakLoader(this.options.uri, this.options.useIframe),
				self = this;

			loader.load(text, function (data) {
				self.prepare(data);

				// Execute custom callback "loaded" here
				self.options.loaded(self.strokes);

				if (self.options.autoplay) {
					self.render();
				}
			});
		}
	};

	// Current version.
	Dmak.VERSION = "0.2.0";

	Dmak.default = {
		uri: "",
		useIframe: false,
		skipLoad: false,
		autoplay: true,
		height: 109,
		width: 109,
		viewBox: {
			x: 0,
			y: 0,
			w: 109,
			h: 109
		},
		step: 0.03,
		element: "draw",
		stroke: {
			animated : {
				drawing : true,
				erasing : true
			},
			order: {
				visible: false,
				attr: {
					"font-size": "8",
					"fill": "#999999"
				}
			},
			attr: {
				"active": "#BF0000",
				// may use the keyword "random" here for random color
				"stroke": "#2C2C2C",
				"stroke-width": 4,
				"stroke-linecap": "round",
				"stroke-linejoin": "round"
			}
		},
		grid: {
			show: true,
			attr: {
				"stroke": "#CCCCCC",
				"stroke-width": 0.5,
				"stroke-dasharray": "--"
			}
		},
		loaded: function () {
			// a callback
		},
		erased: function () {
			// a callback
		},
		drew: function () {
			// a callback
		}
	};

	Dmak.fn = Dmak.prototype = {

		/**
		 * Prepare kanjis and papers for rendering.
		 */
		prepare: function (data) {
			this.strokes = preprocessStrokes(data, this.options);
			this.papers = giveBirthToRaphael(data.length, this.options);
			if (this.options.grid.show) {
				showGrid(this.papers, this.options);
			}
		},

		/**
		 * Clean all strokes on papers.
		 */
		erase: function (end) {
			// Cannot have two rendering process for the same draw. Keep it cool.
			if (this.timeouts.play.length) {
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
				eraseStroke(this.strokes[this.pointer], this.timeouts.erasing, this.options);

				// Execute custom callback "erased" here
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
			if (this.timeouts.play.length) {
				return false;
			}

			if (typeof end === "undefined") {
				end = this.strokes.length;
			} else if (end > this.strokes.length) {
				return false;
			}

			var cb = function (that) {
					drawStroke(that.papers[that.strokes[that.pointer].char], that.strokes[that.pointer], that.timeouts.drawing, that.options);

					// Execute custom callback "drew" here
					that.options.drew(that.pointer);

					that.pointer++;
					that.timeouts.play.shift();
				},
				delay = 0,
				i;

			// Before drawing clear any remaining erasing timeouts
			for (i = 0; i < this.timeouts.erasing.length; i++) {
				window.clearTimeout(this.timeouts.erasing[i]);
				this.timeouts.erasing = [];
			}

			for (i = this.pointer; i < end; i++) {
				if (!this.options.stroke.animated.drawing || delay <= 0) {
					cb(this);
				} else {
					this.timeouts.play.push(setTimeout(cb, delay, this));
				}
				delay += this.strokes[i].duration;
			}
		},

		/**
		 * Pause rendering
		 */
		pause: function () {
			for (var i = 0; i < this.timeouts.play.length; i++) {
				window.clearTimeout(this.timeouts.play[i]);
			}
			this.timeouts.play = [];
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
	 * Flattens the array of strokes ; 3D > 2D and does some preprocessing while
	 * looping through all the strokes:
	 *  - Maps to a character index
	 *  - Calculates path length
	 */
	function preprocessStrokes(data, options) {
		var strokes = [],
			stroke,
			length,
			i,
			j;

		for (i = 0; i < data.length; i++) {
			for (j = 0; j < data[i].length; j++) {
				length = Raphael.getTotalLength(data[i][j].path);
				stroke = {
					"char": i,
					"length": length,
					"duration": length * options.step * 1000,
					"path": data[i][j].path,
					"groups" : data[i][j].groups,
					"text": data[i][j].text,
					"object": {
						"path" : null,
						"text": null
					}
				};
				strokes.push(stroke);
			}
		}

		return strokes;
	}

	/**
	 * Init Raphael paper objects
	 */
	function giveBirthToRaphael(nbChar, options) {
		var papers = [],
			paper,
			i;

		for (i = 0; i < nbChar; i++) {
			paper = new Raphael(options.element, options.width + "px", options.height + "px");
			paper.setViewBox(options.viewBox.x, options.viewBox.y, options.viewBox.w, options.viewBox.h);
			paper.canvas.setAttribute("class", "dmak-svg");
			papers.push(paper);
		}
		return papers.reverse();
	}

	/**
	 * Draw the background grid
	 */
	function showGrid(papers, options) {
		var i;

		for (i = 0; i < papers.length; i++) {
			papers[i].path("M" + (options.viewBox.w / 2) + ",0 L" + (options.viewBox.w / 2) + "," + options.viewBox.h).attr(options.grid.attr);
			papers[i].path("M0," + (options.viewBox.h / 2) + " L" + options.viewBox.w + "," + (options.viewBox.h / 2)).attr(options.grid.attr);
		}
	}

	/**
	 * Remove a single stroke ; deletion can be animated if set as so.
	 */
	function eraseStroke(stroke, timeouts, options) {
		// In some cases the text object may be null:
		//  - Stroke order display disabled
		//  - Stroke already deleted
		if (stroke.object.text !== null) {
			stroke.object.text.remove();
		}

		var cb = function() {
			stroke.object.path.remove();

			// Finally properly prepare the object variable
			stroke.object = {
				"path" : null,
				"text" : null
			};

			timeouts.shift();
		};

		if (options.stroke.animated.erasing) {
			stroke.object.path.node.style.stroke = options.stroke.attr.active;
			timeouts.push(animateStroke(stroke, -1, options, cb));
		}
		else {
			cb();
		}
	}

	/**
	 * Draw a single stroke ; drawing can be animated if set as so.
	 */
	function drawStroke(paper, stroke, timeouts, options) {
		var cb = function() {

			// The stroke object may have been already erased when we reach this timeout
			if (stroke.object.path === null) {
				return;
			}

			var color = options.stroke.attr.stroke;
			if(options.stroke.attr.stroke === "random") {
				color = Raphael.getColor();
			}

			// Revert back to the default color.
			stroke.object.path.node.style.stroke = color;
			stroke.object.path.node.style.transition = stroke.object.path.node.style.WebkitTransition = "stroke 400ms ease";

			timeouts.shift();
		};

		stroke.object.path = paper.path(stroke.path);
		stroke.object.path.attr(options.stroke.attr);

		if (options.stroke.order.visible) {
			showStrokeOrder(paper, stroke, options);
		}

		if (options.stroke.animated.drawing) {
			animateStroke(stroke, 1, options, cb);
		}
		else {
			cb();
		}
	}

	/**
	 * Draw a single next to
	 */
	function showStrokeOrder(paper, stroke, options) {
		stroke.object.text = paper.text(stroke.text.x, stroke.text.y, stroke.text.value);
		stroke.object.text.attr(options.stroke.order.attr);
	}

	/**
	 * Animate stroke drawing.
	 * Based on the great article wrote by Jake Archibald
	 * http://jakearchibald.com/2013/animated-line-drawing-svg/
	 */
	function animateStroke(stroke, direction, options, callback) {
		stroke.object.path.attr({"stroke": options.stroke.attr.active});
		stroke.object.path.node.style.transition = stroke.object.path.node.style.WebkitTransition = "none";

		// Set up the starting positions
		stroke.object.path.node.style.strokeDasharray = stroke.length + " " + stroke.length;
		stroke.object.path.node.style.strokeDashoffset = (direction > 0) ? stroke.length : 0;

		// Trigger a layout so styles are calculated & the browser
		// picks up the starting position before animating
		stroke.object.path.node.getBoundingClientRect();
		stroke.object.path.node.style.transition = stroke.object.path.node.style.WebkitTransition = "stroke-dashoffset " + stroke.duration + "ms ease";

		// Go!
		stroke.object.path.node.style.strokeDashoffset = (direction > 0) ? "0" : stroke.length;

		// Execute the callback once the animation is done
		// and return the timeout id.
		return setTimeout(callback, stroke.duration);
	}

	/**
	 * Helper function to clone an object
	 */
	function clone(object) {
		if (object === null || typeof object !== "object") {
			return object;
		}

		var temp = object.constructor(); // give temp the original object's constructor
		for (var key in object) {
			temp[key] = clone(object[key]);
			}

		return temp;
	}

	/**
	 * Helper function to copy own properties over to the destination object.
	 */
	function assign(source, replacement) {
		if (arguments.length !== 2) {
			throw new Error("Missing arguments in assign function");
		}

		for (var key in source) {
			if (replacement.hasOwnProperty(key)) {
				source[key] = (typeof replacement[key] === "object") ? assign(source[key], replacement[key]) : replacement[key];
			}
		}
		return source;
	}

	window.Dmak = Dmak;
}());

;(function () {

	"use strict";

	// Create a safe reference to the DrawMeAKanji object for use below.
	var DmakLoader = function (uri, useIframe) {
		this.uri = uri;
        this.useIframe = useIframe;
	};

	/**
	 * Gather SVG data information for a given set of characters.
	 * By default this action is done while instanciating the Word
	 * object, but it can be skipped, see above
	 */
	DmakLoader.prototype.load = function (text, callback) {
		var paths = [],
			nbChar = text.length,
			done = 0,
			i,
            loadSvg,
			callbacks = {
				done: function (index, data) {
					paths[index] = data;
					done++;
					if (done === nbChar) {
						callback(paths);
					}
				},
				error: function (msg) {
					console.log("Error", msg);
				}
			};

        loadSvg = this.useIframe ? loadSvgIframe : loadSvgXHR;
		for (i = 0; i < nbChar; i++) {
			loadSvg(this.uri, i, text.charCodeAt(i).toString(16), callbacks);
		}
	};

	/**
	 * Try to load a SVG file matching the given char code.
	 * @thanks to the incredible work made by KanjiVG
	 * @see: http://kanjivg.tagaini.net
	 */
	function loadSvgXHR(uri, index, charCode, callbacks) {
		var xhr = new XMLHttpRequest(),
			code = ("00000" + charCode).slice(-5);

		// Skip space character
		if(code === "00020" || code === "03000") {
			callbacks.done(index, {
				paths: [],
				texts: []
			});
			return;
		}

		xhr.open("GET", uri + code + ".svg", true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					callbacks.done(index, parseResponse(xhr.response, code));
				} else {
					callbacks.error(xhr.statusText);
				}
			}
		};
		xhr.send();
	}

    function loadSvgIframe(uri, index, charCode, callbacks) {
        var code, url, i, handler;

        code = ("00000" + charCode).slice(-5);
        url = uri + code + ".svg.html";

        // Skip space character
        if(code === "00020" || code === "03000") {
                callbacks.done(index, {
                        paths: [],
                        texts: []
                });
                return;
        }

        handler = {};

        // set handler for inter-frame messages
        handler.messageHandler = function(event) {
            if(event.data.name === code) {
                clearTimeout(handler.errorTimeout);
                event.target.removeEventListener(event.type, handler.messageHandler);
                callbacks.done(index, parseResponse(event.data.data, code));
            }
        };

        window.addEventListener("message", handler.messageHandler, false);

        // create hidden iframe, that will later communicate and auto-remove
        i = document.createElement("iframe");
        i.style.display = "none";

        i.onload = function() {
            i.parentNode.removeChild(i);
            handler.errorTimeout = setTimeout(function() {
                window.addEventListener("message", handler.messageHandler, false);
                callbacks.error("timeout hit loading iframe.");
            }, 500);
        };

        i.src = url;
        document.body.appendChild(i);
    }

	/**
	 * Simple parser to extract paths and texts data.
	 */
	function parseResponse(response, code) {
		var data = [],
			dom = new DOMParser().parseFromString(response, "application/xml"),
			texts = dom.querySelectorAll("text"),
			groups = [],
			i;
		
		// Private recursive function to parse DOM content
		function __parse(element) {
            var children = element.childNodes,
                i;

            for(i = 0; i < children.length; i++) {
                if(children[i].tagName === "g") {
                    groups.push(children[i].getAttribute("id"));
                    __parse(children[i]);
                    groups.splice(groups.indexOf(children[i].getAttribute("id")), 1);
                }
                else if(children[i].tagName === "path") {
                    data.push({
                        "path" : children[i].getAttribute("d"),
                        "groups" : groups.slice(0)
                    });
                }
            }
		}

        // Start parsing
		__parse(dom.getElementById("kvg:" + code));

        // And finally add order mark information
		for (i = 0; i < texts.length; i++) {
			data[i].text = {
				"value" : texts[i].textContent,
				"x" : texts[i].getAttribute("transform").split(" ")[4],
				"y" : texts[i].getAttribute("transform").split(" ")[5].replace(")", "")
			};
		}
		
		return data;
	}

	window.DmakLoader = DmakLoader;
}());
