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

    var colorScale = d3.interpolateWarm;

    var mpts = -1;

    var partitioning = [];

    var tip;

    var myColor;

    function my(selection) {
        selection.each(function(data, i) {

            var root = d3.tree()(d3.hierarchy(data));
            
            var max_epsilon = root.data.birth;
            var min_epsilon = d3.min(root.leaves(), 
                function(d) {
                    return d.data.death;
                });
            
            var f = d3.format(".2f");

            // READS THE NUMBER OF POINTS IN THE DATA.
            var n = root.data.n;

            root.descendants().forEach(function (d) {
                min_id = Math.min(min_id, d.data.id);
                max_id = Math.max(max_id, d.data.id);

                min_stability = Math.min(min_stability, d.data.stability);
                max_stability = Math.max(max_stability, d.data.stability);


                d.data.selected = false;
            });
            
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
            
            color = d3.scaleSequential(colorScale)
                .domain([min_stability, max_stability]);
            
            // CREATES SVG.
            var svg = selection.append("svg")
                .attr("preserveAspectRatio", "xMinYMin")
                .attr("viewBox", [0, 0, width, height])
                .style("display", "block")
                .style("margin", "10 10 10 10")
                .style("background", "white")
                .style("cursor", "pointer")

            // SORTS NODES IN ORDER OF DEPTH TO MAKE CHILDREN ALWAYS COME FIRST 
            // THAN THEIR PARENTS IN THE ARRAY.
            var leaves = root.leaves()
            var nodes  = root.descendants().sort((a, b) => b.depth - a.depth)

            // JOINS DATA.
            var node = svg.append("g")
                .attr("id", "clusters")
                .selectAll("g")
                .data(nodes);
            
            // GETS THE NUMBER OF LEAVES IN THE TREE
            var nleaves = root.leaves().length
            
            var widthleaves = d3.sum(root.leaves(), 
                function(d) {
                    return d.data.n
                });
                        
            var min_node_size = 1;
            var max_node_size = width/6;

            // DEFINES THE SCALES NECESSARY TO PLOT THE CONDENSED TREE.
            var yScale = d3.scaleLinear()
                        .domain([min_epsilon, max_epsilon])
                        .range([height, 0])
            
            var widthScale = d3.scaleLinear()
                        .domain([1, n])
                        .range([min_node_size, max_node_size])
            
            var separation = ((width - widthScale(widthleaves))/(nleaves + 1))*0.95
            var offset = separation

            leaves.forEach(function(d) {
                d.x = offset
                offset += widthScale(d.data.n) + separation
            });

            nodes.forEach(function(d) {                
                if (d.children) {
                    d.x = 0
                    d.children.forEach(function(c) {d.x += c.x})
                    d.x = d.x/d.children.length
                }
            });

            // CREATES GROUPS CORRESPONDING TO NODES IN THE CLUSTER TREE.
            node.enter()
                .append("g")
                .attr("class", "cluster")
                .attr("title", function(d) {
                    return "<div><span>Cluster:</span> <span style='color:white'>" + d.data.id + "</span></div>" +
                            "<div><span>#points:</span> <span style='color:white'>" + d.data.n + "</span></div>" +
                            "<div><span>Birth:</span> <span style='color:white'>" + f(d.data.birth) + "</span></div>" +
                            "<div><span>Death:</span> <span style='color:white'>" + f(d.data.death) + "</span></div>" +
                            "<div><span>Stability:</span> <span style='color:white'>" + f(d.data.stability) + "</span></div>";
                    })
                .call(d => nodeSetup(d))
                .attr("cluster", d => d.data.id)
                .attr("transform", d => `translate(${d.x}, ${d.y})`)
                .attr("stability", d => d.data.stability)
                .selectAll("rect")
                .data(d => d.data.points)
                    .enter()
                    .append("rect")
                    .attr("width", function(d) {
                        return widthScale(d[3] - d[2] + 1);
                    })
                    .attr("height", d => yScale(d[1]) - yScale(d[0]) + 1)
                    .attr("fill", function(d) {
                        return color(d3.select(this.parentNode).attr("stability"));
                    })
                    .attr("transform", d => `translate(0, ${yScale(d[0])})`);

            
            var link = svg.append("g")
                .attr("id", "links")
                .attr("fill", "none")
                .attr("stroke", "#555")
                .attr("stroke-opacity", 0.4)
                .attr("stroke-width", 1.5)
                .selectAll("path")
                .data(root.links())
                    .enter().append("path")
                    .attr("d", function(d) {
                        return "M" + d.source.x + "," + yScale(d.source.data.death)
                            + "H" + d.target.x + "V" + yScale(d.target.data.birth);
                    })
    

            // LOADS PARTITIONING REGARDING THE CURRENT MPTS VALUE.
            d3.text("visualization/" + mpts + "RNG_" + project + ".lr", function (data) {
                partitioning = new Set(d3.csvParseRows(data)[1].map(x => parseInt(x)));
            });
            
            function nodeSetup(node) {
                node
                    .on("mouseover", d => highlight(d))
                    .on("mouseout", d => normal(d))
                    .on("click",    d => mouseclick(d));

                // ADDS A TOOLTIP TO THIS NODE.
                tippy('.cluster', {
                    placement: 'bottom',
                    flip: false,
                    inlinePositioning: false,
                });
            };

            function labelSetup(label) {

            };

            // MOUSEOVER EVENT.
            function highlight(d) {
                d3.json(get_transposed_file_url(project, 2, 50), 
                    function(error, data) {
                        
                        if (error) return console.error(error);

                        // TAKES CARE OF THE CHARTS REGARDING HIGHER MPTS.
                        var sequence = [d.data.id]
                        for (let k = mpts; k <= max_mpts; k++) {
                            var aux = []

                            var charts = d3.select('#tree-chart-' + (k))
                                        .filter(x => x !== selection[0])

                            charts
                                .selectAll("#clusters")
                                .selectAll("g")
                                .filter(x => !sequence.includes(x.data.id))
                                .transition()
                                .duration(150)
                                .ease(d3.easeLinear)
                                .style("opacity", 0.0);

                            charts
                                .selectAll("#clusters")
                                .selectAll("g")
                                .filter(x => sequence.includes(x.data.id))
                                .nodes()
                                .forEach(d => d._tippy.show())

                            charts
                                .selectAll("#links")
                                .selectAll("path")
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

            };

            // MOUSEOUT EVENT.
            function normal(d) {
                var charts = d3.select('#tree-plot')

                charts
                    .selectAll("#clusters")
                    .selectAll("g")
                    .transition()
                    .duration(350)
                    .ease(d3.easeCubicIn)
                    .style("opacity", 1.0);

                charts
                    .selectAll("#clusters")
                    .selectAll("g")
                    .nodes()
                    .forEach(d => d._tippy.hide())

                charts
                    .selectAll("#links")
                    .selectAll("path")
                    .transition()
                    .duration(350)
                    .ease(d3.easeCubicIn)
                    .style("opacity", 1.0);

            };


            // MOUSECLICK EVENT.
            function mouseclick(d) {
                d3.json(get_transposed_file_url(project, 2, 50), 
                    function(error, data) {
                        
                        if (error) return console.error(error);

                        // TAKES CARE OF THE CHARTS REGARDING HIGHER MPTS.
                        var sequence = [d.data.id]
                        for (let k = mpts; k <= max_mpts; k++) {
                            var aux = []

                            var charts = d3.select('#tree-chart-' + (k))
                                        .filter(x => x !== selection[0])

                            charts
                                .selectAll("#clusters")
                                .selectAll("g")
                                .filter(x => !sequence.includes(x.data.id))
                                .transition()
                                .duration(150)
                                .ease(d3.easeLinear)
                                .style("opacity", 0.0);

                            charts
                                .selectAll("#clusters")
                                .selectAll("g")
                                .filter(x => sequence.includes(x.data.id))
                                .nodes()
                                .forEach(d => d._tippy.show())

                            charts
                                .selectAll("#links")
                                .selectAll("path")
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

            };

            function fosc() {
                
                nodes = svg.selectAll(".cluster");
                labels = svg.selectAll("#links");
                
                if(d3.select('.fosc-select input[type=checkbox]').property("checked")){
                    nodes
                        .style("visibility", d => !partitioning.has(d.data.id) ? "hidden" : "visible");

                    labels
                        .style("visibility", "hidden");
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

                root = d3.tree()(d3.hierarchy(data));
            
                max_epsilon = root.data.birth;
                min_epsilon = d3.min(root.leaves(), 
                    function(d) {
                    return d.data.death;
                    });

                
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
                var updateNode = svg.select("#clusters")
                    .data(root.descendants().sort((a, b) => b.depth - a.depth));                

                console.log(updateNode);

                // EXIT.
                updateNode.exit().remove();

                console.log(updateNode);


                // ENTER.
                updateNode.enter()
                .append("g")
                .attr("class", "cluster")
                .attr("title", function(d) {
                    return "<div><span>Cluster:</span> <span style='color:white'>" + d.data.id + "</span></div>" +
                            "<div><span>#points:</span> <span style='color:white'>" + d.data.n + "</span></div>" +
                            "<div><span>Birth:</span> <span style='color:white'>" + f(d.data.birth) + "</span></div>" +
                            "<div><span>Death:</span> <span style='color:white'>" + f(d.data.death) + "</span></div>" +
                            "<div><span>Stability:</span> <span style='color:white'>" + f(d.data.stability) + "</span></div>";
                    })
                .call(d => nodeSetup(d))
                .attr("cluster", d => d.data.id)
                .attr("transform", d => `translate(${d.x}, ${d.y})`)
                .attr("stability", d => d.data.stability)
                .selectAll("rect")
                .data(d => d.data.points)
                .exit().remove()

                // // ENTER.
                // updateNode.enter()
                // .append("g")
                // .attr("class", "cluster")
                // .attr("title", function(d) {
                //     return "<div><span>Cluster:</span> <span style='color:white'>" + d.data.id + "</span></div>" +
                //             "<div><span>#points:</span> <span style='color:white'>" + d.data.n + "</span></div>" +
                //             "<div><span>Birth:</span> <span style='color:white'>" + f(d.data.birth) + "</span></div>" +
                //             "<div><span>Death:</span> <span style='color:white'>" + f(d.data.death) + "</span></div>" +
                //             "<div><span>Stability:</span> <span style='color:white'>" + f(d.data.stability) + "</span></div>";
                //     })
                // .call(d => nodeSetup(d))
                // .attr("cluster", d => d.data.id)
                // .attr("transform", d => `translate(${d.x}, ${d.y})`)
                // .attr("stability", d => d.data.stability)
                // .selectAll("rect")
                // .data(d => d.data.points)
                //     .enter()
                //     .append("rect")
                //     .attr("width", function(d) {
                //         console.log(d[3])
                //         return widthScale(d[3] - d[2] + 1);
                //     })
                //     .attr("height", d => yScale(d[1]) - yScale(d[0]) + 1)
                //     .attr("fill", function(d) {
                //         return color(d3.select(this.parentNode).attr("stability"));
                //     })
                //     .attr("transform", d => `translate(0, ${yScale(d[0])})`);


                // // UPDATE.
                // updateNode
                //     .call(d => nodeSetup(d))
                //     .transition()
                //         .duration(400)

                // // UPDATE LABELS OF CLUSTERS.
                // updateLabel = svg.selectAll("text")
                //     .data(root.descendants())

                // updateLabel.exit().remove();

                // updateLabel.enter()
                //     .append("text")
                //     .call(d => labelSetup(d))
                //     .transition()
                //         .duration(400)
                
                // updateLabel
                //     .call(d => labelSetup(d))
                //     .transition()
                //     .duration(400)

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
    return "/dashboard/" + datasetId + "/trees/" + data_name + "-ct-" + mpts + ".json"
    // return "http://localhost:8000/data/" + data_name + "/server/" + data_name + "-ct-" + mpts + ".json"
}


function get_transposed_file_url(data_name, kmin, kmax) {
    return "/dashboard/" + datasetId + "/" + data_name + "-t-" + kmin + "-" + kmax + ".json"
    // return "http://localhost:8000/data/" + data_name + "/" + data_name + "-t-" + kmin + "-" + kmax + ".json"
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

        // d3.select("svg").remove();

        // d3.json(get_file_url(project, chart.mpts()),
        // function(data) {
        //     d3.select("#chart-tree")
        //         .datum(data)
        //         .call(chart);
        // });

    });

    return chart
}


function drawMultipleTreeCharts() {

    var min_mpts = 2;
    var max_mpts = 16;

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
var max_mpts = 16;

covered_points = []
selected_clusters = {}

chart  = drawChartTree(18)
charts = drawMultipleTreeCharts()