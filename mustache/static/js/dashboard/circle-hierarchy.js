
function get_file_url(data_name, mpts) {
    return "http://localhost:8000/" + data_name + "-ct-" + mpts + ".json"
}

function circle_hierarchy(data_name, mpts) {

    data = d3.json(get_file_url(data_name, mpts))
        .then(function(data) {

            pack = data => d3.pack()
                .size([width, height])
                .padding(3)
              (d3.hierarchy(data)
                .sum(d => d.n)
                .sort((a, b) => b.n - a.n))

            // This has to be given as a parameter.
            // Dimensions of the chart
            var width = $("#circle-panel").find(".panel-body").attr("width"),
                height = width; //$("#circle-panel").find(".panel-body").attr("height");

            var min_id = Number.MAX_VALUE;
            var max_id = Number.MIN_VALUE;

            const root = pack(data);
            let focus = root;
            let view;

            root.descendants().forEach(function (d) {
                min_id = Math.min(min_id, d.data.id)
                max_id = Math.max(max_id, d.data.id)
            });

            color = d3.scaleLinear()
                .domain([min_id, max_id])
                .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
                .interpolate(d3.interpolateHsl);
                // .range(["#b3cde3","#fbb4ae","#decbe4","#ccebc5"])

            // Find Labels in the Cluster Tree

            d3.select('#chart-circle').select("svg").remove();

            var svg = d3.select("#chart-circle").append("svg")
                .attr("viewBox", "-280 -280 " + (width) + " " + (height))
                .style("display", "block")
                .style("margin", "10 10 10 10")
                .style("background", "white")
                .style("cursor", "pointer")
                .on("click", () => zoom(root));

            var node = svg.append("g")
                .selectAll("circle")
                .data(root.descendants())
                .join("circle")
                  .attr("fill", d => color(d.data.id))
                  .attr("pointer-events", d => !d.children ? "none" : null)
                  .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
                  .on("mouseout", function() { d3.select(this).attr("stroke", null); })
                  .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));

            var label = svg.append("g")
                    .style("font", "10px sans-serif")
                    .attr("pointer-events", "none")
                    .attr("text-anchor", "middle")
                .selectAll("text")
                .data(root.descendants())
                .join("text")
                    .style("fill-opacity", d => d.parent === root ? 1 : 0)
                    .style("display", d => d.parent === root ? "inline" : "none")
                    .text(d => d.data.id);

            zoomTo([root.x, root.y, root.r * 2]);

            function zoomTo(v) {
                const k = width / v[2];

                view = v;

                label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
                node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
                node.attr("r", d => d.r * k);
            }

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
            }

            // Listens to the button FOSC and updates the chart.
            $('.fosc-select input[type=checkbox]').on("change", function () {
                if(d3.select('.fosc-select input[type=checkbox]').property("checked")){
                    node.style("visibility", d => d.children ? "hidden" : "visible");
                } else {
                    node.style("visibility", "visible");
                }
            })

    });
}


function plot_circle_hierarchy(data_name) {
    circle_hierarchy(data_name, 2)

    $('.mpts-value input[type=number]').on("change", function () {
        console.log('UPDATE')
        console.log(this.value)
        circle_hierarchy(data_name, this.value)
    });

}

data_name = "test"
mpts2 = d3.select('.mpts-value')
console.log(mpts2)
mpts = 2
plot_circle_hierarchy(data_name, mpts)
