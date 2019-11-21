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

            var root = d3.tree()(d3.hierarchy(data));

            var max_epsilon = root.data.birth;
            
            // console.log("max epsilon", max_epsilon);

            var f = d3.format(".2f");

            color = d3.scaleSequential(colorScale)
                .domain([0, 125]);

            var n = 125;

            var yScale = d3.scaleLinear().domain([0, max_epsilon]).range([height, 0])
            var xScale = d3.scaleLinear().domain([0, n]).range([0, width])    

            // SETUP EACH NODE'S POSITION BEFORE PLOTTING.
            root.each(function(d){
                d["x"] = xScale(d.data.points[0][2]);
                d["y"] = yScale(d.data.birth);
                // console.log(d.data.birth, d.data.death)
                // console.log(yScale(d.data.death) - yScale(d.data.birth))
            });


            // CREATES SVG.
            var svg = selection.append("svg")
                .attr("preserveAspectRatio", "xMinYMin")
                .attr("viewBox", [0, 0, width, height])
                .style("display", "block")
                .style("margin", "10 10 10 10")
                .style("background", "white")
                .style("cursor", "pointer")

            var link = svg.append("g")
                .attr("fill", "none")
                .attr("stroke", "#555")
                .attr("stroke-opacity", 0.4)
                .attr("stroke-width", 1.5)
                .selectAll("path")
                .data(root.links())
                .enter().append("path")
                .attr("d", d => elbow(d))

            // JOIN DATA.
            var node = svg.append("g")
                .selectAll("g")
                .data(root.descendants());
            
            // CREATES GROUPS CORRESPONDING TO NODES IN THE CLUSTER TREE.
            node.enter()
                .append("g")
                .attr("cluster", d => d.data.id)
                .attr("transform", d => `translate(${d.x},${d.y})`)
                .selectAll("rect")
                .data(d => d.data.points)
                    .enter()
                    .append("rect")
                    .attr("width", d => xScale(d[3]-d[2]))
                    .attr("height", d => yScale(d[1]))
                    .attr("fill", d => color(d[3]-d[2]))
                    // .attr("transform", d => `translate(${xScale(d[2])}, 0)`)
            
            console.log("UHHHHHHHHHEAH")
            console.log("IIIIIIIIIIIIIIII")

            // LOADS PARTITIONING REGARDING THE CURRENT MPTS VALUE.
            d3.text("visualization/" + mpts + "RNG_" + project + ".lr", function (data) {
                partitioning = new Set(d3.csvParseRows(data)[1].map(x => parseInt(x)));
            });
                
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

            };

            function labelSetup(label) {

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
                d3.select('#tree-plot')
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

                tree = data => {
                    var root = d3.hierarchy(data);
                    root.dx = width/2;
                    root.dy = height;
    
                    return d3.tree().nodeSize([root.dx, root.dy])(root);
                }
    
                root = tree(data);
                
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

                // UPDATE.
                updateNode
                    .call(d => nodeSetup(d))
                    .transition()
                        .duration(400)

                // UPDATE LABELS OF CLUSTERS.
                updateLabel = svg.selectAll("text")
                    .data(root.descendants())

                updateLabel.exit().remove();

                updateLabel.enter()
                    .append("text")
                    .call(d => labelSetup(d))
                    .transition()
                        .duration(400)
                
                updateLabel
                    .call(d => labelSetup(d))
                    .transition()
                    .duration(400)

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
    var chart = treeChart();
    
    chart.mpts(i);

    d3.json(get_file_url(project, i),
        function(data) {
            d3.select("#chart-tree")
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
    var u = d3.select('#tree-plot')
        .selectAll(".chart-scrollers")
        .data([...Array(max_mpts).keys()]);

    // ITERATE OVER DIVS AND ADD THE SVG PLOTS TO THEM.
    u.enter()
        .append("div")
        .classed("chart-scrollers", "true")
        .classed("nopadding", "true")
        .classed("col-xs-" + 3, "true")
        .property("id", function (d) {
            return "tree-chart-" + (d + min_mpts);
        })
        .each(function (d) {            
            d3.json(get_file_url(project, (d + min_mpts)),
                function(data) {
                    charts[(d + min_mpts)] = treeChart().mpts((d + min_mpts))
                    d3.select("#tree-chart-" + (d + min_mpts))
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

function elbow(d) {
    return "M" + d.source.x + "," + d.source.y
        + "H" + d.target.x + "V" + d.target.y;
}

chart  = drawChartTree(10)
// charts = drawMultipleTreeCharts()
