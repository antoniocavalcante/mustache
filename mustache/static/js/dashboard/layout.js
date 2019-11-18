function panelSize() {

    var navBarH = $(".navbar").height(),
        navBarW = $(".navbar").width(),
        mainHeight = $(".main").height();

    var globalWidth = window.innerWidth,
        globalHeight = window.innerHeight,
        globalMainHeight = globalHeight - navBarH,
        padding = 10

    panelH = (globalMainHeight - (padding * 2)) / 2;

    console.log("panel size is: " + panelH);

    return panelH;

}


function svg2img(selection) {
    var html = d3.select(selection)
        .attr("version", 1.1)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .node().parentNode.innerHTML;

    var imgsrc = 'data:image/svg+xml;base64,' + btoa(html);

    //  var canvas = document.querySelector("canvas")

    var image = new Image;
    image.src = imgsrc;
    image.onload = function () {

        var a = document.createElement("a");
        a.download = "sample.svg";
        a.href = imgsrc;
        a.click();
    };

}


$.fn.extend({
    animateCss: function (animationName, callback) {
        var animationEnd = (function (el) {
            var animations = {
                animation: 'animationend',
                OAnimation: 'oAnimationEnd',
                MozAnimation: 'mozAnimationEnd',
                WebkitAnimation: 'webkitAnimationEnd',
            };

            for (var t in animations) {
                if (el.style[t] !== undefined) {
                    return animations[t];
                }
            }
        })(document.createElement('div'));

        this.addClass('animated ' + animationName).one(animationEnd, function () {
            $(this).removeClass('animated ' + animationName);

            if (typeof callback === 'function') callback();
        });

        return this;
    },
});

// Addition to jQuery to get the inner text width
$.fn.textWidth = function () {
    var text = $(this).html();
    $(this).html('<span>' + text + '</span>');
    var width = $(this).find('span:first').width();
    $(this).html(text);
    return width;
};


$(".brand-logo").hover(function () {
    $(this).animateCss("swing");
});



$("#haiVisible").on("change", function () {
    $("#hai-panel").toggleClass("hidden");
    $("#reach-panel").removeClass("col-xs-9").addClass("col-xs-12");
    sizing();
})