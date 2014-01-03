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
        var paths = [];
        var nbChar = text.length;
        var done = 0;
        for (var i = 0; i < nbChar; i++) {
            loadSvg(this.uri, i, text.charCodeAt(i).toString(16), {
                done: function (index, data) {
                    paths[index] = data;
                    done++;
                    if (done === nbChar) {
                        callback(paths);
                    }
                },
                error: function (msg) {
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
    }

    // Parse the SVG data to only keep paths data.
    function parseResponse(response) {
        var parser = new DOMParser();
        var elements = parser.parseFromString(response, "application/xml").querySelectorAll('path');
        var paths = [];
        for (var i = 0; i < elements.length; i++) {
            paths.push(elements[i].getAttribute('d'));
        }
        return paths;
    }

    window.DmakLoader = DmakLoader;
}());
