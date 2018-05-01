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
    var width = parseInt(d3.select('#chart-dendrogram').style('width'), 10) - margin.left - margin.right,
        height = 450;

    var colorScale = d3.scaleSequential(d3.interpolatePlasma)
        .domain([1, 3]);

    var svg = d3.select("#chart-dendrogram").append("svg")
        .attr("width", width)
        .attr("height", height)
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

    // var partitioning = [1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 0, 0, 0, 5, 5, 5, 5, 5, 5, 0];

    /*var partitioning = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 5, 5, 5, 5, 5, 5, 0]*/

    var partitioning = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5, 5, 5, 5, 5, 5, 5, 5]
    
    /*var partitioning = [0]*/


    function setColor(d) {

        if (d.children) {
            var childrenLabels = []

            var i = 0;

            for (i = 0; i < d.children.length; i++) {
                childrenLabels.push(setColor(d.children[i]));
            }

            // If this is true, then all children have been coloured the same.
            if (!!childrenLabels.reduce(function (a, b) {
                    return (a === b) ? a : NaN;
                })) {
                d.color = childrenLabels[0];
            } else {
                d.color = 0;
            }
        } else {
            d.color = partitioning[d.data.name];
        }

        return d.color;

    }

    var data = d3.json("../../data/readme3.json", function (json) {
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

        console.log(ymax, ymin);

        setColor(root);

        // Creates the scale of the Dendrogram. Use yScaleInverted(x) for inverted.
        yScale = d3.scaleLinear().domain([ymin, ymax]).range([0, height - 60]);
        yScaleInverted = d3.scaleLinear().domain([ymax, ymin]).range([0, height - 60]);

        var hardcodeline = ymax / 2

        var link = svg.selectAll(".link")
            .data(nodes.slice(1))
            .enter().append("path")
            .attr("class", "link")
            .attr("d", elbow)
            .attr("stroke", function (d, i) {
                if (d.parent.data.y < hardcodeline) {
                    return colorScale(d.color);
                } else {
                    return "grey";
                }
            });

        var node = svg.selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + yScaleInverted(d.data.y) + ")";
            });

        // Adds the shape of the nodes in the dendrogram.
        node.append("circle")
            .attr("r", 3.5);

        node.append("text")
            .attr("x", 0)
            .attr("y", 20)
            .style("text-anchor", "middle")
            .text(function (d) {
                return d.children ? "" : d.data.label;
            });

        function map(num, in_min, in_max, out_min, out_max) {
            return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
        }

        var drag = d3.drag()
            .on('drag', function (d) {
                // move circle
                var dy = d3.event.dy;
                var y1New = parseFloat(d3.select(this).attr('y1')) + dy;
                var y2New = parseFloat(d3.select(this).attr('y2')) + dy;
                d3.select(this)
                    .attr("y1", function(){
                    if(y1New < -5){
                        return -5;
                    } else if (y1New > height - 60){
                        return height - 60;
                    } else {
                        return y1New
                    }
                })
                    .attr("y2", function() {
                    if(y2New < -5){
                        return -5;
                    } else if (y2New > height - 60){
                        return height - 60;
                    } else {
                        return y2New
                    }
                });
                console.log(d3.event.y);
                var currentValue = map(y1New, height-60, 0, ymin, ymax);
                link.attr("stroke", function (d, i) {
                    if (d.parent.data.y < currentValue) {
                        return colorScale(d.color);
                    } else {
                        return "grey";
                    }
                });
            })
            .on('end', function () {

            });


        // Threshold Bar
        var thresholdBar = svg.append("g")
            .attr("transform", "translate(0,0)");

        thresholdBar.append("line")
            .attr("x1", 0)
            .attr("y1", yScaleInverted(hardcodeline))
            .attr("x2", width - margin.left - margin.right - 100) // Dynamic size of the bar
            .attr("y2", yScaleInverted(hardcodeline))
            .call(drag);

/*        d3.select("#slider")
            .attr("min", ymin)
            .attr("max", ymax)
            .attr("step", (ymax - ymin) / 1000)
            .attr("value", hardcodeline)
            .text(this.value);

        // Link the threshold bar to the slider.
        d3.select("#slider").on("input", function () {
            var currentValue = this.value;
            thresholdBar.select("line").attr("y1", y1 => yScaleInverted(currentValue))
            thresholdBar.select("line").attr("y2", y2 => yScaleInverted(currentValue))
            link.attr("stroke", function (d, i) {
                console.log(currentValue);
                if (d.parent.data.y < currentValue) {
                    return colorScale(d.color);
                } else {
                    return "grey";
                }
            });

        });*/

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
    var margin = {
            top: 60,
            right: 60,
            bottom: 60,
            left: 60
        },
        width = parseInt(d3.select('#hai-plot').style('width'), 10) - margin.left - margin.right,
        height = width - margin.top - margin.bottom,
        gridSize = Math.floor(width / 50),
        datasets = ["../../data/matrix_sim.csv", "../../data/data.tsv"];

    labels = [];
    for (var i = 2; i < 50; i++) {
        labels.push(i);
    }

    var svg = d3.select("#hai-plot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + 60)
        .append("g")
        .attr("transform", "translate(" + (margin.left + 35) + "," + margin.top + ")");

    var HeatMapxScale = d3.scaleLinear()
        .range([gridSize / 2, 47.5 * gridSize])
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
        .attr("transform", "translate(" + -25 + "," + -gridSize + ")")
        .call(HeatMapxAxisLeft);

    // Set up X axis Top
    svg.append("g")
        .attr("class", "axis-heatmap")
        .attr("transform", "translate(" + -gridSize + "," + -25 + ")")
        .call(HeatMapxAxisTop);

    // Define the div for the tooltip
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);


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
                /*                console.log("minValue: " + minValue);
                                console.log("maxValue: " + maxValue);*/
                var colorScale = d3.scaleSequential(d3.interpolateViridis)
                    .domain([minValue, maxValue]);
                // .range([minValue, maxValue]);

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
                    // .attr("rx", 2)
                    // .attr("ry", 2)
                    .attr("class", "hour bordered")
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
                    .attr("transform", "translate(" + width * 0.405 + "," + (height + 30) + ")");

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
                    .attr("transform", "translate(0," + 70 + ")")
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

HAIPlot()
MultiReachabilityPlots()
dendrogram()
ReachabilityPlot()
