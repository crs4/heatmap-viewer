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
    .done(function(patches){
      size = patches.patch_size;
      patches.predictions.forEach(function(patch){
        var prediction = patch[2];
        console.log(prediction);
        if (prediction > 0) {
          var heat = new paper.Rectangle(patch[1], patch[0], size[0], size[1]);
          var path = new paper.Path.Rectangle(heat);
          path.fillColor = new paper.Color(cancer_percentage*255, 0, 0);
          // path.selected = true;
        }

      });



    }

    );
};

