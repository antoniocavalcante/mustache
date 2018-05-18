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
    
    return panelH;
    
    
}


function svg2img(selection){
  var html = d3.select(selection)
        .attr("version", 1.1)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .node().parentNode.innerHTML;

  var imgsrc = 'data:image/svg+xml;base64,'+ btoa(html);

//  var canvas = document.querySelector("canvas")

  var image = new Image;
  image.src = imgsrc;
  image.onload = function() {

	  var a = document.createElement("a");
	  a.download = "sample.svg";
	  a.href = imgsrc;
	  a.click();
  };

}

