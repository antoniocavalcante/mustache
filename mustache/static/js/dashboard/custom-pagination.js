function pagination(selection) {

    // GETS THE NUMBER OF ELEMENTS PER PAGE.
    elements_per_page = $("#elements-per-pg").find(":selected").text();

    // CALCULATES THE NUMBER OF PAGES.
    number_of_pages = Math.ceil(Object.keys(clusters).length / elements_per_page);

    // CREATES PAGES.
    pages = new Array(number_of_pages);

    // JOIN DATA.
    pgLinks = d3.select(".pagination")
                .selectAll(".pg")
                .data(pages, 
                    function (d) {
                        return +d;
                    })

    // REMOVE DATA.
    pgLinks.exit().remove();

    d3.selectAll(".arr").remove();
    
    // UPDATE
    pgLinks.enter()
            .append("li")
            .classed("pg", "true")
            .append("a")
            .attr("href", "#")
            .html(function (d) {
                    return (d + 1);
                })

    d3.select(".pg").classed("active", "true");

    move = $("#tree-plot").width();

    buttons = d3.selectAll(".pg");

    function toggleActive(current) {
        if (current < 0 || current > pages.length - 1) return;
        buttons.each(function (d) {
            $(this).removeClass("active")
            if (current == d) {
                $(this).addClass("active");
            }
        })
    }

    buttons.on("click", function (d) {
        offset = move * d;
        if (d == pages.length - 1) {
            offset = offset + 10;
        }
        $("#reach-plot").scrollLeft(offset);

    });


    $("#reach-plot").scroll(function () {
        pos = $(this).scrollLeft() + 1;
        current = Math.floor(pos / move);
        if (pos + move >= Math.ceil(meds * move)) {
            current = pages.length - 1;
        }
        toggleActive(current);

    })

    $("#reach-plot").scrollLeft(0);

    d3.select(".pagination")
        .append("li")
        .attr("pg-val", "1")
        .classed("arr", "true")
        .classed("pg-nav", "true")
        .append("a")
        .attr("href", "#")
        .append("span")
        .html("&raquo;");

    nav = d3.selectAll(".pg-nav");

    nav.on("click", function () {
        i = d3.select(this).attr("pg-val")
        g = $(".pg.active")[0];
        d3.select(g).each(function (d) {
            shift = d + parseInt(i);
            offset = move * shift;
            if (shift == pages.length - 1) {
                offset = offset + 10;
            }
            $("#reach-plot").scrollLeft(offset);
        })
    })

}