function mstChart() {
    var raw_data = [];
    var data = [];

    var vertices = [];
    var edges = [];

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
    var radius = 6.5;
    
    function my(selection) {
        selection.each(function(raw, i) {

            var map = new Map();

            data = d3.dsvFormat(" ").parseRows(raw).map(function(row) {
                if (!map.has(+row[0])) {
                    vertices.push({"id" : +row[0]});
                    map.set(+row[0], true);                   
                }
                
                if (!map.has(+row[1])) {
                    vertices.push({"id" : +row[1]});
                    map.set(+row[1], true);                   
                }

                edges.push({"source": +row[0], "target": +row[1], "weight": +row[2]})
                
                return row.map(function(value) {
                    return +value;
                });
            }); 

            // CREATES THE FORCE SIMULATION.
            var simulation = d3.forceSimulation(vertices)
                .force("charge", d3.forceManyBody(-30))
                .force("link", d3.forceLink(edges).distance(d => d.weight))
                .force("center", d3.forceCenter(width/2, height/2));

            // CREATES SVG.
            var svg = selection.append("svg")
                .attr("preserveAspectRatio", "xMinYMin slice")
                .attr("viewBox", "-300 -300 " + (width + 500) + " " + (height + 500))
                .style("display", "block")
                .style("margin", "10 10 10 10")
                .style("background", "white")
                .style("cursor", "pointer");

                // .attr("viewBox", [-width / 2, -height / 2, width, height])


            var drag = simulation => {
  
                function dragstarted(d) {
                    if (!d3.event.active) simulation.alphaTarget(0.9).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                }
                
                function dragged(d) {
                    d.fx = d3.event.x;
                    d.fy = d3.event.y;
                }
                
                function dragended(d) {
                    if (!d3.event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }
                
                return d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended);
            };

            var link = svg.append("g")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .selectAll("line")
                .data(edges)
                .enter()
                .append("line");

            var node = svg.append("g")
                .attr("fill", "#fff")
                .attr("stroke", "#000")
                .attr("stroke-width", 1.5)
                .selectAll("circle")
                .data(vertices)
                .enter()
                .append("circle")
                .attr("r", radius)
                .call(drag(simulation));

            simulation.on("tick", () => {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);
                
                node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);
            });

            // LOADS PARTITIONING REGARDING THE CURRENT MPTS VALUE.
            d3.text("visualization/" + mpts + "RNG_" + project + ".lr", function (data) {
                partitioning = new Set(d3.csvParseRows(data)[1].map(x => parseInt(x)));
            });

            function fosc() {
                
                nodes = svg.selectAll("circle");

                if(d3.select('.fosc-select input[type=checkbox]').property("checked")){
                    nodes
                        .style("visibility", d => !partitioning.has(d.id) ? "hidden" : "visible");

                } else {
                    nodes
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
                            .style("visibility", d => !partitioning.has(d.id) ? "hidden" : "visible");
                    } else {
                        nodes
                            .style("visibility", "visible");
                    }
                });
            };

            updateData = function() {

                var map = new Map();
                vertices = [];
                edges = [];

                d3.dsvFormat(" ").parseRows(data).map(function(row) {
                    if (!map.has(+row[0])) {
                        vertices.push({"id" : +row[0]});
                        map.set(+row[0], true);                   
                    }
                    
                    if (!map.has(+row[1])) {
                        vertices.push({"id" : +row[1]});
                        map.set(+row[1], true);                   
                    }
    
                    edges.push({"source": +row[0], "target": +row[1], "weight": +row[2]})
                    
                    return row.map(function(value) {
                        return +value;
                    });
                }); 
    
                
                // UPDATES COLOR SCALE.
                // color = d3.scaleSequential(colorScale)
                    // .domain([min_stability, max_stability]);

                // JOIN NODES.
                var updateNode = svg.select("g").selectAll("circle")
                    .data(vertices);                

                // EXIT.
                updateNode.exit().remove();

                // ENTER.
                updateNode.enter()
                    .append("circle")
                    .transition()
                        .duration(200);

                // UPDATE.
                updateNode
                    .attr("fill", "#fff")
                    .attr("stroke", "#000")
                    .attr("stroke-width", 1.5)
                    .selectAll("circle")
                    .data(vertices)
                    .enter()
                    .append("circle")
                    .attr("r", 6.5)
                    .call(drag(simulation));
    
                // JOIN LINKS.
                var updateLink = svg.select("g").selectAll("circle")
                    .data(edges);                
                
                // EXIT.
                updateLink.exit().remove()

                // ENTER.
                updateLink.enter()
                    .append("line");


                // CHECKS IF FOSC IS ACTIVE AND HIDES UNSELECTED NODES.
                // fosc();
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

function readMST(data) {
    var map = new Map();

    data = d3.dsvFormat(" ").parseRows(raw).map(function(row) {
        if (!map.has(+row[0])) {
            vertices.push({"id" : +row[0]});
            map.set(+row[0], true);                   
        }
        
        if (!map.has(+row[1])) {
            vertices.push({"id" : +row[1]});
            map.set(+row[1], true);                   
        }

        edges.push({"source": +row[0], "target": +row[1], "weight": +row[2]})
        
        return row.map(function(value) {
            return +value;
        });
    }); 
    
}



function drawChartMST(i) {
    var chart = mstChart();
    
    chart.mpts(i);

    d3.text("/dashboard/" + datasetId + "/msts/" + i + "RNG_" + project + ".mst", 
        function(error, data) {
            if (error) throw error;

            d3.select("#chart-mst")
                .datum(data)
                .call(chart);
        });

    $('.mpts-value input[type=number]').on("change", function () {
        
        // UPDATES THE VALUE OF MPTS CORRESPONDING TO THE CHART.
        chart.mpts(parseInt(this.value));

        // LOADS AND UPDATES THE DATA IN THE CHART.
        d3.text("/dashboard/" + datasetId + "/msts/" + chart.mpts() + "RNG_" + project + ".mst",
            function(error, data) {
                if (error) throw error;
                chart.data(data);
            });
    });

    return chart
}

function drawMultipleMSTCharts() {

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
            return "mst-chart-" + (d + min_mpts);
        })
        .each(function (d) {            
            d3.json(get_file_url(project, (d + min_mpts)),
                function(data) {
                    charts[(d + min_mpts)] = circlePacking().mpts((d + min_mpts))
                    d3.select("#mst-chart-" + (d + min_mpts))
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

chart  = drawChartMST(30)
// charts = drawMultipleCirclePacking()
