function drawReach(filename) {

    var barData = {};
    barData.raw;
    barData.chr;
    barData.small;
    barData.color;
    barData.mapping;
    var bars;
    var barColoring;
    var globalColor = d3.interpolateRainbow;
    var colorScale = d3.scaleSequential(globalColor);
    var file = "data/ra/" + filename + "RNG_anuran.lr"
    var barWindow;

    function panelSetup() {

        $("#myreach").find('.modal-title').text('Chart ' + filename);

        leaves = d3.selectAll(".node").filter(function (d) {
            return d.children == null;
        });

        leaves = leaves.sort(function (a, b) {
            return (+a.data.label) - (+b.data.label);
        });

        dropdown = d3.select("#myreach").select(".dropdown-menu");

        dropdown.selectAll("li").remove();

        leaves.each(function (d) {
            if (d.data.label == filename) {
                dropdown.append("li")
                    .classed("full-reach-page", "true")
                    .classed("active", "true")
                    .append("a").attr("href", "#")
                    .html(+d.data.label);
            } else {
                dropdown.append("li")
                    .classed("full-reach-page", "true")
                    // .classed("disabled", "true")
                    .append("a").attr("href", "#")
                    .html(+d.data.label);
            }
        })

        d3.selectAll(".full-reach-page").on("click", function () {
            selection = d3.select(this).select("a").html();
            update(selection);
        })


        d3.selectAll(".full-reach-arrow").on("click", function () {
            shift = d3.select(this).attr("data-val");
            selection = (+shift) + (+filename)
            leaves.each(function (d) {
                if (+d.data.label == selection) update(selection);
            })
        })
    }

    function loadLabel(callback) {

        d3.text(file, function (error, data) {
            if (error) throw error;

            barData.color = d3.csvParseRows(data)[1];
            barData.mapping = d3.csvParseRows(data)[0];

            barColoring = {};

            data = barData.color;

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

    var width = parseInt($(".modal-xl").attr("width") * (10 / 12)),
        h = $(".modal-xl").attr("height");

    var svg = d3.select("#full-plot")
        .append("svg")
        .attr("width", width)
        .attr("height", h);

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
        height = h - margin.top - margin.bottom;

    margin2.top = height

    height2 = (h * 0.08) - margin2.bottom;

    var x = d3.scaleLinear().range([0, width]),
        x2 = d3.scaleLinear().range([0, width]),
        x3 = d3.scaleLinear().range([0, width]),
        x4 = d3.scaleLinear().range([0, width]),
        x5 = d3.scaleLinear().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        y2 = d3.scaleLinear().range([height2, 0]),
        y4 = d3.scalePow().range([height2, 0]).exponent(0.3),
        xtip = d3.scaleLinear().domain([0, width]);


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
        .translateExtent([
            [0, 0],
            [width, height]
        ])
        .extent([
            [0, 0],
            [width, height]
        ])
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

    // svg.call(zoom);

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

    svg.append("rect")
        .attr("class", "zoom")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(zoom)
        .on("mousemove", function () {
            v = d3.mouse(this);
            sel = Math.floor(xtip(v[0]));
            d3.selectAll(".bar").style("fill", function (d, i) {

                if (i == sel) {
                    j = barData.mapping.indexOf(String(d[1]));

                    region = d3.select(".tooltip-region")
                    values = region.selectAll(".tip-values").data([i]);
                    data = region.selectAll(".tip-data").data([i]);

                    values.each(function () {
                        vals = d3.select(this).selectAll("span").data(ids[j]);

                        vals.enter().append("span").attr("class", "tip-text").html(function (d) {
                            return d;
                        }).append("br");

                        vals.html(function (d) {
                            return d;
                        }).append("br");

                        vals.exit().remove();

                    })

                    values.exit().remove();

                    data.each(function () {
                        vals = d3.select(this).selectAll("h5").data([{
                            label: "Value: ",
                            value: d[0]
                        }, {
                            label: "Index: ",
                            value: d[1]
                        }]);

                        vals.enter().append("h5").html(function (d) {
                            return d.label;
                        }).append("span").attr("class", "tip-text").html(function (d) {
                            return d.value;
                        });

                        vals.html(function (d) {
                            return d.label;
                        }).append("span").attr("class", "tip-text").html(function (d) {
                            return d.value;
                        });

                        vals.exit().remove();

                    })

                    data.exit().remove();

                    region.select("#tip-color").style("background-color", function () {
                        var b = barData.color[d[1]]
                        return colorScale(barColoring[b]);
                    });

                    var b = barData.color[d[1]]
                    if (b == 0) {
                        return "orange";
                    } else {
                        return d3.rgb(colorScale(barColoring[b])).darker(3);
                    }

                } else {

                    var b = barData.color[d[1]]
                    return colorScale(barColoring[b]);
                }
            });

            // .attr("fill-opacity", function (d, i) {
            //     if (i == sel) {
            //         return 1.0;
            //     } else {
            //         return 0.3;
            //     }
            // })
        })
        .on("mouseout", function () {
            d3.select(".tooltip-region").selectAll(".tip-text").remove();
            d3.select(".tooltip-region").select("#tip-color").style("background-color", "#cccccc")
            d3.selectAll(".bar").style("fill", function (d, i) {
                var b = barData.color[d[1]]
                return colorScale(barColoring[b]);
            });
        })


    var barWidth = 6;
    var barPadding = 1.5;

    function loadChart() {
        d3.text(file, function (error, data) {

            if (error) throw error;

            barData.raw = d3.csvParseRows(data)[2];

            barData.chr = barData.raw.map(function (d, i) {
                return [d, i]
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

            xtip.range([0, barWindow]);

            focus.append("g")
                .attr("class", "axis axis--y");

            var sampled = largestTriangleThreeBuckets(barData.chr, width);

            context.selectAll("#area-gradient").remove();

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

            var mini = context.selectAll(".area").data([sampled])

            mini.enter().append("path")
                .attr("class", "area")
                .attr("d", area2)
                .style("fill", "url(#area-gradient)")

            mini.transition().duration(500).attr("d", area2)
                .style("fill", "url(#area-gradient)")

            mini.exit().remove();

            context.selectAll(".axis--x").remove();

            context.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height2 + ")")
                .call(xAxis2);

            context.selectAll(".brush").remove();

            context.append("g")
                .attr("class", "brush")
                .call(brush)
                .call(brush.move, x.range());

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

        let minFactor = (barWindow / barData.raw.length);

        if (factor < minFactor) {
            factor = minFactor;
        }

        threshold = Math.floor(barWindow / factor);

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

        throttled_version();

        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (s[1] - s[0]))
            .translate(-s[0], 0));

    }

    function brushEnd() {

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

    function update(a) {
        filename = a;
        file = "data/ra/" + filename + "RNG_anuran.lr"
        panelSetup();
        var q = d3.queue();
        q.defer(loadLabel);
        q.await(function (error) {
            if (error) throw error;
            loadChart();
        });
    }

    panelSetup();
    var q = d3.queue();
    q.defer(loadLabel);
    q.await(function (error) {
        if (error) throw error;
        loadChart();
    });

}