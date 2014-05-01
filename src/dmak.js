 ;(function () {

	"use strict";

	// Create a safe reference to the DrawMeAKanji object for use below.
	var Dmak = function (text, options) {
		this.text = text;
		this.options = extend(Dmak.options, options);
		this.strokes = [];
		this.papers = [];
		this.pointer = 0;
		this.timeouts = {
			play : [],
			erasing : [],
			drawing : []
		};

		if (!this.options.skipLoad) {
			var loader = new DmakLoader(this.options.uri),
				self = this;

			loader.load(text, function (data) {
				self.prepare(data);

				// Execute custom callback "loaded" here
				self.options.loaded(self.kanjis);

				if (self.options.autoplay) {
					self.render();
				}
			});
		}
	};

	// Current version.
	Dmak.VERSION = "0.2.0";

	Dmak.options = {
		uri: "",
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
		},
		erased: function () {
		},
		drew: function () {
		}
	};

	Dmak.fn = Dmak.prototype = {

		/**
		 * Prepare kanjis and papers for rendering.
		 */
		prepare: function (data) {
			this.kanjis = preprocessStrokes(data);
			this.papers = giveBirthToRaphael(data.length);
			if (this.options.grid.show) {
				showGrid(this.papers);
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
				eraseStroke(this.kanjis[this.pointer], this.timeouts.erasing);

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
				end = this.kanjis.length;
			} else if (end > this.kanjis.length) {
				return false;
			}

			var cb = function (that) {
					drawStroke(that.papers[that.kanjis[that.pointer].char], that.kanjis[that.pointer], that.timeouts.drawing);

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
				if (!Dmak.options.stroke.animated.drawing || delay <= 0) {
					cb(this);
				} else {
					this.timeouts.play.push(setTimeout(cb, delay, this));
				}
				delay += this.kanjis[i].duration;
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
	function preprocessStrokes(data) {
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
					"duration": length * Dmak.options.step * 1000,
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
	function giveBirthToRaphael(nbChar) {
		var papers = [],
			paper,
			i;

		for (i = 0; i < nbChar; i++) {
			paper = new Raphael(Dmak.options.element, Dmak.options.width + "px", Dmak.options.height + "px");
			paper.setViewBox(Dmak.options.viewBox.x, Dmak.options.viewBox.y, Dmak.options.viewBox.w, Dmak.options.viewBox.h);
			paper.canvas.setAttribute("class", "dmak-svg");
			papers.push(paper);
		}
		return papers.reverse();
	}

	/**
	 * Draw the background grid
	 */
	function showGrid(papers) {
		var i;

		for (i = 0; i < papers.length; i++) {
			papers[i].path("M" + (Dmak.options.viewBox.w / 2) + ",0 L" + (Dmak.options.viewBox.w / 2) + "," + Dmak.options.viewBox.h).attr(Dmak.options.grid.attr);
			papers[i].path("M0," + (Dmak.options.viewBox.h / 2) + " L" + Dmak.options.viewBox.w + "," + (Dmak.options.viewBox.h / 2)).attr(Dmak.options.grid.attr);
		}
	}

	/**
	 * Remove a single stroke ; deletion can be animated if set as so.
	 */
	function eraseStroke(stroke, timeouts) {
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

		if (Dmak.options.stroke.animated.erasing) {
			stroke.object.path.node.style.stroke = Dmak.options.stroke.attr.active;
			timeouts.push(animateStroke(stroke, -1, cb));
		}
		else {
			cb();
		}
	}

	/**
	 * Draw a single stroke ; drawing can be animated if set as so.
	 */
	function drawStroke(paper, stroke, timeouts) {
		var cb = function() {

			// The stroke object may have been already erased when we reach this timeout
			if (stroke.object.path === null) {
				return;
			}

			var color = Dmak.options.stroke.attr.stroke;
			if(Dmak.options.stroke.attr.stroke === "random") {
				color = Raphael.getColor();
			}

			// Revert back to the default color.
			stroke.object.path.node.style.stroke = color;
			stroke.object.path.node.style.transition = stroke.object.path.node.style.WebkitTransition = "stroke 400ms ease";

			timeouts.shift();
		};

		stroke.object.path = paper.path(stroke.path);
		stroke.object.path.attr(Dmak.options.stroke.attr);

		if (Dmak.options.stroke.order.visible) {
			showStrokeOrder(paper, stroke);
		}

		if (Dmak.options.stroke.animated.drawing) {
			animateStroke(stroke, 1, cb);
		}
		else {
			cb();
		}
	}

	/**
	 * Draw a single next to
	 */
	function showStrokeOrder(paper, stroke) {
		stroke.object.text = paper.text(stroke.text.x, stroke.text.y, stroke.text.value);
		stroke.object.text.attr(Dmak.options.stroke.order.attr);
	}

	/**
	 * Animate stroke drawing.
	 * Based on the great article wrote by Jake Archibald
	 * http://jakearchibald.com/2013/animated-line-drawing-svg/
	 */
	function animateStroke(stroke, direction, callback) {
		stroke.object.path.attr({"stroke": Dmak.options.stroke.attr.active});
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
	 * Simplistic helper function for extending objects
	 */
	function extend(defaults, replacement) {
		var result = defaults,
			key;

		if (arguments.length !== 2) {
			throw new Error("Missing arguments in extend function");
		}

		for (key in replacement) {
			if (typeof result[key] === "object") {
				result[key] = extend(result[key], replacement[key]);
			} else if (result.hasOwnProperty(key)) {
				result[key] = replacement[key];
			}
		}
		return result;
	}

	window.Dmak = Dmak;
}());
