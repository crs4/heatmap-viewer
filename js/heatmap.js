var colorMap = YlOrRd;
var patchData;
var slideDimensions; 
var userPatches = {};

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


function drawCancerLegacy(data, threshold) {
  // var size = data.patch_size;
  var size = [1024, 1024];
  data.predictions.forEach(function(patch){
    var prediction = patch[2];
    if (prediction > threshold) {
      // rescaling
      prediction = (prediction - threshold)/(1 - threshold);
      if (patch.length < 4) { // Rectangle does not exists
        var heat = new paper.Rectangle(patch[1], patch[0], size[0], size[1]);
        var path = new paper.Path.Rectangle(heat);
        patch.push(path);
      }
      else {
        var path = patch[3];
      }
      var color = interpolateLinearly(prediction, colorMap);
      path.fillColor = new paper.Color(color);
      path.visible = true;
    }
    else if (patch.length == 4) { // Rectangle already exists
      patch[3].visible = false;
    }

  });
  paper.project.view.update();
}

function drawRectangle(x, y, sizeX, sizeY, color) {
  var rect = new paper.Rectangle(x, y, sizeX, sizeY);
  var path = new paper.Path.Rectangle(rect);
  path.fillColor = new paper.Color(color);
  paper.project.view.update();
  return path;
}

function convertToSlideCoordinates(x, y) {
  return paper.view.viewToProject(new paper.Point(x, y));
};

var PATCH_SIZE = 1000;
function getPatch(x, y) {
  var patchX = Math.floor(x / PATCH_SIZE) * PATCH_SIZE;
  var patchY = Math.floor(y / PATCH_SIZE) * PATCH_SIZE;
  return [patchX, patchY];
};

function drawCancer(data, threshold) {
  patchData = data;
  var size = [
    data.patch_size[0]*data.downsample_factor, 
    data.patch_size[1]*data.downsample_factor
  ];
  data.features.forEach(function(patch){
    var prediction = patch.cancer;
    if (prediction > threshold) {
      // rescaling
      prediction = (prediction - threshold)/(1 - threshold);
      if (! patch.hasOwnProperty('rect')) { // Rectangle does not exists
        var x = patch.x*data.downsample_factor;
        var y = patch.y*data.downsample_factor;
        var heat = new paper.Rectangle(x, y, size[0], size[1]);
        var path = new paper.Path.Rectangle(heat);
        patch['rect'] = path;
      }
      else {
        var path = patch.rect;
      }
      var color = interpolateLinearly(prediction, colorMap);
      path.fillColor = new paper.Color(color);
      path.visible = true;
    }
    else if (patch.hasOwnProperty('rect')) { // Rectangle already exists
      patch.rect.visible = false;
    }

  });
  paper.project.view.update();
}



window.onload = function() {

  var patches;
  var url = new URL(window.location.href);
  var uriImage = url.searchParams.get("image");
  var heatmap = url.searchParams.get("heatmap");
  var threshold = url.searchParams.get("th");
  var legacy = url.searchParams.get("legacy", false);

  if (threshold == null) {
    threshold = 0.7;
  }
  $("#low-colorbar")[0].innerText = threshold;
  $("#th-value")[0].innerText = threshold;
  $("#threshold")[0].value = threshold*100;

  this.viewer = OpenSeadragon({
      id: "openseadragon1",
      prefixUrl: "/openseadragon/images/",
      tileSources: uriImage
  });

  this.viewer.gestureSettingsMouse.clickToZoom = false;


  viewer.addHandler('open', function() {
    slideDimensions = viewer.world.getItemAt(0).source.dimensions;
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

  $('#threshold').on('mouseup', function(){
    var th = $(this).val()/100;
    drawCancer(patches, th); 
    $("#low-colorbar")[0].innerText = th;
  });

$('#threshold').on('input', function(){
    var th = $(this).val()/100;
    $("#th-value")[0].innerText = th;
  });



  drawColormap('colorbar', colorMap);

  $.ajax({
    'url': '/features/' + heatmap,
    datatype: 'json'
  })
    .done(function(data){
      patches = data;
      if (legacy) {
        drawCancerLegacy(patches, threshold); 
      }
      else {
        drawCancer(patches, threshold); 
      }

    }

    );

    new OpenSeadragon.MouseTracker({
        element: viewer.canvas,
      pressHandler: function(event){
        var size = 1000;
        var slidePoint = convertToSlideCoordinates(event.position.x, event.position.y);
        var patchCoordinates = getPatch(slidePoint.x, slidePoint.y);
        var key = "" + patchCoordinates[0] + ":" + patchCoordinates[1];
        if (userPatches.hasOwnProperty(key)) {
          userPatches[key].remove();
          delete userPatches[key];
          paper.view.update();
        }
        else {
          var path = drawRectangle(patchCoordinates[0], patchCoordinates[1], PATCH_SIZE, PATCH_SIZE, 'red');
          userPatches[key] = path;
        }
      },
    }).setTracking(true);


};

