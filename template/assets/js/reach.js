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
    var file = "data/anuran_mustache/" + (filename) + "RNG_anuran.lr"
    var bisectVal = d3.bisector(function (d) {
        return +d[1];
    }).left
    var start = 2;

    function loadLabel(callback) {

        d3.text(file, function (error, data) {
            if (error) throw error;
            barData.color = d3.csvParseRows(data)[0];

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

    width = ($(window).innerWidth() * 0.85);
    h = ($(window).innerHeight() * 0.75);

    var svg = d3.select("#full-reach").append("svg").attr("width", width).attr("height", h),
        margin = {
            top: 20,
            right: 0,
            bottom: 100,
            left: 40
        },
        margin2 = {
            top: (h - 200),
            right: 20,
            bottom: 50,
            left: 40
        },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +(h - 100) - margin.top - margin.bottom,
        height2 = +(h - 100) - margin2.top - margin2.bottom;

    var x = d3.scaleLinear().range([0, width]),
        x2 = d3.scaleLinear().range([0, width]),
        x3 = d3.scaleLinear().range([0, width]),
        x4 = d3.scaleLinear().range([0, width]),
        x5 = d3.scaleLinear().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        y2 = d3.scaleLinear().range([height2, 0]),
        y4 = d3.scalePow().range([height2, 0]).exponent(0.3),
        sf = d3.scaleLinear(),
        sf2 = d3.scaleLinear();


    var xAxis = d3.axisBottom(x).ticks(0),
        xAxis2 = d3.axisBottom(x2),
        yAxis = d3.axisLeft(y);

    var brush = d3.brushX()
        .extent([
                [0, 0],
                [width, 20]
            ])
        .on("brush", function () {
            brushed(1)
        })
        .on("end", brushEnd);

    var brush2 = d3.brushX()
        .extent([
                [0, 0],
                [width, height2]
            ])
        .on("brush", function () {
            brushed(2)
        })
        .on("end", brushEnd2);

    var area = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function (d) {
            return x(d[1]);
        })
        .y0(height)
        .y1(function (d) {
            return y(+d[0]);
        });

    var area2 = d3.area()
        .curve(d3.curveMonotoneX)
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

    var scrubber = svg.append("g")
        .attr("class", "scrubber")
        .attr("transform", "translate(" + (margin2.left) + "," + (margin2.top + height2 + 50) + ")")

    var scaleFactor;
    var barWidth = 6;
    var barPadding = 1.5;

    //        tooltip

    var highlight = svg.append("g")
        .attr("class", "highlight")
        .style("display", "none");

    highlight.append("circle")
        .attr("r", (barWidth - barPadding) / 2)
        .attr("transform", "translate(" + ((barWidth - barPadding)) + ",0)");

    highlight.append("text")
        .attr("x", 200)
        .attr("y", 50)
        .attr("dy", ".35em");

    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        //              .on("mouseover", function() { highlight.style("display", null); })
        //              .on("mouseout", function() { highlight.style("display", "none"); })
        .on("mousemove", mousemove);

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
            x.clamp(true);
            x2.clamp(true);
            x3.clamp(true);

            focus.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            focus.append("g")
                .attr("class", "axis axis--y");

            sampled = largestTriangleThreeBuckets(barData.chr, width)

            sf.domain([150, width]);
            sf.range([Math.floor(width / barWidth), barData.raw.length]);
            sf.clamp(true);

            sf2.domain([Math.floor(width / barWidth), barData.raw.length]);
            sf2.range([150, width]);
            sf2.clamp(true);

            // set the gradient
            context.append("linearGradient")
                .attr("id", "area-gradient")
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", 1).attr("y1", 0)
                .attr("x2", width).attr("y2", height2)
                .selectAll("stop")
                .data(sampled)
                .enter().append("stop")
                .attr("offset", function (d, i) {
                    return ((i / sampled.length) * 100) + "%";
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

            scrubber.append("g")
                .attr("class", "brush")
                .call(brush)
                .call(brush.move, x.range());

            d3.select(".brush").select(".overlay").remove();

            context.append("g")
                .attr("class", "brush2")
                .call(brush2)
                .call(brush2.move, x.range());

            d3.select(".brush2").select(".selection").attr("fill", "blue");

            d3.select(".brush").select(".selection").attr("source", 1);
            d3.select(".brush2").select(".selection").attr("source", 2);

        });
    }

    function brushed(type) {

        if (d3.event.sourceEvent && type == 1) {
            return;
        }
        if (d3.event.sourceEvent && type == 2) {
            return;
        }

        var factor;
        var threshold;
        var points;

        //get brush selection      
        var s = d3.event.selection;
        factor = Math.abs((s[1] - s[0]) / width);
        x5.domain(s.map(x2.invert));

        selected = s.map(x2.invert);

        barWindow = (width / barWidth);
        threshold = Math.floor(barWindow / factor);

        //sample data        
        x3.domain([0, barWindow]);
        Swindow = s.map(x3.invert);

        let minFactor = (barWindow / barData.raw.length);

        if (factor < minFactor) {
            factor = minFactor;
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
                return +d[1];
            });

        bars.exit().remove();

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

    function brushEnd() {

        focus.select(".axis--y").transition().duration(500).call(yAxis);

        if (d3.event.sourceEvent) {

            var scalar = d3.event.selection;
            var f = scalar[1] - scalar[0]

            //force minimum scale
            if (f < sf.domain()[0]) {
                f = sf.domain()[0]

                if (scalar[0] + sf.domain()[0] > sf.domain()[1]) {
                    scalar = [scalar[1] - sf.domain()[0], scalar[1]]
                } else {
                    scalar = [scalar[0], scalar[0] + sf.domain()[0]]
                }

                scrubber.select(".brush").call(brush.move, scalar);
                return;
            }
            //

            var newd = x2(sf(f));
            var offset = (f - newd)
            var k = width - f;
            var g = 0
            if (k > 0) {
                g = scalar[0] / k;
            }

            var h = [scalar[0] + (offset * g), scalar[0] + newd + (offset * g)]

            context.select(".brush2").transition().duration(500).call(brush2.move, h);

        }
    }

    function brushEnd2() {

        focus.select(".axis--y").transition().duration(500).call(yAxis);

        if (d3.event.sourceEvent) {

            var scalar = d3.event.selection;
            //            scalar = scalar.map(x2.invert)
            var f = scalar[1] - scalar[0]
            var newd = sf2(f);
            var offset = Math.abs(newd - f)
            var k = width - f;
            var g = 0
            if (k > 0) {
                g = scalar[0] / k
            }

            var h = [scalar[0] + (offset * g), scalar[0] + newd + (offset * g)]

            scrubber.select(".brush").transition().duration(500).call(brush.move, h);
        }
    }

    function mousemove() {
        var x0 = x5.invert(d3.mouse(this)[0]),
            i = bisectVal(data, x0),
            d = x0 - (i - 1) > i - x0 ? i : (i - 1);
        highlight.select("text").text(d);
    }

    var q = d3.queue();
    q.defer(loadLabel);
    q.await(function (error) {
        if (error) throw error;
        loadChart();
    });

}
