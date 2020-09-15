from shapely.geometry import box
from shapely.ops import cascaded_union
from PIL import Image, ImageDraw
import numpy as np
from typing import Tuple, Union
Num = Union[int, float]


def get_masks(image_size: Tuple[int, int], polygons, factor=100):
    image_size = tuple([i // factor for i in image_size])
    image = Image.new('L', image_size)
    draw = ImageDraw.Draw(image)
    for p in polygons:
        if p:
            p = [(el[0] // factor, el[1] // factor) for el in p]
            draw.polygon(p, 1)
    return np.array(image)


def patches2polygons(patches):
    polygons = []
    for f in patches['predictions']:
        polygons.append(box(f[1], f[0], f[1] + 256, f[0] + 256))

    u = cascaded_union(polygons)
    return [tuple(p.exterior.coords) for p in u]
