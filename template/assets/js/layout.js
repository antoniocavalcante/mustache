function panelSize(){
    
    var navBarH = $(".navbar").height(),
        navBarW = $(".navbar").width(),
        mainHeight = $(".main").height();
    
    var globalWidth = window.innerWidth,
        globalHeight = window.innerHeight,
        globalMainHeight = globalHeight - navBarH,
        padding = 10
    
    panelH = (globalMainHeight - (padding*2) - (padding*1.5)) / 2;
    
    console.log("panel size is: "+ panelH);
    
//    d3.selectAll(".panel-body").style("height", panelH+"px");
//    
//    var panel2 = d3.select("#hai-panel"),
//        header2 = panel2.select(".panel-heading"),
//        body2 = panel2.select(".panel-body"),
//        footer2 = panel2.select(".panel-footer")
//    
//    var panel = $("#hai-panel"),
//        header = panel.find(".panel-heading").outerHeight(),
//        body = panel.find(".panel-body").outerHeight(),
//        footer = panel.find(".panel-footer").outerHeight();
//    
//    console.log(header, body, footer);
//    
//    body2.style("height", (body-footer-header)+"px");
    
    
}

panelSize();

//d3.select(window).on("resize", panelSize);