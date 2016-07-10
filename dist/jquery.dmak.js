/*
 *  Draw Me A Kanji - v0.3.1
 *  A funny drawer for your Japanese writings
 *  http://drawmeakanji.com
 *
 *  Made by Matthieu Bilbille
 *  Under MIT License
 */
/**
 * Draw Me a Kanji - version: 0.1
 * Plugin jQuery
 *
 * https://github.com/mbilbille/drawmeakanji
 * https://github.com/mbilbille
 *
 * Licensed under the MIT license.
 */
 ;(function ( $, window, document, undefined ) {

	// Create the defaults once
	var pluginName = "dmak";

	// The actual plugin constructor
	function Plugin ( element, text, options ) {
		this.element = element;
		this.text = text;
		this.options = $.extend( {}, options, {"element" : $(element).attr("id")} );
		this._name = pluginName;
		this.dmak = null;
		this.init();
	}

	Plugin.prototype = {
		init: function () {
			this.dmak = new Dmak(this.text, this.options);
		},
		reset: function() {
			this.dmak.erase();
		},
		pause: function() {
			this.dmak.pause();
		},
		play: function() {
			this.dmak.render();
		},
		rewind: function (x) {
			this.dmak.eraseLastStrokes(x);
		},
		forward: function (x) {
			this.dmak.renderNextStrokes(x);
		},
		rewindTo: function (t) {
			this.dmak.erase(t);
		},
		forwardTo: function (t) {
			this.dmak.render(t);
		}
	};

	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[ pluginName ] = function ( text, options ) {
		return this.each(function() {
			if ( !$.data( this, "plugin_" + pluginName ) ) {
				$.data( this, "plugin_" + pluginName, new Plugin( this, text, options ) );
			}
			else if ($.isFunction(Plugin.prototype[text])) {
				$.data(this, "plugin_" + pluginName)[text](options);
			}
		});
	};

})( jQuery, window, document );
