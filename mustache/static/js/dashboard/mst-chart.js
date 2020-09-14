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

    var myColor;

    var mpts = -1;

    var partitioning = [];

    var tip;
    var radius = 15;
    
    var scaleStrength;;

    var min_weight = Number.MAX_VALUE;
    var max_weight = Number.MIN_VALUE;

    function my(selection) {
        selection.each(function(raw, i) {

            var map = new Map();

            var i = 0;

            data = d3.dsvFormat(" ").parseRows(raw).map(function(row) {
                if (!map.has(+row[0])) {
                    vertices.push({"id" : i});
                    i = i + 1;
                    map.set(+row[0], true);                   
                }
                
                if (!map.has(+row[1])) {
                    vertices.push({"id" : i});
                    i = i + 1;
                    map.set(+row[1], true);                   
                }

                min_weight = Math.min(min_weight, parseFloat(row[2]));
                max_weight = Math.max(max_weight, parseFloat(row[2]));

                edges.push({"source": +row[0], "target": +row[1], "weight": parseFloat(row[2])});
                
                return row.map(function(value) {
                    return +value;
                });
            }); 

            scaleStrength = d3.scaleLinear().range([0, 1]).domain([min_weight, max_weight]);

            var factor = 4;

            radius = Math.max(10, 100/vertices.length)

            // CREATES THE FORCE SIMULATION.
            var simulation = d3.forceSimulation(vertices)
                .force("charge", d3.forceManyBody().strength(-30))
                .force("link", d3.forceLink(edges).id(d => d.id).distance(d => scaleStrength(d.weight)))
                .force('collision', d3.forceCollide().radius(radius))
                .force("center", d3.forceCenter(width/2, height/2))
                .alphaDecay(0.001)
                .velocityDecay(0.5);

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

            // LOADS PARTITIONING REGARDING THE CURRENT MPTS VALUE.
            d3.text("visualization/" + mpts + "RNG_" + project + ".lr", function (data) {
                
                mapping = d3.csvParseRows(data)[0].map(x => parseInt(x));

                labels = d3.csvParseRows(data)[1].map(x => parseInt(x));

                for (let i = 0; i < mapping.length; i++) {
                    partitioning[mapping[i]] = labels[i];                   
                }

                var clusters = Array.from(new Set(labels), x => parseInt(x))

                clusters.sort(function (a, b) {
                    return a - b;
                })
                    
                // partitioning = labels

                for (let i = 0; i < clusters.length; i++) {
                    partitioning[partitioning == labels[i]] = i;
                }

                myColor = d3.scaleSequential(d3.interpolateInferno)
                    .domain([0, Math.max.apply(null, partitioning)]);

            });

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
                .attr("id", function(d){
                    return mpts + "-" + d.id;
                })
                .attr("r", radius)
                .call(drag(simulation));

            simulation.on("tick", ticked);

            function ticked() {
    
                var alpha = this.alpha();
                var chargeStrength;
            
                if ( alpha > 0.5 ) {
                    chargeStrength = (alpha - 0.2);
                }
                else {
                    chargeStrength = 0;
                }
            
                this.force("charge", d3.forceManyBody().strength( -10 * chargeStrength ))
                
                link
                    .attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });
            
                node
                    .attr("cx", function(d) { return d.x; })
                    .attr("cy", function(d) { return d.y; });
                    
                // validate:
                if (alpha < 0.001) {
                    link.each(function(d,i) {
                    
                        var a = d.source.x - d.target.x;
                        var b = d.source.y - d.target.y;
                        var c = Math.pow(a*a + b*b, 0.5);
                        
                        console.log("specified length: " + scaleStrength(edges[i].weight) + ", realized distance: " + c );
                    })
                }
            }
    

            function nodeSetup(node) {
                node
                    .attr("fill", d => color(d.data.stability))
                    .attr("stroke", "grey")
                    .attr("id", d => (mpts + "-" + d.data.id))
                    .on("mouseover", d => highlight(d))
                    .on("mouseout", d => normal(d))
                    .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));
            };

            function fosc() {
                
                nodes = svg.selectAll("circle");

                if(d3.select('.fosc-select input[type=checkbox]').property("checked")){
                    nodes
                        .style("fill", d => myColor(partitioning[d.id]));
                } else {
                    nodes
                        .style("fill", "white");
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
    return "/dashboard/" + datasetId + "/msts/" + i + "RNG_" + project + ".mst"
    // return "http://localhost:8000/data/" + data_name + "/server/" + data_name + "-ct-" + mpts + ".json"
}


function get_transposed_file_url(data_name, kmin, kmax) {
    return "/dashboard/" + datasetId + "/" + data_name + "-t-" + kmin + "-" + kmax + ".json"
    // return "http://localhost:8000/data/" + data_name + "/" + data_name + "-t-" + kmin + "-" + kmax + ".json"
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
    var max_mpts = 16;

    var charts = {};

    // ADD DIVS ACCORDING TO RANGE OF MPTS.
    var u = d3.select('#mst-plot')
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
            d3.text("/dashboard/" + datasetId + "/msts/" + (d + min_mpts) + "RNG_" + project + ".mst",
                function(error, data) {
                    if (error) throw error;

                    charts[(d + min_mpts)] = mstChart().mpts((d + min_mpts))
                    d3.select("#mst-chart-" + (d + min_mpts))
                        .datum(data)
                        .call(charts[(d + min_mpts)]);
                })
        })
        .insert("p").text(function (d) {
            return "mpts: " + (d + min_mpts);
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

chart  = drawChartMST(2)
charts = drawMultipleMSTCharts()
