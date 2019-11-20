//globals


var folderRoot = "",
    metaHiearchyFile = "",
    HAIPlotFile = "";

var globalColor = d3.interpolateViridis,
    haiColor = d3.interpolateBuPu,
    clusters = {},
    charts = [],
    medoids = {},
    ppg,
    ids,
    fosc = [];

var barWidth = 6;
var barPadding = 1.5;
var fullYScale = 0.3;
var HAicolorScale = d3.scaleSequential(haiColor);
var MultiReachcolorScale = d3.scaleSequential(globalColor);
var HAIcountScale;


// dendrogram settings
var nodeSize = 2.5;
var linkWidth = 1;
var dendrogramExponent = 0.5;
var dendrogramXScale;
var yScaleInverted;
var lineScale;

// reachabillity settings
var reachExponent = 1.0;
var reachCharts = {};


var interpolators = [
    // These are from d3-scale.
    "Viridis",
    "Inferno",
    "Magma",
    "Plasma",
    "Warm",
    "Cool",
    "Rainbow",
    "CubehelixDefault"
];

var monoInterpolators = [

    "Blues",
    "Greens",
    "Greys",
    "Oranges",
    "Purples",
    "Reds",
    "BuGn",
    "BuPu",
    "GnBu",
    "OrRd",
    "PuBuGn",
    "PuBu",
    "PuRd",
    "RdPu",
    "YlGnBu",
    "YlGn",
    "YlOrBr",
    "YlOrRd"

];


var floor = Math.floor,
    abs = Math.abs;

d3.text(datasetId + "/" + "ids", function (data) {
    ids = d3.csvParseRows(data);
})

d3.text(datasetId + "/" + "FOSC", function (data) {
    raw = d3.csvParseRows(data)[0];
    fosc = raw.map(function (d) {
        return parseInt(d);
    })
})

$("#projectTitle").text(project)

function settings() {

    var globalSettings = $("#globalSettings");
    var colorTheme = globalSettings.find("#colorTheme").find("select");
    $.each(interpolators, function (i, item) {
        colorTheme.append($('<option>', {
            value: interpolators[i],
            text: interpolators[i]
        }));
    });

    colorTheme.on("change", function () {
        globalColor = d3.scaleSequential(d3["interpolate" + this.value])

        // // hai plot
        // var last = HAicolorScale.domain();
        // HAicolorScale = d3.scaleSequential(globalColor).domain(last.invert())
        // var cards = d3.select("#hai-plot").selectAll("rect")
        // cards.style("fill", function (d, i) {
        //     return HAicolorScale(+d[0]);
        // })

        // dendrogram
        MultiReachcolorScale = d3.scaleSequential(globalColor);
        shading(clusters);

        // multiple reachabillity
        update();
    })

    var reachSettings = $("#settingsReach");
    var reachYScale = reachSettings.find("#yScale");
    reachYScale.attr("min", 0.05).attr("max", 1).attr("step", 0.05).attr("value", reachExponent);
    reachYScale.on("input", function () {
        reachExponent = this.value;
        Object.keys(reachCharts).forEach(function (key) {
            var chart = reachCharts[key];
            var y = chart.yScale;
            var container = chart.chartContainer;
            y.exponent(reachExponent)
            var area = chart.area
                .y1(function (d) {
                    return y(d[1]);
                });
            container.select("path").data([chart.data]).attr("d", area);
            container.select(".yAxis").call(chart.yAxis);
        })
    });


    function HAIlegendColor() {
        // Calculate variables for the temp gradient
        var width = parseInt($("#hai-panel").find(".panel-body").attr("width"));
        var numStops = 10;
        var countRange = HAIcountScale.domain();
        // index 2 is the substraction between max and min
        countRange[2] = countRange[1] - countRange[0];
        var countPoint = [];

        for (var i = 0; i < numStops; i++) {
            countPoint.push(i * countRange[2] / (numStops - 1) + countRange[0]);
        }

        d3.select("#hai-plot").select("#legend-traffic").remove()
        // Create the gradient
        d3.select("#hai-plot").select("svg").append("defs")
            .append("linearGradient")
            .attr("id", "legend-traffic")
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "100%").attr("y2", "0%")
            .selectAll("stop")
            .data(d3.range(numStops))
            .enter().append("stop")
            .attr("offset", function (d, i) {
                return HAIcountScale(countPoint[i]) / width;
            })
            .attr("stop-color", function (d, i) {
                return HAicolorScale(countPoint[i]);
            });

        d3.select("#hai-plot").select(".HAIlegend").style("fill", "url(#legend-traffic)");
    }

    var haiSettings = $("#settingsHai");
    var haiColorTheme = haiSettings.find("#colorTheme").find("select");
    var haiInvert = haiSettings.find("#haiInvert");
    $.each(monoInterpolators, function (i, item) {
        haiColorTheme.append($('<option>', {
            value: monoInterpolators[i],
            text: monoInterpolators[i]
        }));
    });

    haiColorTheme.on("change", function () {
        haiColor = d3.scaleSequential(d3["interpolate" + this.value]);
        var last = HAicolorScale.domain();
        HAicolorScale = d3.scaleSequential(haiColor).domain(last)
        HAIlegendColor();
        var cards = d3.select("#hai-plot").selectAll("rect")
        cards.style("fill", function (d, i) {
            return HAicolorScale(+d[0]);
        })
    })

    haiInvert.click(function () {
        var last = HAicolorScale.domain();
        last = last.reverse();
        HAicolorScale = d3.scaleSequential(haiColor).domain(last)
        HAIlegendColor();
        var cards = d3.select("#hai-plot").selectAll("rect")
        cards.style("fill", function (d, i) {
            return HAicolorScale(+d[0]);
        })

    })

}

function largestTriangleThreeBuckets(data, threshold) {

    var data_length = data.length;
    if (threshold >= data_length || threshold === 0) {
        return data; // Nothing to do
    }

    var sampled = [],
        sampled_index = 0;

    // Bucket size. Leave room for start and end data points
    var every = (data_length - 2) / (threshold - 2);

    var a = 0, // Initially a is the first point in the triangle
        max_area_point,
        max_area,
        area,
        next_a;

    sampled[sampled_index++] = data[a]; // Always add the first point

    for (var i = 0; i < threshold - 2; i++) {

        // Calculate point average for next bucket (containing c)
        var avg_x = 0,
            avg_y = 0,
            avg_range_start = floor((i + 1) * every) + 1,
            avg_range_end = floor((i + 2) * every) + 1;
        avg_range_end = avg_range_end < data_length ? avg_range_end : data_length;

        var avg_range_length = avg_range_end - avg_range_start;

        for (; avg_range_start < avg_range_end; avg_range_start++) {
            avg_x += data[avg_range_start][0] * 1; // * 1 enforces Number (value may be Date)
            avg_y += data[avg_range_start][1] * 1;
        }
        avg_x /= avg_range_length;
        avg_y /= avg_range_length;

        // Get the range for this bucket
        var range_offs = floor((i + 0) * every) + 1,
            range_to = floor((i + 1) * every) + 1;

        // Point a
        var point_a_x = data[a][0] * 1, // enforce Number (value may be Date)
            point_a_y = data[a][1] * 1;

        max_area = area = -1;

        for (; range_offs < range_to; range_offs++) {
            // Calculate triangle area over three buckets
            area = abs((point_a_x - avg_x) * (data[range_offs][1] - point_a_y) -
                (point_a_x - data[range_offs][0]) * (avg_y - point_a_y)
            ) * 0.5;
            if (area > max_area) {
                max_area = area;
                max_area_point = data[range_offs];
                next_a = range_offs; // Next a is this b
            }
        }

        sampled[sampled_index++] = max_area_point; // Pick this point from the bucket
        a = next_a; // This a is the next a (chosen b)
    }

    sampled[sampled_index++] = data[data_length - 1]; // Always add last

    return sampled;
}

function panelSize() {

    var navBarH = $(".navbar").height(),
        navBarW = $(".navbar").width(),
        mainHeight = $(".main").height();

    var globalWidth = window.innerWidth,
        globalHeight = window.innerHeight,
        globalMainHeight = globalHeight - navBarH,
        padding = 10

    console.log(globalMainHeight, globalHeight);

    panelH = (globalMainHeight / 2);

    w = $(window).width()
    h = $(document).height()
    h2 = $(".navbar").height()
    pdt = parseInt($(".main").css("padding-top")) - h2;
    mainMinH = $('.container-fluid').innerHeight();
    padding = 10;
    panelH = (h - h2 - pdt - padding - padding) / 2;

    return panelH;

}


function sizing() {
    panelH = panelSize();

    var panels = $(".panel");
    for (i = 0; i < panels.length; i++) {
        panel = panels[i];
        height = setWindow(panel);

    }
}



function setWindow(container) {
    var panel = $(container),
        footer = panel.find(".panel-footer"),
        header = panel.find(".panel-heading"),
        body = panel.find(".panel-body");

    footerH = footer.outerHeight(true);
    headerH = header.outerHeight(true);
    bodyH = body.outerHeight(true);
    panelW = panel.outerWidth(true);

    newH = parseInt(panelH - bodyH - footerH - headerH);
    console.log(newH, panelW);
    body.attr("width", panelW);
    body.attr("height", newH);

}

sizing();


function update() {

    medoids = {};

    Object.keys(clusters).forEach(function (key) {
        if (!('medoid' in clusters[key].data)) {
            medoids[clusters[key].children[0].data.medoid] = 0;
        } else {
            medoids[clusters[key].data.medoid] = clusters[key].data.color - 1;
        }
    })

    var v = Object.keys(medoids);

    var margin = {
        top: 10,
        right: 0,
        bottom: 10,
        left: 0
    },

        width = $("#reach-panel").find(".panel-body").attr("width"),
        height = $("#reach-panel").find(".panel-body").attr("height");

    MultiReachcolorScale.domain([0, v.length]);

    var t = d3.transition()
        .duration(750);

    // new data join to dom
    var u = d3.select('#reach-plot')
        .selectAll(".chart-scroller")
        .data(v, function (d) {
            return d;
        });

    u.exit().each(function (d) {
        var $sel = $(this);
        $sel.hide("slow", function () {
            $sel.remove();
        });
    })

    // update existing
    u.each(function (d) {
        var chart = d3.select(this);
        chart.select("path")
            .transition(t)
            .attr("fill", MultiReachcolorScale(medoids[d]));
    })

    // add new
    u.enter()
        .append("div").classed("chart-scroller", "true").property("id", function (d) {
            return "chart_" + d;
        })
        .text(function (d, i) {
            d3.text(datasetId + "/" + "visualization/" + d + "RNG_" + project + ".lr", function (d2) {
                $('#chart_' + d).hide();
                reachCharts[d] = createChart(d2, u, i, d);
                $('#chart_' + d).show("fast");
            });
        });

    reachPaging();


    // highlightMedoidNode();


    // function highlightMedoidNode() {

    //     d3.selectAll(".node").each(function (d) {

    //         if (v.find(function (element) {
    //                 return +element == d.data.label;
    //             })) {

    //             d3.select(this).transition().duration(500).attr("fill", "red")
    //             d3.select(this).select("circle").transition().duration(500).attr("r", 3);

    //         } else {
    //             try {
    //                 n = clusters[d.data.name];
    //                 d3.select(this).transition().duration(500).attr("fill", colorScale(n.data.color - 1))
    //                 d3.select(this).select("circle").transition().duration(500).attr("r", 2.5);
    //             } catch (error) {
    //                 return;
    //             }


    //         }
    //     })
    // }


    function createChart(data, cont, i, id) {

        var rows = d3.csvParseRows(data);

        var chart = new Chart({
            data: rows[2].map(function (d) {
                return +d;
            }),
            id: id,
            index: i,
            width: width,
            height: height,
            margin: margin,
            rows: rows.length,
            container: cont,
            color: 1
        });

        return chart;

    }


    function Chart(options) {

        this.chartData = options.data;
        this.width = options.width;
        this.height = options.height;
        this.svg = options.svg;
        this.id = options.id;
        this.name = options.name;
        this.margin = options.margin;
        this.showBottomAxis = true;
        this.mpts = [];
        this.rows = options.rows;
        this.container = options.container;
        this.fill = options.color;
        this.index = options.index

        this.fill = v.indexOf(this.id);

        this.rows = $("#reach-per-pg").find(":selected").text();


        colW = parseInt(12 / this.rows);

        var chr = this.chartData.map(function (d, i) {
            return [i, d];
        })

        var svgCont = d3.select("#reach-plot").select("#chart_" + this.id)
            .classed("col-xs-" + colW, "true")
            .classed("chart-scroller", "true")
            .classed("nopadding", "true")
            .append("a")
            .classed("no-link", "true")
            .attr("data-toggle", "modal")
            .attr("data-target", "#reach-modal")
            .attr("data-value", this.id)
            .attr("href", "#")

        var chartXScale = (this.width / this.rows) - (this.margin.right + this.margin.left + 40),
            chartYScale = this.height - (this.margin.top + this.margin.bottom);

        var svg = svgCont.append("svg")
            .attr("id", "chart" + this.id)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "-40 " + (-(this.margin.top)) + " " + options.width / this.rows + " " + (options.height));

        /* XScale is based on the number of points to be plotted */
        this.xScale = d3.scaleLinear()
            .range([0, chartXScale])
            .domain([0, this.chartData.length - 1]);


        /* YScale is linear based on the maxData Point we found earlier */
        // this.yScale = d3.scaleLinear()
        //     .range([chartYScale, 0])
        //     .domain([0, d3.max(this.chartData)]);

        this.yScale = d3.scalePow().exponent(reachExponent)
            .range([chartYScale, 0])
            .domain([0, d3.max(this.chartData)]);

        var xS = this.xScale;
        var yS = this.yScale;

        this.data = largestTriangleThreeBuckets(chr, Math.floor(chartXScale));
        this.height = chartYScale;
        this.width = chartXScale;

        this.area = d3.area()
            .curve(d3.curveMonotoneX)
            .x(function (d, i) {
                return xS(d[0]);
            })
            .y0(this.height)
            .y1(function (d) {
                return yS(d[1]);
            });

        svg.append("defs").append("clipPath")
            .attr("id", "clip-" + this.id)
            .append("rect")
            .attr("width", this.width)
            .attr("height", this.height);

        this.chartContainer = svg.append("g")
            .attr("transform", "translate(" + this.margin.left + "," + "0" + ")");

        this.chartContainer.append("path")
            .data([this.data])
            .attr("class", "chart")
            .attr("val", this.id)
            .attr("clip-path", "url(#clip-" + this.id + ")")
            .attr("fill", MultiReachcolorScale(medoids[this.id]))
            .attr("d", this.area);

        this.yAxis = d3.axisLeft().scale(this.yScale).ticks(5);

        this.chartContainer.append("g")
            .attr("class", "yAxis")
            .attr("transform", "translate(-3,0)")
            .call(this.yAxis);

        this.chartContainer.append("text")
            .attr("class", "country-title")
            // .style("text-anchor", "middle")
            .attr("fill", "white")
            .attr("transform", "translate(" + (chartXScale - ((options.width / this.rows) / 2)) + "," + (options.height * 0.9) + ")")
            .text("mpts: " + v[this.fill]);

        // d3.selectAll(".no-link").on("mouseover", function () {
        //     var text = d3.select(this).select(".country-title");
        //     text.transition().duration(100).style("font-size", 24);
        // }).on("mouseout", function () {
        //     var text = d3.select(this).select(".country-title");
        //     text.transition().duration(100).style("font-size", 15);
        // })

        var clustersCopy;

        function highlightTree(chart) {
            clustersCopy = clusters;
            Object.keys(clusters).forEach(function (key) {
                var x = clusters[key].data.medoid == chart.attr("val")
                if (x) {
                    clusters = {}
                    clusters[key] = clustersCopy[key];
                    highlightShading(clusters, medoids[chart.attr("val")], clustersCopy);
                }
            })

        }

        d3.selectAll(".no-link").selectAll("svg").on("mouseover", function () {
            var chart = d3.select(this).select("path");
            chart.attr("fill", d3.color(MultiReachcolorScale(medoids[chart.attr("val")])).brighter(1))
            highlightTree(chart);
        }).on("mouseout", function () {
            var chart = d3.select(this).select("path");
            clusters = clustersCopy;
            chart.attr("fill", MultiReachcolorScale(medoids[chart.attr("val")]))
            shading(clusters)
        })

    }

}

function highlightShading(clusters, counter, clustersCopy) {

    var colorScale = d3.scaleSequential(globalColor);

    var colouring = {};

    Object.keys(clusters).forEach(function (key) {
        try {
            childs = clusters[key].descendants();
            for (y = 0; y < childs.length; y++) {
                colouring[childs[y].data.name] = counter + 1;
            }
            clusters[key].data['color'] = counter;
        } catch (error) { }
        counter++;
    });

    // adjust color scale to match number of selection
    colorScale.domain([1, Object.keys(clustersCopy).length + 1]);

    node = d3.selectAll(".node");
    link = d3.selectAll(".link");

    // fill node circles with color
    node
        .attr("fill", function (d, i) {
            val = colouring[d.data.name];

            if (val) {
                return colorScale(val);
            }
            return "grey"

        }).style("opacity", function (d, i) {
            val = colouring[d.data.name];
            if (val) {
                return 1;
            }
            return 0.3
        });

    // change node link colors
    link
        .attr("stroke", function (d, i) {

            if (clusters[d.data.name]) {
                return "grey";
            }

            val = colouring[d.data.name];
            if (val) {
                return colorScale(val);
            }
            return "grey";
        }).style("opacity", function (d, i) {

            if (clusters[d.data.name]) {
                return 0.3;
            }

            val = colouring[d.data.name];
            if (val) {
                return 1;
            }
            return 0.3
        });

}



function shading(clusters) {

    var colorScale = d3.scaleSequential(globalColor);

    var colouring = {};

    // label nodes with the color colors
    counter = 1;
    Object.keys(clusters).forEach(function (key) {
        try {
            childs = clusters[key].descendants();
            for (y = 0; y < childs.length; y++) {
                colouring[childs[y].data.name] = counter;
            }
            clusters[key].data['color'] = counter;
        } catch (error) { }
        counter++;
    });

    // adjust color scale to match number of selection
    colorScale.domain([1, Object.keys(clusters).length + 1]);

    node = d3.selectAll(".node");
    link = d3.selectAll(".link");

    // fill node circles with color
    node
        .attr("fill", function (d, i) {
            val = colouring[d.data.name];

            if (val) {
                return colorScale(val);
            }
            return "grey"

        }).style("opacity", function (d, i) {
            val = colouring[d.data.name];
            if (val) {
                return 1;
            }
            return 0.3
        });

    // change node link colors
    link
        .attr("stroke", function (d, i) {

            if (clusters[d.data.name]) {
                return "grey";
            }

            val = colouring[d.data.name];
            if (val) {
                return colorScale(val);
            }
            return "grey";
        }).style("opacity", function (d, i) {

            if (clusters[d.data.name]) {
                return 0.3;
            }

            val = colouring[d.data.name];
            if (val) {
                return 1;
            }
            return 0.3
        });

}



function dendrogram() {

    var margin = {
        top: 10,
        right: 0,
        bottom: 10,
        left: 0
    };

    var width = $("#dendogram-panel").find(".panel-body").attr("width"),
        height = $("#dendogram-panel").find(".panel-body").attr("height");


    var svg = d3.select("#chart-dendrogram").append("svg")
        .attr("preserveAspectRatio", "xMidYMid Slice")
        .attr("viewBox", "-40 -15 " + (width - 20) + " " + (height - 15));

    // Variable to hold the root of the hierarchy.
    var clusterLayout = d3.cluster()
        .size([width - 100, height])
        .separation(function separation(a, b) {
            return a.parent == b.parent ? 2 : 2;
        });

    var zoom = d3.zoom()
        .scaleExtent([1, 100])
        .translateExtent([
            [0, 0],
            [width, height]
        ])
        .extent([
            [0, 0],
            [width, height]
        ])
        .on("zoom", zoomed);

    svg.append("rect")
        .attr("class", "zoom")
        .attr("width", width - 60)
        .attr("height", height - 15)
        .attr("transform", "translate(" + (0) + "," + (-15) + ")")
        .call(zoom);

    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform;
        x3.domain(t.rescaleX(x2).domain());

        var scaling = ((Math.abs(x3.domain()[1] - x3.domain()[0]) / Math.abs(x2.domain()[1] - x2.domain()[0])) * 100).toFixed(0);
        d3.select("#dendrogramZoom").select("#output").html(scaling + "%")

        svg.selectAll(".node").attr("transform", function (d) {
            return "translate(" + x3(d.x) + "," + yScaleInverted(d.data.y) + ")";
        });

        svg.selectAll(".link").attr("d", elbow);
    }

    var x3 = d3.scaleLinear().range([0, width - 100]);
    var x2 = d3.scaleLinear().range([0, width - 100]);


    var changedClusters = false;

    // Maximum values for the Y axis
    var ymax = Number.MIN_VALUE;
    var ymin = Number.MAX_VALUE;
    var xmax2 = Number.MIN_VALUE;
    var xmin2 = Number.MAX_VALUE;

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    var data = d3.json(datasetId + "/" + project + "_meta-hierarchy_.json", function (json) {
        var root = d3.hierarchy(json);

        clusterLayout(root);

        var nodes = root.descendants();

        // Finds the maximum and minimum density values.
        nodes.forEach(function (d) {
            if (d.data.y > ymax)
                ymax = d.data.y;
            if (d.data.y < ymin)
                ymin = d.data.y;
        });

        nodes.forEach(function (d) {
            if (d.x > xmax2)
                xmax2 = d.x;
            if (d.x < xmin2)
                xmin2 = d.x;
        });

        labelVals = nodes.filter(function (d) {
            return d.children == null;
        });

        labelVals = labelVals.sort(function (a, b) {
            return (+a.data.label) - (+b.data.label);
        });

        x3.domain([xmin2 - 5, xmax2]);
        x2.domain(x3.domain());

        yScale = d3.scalePow().domain([ymin, ymax]).range([0, height - 60]).exponent(dendrogramExponent).clamp(true);
        yScaleInverted = d3.scalePow().domain([ymax, ymin]).range([0, height - 60]).exponent(dendrogramExponent).clamp(true);
        xScale = d3.scaleLinear().domain([2, 100]).range([0, width - 100]);
        lineScale = d3.scalePow().range([0, height - 60]).exponent(dendrogramExponent).domain([ymax, ymin]).clamp(true);
        lineMove = d3.scaleLinear().range([0, height - 60]).domain([0, height - 60]).clamp(true);

        var yAxis = d3.axisLeft().scale(this.yScaleInverted).ticks(5);

        var loadLine = d3.select("#slider").property("value")
        if (typeof (loadLine) == 'float') {
            hardcodeline = loadLine
        } else {
            var hardcodeline = (loadLine / 100) * ymax;
        }

        var link = svg.selectAll(".link")
            .data(nodes.slice(1))
            .enter().append("path")
            .attr("class", "link")
            .style("stroke-width", linkWidth)
            .attr("d", elbow)
            .attr("stroke", "grey")
            .style("opacity", 0.3);

        var node = svg.selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .style("opacity", 0.3)
            .attr("transform", function (d) {
                return "translate(" + x3(d.x) + "," + yScaleInverted(d.data.y) + ")";
            });

        // Adds the shape of the nodes in the dendrogram.
        node.append("circle")
            .attr("r", nodeSize)
            .attr("data-target", "#reach-modal")
            .attr("data-value", function (d) {
                if (d.children == null) {
                    return d.data.label;
                }
            })
            .attr("data-toggle", function (d) {
                if (d.children == null) {
                    return "modal";
                }
            });

        node.append("text")
            .attr("x", 0)
            .attr("y", 20)
            .style("text-anchor", "middle")
            .text(function (d) {
                return d.children ? "" : d.data.label;
            });

        node.selectAll("text").each(function (d) {
            console.log(d3.select(this).style("textLength"));

        })

        // Define the div for the tooltip
        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        node.on("mouseover", function (d) {

            d3.select(this).attr("stroke", "red")
            d3.select("body")
                .style("cursor", "pointer");

            if (!d.children) {

                div.transition()
                    .duration(200)
                    .style("opacity", 1.0);

                displayText = d.data.label;
                div.html(displayText)
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY) + "px");

            }
        })
            .on("mouseout", function (d) {
                d3.select(this).attr("stroke", "none");
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
                d3.select("body")
                    .style("cursor", "auto");
            });

        var transitionTime = 100;

        // colour and extract clusters from dendogram based on threshold bar current value.
        function clusterThresholdExtraction(currentValue) {

            d3.select("#manualThresh").select("input").property("value", function () {
                return (+currentValue).toFixed(8);
            }).attr("step", (ymax / 100).toFixed(8));

            var clusters = {}

            function traverse(d, i) {
                if (d.data.y <= currentValue) {
                    if (d.parent != null && d.parent.data.y > currentValue && d.children != null) {
                        clusters[d.data.name] = d;
                    } else if (currentValue == ymax) {
                        clusters[root.data.name] = root;
                    }
                }
            };

            node.each(traverse);

            return clusters;

        }

        var drag = d3.drag()
            .on('drag', function (d) {
                d3.select("body")
                    .style("cursor", "row-resize");

                var dy = d3.event.y;

                d3.select(this).attr("y1", lineMove(dy)).attr("y2", lineMove(dy));

                var currentValue = lineScale.invert(dy);

                d3.select("#slider").property("value", function () {
                    return currentValue;
                });

                clusters = clusterThresholdExtraction(currentValue);
                shading(clusters);
            })
            .on("end", function () {
                d3.select("body")
                    .style("cursor", "auto");
                update(clusters);
            });

        function manualExtract(bool) {
            if (bool) {
                node.on("click", function (d) {
                    if (d.children == null) {
                        return;
                    }

                    if (clusters[d.data.name]) {
                        delete clusters[d.data.name];

                    } else {

                        children = d.descendants();
                        parents = d.ancestors();

                        // removes parents from colouring
                        for (x = 0; x < parents.length; x++) {
                            if (clusters[parents[x].data.name]) {
                                delete clusters[parents[x].data.name];
                            }
                        }

                        // removes children nodes from the selected clusters
                        for (x = 0; x < children.length; x++) {
                            if (clusters[children[x].data.name]) {
                                delete clusters[children[x].data.name];
                            }
                        }

                        // add selection to selected clusters
                        clusters[d.data.name] = d;

                    }

                    shading(clusters);
                    update(clusters);

                });
            } else {
                node.on("click", function (d) {
                    return;
                });
            }
        }


        // Threshold Bar
        var thresholdBar = svg.append("g");

        thresholdBar.append("line")
            .attr("x1", -40)
            .attr("y1", yScaleInverted(hardcodeline))
            .attr("x2", width) // Dynamic size of the bar
            .attr("y2", yScaleInverted(hardcodeline))
            .call(drag);

        d3.select("#slider")
            .property("min", ymin)
            .property("max", ymax)
            .attr("step", (ymax - ymin) / 1000)
            .property("value", hardcodeline)
            .text(function () {
                clusters = clusterThresholdExtraction(this.value);
                shading(clusters)
            });

        // Link the threshold bar to the slider.
        d3.select("#slider").on("input", function () {
            var currentValue = this.value;
            thresholdBar.select("line").attr("y1", y1 => yScaleInverted(currentValue));
            thresholdBar.select("line").attr("y2", y2 => yScaleInverted(currentValue));
            clusters = clusterThresholdExtraction(currentValue);
            shading(clusters);

        });

        // svg.append("rect").attr("width", 40).attr("height", height).style("fill", "white").attr("transform", "translate(-40,-15)");
        // svg.append("rect").attr("width", 40).attr("height", height).style("fill", "white").attr("transform", "translate(" + (width - 60) + ",-15)");

        svg.append("g")
            .attr("class", "yAxis")
            .attr("transform", "translate(0,0)")
            .call(yAxis);

        // dendogram node selection method switcher
        var a1, b1;

        function dendoSelect(a) {

            if (a.checked) {

                option = a.value;

                if (option == 'bar') {

                    d3.select("#manualThresh").classed("hidden", false);

                    thresholdBar.classed("hidden", false);
                    manualExtract(false);

                    thresholdBar.each(function () {
                        value = lineScale.invert(d3.select(this).select("line").attr("y1"))
                        clusters = clusterThresholdExtraction(value);
                        shading(clusters);
                    });

                    update();

                } else if (option == 'manual') {

                    d3.select("#manualThresh").classed("hidden", true);

                    thresholdBar.classed("hidden", true);
                    manualExtract(true);
                    shading(clusters);

                } else if (option == "fosc") {

                    d3.select("#manualThresh").classed("hidden", true);

                    clusters = {}
                    node.each(function (d) {
                        if (fosc.includes(+d.data.name) && +d.data.name != 0) {
                            clusters[d.data.name] = d;
                        }
                    })

                    thresholdBar.classed("hidden", true);
                    manualExtract(false);
                    shading(clusters);
                    update();

                }

            }

        }

        // set dendogram initially
        d3.selectAll("input").each(function (d, i) {
            dendoSelect(this)
        })

        // set dendogram when radio buttons changed
        $('.dendo-method input[type=radio]').on("change", function () {
            dendoSelect(this)
        })

        update(clusters);

        $("#manualThresh").find("input").on("change", function () {
            var value = +this.value;
            if (value > ymax) {
                value = ymax;
            } else if (value < ymin) {
                value = ymin;
            }
            clusters = clusterThresholdExtraction(value);
            thresholdBar.select("line").attr("y1", yScaleInverted(value)).attr("y2", yScaleInverted(value));
            shading(clusters);
            update();
        })

        var settingsDendrogram = $("#settingsDendrogram");
        var dYScale = settingsDendrogram.find("#yScale");
        var dNode = settingsDendrogram.find("#nodeSize");
        var dLink = settingsDendrogram.find("#linkWidth");

        dNode.attr("min", 2).attr("max", 8).attr("step", 0.5).attr("value", nodeSize);
        dNode.on("input", function () {
            d3.selectAll(".node").selectAll("circle").attr("r", this.value)
        })

        dLink.attr("min", 1).attr("max", 3).attr("value", 1).attr("step", 0.5)
        dLink.on("input", function () {
            d3.selectAll(".link").style("stroke-width", this.value)
        })

        dYScale.attr("min", 0.1).attr("max", 1).attr("step", 0.05).attr("value", dendrogramExponent)
        dYScale.on("input", function () {
            yScaleInverted.exponent(this.value);
            lineScale.exponent(this.value);
            svg.select(".yAxis").call(yAxis);

            if ($('.dendo-method input[value=bar]').parent().hasClass("active")) {
                var line = svg.select("line");
                var value = $("#manualThresh").find("input").val()
                line.attr("y1", yScaleInverted(value));
                line.attr("y2", yScaleInverted(value));
            }

            svg.selectAll(".node").attr("transform", function (d) {
                return "translate(" + x3(d.x) + "," + yScaleInverted(d.data.y) + ")";
            });

            svg.selectAll(".link").attr("d", elbow);
        }).on("change", function () {
            update();
        })


    });

    // Transform this into a path
    function elbow(d, i) {
        return "M" + x3(d.parent.x) + "," + yScaleInverted(d.parent.data.y) +
            "H" + x3(d.x) + "V" + yScaleInverted(d.data.y);
    }
}


function haiPlot() {

    // var width = parseInt((screen.width - (30 + 35)) / 4);
    var width = parseInt($("#hai-panel").find(".panel-body").attr("width"));
    var height = parseInt($("#reach-panel").find(".panel-body").attr("height"));

    height = height - 20;


    var dataset = datasetId + "/" + project + "_HAI_tree.out";

    var heatmapChart = function (file) {
        d3.text(file,
            function (error, data) {

                data = d3.csvParseRows(data);
                var haiRange = data.length;

                var gridSize = (width - (30 * 2)) / haiRange,
                    gridSizeY = (height - (30 * 2)) / haiRange;

                var minValue = d3.min(data, function (d, i) {
                    return +d3.min(d);
                });

                minValue = data.map(function (d) {
                    return +d3.values(d).reverse()[0];
                })

                minValue = d3.min(minValue);

                maxValue = data.map(function (d) {
                    return +d3.values(d).sort()[0];
                })

                maxValue = d3.max(maxValue);

                labels = [];
                for (var i = 0; i < (haiRange + 1); i++) {
                    labels.push(i);
                }

                HAicolorScale.domain([minValue, maxValue]);
                var inverted = $("#settingsHai").find("#haiInvert");
                if (inverted.prop("checked")) {
                    HAicolorScale.domain([maxValue, minValue]);
                }

                var svg = d3.select("#hai-plot").append("svg")
                    .attr("preserveAspectRatio", "xMidYMid Slice")
                    .attr("viewBox", "-30 -20 " + (width + 20) + " " + height)
                    .attr("width", width)
                    .attr("height", height + 20);

                labels = [2, 50];

                var HeatMapxScale = d3.scaleLinear()
                    .range([gridSize + (gridSize / 2), (haiRange * gridSize) + (gridSize / 2)])
                    .domain([d3.min(labels), d3.max(labels)]);

                var HeatMapxScaleY = d3.scaleLinear()
                    .range([gridSizeY + (gridSizeY / 2), (haiRange * gridSizeY) + (gridSizeY / 2)])
                    .domain([d3.min(labels), d3.max(labels)]);

                // Define x-axis
                var HeatMapxAxisLeft = d3.axisLeft()
                    .ticks(10)
                    .scale(HeatMapxScaleY);

                var HeatMapxAxisTop = d3.axisTop()
                    .ticks(10)
                    .scale(HeatMapxScale);

                // Set up X axis Left
                svg.append("g")
                    .attr("class", "axis-heatmap-l")
                    .attr("transform", "translate(" + -5 + "," + -5 + ")")
                    .call(HeatMapxAxisLeft);

                // Set up X axis Top
                svg.append("g")
                    .attr("class", "axis-heatmap-t")
                    .attr("transform", "translate(" + -5 + "," + -5 + ")")
                    .call(HeatMapxAxisTop);

                // Define the div for the tooltip
                var div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);

                ndata = []
                for (i = 0; i < data.length; i++) {
                    ndata[i] = data[i].map(function (d, j) {
                        return [d, i, j];
                    })
                }

                data = [].concat.apply([], ndata);

                node = d3.selectAll(".node");

                var cards = svg.selectAll(".hour")
                    .data(data);

                cards.append("title");

                cards.enter().append("rect")
                    .attr("x", function (d, i) {
                        return (d[2]) * (gridSize);
                    })
                    .attr("y", function (d, i) {
                        return (d[1]) * gridSizeY;
                    })
                    .attr("width", gridSize)
                    .attr("height", gridSizeY)
                    .style("fill", function (d, i) {
                        return HAicolorScale(+d[0]);
                    })
                    .on("mouseover", function (d) {
                        d3.select(this).style("fill", "#ffffff");
                        div.transition()
                            .duration(200)
                            .style("opacity", 1.0);
                        div.html((+d[0]).toFixed(5) + '<br>' + d[1] + '<br>' + d[2])
                            .style("left", (d3.event.pageX + 10) + "px")
                            .style("top", (d3.event.pageY) + "px");


                        nodes = []
                        node.each(function (d) {

                            start = d[1]
                            end = d[2]

                            if (+d.data.label == start) {
                                nodes.push(d3.select(this));
                            }

                            if (+d.data.label == end) {
                                nodes.push(d3.select(this));
                            }
                        })

                    })
                    .on("mouseout", function (d) {
                        d3.select(this).style("fill", function (d, i) {
                            return HAicolorScale(+d[0]);
                        });
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });

                // Scale for workingtime
                HAIcountScale = d3.scaleLinear()
                    .domain([minValue, maxValue])
                    .range([0, width]);

                // Calculate variables for the temp gradient
                var numStops = 10;
                var countRange = HAIcountScale.domain();
                // index 2 is the substraction between max and min
                countRange[2] = countRange[1] - countRange[0];
                var countPoint = [];

                for (var i = 0; i < numStops; i++) {
                    countPoint.push(i * countRange[2] / (numStops - 1) + countRange[0]);
                }

                var legendWidth = gridSize * haiRange

                // Create the gradient
                svg.append("defs")
                    .append("linearGradient")
                    .attr("id", "legend-traffic")
                    .attr("x1", "0%").attr("y1", "0%")
                    .attr("x2", "100%").attr("y2", "0%")
                    .selectAll("stop")
                    .data(d3.range(numStops))
                    .enter().append("stop")
                    .attr("offset", function (d, i) {
                        return HAIcountScale(countPoint[i]) / width;
                    })
                    .attr("stop-color", function (d, i) {
                        return HAicolorScale(countPoint[i]);
                    });

                // Color Legend container
                var legendsvg = svg.append("g")
                    .attr("class", "HAIlegend")
                    .attr("transform", "translate(" + legendWidth / 2 + "," + (height - 100) + ")");

                // Draw the Rectangle
                legendsvg.append("rect")
                    .attr("class", "legendRect")
                    .attr("x", -legendWidth / 2)
                    .attr("y", 50)
                    .attr("width", legendWidth)
                    .attr("height", 15)
                    .style("fill", "url(#legend-traffic)");

                // Set scale for x-axis
                var xScale = d3.scaleLinear()
                    .range([-legendWidth / 2, legendWidth / 2])
                    .domain([minValue, maxValue]);

                // Define x-axis
                var xAxis = d3.axisBottom()
                    .ticks(5)
                    .scale(xScale);

                // Set up X axis
                legendsvg.append("g")
                    .attr("class", "axis")
                    .attr("transform", "translate(0," + 65 + ")")
                    .call(xAxis);

            });

    };

    heatmapChart(dataset);

}


dendrogram();
haiPlot();
settings();
$('#loading').delay(1000).fadeOut(1000);



$("#reach-modal").on("show.bs.modal", function (event) {
    var button = $(event.relatedTarget)
    var value = button.data('value')
    var modal = $(this);
    // modal.find('.modal-title').text('Chart ' + value);
    var modalPad = parseInt($(window).innerHeight() * 0.10),
        width = parseInt($(window).innerWidth() - modalPad),
        h = parseInt($(window).innerHeight() - (modalPad * 2));

    modal.find("#full-options").css("max-height", h)

    $(".modal-xl").attr("height", h);
    $(".modal-xl").attr("width", width);

    $(".modal-xl").css("height", h);
    $(".modal-xl").css("width", width);

    drawReach(+value);

});

$('#reach-modal').on('hidden.bs.modal', function () {
    d3.select("#full-reach").selectAll("svg").remove();
})


function reachPaging() {

    ppg = $("#reach-per-pg").find(":selected").text();
    meds = Object.keys(clusters).length / ppg;
    count = Math.ceil(meds);
    pages = [];
    for (i = 0; i < count; i++) {
        pages.push(i);
    }

    pgLinks = d3.select(".pagination").selectAll(".pg").data(pages, function (d) {
        return +d;
    })

    pgLinks.exit().remove();

    d3.selectAll(".arr").remove();


    pgLinks.enter().append("li").classed("pg", "true").append("a").attr("href", "#").html(function (d) {
        return (d + 1);
    })

    d3.select(".pg").classed("active", "true");

    move = $("#reach-plot").width();

    buttons = d3.selectAll(".pg");

    function toggleActive(current) {
        if (current < 0 || current > pages.length - 1) return;
        buttons.each(function (d) {
            $(this).removeClass("active")
            if (current == d) {
                $(this).addClass("active");
            }
        })
    }

    buttons.on("click", function (d) {
        offset = move * d;
        if (d == pages.length - 1) {
            offset = offset + 10;
        }
        $("#reach-plot").scrollLeft(offset);

    });


    $("#reach-plot").scroll(function () {
        pos = $(this).scrollLeft() + 1;
        current = Math.floor(pos / move);
        if (pos + move >= Math.ceil(meds * move)) {
            current = pages.length - 1;
        }
        toggleActive(current);

    })

    $("#reach-plot").scrollLeft(0);

    d3.select(".pagination")
        .append("li")
        .attr("pg-val", "1")
        .classed("arr", "true")
        .classed("pg-nav", "true")
        .append("a")
        .attr("href", "#")
        .append("span")
        .html("&raquo;");

    nav = d3.selectAll(".pg-nav");

    nav.on("click", function () {
        i = d3.select(this).attr("pg-val")
        g = $(".pg.active")[0];
        d3.select(g).each(function (d) {
            shift = d + parseInt(i);
            offset = move * shift;
            if (shift == pages.length - 1) {
                offset = offset + 10;
            }
            $("#reach-plot").scrollLeft(offset);
        })
    })

}


d3.select("#reach-per-pg").on("change", function () {
    d3.select('#reach-plot').selectAll(".chart-scroller").remove();
    reachPaging();
    update();
})
