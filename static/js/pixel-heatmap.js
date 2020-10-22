var colorMap = YlOrRd;
var slideDimensions; 

var url = new URL(window.location.href);
var uriImage = url.searchParams.get("image");
var heatmap = url.searchParams.get("heatmap");
var threshold = url.searchParams.get("th");
//from https://github.com/timothygebhard/js-colormaps/blob/master/overview.html
//*******************************
function enforceBounds(x) {
    if (x < 0) {
        return 0;
    } else if (x > 1){
        return 1;
    } else {
        return x;
    }
}

function interpolateLinearly(x, values) {

    // Split values into four lists
    var x_values = [];
    var r_values = [];
    var g_values = [];
    var b_values = [];
    for (i in values) {
        x_values.push(values[i][0]);
        r_values.push(values[i][1][0]);
        g_values.push(values[i][1][1]);
        b_values.push(values[i][1][2]);
    }

    var i = 1;
    while (x_values[i] < x) {
        i = i+1;
    }
    i = i-1;

    var width = Math.abs(x_values[i] - x_values[i+1]);
    var scaling_factor = (x - x_values[i]) / width;

    // Get the new color values though interpolation
    var r = r_values[i] + scaling_factor * (r_values[i+1] - r_values[i])
    var g = g_values[i] + scaling_factor * (g_values[i+1] - g_values[i])
    var b = b_values[i] + scaling_factor * (b_values[i+1] - b_values[i])

    return [enforceBounds(r), enforceBounds(g), enforceBounds(b)];

}


 function drawColormap(CanvasID, colormap) {

    var c = document.getElementById(CanvasID);
    var ctx = c.getContext("2d");
    
    var pixels = c.width;
    for (i = 0; i <= pixels; i++) {
        var color = interpolateLinearly(i/pixels, colormap);
        r = Math.round(255*color[0]);
        g = Math.round(255*color[1]);
        b = Math.round(255*color[2]);
        ctx.fillStyle = 'rgb('+r+', '+g+', '+b+')';
        ctx.fillRect(i, 0, 1, 20);
    }
}

function changePixels(event){
  if(event.image.src.includes(heatmap.split('.').slice(0, -1).join('.')) ){
     var canvas = document.createElement( 'canvas' )
     canvas.width = event.image.width;
     canvas.height = event.image.height;
     var renderedContext = canvas.getContext('2d');
     renderedContext.drawImage(event.image, 0, 0);
     var tiledData = renderedContext.getImageData(0, 0, canvas.width, canvas.height);
     var n = event.image.width * event.image.height;

     for (var i = 0; i <n; i++) {
      var pix = tiledData.data.slice(i*4, i*4+4);
      if(pix[0] > threshold*255){
                pix[3] = 255;
         }
       else {
         pix[3] = 0;
       }
        tiledData.data.set(pix, i*4);
    };

    renderedContext.putImageData(tiledData, 0, 0);
    event.tile.context2D = renderedContext;
  }
}


window.onload = function() {

  var path;
  var tool = new paper.Tool();
  tool.minDistance = 1000;
  var patches;
  var opacity;


  if (threshold == null) {
    threshold = 0.7;
  }
  $("#low-colorbar")[0].innerText = threshold;
  $("#th-value")[0].innerText = threshold;
  $("#threshold")[0].value = threshold*100;

  this.viewer = OpenSeadragon({
      id: "openseadragon1",
      prefixUrl: "/static/openseadragon/images/",
  tileSources: [
    {
      tileSource: uriImage,
    },
    {
      tileSource: heatmap,
      opacity: 0.2
    }
    ]
  });




  this.viewer.addHandler('open', function() {
    slideDimensions = viewer.world.getItemAt(0).source.dimensions;
  });


  this.viewer.addHandler('tile-loaded', changePixels);
  /* this.viewer.navigator.addHandler('tile-loaded', changePixels); */

  var defaultOpacity = 1;
  opacityController = $('#opacity')[0];
  opacityController.value = defaultOpacity*100;

  $('#opacity').on('input', function(){
    opacity = $(this).val()/100;
    paper.project.activeLayer.children.forEach(function(e) {e.opacity = opacity;});
     paper.project.view.update();
  });

  $('#threshold').on('mouseup', function(){
    threshold = $(this).val()/100;
    /* changePixels();  */
    viewer.addTiledImage({
          tileSource : heatmap,
          index: 1,
          // opacity: threshold,
          replace: true
          });

    $("#low-colorbar")[0].innerText = threshold;
  });

  $('#threshold').on('input', function(){
    var th = $(this).val()/100;
    $("#th-value")[0].innerText = th;
  });

  drawColormap('colorbar', colorMap);

 
};
//


