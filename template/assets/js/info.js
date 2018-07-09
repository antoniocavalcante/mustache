def = {};
def.domain = {
    title: "Domain",
    tip: "in and out domain for the graph."
};

def.yAxes = {
    title: "Y Scale",
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

def.clusters = {
    title: "Clusters",
    tip: "number of clusters in the dataset."
};

def.smplWindow = {
    title: "Sample Window",
    tip: "Number of sampled points in the graph window."
};

def.smplPoints = {
    title: "Sample Points",
    tip: "Number of total points sampled."
};

def.zoom = {
    title: "Zoom",
    tip: "Current level of zoom for the chart."
};

def.resolution = {
    title: "Resolution",
    tip: "Current % of points shown from the total number of points."
};


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