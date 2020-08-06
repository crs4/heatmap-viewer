window.onload = function() {

  var url = new URL(window.location.href);
  var uriImage = url.searchParams.get("image");

  this.viewer = OpenSeadragon({
      id: "openseadragon1",
      prefixUrl: "/openseadragon/images/",
      tileSources: "http://mobydick.crs4.it/ome_seadragon/deepzoom/get/" + uriImage + ".dzi"
  });
  var overlay = this.viewer.paperjsOverlay();

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
      console.log(patches[0]);
      console.log(patches[0].size[0]);
      patches.forEach(function(patch){
        var cancer_percentage = patch.data.cancer_percentage;
        if (cancer_percentage > 0) {
          var heat = new paper.Rectangle(patch.x, patch.y, patch.size[0], patch.size[1]);
          var path = new paper.Path.Rectangle(heat);
          path.fillColor = new paper.Color(cancer_percentage*255, 0, 0);
          // path.selected = true;
        }

      });



    }

    );
};

