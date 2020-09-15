import json
import os
from typing import List, Tuple

from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.responses import FileResponse

POLYGONS_PATH = 'polygons'
app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
#  app.mount("/features",
#            StaticFiles(directory="static/features"),
#            name="features")

POLYGONS_PATH = 'static/polygons/'


class Polygon(BaseModel):
    coords: List[List[int]]


@app.get("/")
async def read_index():
    return FileResponse('static/index.html')


@app.get("/polygons/{polygon_id}")
async def read_polygon(polygon_id: str):
    return FileResponse(os.path.join(POLYGONS_PATH, polygon_id))


@app.post("/polygons/{polygon_id}")
async def write_polygon(polygon_id: str, polygon: List):
    polygon = jsonable_encoder(polygon)
    with open(f'static/polygons/{polygon_id}', 'w') as f:
        json.dump(polygon, f)
    return polygon
