function treeChart() {
    var data = [];

    var width = 720;
    var height = 720;

    var min_id = Number.MAX_VALUE;
    var max_id = Number.MIN_VALUE;

    var min_stability = Number.MAX_VALUE;
    var max_stability = Number.MIN_VALUE;

    var updateData;
    var updatePartitioning;

    var color;

    var colorScale = d3.interpolateOrRd;

    var mpts = -1;

    var partitioning = new Set([]);

    var tip;

    function my(selection) {
        selection.each(function(data, i) {

            pack = data => d3.pack()
                .size([width, height])
                .padding(3)
            (d3.hierarchy(data)
                .sum(d => d.n)
                .sort((a, b) => b.n - a.n))


            var root = pack(data);
            var focus = root;
            var view;

            var f = d3.format(".2f");

            root.descendants().forEach(function (d) {
                min_id = Math.min(min_id, d.data.id);
                max_id = Math.max(max_id, d.data.id);

                min_stability = Math.min(min_stability, d.data.stability);
                max_stability = Math.max(max_stability, d.data.stability);                        
            });

            color = d3.scaleSequential(colorScale)
                .domain([min_stability, max_stability]);

            // CREATES SVG.
            var svg = selection.append("svg")
                .attr("preserveAspectRatio", "xMinYMin slice")
                .attr("viewBox", "-380 -380 " + (width + 50) + " " + (height + 50))
                .style("display", "block")
                .style("margin", "10 10 10 10")
                .style("background", "white")
                .style("cursor", "pointer")
                .on("click", () => zoom(root));

            // CREATES NODES OF THE PLOT.
            var node = svg.append("g")
                .selectAll("circle")
                .data(root.descendants())
                .enter()
                    .append("circle")
                    .call(d => nodeSetup(d));
  
            // CREATES LABELS.
            var label = svg.append("g")
                    .style("font", "0px sans-serif")
                    .attr("pointer-events", "none")
                    .attr("text-anchor", "middle")
                .selectAll("text")
                .data(root.descendants())
                .enter()
                .append("text")
                    .style("fill-opacity", d => d.parent === root ? 1 : 0)
                    .style("display", d => d.parent === root ? "inline" : "none")
                    .text(d => d.data.id);

            // LOADS PARTITIONING REGARDING THE CURRENT MPTS VALUE.
            d3.text("visualization/" + mpts + "RNG_" + project + ".lr", function (data) {
                partitioning = new Set(d3.csvParseRows(data)[1].map(x => parseInt(x)));
            });
    
            zoomTo([root.x, root.y, root.r * 2]);
            
            tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function(d) {
                    return "<div><span>Cluster:</span> <span style='color:white'>" + d.data.id + "</span></div>" +
                            "<div><span>#points:</span> <span style='color:white'>" + d.data.n + "</span></div>" +
                            "<div><span>Birth:</span> <span style='color:white'>" + f(d.data.birth) + "</span></div>" +
                            "<div><span>Death:</span> <span style='color:white'>" + f(d.data.death) + "</span></div>" +
                            "<div><span>Stability:</span> <span style='color:white'>" + f(d.data.stability) + "</span></div>";
                    });
            
            svg.call(tip);
            
            function nodeSetup(node) {
                node
                    .attr("fill", d => color(d.data.stability))
                    .attr("stroke", "grey")
                    .attr("id", d => (mpts + "-" + d.data.id))
                    .on("mouseover", d => highlight(d))
                    .on("mouseout", d => normal(d))
                    .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));
            };

            function labelSetup(label) {
                label
                    .style("fill-opacity", d => d.parent === root ? 1 : 0)
                    .style("display", d => d.parent === root ? "inline" : "none")
                    .text(d => d.data.id);
            };

            function zoomTo(v) {
                const k = width / v[2];

                view = v;

                label
                    .attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
                svg.select("g").selectAll("circle")
                    .attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`)
                    .attr("r", d => d.r * k);
            };

            function zoom(d) {
                const focus0 = focus;

                focus = d;

                const transition = svg.transition()
                    .duration(d3.event.altKey ? 7500 : 750)
                    .tween("zoom", d => {
                      const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                      return t => zoomTo(i(t));
                    });

                label
                  .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
                  .transition(transition)
                    .style("fill-opacity", d => d.parent === focus ? 1 : 0)
                    .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
                    .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
            };

            // MOUSEOVER EVENT.
            function highlight(d) {
                d3.json(get_transposed_file_url(project, 2, 9), 
                    function(error, data) {
                        
                        if (error) return console.error(error);

                        // TAKES CARE OF THE CHARTS REGARDING HIGHER MPTS.
                        var sequence = [d.data.id]
                        for (let k = mpts; k <= max_mpts; k++) {
                            var aux = []

                            d3.select('#chart_' + (k))
                                .filter(x => x !== selection[0])
                                .selectAll("circle")
                                .filter(x => !sequence.includes(x.data.id))
                                .transition()
                                .duration(150)
                                .ease(d3.easeLinear)
                                .style("opacity", 0.0);

                            sequence.forEach(element => {
                                aux = aux.concat(data[k][element])
                            });
                            
                            sequence = aux
                        }

                        // TAKES CARE OF THE CHARTS REGARDING LOWER MPTS.

                    });

                tip.show(d);
            };

            // MOUSEOUT EVENT.
            function normal(d) {
                d3.select('#circle-plot')
                    .selectAll("circle")
                    .transition()
                    .duration(350)
                    .ease(d3.easeCubicIn)
                    .style("opacity", 1.0);

                tip.hide(d);
            };

            function fosc() {
                
                nodes = svg.selectAll("circle");
                labels = svg.selectAll("text");
                
                if(d3.select('.fosc-select input[type=checkbox]').property("checked")){
                    nodes
                        .style("visibility", d => !partitioning.has(d.data.id) ? "hidden" : "visible");

                    labels
                        .style("visibility", d => !partitioning.has(d.data.id) ? "hidden" : "visible");
                } else {
                    nodes
                        .style("visibility", "visible");
                    labels
                        .style("visibility", "visible");

                }
            };

            // EVENT LISTENER TO IDENTIFY WHEN FOSC IS SELECTED.
            $('.fosc-select input[type=checkbox]').on("change", function() {
                fosc();
            });

            updatePartitioning = function() { 
                d3.text("visualization/" + mpts + "RNG_" + project + ".lr", function (data) {
                    var raw = d3.csvParseRows(data)[1].map(x => parseInt(x));
                    my.partitioning(new Set(raw));

                    nodes = svg.select("g").selectAll("circle");
                
                    if(d3.select('.fosc-select input[type=checkbox]').property("checked")){
                        nodes
                            .style("visibility", d => !partitioning.has(d.data.id) ? "hidden" : "visible");
                    } else {
                        nodes
                            .style("visibility", "visible");
                    }
                });
            };

            updateData = function() {

                pack = data => d3.pack()
                    .size([width, height])
                    .padding(3)
                (d3.hierarchy(data)
                    .sum(d => d.n)
                    .sort((a, b) => b.n - a.n))

                root = pack(my.data());
                
                // RESETS MINIMUM AND MAXIMUM OF ATTRIBUTES.
                min_id = Number.MAX_VALUE;
                max_id = Number.MIN_VALUE;            

                min_stability = Number.MAX_VALUE;
                max_stability = Number.MIN_VALUE;            

                // UPDATES MINIMUM AND MAXIMUM IDS OF CLUSTERS.
                root.descendants().forEach(function (d) {
                    min_id = Math.min(min_id, d.data.id)
                    max_id = Math.max(max_id, d.data.id)

                    min_stability = Math.min(min_stability, d.data.stability);
                    max_stability = Math.max(max_stability, d.data.stability);
                });

                // UPDATES COLOR SCALE.
                color = d3.scaleSequential(colorScale)
                    .domain([min_stability, max_stability]);

                // JOIN.
                var updateNode = svg.select("g").selectAll("circle")
                    .data(root.descendants());                

                // EXIT.
                updateNode.exit().remove();

                // ENTER.
                updateNode.enter()
                    .append("circle")
                    .call(d => nodeSetup(d))
                    .transition()
                        .duration(400)
                        .attr("transform", d => `translate(${(d.x - root.x)},${(d.y - root.y)})`)
                        .attr("r", d => d.r);

                // UPDATE.
                updateNode
                    .call(d => nodeSetup(d))
                    .transition()
                        .duration(400)
                        .attr("transform", d => `translate(${(d.x - root.x)},${(d.y - root.y)})`)
                        .attr("r", d => d.r);

                // UPDATE LABELS OF CLUSTERS.
                updateLabel = svg.selectAll("text")
                    .data(root.descendants())

                updateLabel.exit().remove();

                updateLabel.enter()
                    .append("text")
                    .call(d => labelSetup(d))
                    .transition()
                        .duration(400)
                        .attr("transform", d => `translate(${(d.x - root.x)},${(d.y - root.y)})`)
                
                updateLabel
                    .call(d => labelSetup(d))
                    .transition()
                    .duration(400)
                        .attr("transform", d => `translate(${(d.x - root.x)},${(d.y - root.y)})`)
                        .attr("r", d => d.r);

                // CHECKS IF FOSC IS ACTIVE AND HIDES UNSELECTED NODES.
                fosc();
            };
        });
    }

    my.data = function(value) {
    	if (!arguments.length) return data;
        data = value;
        if (typeof updateData === 'function') updateData();
    	return my;
	};

    my.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return my;
    };

    my.height = function(value) {
      if (!arguments.length) return height;
      height = value;
      return my;
    };

    my.min_id = function(value) {
      if (!arguments.length) return min_id;
      min_id = value;
      return my;
    };

    my.max_id = function(value) {
      if (!arguments.length) return max_id;
      max_id = value;
      return my;
    };

    my.min_stability = function(value) {
        if (!arguments.length) return min_stability;
        min_stability = value;
        return my;
    };
  
    my.max_stability = function(value) {
        if (!arguments.length) return max_stability;
        max_stability = value;
        return my;
    };  

    my.color = function(value) {
        if (!arguments.length) return color;
        color = value;
        return my;
      };

    my.mpts = function(value) {
        if (!arguments.length) return mpts;
        mpts = value;
        if (typeof updatePartitioning === 'function') updatePartitioning();
        return my;
    };

    my.partitioning = function(value) {
        if (!arguments.length) return partitioning;
        partitioning = value;
        return my;
    };

    return my;
}

function get_file_url(data_name, mpts) {
    return "http://localhost:8000/data/" + data_name + "/server/" + data_name + "-ct-" + mpts + ".json"
}


function get_transposed_file_url(data_name, kmin, kmax) {
    return "http://localhost:8000/data/" + data_name + "/" + data_name + "-t-" + kmin + "-" + kmax + ".json"
}


function drawChartTree(i) {
    var chart = circlePacking();
    
    chart.mpts(i);

    d3.json(get_file_url(project, i),
        function(data) {
            d3.select("#chart-circle")
                .datum(data)
                .call(chart);
        });

    $('.mpts-value input[type=number]').on("change", function () {
        
        // UPDATES THE VALUE OF MPTS CORRESPONDING TO THE CHART.
        chart.mpts(parseInt(this.value));

        // LOADS AND UPDATES THE DATA IN THE CHART.
        d3.json(get_file_url(project, chart.mpts()),
            function(data) {
                chart.data(data);
            });
    });

    return chart
}


function drawMultipleTreeCharts() {

    var min_mpts = 2;
    var max_mpts = 8;

    var charts = {};

    // ADD DIVS ACCORDING TO RANGE OF MPTS.
    var u = d3.select('#circle-plot')
        .selectAll(".chart-scrollers")
        .data([...Array(max_mpts).keys()]);

    // ITERATE OVER DIVS AND ADD THE SVG PLOTS TO THEM.
    u.enter()
        .append("div")
        .classed("chart-scrollers", "true")
        .classed("nopadding", "true")
        .classed("col-xs-" + 3, "true")
        .property("id", function (d) {
            return "chart_" + (d + min_mpts);
        })
        .each(function (d) {            
            d3.json(get_file_url(project, (d + min_mpts)),
                function(data) {
                    charts[(d + min_mpts)] = circlePacking().mpts((d + min_mpts))
                    d3.select("#chart_" + (d + min_mpts))
                        .datum(data)
                        .call(charts[(d + min_mpts)]);
                })
        })
        .property("overflow-y", "scroll")
        .append("a")
        .classed("no-link", "true")
        .attr("data-toggle", "modal")
        .attr("data-value", function(d) {
            return d;
        });

    // ADD INTERACTIVITY: FOSC.
    
    return charts;
}

var min_mpts = 2;
var max_mpts = 9;

// chart  = drawChart(2)
// charts = drawMultipleCirclePacking()
