def = {};
def.domain = {
    title: "Domain",
    tip: "in and out domain for the graph."
};

def.yAxes = {
    title: "Y Axes Scale",
    tip: "set a power scale for the y axes."
};

def.barWidth = {
    title: "Bar Width",
    tip: "set the bar width for the bar graph."
};

def.points = {
    title: "Points",
    tip: "number of points in the dataset."
};

def.smplWindow = {
    title: "Sample Window",
    tip: "Number of sampled points in the graph window."
}


var elements = $("*").filter(function () {
    return $(this).data("inf") !== undefined;
});

/* <i title="Test" class="fa fa-info-circle inline info-format inf"></i> */

for (i = 0; i < elements.length; i++) {

    var elem = $(elements[i]);
    var typ = elem.data("inf");
    var val = elem.data("val");

    title = def[val].title + ": ";
    if (typ == "stats") {
        elem.find("strong").text(title);
    }
    if (typ == "param") {
        elem.append(title);
    }
    elem.find("i").attr("title", def[val].tip).addClass("inf info-format").attr("data-tippy-size", "large");

}


tippy('.inf');