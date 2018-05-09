function MultiReachabilityPlots() {
    var margin = {
            top: 10,
            right: 25,
            bottom: 100,
            left: 60
        },
        height = 925 - margin.top - margin.bottom,
        width = parseInt(d3.select('#chart-container').style('width'), 10) - margin.left - margin.right;

    charts = []
    mpts = [9, 27, 35, 46]

    var colorScale = d3.scaleSequential(d3.interpolatePlasma)
        .domain([0, 3]);

    var svg = d3.select("#chart-container").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", (height + margin.top + margin.bottom));

    d3.text('../../data/data3.csv', createChart);

    function createChart(data) {

        var rows = d3.csvParseRows(data);

        var charts = [];

        // var startYear = data[0].Year;
        // var endYear = data[data.length - 1].Year;
        var chartHeight = height * (1 / rows.length);

        for (var i = 0; i < rows.length; i++) {

            charts.push(new Chart({
                data: rows[i].map(function (d) {
                    return +d;
                }),
                id: i,
                name: "UK",
                width: width,
                height: height * (1 / rows.length),
                svg: svg,
                margin: margin,
                showBottomAxis: (i == rows.length - 1),
                m: mpts[i]
            }));

        }
    }

    function Chart(options) {
        this.chartData = options.data;
        this.width = options.width;
        this.height = options.height;
        this.svg = options.svg;
        this.id = options.id;
        this.name = options.name;
        this.margin = options.margin;
        this.showBottomAxis = options.showBottomAxis;
        this.mpts = options.m;

        /* XScale is based on the number of points to be plotted */
        this.xScale = d3.scaleLinear()
            .range([0, this.width])
            .domain([0, this.chartData.length - 1]);


        /* YScale is linear based on the maxData Point we found earlier */
        this.yScale = d3.scaleLinear()
            .range([this.height, 0])
            .domain([0, d3.max(this.chartData)]);

        var xS = this.xScale;
        var yS = this.yScale;

        /*
          This is what creates the chart.
          There are a number of interpolation options.
          'basis' smooths it the most, however, when working with a lot of data, this will slow it down
        */
        this.area = d3.area()
            .curve(d3.curveBasis) // .interpolate("curveStep")
            .x(function (d, i) {
                return xS(i);
            })
            .y0(this.height)
            .y1(function (d) {
                return yS(d);
            });

        /*
          This isn't required - it simply creates a mask. If this wasn't here,
          when we zoom/panned, we'd see the chart go off to the left under the y-axis
        */
        this.svg.append("defs").append("clipPath")
            .attr("id", "clip-" + this.id)
            .append("rect")
            .attr("width", this.width)
            .attr("height", this.height);
        /*
          Assign it a class so we can assign a fill color
          And position it on the page
        */
        this.chartContainer = svg.append("g")
            .attr('class', this.name.toLowerCase())
            .attr("transform", "translate(" + this.margin.left + "," + (this.margin.top + (this.height * this.id) + (20 * this.id)) + ")");

        this.chartContainer.append("path")
            .data([this.chartData])
            .attr("class", "chart")
            .attr("clip-path", "url(#clip-" + this.id + ")")
            .attr("d", this.area)
            .style("fill", colorScale(this.id));

        this.yAxis = d3.axisLeft().scale(this.yScale).ticks(5);

        this.chartContainer.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(-15,0)")
            .call(this.yAxis);

        this.chartContainer.append("text")
            .attr("class", "country-title")
            .attr("transform", "translate(300,10)")
            .text("mpts: " + this.mpts);

    }

    Chart.prototype.showOnly = function (b) {
        this.xScale.domain(b);
        this.chartContainer.select("path").data([this.chartData]).attr("d", this.area);
        this.chartContainer.select(".x.axis.top").call(this.xAxisTop);
        this.chartContainer.select(".x.axis.bottom").call(this.xAxisBottom);
    }

}


function dendrogram() {

    var margin = {
        top: 10,
        right: 0,
        bottom: 10,
        left: 0
    };

    // Size of the plot
    var width = parseInt(d3.select('#chart-dendrogram').style('width'), 10),
        height = 450;

    var h = parseFloat(d3.select(".main-content").style('height'));
    var newH = ((height / h) * 100);

    d3.select(".svg-container").style("padding-bottom", 25 + "%");
    var height = d3.select(".svg-container").node().getBoundingClientRect().height;


    var colorScale = d3.scaleSequential(d3.interpolatePlasma)

    var svg = d3.select("#chart-dendrogram").append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + (width - 70) + " " + height * newH)
        .classed("svg-content", true)
        .append("g")
        .attr("transform", "translate(35,10)");

    // Variable to hold the root of the hierarchy.
    var clusterLayout = d3.cluster()
        .size([width - 100, height])
        .separation(function separation(a, b) {
            return a.parent == b.parent ? 2 : 2;
        });

    // Maximum values for the Y axis
    var ymax = Number.MIN_VALUE;
    var ymin = Number.MAX_VALUE;

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    var data = d3.json("data/readme4.json", function (json) {
        var root = d3.hierarchy(json);

        clusterLayout(root);

        var nodes = root.descendants()

        // Finds the maximum and minimum density values.
        nodes.forEach(function (d) {
            if (d.data.y > ymax)
                ymax = d.data.y;
            if (d.data.y < ymin)
                ymin = d.data.y;
        });

        var exp = 1.0

        yScale = d3.scalePow().domain([ymin, ymax]).range([0, height - 60]).exponent(exp).clamp(true);
        yScaleInverted = d3.scalePow().domain([ymax, ymin]).range([0, height - 60]).exponent(exp).clamp(true);

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
            .attr("d", elbow);

        var node = svg.selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + yScaleInverted(d.data.y) + ")";
            });

        // Adds the shape of the nodes in the dendrogram.
        node.append("circle")
            .attr("r", 3)
            .style

        node.append("text")
            .attr("x", 0)
            .attr("y", 20)
            .style("text-anchor", "middle")
            .text(function (d) {
                return d.children ? "" : d.data.label;
            });

        // Drag Bar
        function map(num, in_min, in_max, out_min, out_max) {
            return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
        }

        var transitionTime = 75;

        // colour and extract clusters from dendogram based on threshold bar current value. 
        function clusterThresholdExtraction(currentValue) {
            var counter = 1;
            var colouring = {};
            var clusters = {}

            function traverse(d, i) {

                if (d.data.y <= currentValue) {
                    if (d.parent != null && d.parent.data.y > currentValue && d.children != null) {
                        clusters[d.data.name] = d;
                        colouring[d.data.name] = counter;
                        var childs = d.descendants();
                        for (x = 0; x < childs.length; x++) {
                            colouring[childs[x].data.name] = counter;
                        }
                        counter = counter + 2;
                    }
                }

            };

            node.each(traverse);

            colorScale.domain([0, counter]);

            link.transition()
                .duration(transitionTime)
                .attr("stroke", function (d, i) {
                    if (d.parent.data.y < currentValue) {
                        var val = colouring[d.data.name];
                        return colorScale(val);
                    }
                    return "grey";
                }).style("opacity", function (d, i) {
                    if (d.parent.data.y < currentValue) {
                        var val = colouring[d.data.name];
                        return 1;
                    }
                    return 0.3;
                });

            node.transition()
                .duration(transitionTime)
                .attr("fill", function (d, i) {
                    var val = colouring[d.data.name];
                    if (val != null) {
                        return colorScale(val);
                    }
                    return "grey";
                }).style("opacity", function (d, i) {
                    var val = colouring[d.data.name];
                    if (val != null) {
                        return 1
                    }
                    return 0.3;
                });

            return clusters;

        }

        var drag = d3.drag()
            .on('drag', function (d) {
                d3.select("body")
                    .style("cursor", "row-resize");
                var dy = d3.event.dy;
                var y1New = parseFloat(d3.select(this).attr('y1')) + dy;
                var y2New = parseFloat(d3.select(this).attr('y2')) + dy;
                d3.select(this)
                    .attr("y1", function () {
                        if (y1New < 0) {
                            return 0;
                        } else if (y1New > height - 60) {
                            return height - 60;
                        } else {
                            return y1New
                        }
                    })
                    .attr("y2", function () {
                        if (y2New < 0) {
                            return 0;
                        } else if (y2New > height - 60) {
                            return height - 60;
                        } else {
                            return y2New
                        }
                    });

                var lineScale = d3.scalePow().domain([height - 60, 0]).range([ymin, ymax]).exponent(exp).clamp(true);
                //                var currentValue = map(y1New, height - 60, 0, ymin, ymax);
                var currentValue = lineScale(y1New);
                d3.select("#slider").property("value", function () {
                    return currentValue;
                });
                clusters = clusterThresholdExtraction(currentValue);
            })
            .on("end", function () {
                d3.select("body")
                    .style("cursor", "auto");
            })


        // Threshold Bar
        var thresholdBar = svg.append("g");

        thresholdBar.append("line")
            .attr("x1", 0)
            .attr("y1", yScaleInverted(hardcodeline))
            .attr("x2", width - margin.left - margin.right - 100) // Dynamic size of the bar
            .attr("y2", yScaleInverted(hardcodeline))
            .call(drag)
            .on("mousedown", function () {
                d3.select("body")
                    .style("cursor", "row-resize");
            })
            .on("mouseup", function () {
                d3.select("body")
                    .style("cursor", "auto");
            });

        d3.select("#slider")
            .property("min", ymin)
            .property("max", ymax)
            .attr("step", (ymax - ymin) / 1000)
            .property("value", hardcodeline)
            .text(function () {
                clusterThresholdExtraction(this.value);
                return this.value;
            });

        // Link the threshold bar to the slider.
        d3.select("#slider").on("input", function () {
            var currentValue = this.value;
            thresholdBar.select("line").attr("y1", y1 => yScaleInverted(currentValue))
            thresholdBar.select("line").attr("y2", y2 => yScaleInverted(currentValue))
            console.log(currentValue, yScaleInverted(currentValue));
            clusters = clusterThresholdExtraction(currentValue);

        });

        d3.select("#slider").on("change", function () {
            displayText = "";
            Object.keys(clusters).forEach(function (key) {
                displayText = displayText + clusters[key].data.name + ", ";
            });
            d3.select("#medoids").select('span').html(displayText);
        })

        var yAxis = d3.axisLeft().scale(this.yScaleInverted).ticks(5);

        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(0,0)")
            .call(yAxis);

    });

    // Transform this into a path
    function elbow(d, i) {
        return "M" + d.parent.x + "," + yScaleInverted(d.parent.data.y) +
            "H" + d.x + "V" + yScaleInverted(d.data.y);
    }

}

function dendrogram2() {
    var margin = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    };

    // Size of the plot
    var width = parseInt(d3.select('#chart-dendrogram').style('width'), 10) - margin.left - margin.right,
        height = 450;

    var colorScale = d3.scaleSequential(d3.interpolatePlasma)
        .domain([1, 6]);

    var h = parseFloat(d3.select("#panel1").style('height'));
    var newH = ((height / h) * 100);

    d3.select(".svg-container").style("padding-bottom", newH + "%");

    var svg = d3.select("#chart-dendrogram").append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + width + " " + height * newH)
        .classed("svg-content", true)
        .append("g")
        .attr("transform", "translate(60,30)");

    // Variable to hold the root of the hierarchy.
    var clusterLayout = d3.cluster()
        .size([width - 100, height])
        .separation(function separation(a, b) {
            return a.parent == b.parent ? 2 : 2;
        });

    // Maximum values for the Y axis
    var ymax = Number.MIN_VALUE;
    var ymin = Number.MAX_VALUE;

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    var data = d3.json("data/readme3.json", function (json) {
        var root = d3.hierarchy(json);

        clusterLayout(root);

        var nodes = root.descendants()

        // Finds the maximum and minimum density values.
        nodes.forEach(function (d) {
            if (d.data.y > ymax)
                ymax = d.data.y;
            if (d.data.y < ymin)
                ymin = d.data.y;
        });

        // Creates the scale of the Dendrogram. Use yScaleInverted(x) for inverted.
        yScale = d3.scaleLinear().domain([ymin, ymax]).range([0, height - 60]);
        yScaleInverted = d3.scaleLinear().domain([ymax, ymin]).range([0, height - 60]);

        var hardcodeline = ymax / 2

        var link = svg.selectAll(".link")
            .data(nodes.slice(1))
            .enter().append("path")
            .attr("class", "link")
            .attr("d", elbow)
            .attr("stroke", "grey")
            .style("opacity", 0.3);

        var node = svg.selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("fill", "grey")
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + yScaleInverted(d.data.y) + ")";
            });

        // Adds the shape of the nodes in the dendrogram.
        node.append("circle")
            .attr("r", 3.5)
            .style("opacity", 0.3)


        node.append("text")
            .attr("x", 0)
            .attr("y", 20)
            .style("text-anchor", "middle")
            .text(function (d) {
                return d.children ? "" : d.data.label;
            });

        /*d3.select("#chart-dendrogram").on('mousemove', function () {
            var cursor = d3.mouse(this);
            node.attr("fill", function(d, i){
                if(cursor[0] == d.data.x && cursor[1] == d.data.y){
                    return "red";
                }
            })

        });*/

        // Define the div for the tooltip
        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);


        clusters = {}
        last = {}

        node.on("mouseover", function (d) {
                last[d.data.name] = [d3.select(this).style("opacity"), d3.select(this).style("fill")];
                d3.select(this).attr("fill", "red").style("opacity", 1);
                div.transition()
                    .duration(200)
                    .style("opacity", 1.0);

                if (d.data.name) {
                    displayText = d.data.name;
                } else {
                    displayText = d.label;
                }

                div.html(displayText)
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY) + "px");
            })
            .on("mouseout", function (d) {
                d3.select(this).style("opacity", last[d.data.name][0]).attr("fill", last[d.data.name][1]);
                div.transition()
                    .duration(500)
                    .style("opacity", 0);

            }).on("click", function (d) {
                if (d.children == null) {
                    return;
                }

                if (clusters[d.data.name]) {
                    childs = d.descendants();
                    delete clusters[d.data.name];
                    for (x = 0; x < childs.length; x++) {
                        delete colouring[childs[x].data.name];
                    }
                } else {

                    selected = d;
                    children = d.descendants();
                    parents = d.ancestors();
                    parent = d.parent;
                    colouring = {}

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

                // label nodes with the color colors
                counter = 1;
                Object.keys(clusters).forEach(function (key) {
                    childs = clusters[key].descendants().slice(1);
                    for (y = 0; y < childs.length; y++) {
                        colouring[childs[y].data.name] = counter;
                    }
                    counter++;
                });

                console.log(clusters);

                // adjust color scale to match number of selection
                colorScale = d3.scaleSequential(d3.interpolatePlasma)
                    .domain([1, Object.keys(clusters).length + 1]);

                // fill node circles with color
                node.transition()
                    .duration(200)
                    .attr("fill", function (d, i) {
                        val = colouring[d.data.name];
                        return colorScale(val);
                    }).style("opacity", function (d, i) {
                        val = colouring[d.data.name];
                        if (val) {
                            return 1;
                        }
                        return 0.3
                    });

                // change node link colors
                link.transition()
                    .duration(200)
                    .attr("stroke", function (d, i) {
                        val = colouring[d.data.name];
                        if (val) {
                            return colorScale(val);
                        }
                        return "grey";
                    }).style("opacity", function (d, i) {
                        val = colouring[d.data.name];
                        if (val) {
                            return 1;
                        }
                        return 0.3
                    });

                displayText = "";
                Object.keys(clusters).forEach(function (key) {
                    displayText = displayText + clusters[key].data.name + ", ";
                });
                d3.select("#medoids").select('span').html(displayText);
            });


        var yAxis = d3.axisLeft().scale(this.yScaleInverted).ticks(5);

        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(0,0)")
            .call(yAxis);

    });

    // Transform this into a path
    function elbow(d, i) {
        return "M" + d.parent.x + "," + yScaleInverted(d.parent.data.y) +
            "H" + d.x + "V" + yScaleInverted(d.data.y);
    }

}

function HAIPlot() {

    var width = parseInt(d3.select('#hai-plot').style('width'), 10),
        height = width,
        gridSize = Math.floor(width / 50),
        haiRange = 0,
        datasets = ["data/matrix_sim.csv", "data/data.tsv"];

    var heatmapChart = function (tsvFile) {
        d3.tsv(tsvFile,
            function (d) {
                return {
                    day: +d.day,
                    hour: +d.hour,
                    value: +d.value
                };
            },
            function (error, data) {

                var minValue = d3.min(data, function (d) {
                    return d.value;
                });

                var maxValue = d3.max(data, function (d) {
                    return d.value;
                });

                var haiRange = d3.max(data, function (d) {
                    return d.hour;
                });

                labels = [];
                for (var i = 0; i < (haiRange + 1); i++) {
                    labels.push(i);
                }

                d3.select("#hai-plot.svg-container").style("padding-bottom", 100 + "%");
                var height = d3.select("#hai-plot.svg-container").node().getBoundingClientRect().height;

                var svg = d3.select("#hai-plot").append("svg")
                    .attr("preserveAspectRatio", "xMinYMin meet")
                    .attr("viewBox", "0 0 " + (width+20) + " " + height+100)
                    .classed("svg-content", true)
                    .append("g")
                    .attr("transform", "translate(" + 35 + "," + 30 + ")");

                var HeatMapxScale = d3.scaleLinear()
                    .range([gridSize / 2, (haiRange + 0.5) * gridSize])
                    .domain([d3.min(labels), d3.max(labels)]);

                // Define x-axis
                var HeatMapxAxisLeft = d3.axisLeft()
                    .ticks(10)
                    .scale(HeatMapxScale);

                var HeatMapxAxisTop = d3.axisTop()
                    .ticks(10)
                    .scale(HeatMapxScale);

                // Set up X axis Left
                svg.append("g")
                    .attr("class", "axis-heatmap")
                    .attr("transform", "translate(" + -10 + "," + -gridSize + ")")
                    .call(HeatMapxAxisLeft);

                // Set up X axis Top
                svg.append("g")
                    .attr("class", "axis-heatmap")
                    .attr("transform", "translate(" + -gridSize + "," + -10 + ")")
                    .call(HeatMapxAxisTop);

                // Define the div for the tooltip
                var div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);


                var colorScale = d3.scaleSequential(d3.interpolateViridis)
                    .domain([minValue, maxValue]);

                var cards = svg.selectAll(".hour")
                    .data(data, function (d) {
                        return d.day + ':' + d.hour;
                    });

                cards.append("title");

                cards.enter().append("rect")
                    .attr("x", function (d) {
                        return (d.hour - 1) * gridSize;
                    })
                    .attr("y", function (d) {
                        return (d.day - 1) * gridSize;
                    })
                    .attr("width", gridSize)
                    .attr("height", gridSize)
                    .style("fill", function (d) {
                        return colorScale(d.value);
                    })
                    .on("mouseover", function (d) {
                        d3.select(this).style("fill", "#ffffff");
                        div.transition()
                            .duration(200)
                            .style("opacity", 1.0);
                        div.html(d.hour + " " + d.day + "  <br> " + d.value)
                            .style("left", (d3.event.pageX + 10) + "px")
                            .style("top", (d3.event.pageY) + "px");
                    })
                    .on("mouseout", function (d) {
                        d3.select(this).style("fill", function (d) {
                            return colorScale(d.value);
                        });
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });

                cards.transition().duration(1000)
                    .style("fill", function (d) {
                        return colorScale(d.value);
                    });

                cards.select("title").text(function (d) {
                    return d.value;
                });

                cards.exit().remove();

                // ------------------------------------------------------------------------------

                // Scale for workingtime
                var countScale = d3.scaleLinear()
                    .domain([minValue, maxValue])
                    .range([0, width]);

                // Calculate variables for the temp gradient
                var numStops = 10;
                var countRange = countScale.domain();
                // index 2 is the substraction between max and min
                countRange[2] = countRange[1] - countRange[0];
                var countPoint = [];

                for (var i = 0; i < numStops; i++) {
                    countPoint.push(i * countRange[2] / (numStops - 1) + countRange[0]);
                }
            
                svg = d3.select("#hai-plot.svg-container");

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
                        return countScale(countPoint[i]) / width;
                    })
                    .attr("stop-color", function (d, i) {
                        return colorScale(countPoint[i]);
                    });

                var legendWidth = Math.min(width * 0.8, 400);

                // Color Legend container
                var legendsvg = svg.append("g")
                    .attr("class", "legendWrapper")
                    .attr("transform", "translate(" + width * 0.405 + "," + (height + 20) + ")");

                // Append title
                legendsvg.append("text")
                    .attr("class", "legendTitle")
                    .attr("x", 0)
                    .attr("y", 30)
                    .style("text-anchor", "middle");
                // .text("Number of times I started to work");

                // Draw the Rectangle
                legendsvg.append("rect")
                    .attr("class", "legendRect")
                    .attr("x", -legendWidth / 2)
                    .attr("y", 50)
                    .attr("width", legendWidth)
                    .attr("height", 10)
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
                    .attr("transform", "translate(0," + 0 + ")")
                    .call(xAxis);

            });

    };

    heatmapChart(datasets[0]);


}

function ReachabilityPlot() {

    var colorScale = d3.scaleSequential(d3.interpolateWarm)
        .domain([0, 11]);

    var margin = {
            top: 20,
            right: 20,
            bottom: 30,
            left: 40
        },
        width = parseInt(d3.select('#chart-dendrogram').style('width'), 10) - margin.left - margin.right,
        height = 345 - margin.top - margin.bottom;

    var x = d3.scaleLinear()
        .range([5, width]);

    var y = d3.scaleLinear()
        .range([height, 0]);

    var xAxis = d3.axisBottom(x);

    var yAxis = d3.axisLeft(y);
    // .ticks(10, "%");

    var svg = d3.select("#reachability-plot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.tsv("../../data/linetemplate2.csv", type, function (error, data) {
        if (error) throw error;

        x.domain([0, data.length]);
        y.domain([0, d3.max(data, function (d) {
            return d.reachability;
        })]);

        var barWidth = width / data.length;

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Distance");

        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function (d, i) {
                return x(i);
            })
            .attr("width", barWidth)
            .attr("y", function (d) {
                return y(d.reachability);
            })
            .attr("height", function (d) {
                return height - y(d.reachability);
            })
            .style("fill", function (d) {
                if (d.label == 0) {
                    return "#000000";
                }
                return colorScale(d.label);
            });
    });

    function type(d) {
        d.reachability = +d.reachability;
        return d;
    }
}

// select which dendogram to draw based on option selected
function dendoSelect(a) {
    if (a.checked) {
        option = a.value;
        if (option == 'bar') {
            dendrogram();
        } else if (option == 'manual') {
            dendrogram2();
        } else if (option == 'fosc') {
            dendrogram();
        }
    }
}

// set dendogram initially 
d3.selectAll("input").each(function (d, i) {
    dendoSelect(this)
})

// set dendogram when radio buttons changed
d3.selectAll("input[name='radio']").on("change", function (d, i) {
    d3.select("#chart-dendrogram").select("svg").remove();
    dendoSelect(this)
})


HAIPlot()
//MultiReachabilityPlots()
//ReachabilityPlot()
