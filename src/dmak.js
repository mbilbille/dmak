 ;(function () {

	"use strict";

	// Create a safe reference to the DrawMeAKanji object for use below.
	var Dmak = function (text, options) {
		this.text = text;
		this.options = extend(Dmak.options, options);
		this.kanjis = [];
		this.papers = [];
		this.pointer = 0;
		this.timeouts = [];

		if (!this.options.skipLoad) {
			var loader = new DmakLoader(this.options.uri);
			loader.load(text, function (results) {
				this.setResults(results);
				this.options.loaded(this.kanjis);
				if (this.options.autoplay) {
					this.render();
				}
			}.bind(this));
		}
	};

	// Current version.
	Dmak.VERSION = "0.1.1";

	Dmak.options = {
		uri: "",
		skipLoad: false,
		autoplay: true,
		height: 109,
		width: 109,
		step: 0.03,
		element: "draw",
		stroke: {
			animated: true,
			attr: {
				"active": "#F92672",
				"stroke": "#272822",
				"stroke-width": 3,
				"stroke-linecap": "round",
				"stroke-linejoin": "round"
			}
		},
		text: {
			visible: true,
			attr: {
				"font-size": "8",
				"fill": "#272822"
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

		setResults: function (results) {
			this.kanjis = preprocessKanjis(results);
			this.papers = giveBirthToRaphael(results.length);
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
				this.kanjis[this.pointer].raphaelstroke.remove();
				this.kanjis[this.pointer].raphaelstroke = null;
				this.kanjis[this.pointer].raphaeltext.remove();
				this.kanjis[this.pointer].raphaeltext = null;
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
                end = this.kanjis.length;
            } else if (end > this.kanjis.length) {
				return false;
			}

			var cb = function (that) {
					createStroke(that.papers[that.kanjis[that.pointer].char], that.kanjis[that.pointer]);
					if (Dmak.options.text.visible) {
						createText(that.papers[that.kanjis[that.pointer].char], that.kanjis[that.pointer]);
					}
					that.pointer++;
					that.timeouts.shift();
					that.options.drew(that.pointer);
				},
				delay = 0,
				i,
				t;

			for (i = this.pointer; i < end; i++) {
				if (delay <= 0) {
					cb(this);
				} else {
					t = setTimeout(cb, delay, this);
					this.timeouts.push(t);
				}
				delay += this.kanjis[i].duration;
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
	 * Flattens the array of kanjis ; 3D > 2D
	 * and does some preprocessing while looping
	 * through all the kanjis:
	 *  - Maps to a character index
	 *  - Calculates path length
	 */
	function preprocessKanjis(kanjis) {
		var s = [],
			length,
			kanji,
			i,
			j;

		for (i = 0; i < kanjis.length; i++) {
			for (j = 0; j < kanjis[i].paths.length; j++) {
				length = Raphael.getTotalLength(kanjis[i].paths[j]);
				kanji = {
					"char": i,
					"length": length,
					"duration": length * Dmak.options.step * 1000,
					"path": kanjis[i].paths[j],
					"text": kanjis[i].texts[j],
					"raphaelstroke": null,
					"raphaeltext": null
				};
				s.push(kanji);
			}
		}

		return s;
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
			papers[i].path("M" + (Dmak.options.width / 2) + ",0 L" + (Dmak.options.width / 2) + "," + Dmak.options.height).attr(Dmak.options.grid.attr);
			papers[i].path("M0," + (Dmak.options.height / 2) + " L" + Dmak.options.width + "," + (Dmak.options.height / 2)).attr(Dmak.options.grid.attr);
		}
	}

	/**
	 * Draw a single stroke ; drawing can be animated if set as so.
	 */
	function createStroke(paper, stroke) {
		stroke.raphaelstroke = paper.path(stroke.path);
		stroke.raphaelstroke.attr(Dmak.options.stroke.attr);
		if (Dmak.options.stroke.animated) {
			animateStroke(stroke);
		}
	}

	/**
	 * Draw a single text
	 */
	function createText(paper, stroke) {
		stroke.raphaeltext = paper.text(stroke.text.x, stroke.text.y, stroke.text.value);
		stroke.raphaeltext.attr(Dmak.options.text.attr);
	}

	/**
	 * Animate stroke drawing.
	 * Based on the great article wrote by Jake Archibald
	 * http://jakearchibald.com/2013/animated-line-drawing-svg/
	 */
	function animateStroke(stroke) {
		stroke.raphaelstroke.attr({"stroke": Dmak.options.stroke.attr.active});
		stroke.raphaelstroke.node.style.transition = stroke.raphaelstroke.node.style.WebkitTransition = "none";
		// Set up the starting positions
		stroke.raphaelstroke.node.style.strokeDasharray = stroke.length + " " + stroke.length;
		stroke.raphaelstroke.node.style.strokeDashoffset = stroke.length;
		// Trigger a layout so styles are calculated & the browser
		// picks up the starting position before animating
		stroke.raphaelstroke.node.getBoundingClientRect();
		stroke.raphaelstroke.node.style.transition = stroke.raphaelstroke.node.style.WebkitTransition = "stroke-dashoffset " + stroke.duration + "ms ease";
		// Go!
		stroke.raphaelstroke.node.style.strokeDashoffset = "0";
		// Revert back to the options color when the animation is done.
		setTimeout(function () {
			// The stroke object may have been already erased when we reach this timeout
			if (stroke.raphaelstroke === null) {
				return;
			}
			stroke.raphaelstroke.node.style.stroke = Dmak.options.stroke.attr.stroke;
			stroke.raphaelstroke.node.style.transition = stroke.raphaelstroke.node.style.WebkitTransition = "stroke 400ms ease";
		}, stroke.duration);
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
