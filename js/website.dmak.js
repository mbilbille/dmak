
// Add segments to a slider
$.fn.addSliderSegments = function (amount) {
    return this.each(function () {
        var segmentGap = 100 / (amount - 1) + "%"
        , segment = "<div class='ui-slider-segment' style='margin-left: " + segmentGap + ";'></div>";
        $(this).prepend(segment.repeat(amount - 2));
    });
};

// Implement our own repeat method() which copies the current string a given
// times and returns the new string
String.prototype.repeat = function( num )
{
    return new Array( num + 1 ).join( this );
}

var p;
var options = {
    step : 0.015,
    uri: "kanji/",
    stroke: {
        order: {
            visible : false,
            attr : {
                "fill" : "#CDC3C7"
            }
        },
        attr : {
            "active": "#E74C3C",
            "stroke": "#7F8C8D",
            "stroke-width": 4,
        }
    },
    grid : {
        show: true,
    },
    loaded: function(strokes) {
        $(".logo").toggleClass("flip");
        $(".wrap-draw").addClass("slideDown");
        $slider = $("#slider");
        if ($slider.length > 0) {
            p = 1;
            $slider.slider({
                min: 1,
                max: strokes.length + 1,
                value: 1,
                orientation: "horizontal",
                range: "min",
                slide: function(event, ui) {
                    var range = ui.value - p;
                    var action = "forward";
                    if(range < 0) {
                        action = "rewind";
                        range = range * -1;
                    }
                    p = ui.value;

                    for (var i = 0; i < range; i++) {
                        $("#draw").dmak(action, 1);
                    };
                }
            }).addSliderSegments($slider.slider("option").max);
        }
    },
    erased: function(index) {
        if($slider.slider("value") > index) {
            p = index + 1;
            $slider.slider( "value", p );
       }
   },
   drew: function(index) {
        if($slider.slider("value") <= index) {
            p = index + 1;
            $slider.slider( "value", p );
        }
    }
};

$(function() {

    var blankDrawer = $(".wrap-draw").html();

    // Check if we have a word in the URL
    if(window.location.hash) {
        var word = window.location.hash.substring(1);
        // Properly decode UTF8 characters
        word = decodeURIComponent(word);

    }
    else {
        word = "ようこそ！"
    }

    // First automatic drawing.
    ga("send", "event", "url", "search", word);
    window.setTimeout(function() {
        $("#draw").dmak(word, options);
    }, 2000);

    $('#mybtn').click(function(e) {
        e.preventDefault();

        if ($('#draw').data("plugin_dmak")){
            $("#draw").dmak("pause");
            $('.wrap-draw').html(blankDrawer);

        }
        var text = $('#mytext').val();
        window.location.hash = "#" + text;
        ga('send', 'event', 'input', 'search', text);
        $('#mytext').val("");
        $("#draw").dmak(text, options);
    });

    $( document ).on( "click", "#play", function(e){
        e.preventDefault();
       $('#draw').dmak('play');
    });

    $( document ).on( "click", "#pause", function(e){
        e.preventDefault();
        $('#draw').dmak('pause');
    });

    $( document ).on( "click", "#rewind", function(e){
        e.preventDefault();
        $('#draw').dmak('rewind', 1);
    });

    $( document ).on( "click", "#forward", function(e){
        e.preventDefault();
        $('#draw').dmak('forward', 1);
    });

    $( document ).on( "click", "#sample-words span", function(e){
        e.preventDefault();
        $('#mytext').val($(this).html());
    });


    // SETTINGS
    var $sliderWidth = $("#dmak-stroke-width");
    $sliderWidth.slider({
        min: 1,
        max: 9,
        value: options.stroke.attr['stroke-width'],
        orientation: "horizontal",
        range: "min",
        stop: function(event, ui) {
            options.stroke.attr['stroke-width'] = ui.value;
        }
    }).addSliderSegments($sliderWidth.slider("option").max);

    $("#dmak-color").val(options.stroke.attr.stroke);
    $( document ).on( "change", "#dmak-color", function(e){
        options.stroke.attr.stroke = $(this).val();
    });

    $("#dmak-color-active").val(options.stroke.attr.active);
    $( document ).on( "change", "#dmak-color-active", function(e){
        options.stroke.attr.active = $(this).val();
    });

    var speeds = [0.1, 0.05, 0.015, 0.009, 0.005]
    var $sliderSpeed = $("#dmak-slider-speed");
    $sliderSpeed.slider({
        min: 1,
        max: 5,
        value: 3,
        orientation: "horizontal",
        range: "min",
        stop: function(event, ui) {
            options.step = speeds[ui.value - 1];
        }
    }).addSliderSegments($sliderSpeed.slider("option").max);

    $("#dmak-order").html(options.stroke.order.visible ? "ON" : "OFF");
    $( document ).on( "click", "#dmak-order", function(e){
        e.preventDefault();
        if($(this).html() == "ON") {
            options.stroke.order.visible = false;
            $(this).html("OFF");
        } else {
            options.stroke.order.visible = true;
            $(this).html("ON");
        }
    });

    $("#dmak-grid").html(options.grid.show ? "ON" : "OFF");
    $( document ).on( "click", "#dmak-grid", function(e){
        e.preventDefault();
        if($(this).html() == "ON") {
            options.grid.show = false;
            $(this).html("OFF");
        } else {
            options.grid.show = true;
            $(this).html("ON");
        }
    });
});
