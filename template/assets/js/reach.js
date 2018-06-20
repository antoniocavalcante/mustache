function drawReach(filename, wid, hie) {

    var barData = {};
    barData.raw;
    barData.chr;
    barData.small;
    barData.color;
    barData.mapping;
    var bars;
    var barColoring = {};
    var globalColor = d3.interpolateRainbow;
    var colorScale = d3.scaleSequential(globalColor);
    var file = "data/anuran_mustache/" + filename + "RNG_anuran.lr"
    var bisectVal = d3.bisector(function (d) {
        return +d[1];
    }).left
    var barWindow;

    console.log(file);

    function loadLabel(callback) {

        d3.text(file, function (error, data) {
            if (error) throw error;
            barData.color = d3.csvParseRows(data)[0];

            console.log(barData.color);

            data = barData.color;

            console.log(data.length);

            var labels = Array.from(new Set(data), x => parseInt(x))

            labels.sort(function (a, b) {
                return a - b;
            })

            labels = labels.slice(1);

            for (let i = 0; i < labels.length; i++) {
                barColoring[labels[i]] = i;
            }

            colorScale.domain([0, Object.keys(barColoring).length]);

            callback(null);

        });
    }

    var floor = Math.floor,
        abs = Math.abs;

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

    var width = parseInt($(".modal-xl").attr("width") * 0.80),
        h = $(".modal-xl").attr("height");

    var svg = d3.select("#full-plot")
        .append("svg")
        .attr("width", width)
        .attr("height", h)
        .classed("row", "true");

    var margin = {
            top: 20,
            right: 20,
            bottom: 100,
            left: 40
        },
        margin2 = {
            top: 0,
            right: 20,
            bottom: 0,
            left: 40
        },

        width = width - margin.left - margin.right,
        height = (h - (h * 0.10)) - margin.top - margin.bottom;

    margin2.top = height

    height2 = (h * 0.10) - margin2.bottom;

    var x = d3.scaleLinear().range([0, width]),
        x2 = d3.scaleLinear().range([0, width]),
        x3 = d3.scaleLinear().range([0, width]),
        x4 = d3.scaleLinear().range([0, width]),
        x5 = d3.scaleLinear().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        y2 = d3.scaleLinear().range([height2, 0]),
        y4 = d3.scalePow().range([height2, 0]).exponent(0.3);


    var xAxis = d3.axisBottom(x).ticks(0),
        xAxis2 = d3.axisBottom(x2),
        yAxis = d3.axisLeft(y);


    var brush = d3.brushX()
        .extent([
                [0, 0],
                [width, height2]
            ])
        .on("brush", brushed)
        .on("end", brushEnd);

    var zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    var area2 = d3.area()
        .curve(d3.curveStep)
        .x(function (d) {
            return x4(+d[1]);
        })
        .y0(height2)
        .y1(function (d) {
            return y4(+d[0]);
        });

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    var focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + (margin2.top + 20) + ")");

    var barWidth = 6;
    var barPadding = 1.5;

    function loadChart() {
        d3.text(file, function (error, data) {

            if (error) throw error;

            barData.raw = d3.csvParseRows(data)[1];

            barData.chr = barData.raw.map(function (a, i) {
                return [a, i]
            });

            var data = barData.raw;

            y.domain([0, d3.max(data, function (d) {
                return +d;
            })]);
            x2.domain(d3.extent(data, function (d, i) {
                return i;
            }));

            x4.domain(x2.domain());
            x5.domain(x2.domain());

            barWindow = (width / barWidth);

            focus.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            focus.append("g")
                .attr("class", "axis axis--y");

            var sampled = largestTriangleThreeBuckets(barData.chr, width);

            // set the gradient
            context.append("linearGradient")
                .attr("id", "area-gradient")
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", 0).attr("y1", 0)
                .attr("x2", width).attr("y2", 0)
                .selectAll("stop")
                .data(sampled)
                .enter().append("stop")
                .attr("offset", function (d, i) {
                    return ((i / (width)) * 100) + "%";
                })
                .attr("stop-color", function (d) {
                    var b = barData.color[d[1]]
                    return colorScale(barColoring[b]);
                });

            context.append("path")
                .data([sampled])
                .attr("class", "area")
                .attr("d", area2)
                .style("fill", "url(#area-gradient)");

            context.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height2 + ")")
                .call(xAxis2);

            context.append("g")
                .attr("class", "brush")
                .call(brush)
                .call(brush.move, x.range());

            svg.append("rect")
                .attr("class", "zoom")
                .attr("width", width)
                .attr("height", height)
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .call(zoom);

        });

    }

    var throttled_version = _.debounce(addNewBars, 200);

    function brushed(type) {

        var factor;
        var threshold;

        //get brush selection      
        var s = d3.event.selection;
        factor = Math.abs((s[1] - s[0]) / width);
        x5.domain(s.map(x2.invert));

        selected = s.map(x2.invert);

        //sample data        
        x3.domain([0, barWindow]);
        Swindow = s.map(x3.invert);
        threshold = Math.floor(barWindow / factor);

        let minFactor = (barWindow / barData.raw.length);

        if (factor < minFactor) {
            return;
        }

        if (threshold < barData.raw.length) {
            barData.small = largestTriangleThreeBuckets(barData.chr.slice(selected), threshold);
            data = barData.small;
            points = data.length;
        } else {
            data = barData.chr;
            points = data.length;
        }

        start = Swindow[0] / factor;

        if (start > barData.raw.length - barWindow) {
            start = barData.raw.length - barWindow;
        }

        data = data.slice(start, start + barWindow);

        y.domain([0, d3.max(data, function (d) {
            return +d[0];
        })]);

        //select current bars
        bars = focus.selectAll(".bar")
            .data(data, function (d, i) {
                return d;
            });

        bars.attr("x", function (d, i) {
                return x3(i) + barPadding;
            }).transition().duration(250)
            .attr("y", function (d) {
                return y(+d[0]);
            })
            .attr("height", function (d) {
                return height - y(+d[0])
            })
            .style("fill", function (d, i) {
                var b = barData.color[d[1]]
                return colorScale(barColoring[b]);
            });

        bars.exit().remove();

        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (s[1] - s[0]))
            .translate(-s[0], 0));

    }

    function brushEnd() {

        throttled_version();
        focus.select(".axis--y").transition().duration(500).call(yAxis);

    }

    function addNewBars() {

        //add new bars   
        bars.enter().append("rect")
            .attr("class", "bar")
            .style("fill", function (d, i) {
                var b = barData.color[d[1]]
                return colorScale(barColoring[b]);
            })
            .attr("x", function (d, i) {
                return x3(i) + barPadding;
            })
            .attr("y", function (d) {
                return height;
            }).attr("width", barWidth - barPadding)
            .transition().duration(250)
            .attr("y", function (d) {
                return y(+d[0]);
            })
            .attr("height", function (d) {
                return height - y(+d[0])
            });

    }

    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return;
        var t = d3.event.transform;
        x2.domain(t.rescaleX(x2).domain());
        var window = x2.range().map(t.invertX, t);
        context.select(".brush").call(brush.move, window);
    }

    var q = d3.queue();
    q.defer(loadLabel);
    q.await(function (error) {
        if (error) throw error;
        loadChart();
    });

}
