;(function () {

	"use strict";

	// Create a safe reference to the DrawMeAKanji object for use below.
	var DmakLoader = function (uri) {
		this.uri = uri;
	};

	// Gather SVG data information for a given set of characters.
	// By default this action is done while instanciating the Word
	// object, but it can be skipped, see above
	DmakLoader.prototype.load = function (text, callback) {
		var paths = [],
			nbChar = text.length,
			done = 0,
			i,
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

		for (i = 0; i < nbChar; i++) {
			loadSvg(this.uri, i, text.charCodeAt(i).toString(16), callbacks);
		}
	};

	// Try to load a SVG file matching the given char code.
	// @thanks to the incredible work made by KanjiVG
	// @see: http://kanjivg.tagaini.net
	function loadSvg(uri, index, charCode, callbacks) {
		var xhr = new XMLHttpRequest(),
			code = ("00000" + charCode).slice(-5);
		xhr.open("GET", uri + code + ".svg", true);
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
	}

	function parseResponse(response) {
		var results = {paths: [], texts: []},
			parser = new DOMParser(),
			parsed = parser.parseFromString(response, "application/xml"),
			paths = parsed.querySelectorAll("path"),
			texts = parsed.querySelectorAll("text"),
			textValue,
			transform,
			x,
			y,
			text,
			i;
		for (i = 0; i < paths.length; i++) {
			results.paths.push(paths[i].getAttribute("d"));
		}
		for (i = 0; i < texts.length; i++) {
			textValue = texts[i].textContent;
			transform = texts[i].getAttribute("transform");
			x = transform.split(" ")[4];
			y = transform.split(" ")[5].replace(")", "");
			text = {"value": textValue, "x": x, "y": y};
			results.texts.push(text);
		}
		return results;
	}

	window.DmakLoader = DmakLoader;
}());
