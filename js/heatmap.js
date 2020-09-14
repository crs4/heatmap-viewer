var colorMap = YlOrRd;
var patchData;
var slideDimensions; 
var userPatches = {};
var dragHandler;

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

var pathHit, segmentHit;
var hitOptions = {
	segments: true,
	stroke: true,
	fill: true,
	tolerance: 30
};



class DragHandler {
  onDrag(event) {
    window.viewer.setMouseNavEnabled(false);
  }
  onDragEnd(event){
    window.viewer.setMouseNavEnabled(true);
  }
}

class PathDrawingHandler extends DragHandler {
	constructor(startX, startY) {
    super();
		this.path = new paper.Path();
		var point = convertToSlideCoordinates(startX, startY);
		this.path.add(point);
		this.path.strokeWidth = 100;
		this.path.strokeColor = 'red';
		paper.project.view.update();
	}
  onDrag(event) {
    super.onDrag(event);
    var point = convertToSlideCoordinates(event.position.x, event.position.y);
    this.path.add(point);
    paper.project.view.update();
  }

  onDragEnd(event){
    super.onDragEnd(event);
    this.path.simplify();
    this.path.flatten(1000);
    this.path.closed = true;
    this.path.fillColor = 'red';
    this.path.opacity = opacity;
    paper.project.view.update();
  }
};

class PathMovingHandler extends DragHandler {
  constructor(path){
    super();
    this.path = path;
    this.path.selected = true;

  }

  onDrag(event) {
    super.onDrag(event);
    var origin = paper.view.viewToProject(new paper.Point(0,0));
    var endPoint = paper.view.viewToProject(new paper.Point(event.delta.x, event.delta.y));
    this.path.position = this.path.position.add(endPoint.subtract(origin));
    paper.project.view.update();
  }
}

class PathModifyingHandler extends DragHandler {
  constructor(path, segment){
    super();
    this.path = path;
    this.segment = segment;
    this.path.selected = true;

  }

  onDrag(event) {
    super.onDrag(event);
    this.segment.point = new paper.Point(this.segment.point.x + 10*event.delta.x, this.segment.point.y + 10*event.delta.y);
    paper.project.view.update();
  }
}

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

function drawPolygons(polygons){
  polygons.forEach(function(polygon){
    var path = new paper.Path(polygon);
    path.strokeWidth = 100;
    path.fillColor = 'red';
    path.simplify();
    path.flatten(1000);
    // path.opacity = opacity;
  });

  paper.project.view.update();
};

// Only execute onMouseDrag when the mouse
// has moved at least 10 points:
window.onload = function() {

  var path;
  var tool = new paper.Tool();
  tool.minDistance = 1000;
  var patches;
  var opacity;

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
  // this.viewer.setMouseNavEnabled(false);



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
    opacity = $(this).val()/100;
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
      // patches = data;
      // if (legacy) {
        // drawCancerLegacy(patches, threshold);
      // }
      // else {
        // drawCancer(patches, threshold);
      // }
//
      drawPolygons(data);
      }
    );

    new OpenSeadragon.MouseTracker({
      element: viewer.canvas,
      pressHandler: function(event){
        if ($("#draw-checkbox").is(":checked")) {
          var transformed_point = paper.view.viewToProject(new paper.Point(event.position.x, event.position.y));
          var hitTestResult = paper.project.hitTest(transformed_point, hitOptions);
          if (hitTestResult) {
              if (hitTestResult.type == 'segment') {
                dragHandler = new PathModifyingHandler(hitTestResult.item, hitTestResult.segment);
              }
              else {
                dragHandler = new PathMovingHandler(hitTestResult.item);
              }
          } else {
              dragHandler = new PathDrawingHandler(event.position.x, event.position.y);
          }
        }
      },
      dragHandler: function(event) {
        if (dragHandler) {

        dragHandler.onDrag(event);
        }
      },
      dragEndHandler: function(event) {
        if (dragHandler) {
          dragHandler.onDragEnd(event);
          dragHandler = null;
        }
      }
    }).setTracking(true);
};
//


