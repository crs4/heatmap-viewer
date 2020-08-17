#only for developing
FROM python:3.6.8
ENV WORKDIR=/heatmap
RUN mkdir $WORKDIR/
COPY css $WORKDIR/css
COPY js $WORKDIR/js
COPY index.html $WORKDIR/index.html
COPY openseadragon $WORKDIR/openseadragon
WORKDIR $WORKDIR
ENTRYPOINT ["python3", "-m" ,"http.server"]


