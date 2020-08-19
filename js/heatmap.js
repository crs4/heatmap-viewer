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

//**************************


window.onload = function() {

  var url = new URL(window.location.href);
  var uriImage = url.searchParams.get("image");
  var heatmap = url.searchParams.get("heatmap");
  var threshold = url.searchParams.get("th");

  if (threshold == null) {
    threshold = 0.7;
  }
  $("#low-colorbar")[0].innerText = threshold;

  this.viewer = OpenSeadragon({
      id: "openseadragon1",
      prefixUrl: "/openseadragon/images/",
      tileSources: uriImage
  });

  var overlay = this.viewer.paperjsOverlay();
  viewer.addHandler('resize', function (viewer) {
    overlay.resize();
  })

  var defaultOpacity = 1;
  opacityController = $('#opacity')[0];
  opacityController.value = defaultOpacity*100;

  $('#opacity').on('input', function(){
    var opacity = $(this).val()/100;
    paper.project.activeLayer.children.forEach(function(e) {e.opacity = opacity;});
     paper.project.view.update();
  });

  var colorMap = YlOrRd;
  drawColormap('colorbar', colorMap);

  $.ajax({
    'url': '/features/' + heatmap,
    datatype: 'json'
  })
    .done(function(data){
      var size = data.patch_size;
      data.predictions.forEach(function(patch){
        var prediction = patch[2];
        if (prediction > threshold) {
          // rescaling
          prediction = (prediction - threshold)/(1 - threshold);
          var heat = new paper.Rectangle(patch[1], patch[0], size[0], size[1]);
          var path = new paper.Path.Rectangle(heat);
          var color = interpolateLinearly(prediction, colorMap);
          path.fillColor = new paper.Color(color);
        }

      });


    }

    );
};

