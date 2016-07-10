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
