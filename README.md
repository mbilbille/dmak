# Draw Me A Kanji [![Build Status](https://travis-ci.org/mbilbille/dmak.png?branch=master)](https://travis-ci.org/mbilbille/dmak) [![Stories in Ready](https://badge.waffle.io/mbilbille/dmak.png?label=ready&title=Ready)](https://waffle.io/mbilbille/dmak)

> Render your Japanese writings with fun and taste

![Draw Me A Kanji](https://raw.github.com/mbilbille/dmak/gh-pages/images/sample.gif)

*For the sake of simplicity, "Draw Me A Kanji" is shortened to dmak*

## Usage
Using dmak.js is easy, a lot easier than writing kanjis!

**Prerequisite**
All the hard work with SVG is done by *[Raphaël](http://github.com/DmitryBaranovskiy/raphael/raw/master/raphael-min.js)*, a cool and simple Javascript library to play with vector graphic on the Web.
And... that's it! Include both `raphael.js` and `dmak.js` files in your HTML file.

Up to you to use either:

#### Vanilla JS
```html
<div id="draw"></div>
<script>
  var dmak = new Dmak('電車', {
    'element' : "draw"
  });
</script>
```

#### or the jQuery plugin

```html
<div id="draw"></div>
<script>
    // That's it!
    $("#draw").dmak('電車');
</script>
```
**NOTE:** *You need to include the additional `jquery.dmak.js` file*

## Customization
Dmak.js comes with a whole set of options to alter the way it behaves. Here is an explicit list of all parameters available to you followed by their default value.

* `uri` - path to the SVG files folder. `""`
* `skipLoad` - skip SVG files loading. `false`
* `autoplay` - start drawing as soon as all SVG files are loaded. `true`
* `height` - height in pixels of a single paper surface. `109`
* `width` - width in pixels of a single paper surface. `109`
* `viewBox.x` - x position of the canvas. `0`
* `viewBox.y` - y position of the canvas. `0`
* `viewBox.w` - width of the canvas. `109`
* `viewBox.h` - height of the canvas. `109`
* `step` - positive integer which defines the speed of the drawing. `0.03`
* `element` - DOM element or its ID which is going to be a parent for drawing surface. `"draw"`
* `stroke.animated` - enable or disable stroke animation. `true`
* `stroke.order.visible` - display stroke order. `false`
* `stroke.order.attr.font-size` - stroke order font size in pixels. `8`
* `stroke.order.attr.fill` - stroke order color. `#999999`
* `stroke.attr.active` - currently drawn stroke color. `"#BF0000"`
* `stroke.attr.stroke` - stroke color (can use "random" keyword here for random color). `"#2C2C2C"`
* `stroke.attr.stroke-width` - stroke width in pixels. `4`
* `stroke.attr.stroke-linecap` - ["butt", "square", "round"]. `"round`
* `stroke.attr.stroke-linejoin` - ["bevel", "round", "miter"]. `"round`
* `grid.show` - show or hide gridlines. `true`
* `grid.attr.stroke` - grid color. `"#CCCCCC"`
* `grid.attr.stroke-width` - grid width in pixels. `0.5`
* `grid.attr.stroke-dasharray` - ["", "-", ".", "-.", "-..", ". ", "- ", "--", "- .", "--.", "--.."]. `"--"`
* `loaded` - callback function which is executed when all SVG files are fully loaded
* `erased` - callback function which is executed when a stroke is erased
* `drew` - callback function which is executed when a stroke is drawn

## Demo
For basic samples please refer to [demo](https://github.com/mbilbille/dmak/tree/master/demo) folder, otherwise dive into drawmeakanji.com [source code](https://github.com/mbilbille/dmak/tree/gh-pages).

## Compatibility
- Chrome 1.0+
- Firefox 16.0+ (see: [bugzilla.mozilla.org/show_bug.cgi?id=902879](https://bugzilla.mozilla.org/show_bug.cgi?id=902879))
- Opera 17.0+
- Safari 3.0+
- IE 10.0+ (animation not supported)

## Inspirations

- From @jakearchibald and his great article on [Animated line drawing in SVG](http://jakearchibald.com/2013/animated-line-drawing-svg/)
- From @akeru and his [kanjiviewer.js](https://github.com/KanjiVG/kanjivg.github.com/blob/master/js/kanjiviewer.js) library.

And of course a huge thanks and support to [KanjiVG](http://kanjivg.tagaini.net) for providing a whole set of SVG files.

## Contributing

Check [CONTRIBUTING.md](https://github.com/mbilbille/dmak/tree/master/CONTRIBUTING.md)

## History

Check [Release](https://github.com/mbilbille/dmak/releases) list.

## Building

- Install [nodejs](http://nodejs.org/)
- Install [grunt-cli](http://gruntjs.com/getting-started)
- Process dependencies by running `npm install` in the repository root folder
- Build a new release by invoking `grunt` in the repository root folder

## License

*Draw Me A Kanji* (dmak.js) was created by [Matthieu Bilbille](http://github.com/mbilbille) and released under the [MIT License](http://github.com/mbilbille/dmak/blob/master/LICENSE).
