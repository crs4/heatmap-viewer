//from https://github.com/timothygebhard/js-colormaps/blob/master/overview.html

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



window.onload = function() {

  var url = new URL(window.location.href);
  var uriImage = url.searchParams.get("image");

  this.viewer = OpenSeadragon({
      id: "openseadragon1",
      prefixUrl: "/openseadragon/images/",
      tileSources: "http://mobydick.crs4.it/ome_seadragon/deepzoom/get/" + uriImage + ".dzi"
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
//
  $.ajax({
    'url': '/features/cancer_' + uriImage + '.json',
    datatype: 'json'
  })
    .done(function(data){
      var size = data.patch_size;
      data.predictions.forEach(function(patch){
        var prediction = patch[2];
        threshold = 0.5;
        if (prediction > threshold) {
          var heat = new paper.Rectangle(patch[1], patch[0], size[0], size[1]);
          var path = new paper.Path.Rectangle(heat);
          var color = interpolateLinearly(prediction, summer);
          path.fillColor = new paper.Color(color);
        }

      });


    }

    );
};

