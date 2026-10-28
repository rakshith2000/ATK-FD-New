FROM grafana/grafana:13.0.3

USER root

RUN apk update && \
    apk upgrade --no-cache curl libcurl && \
    rm -rf /var/cache/apk/*

USER grafana

EXPOSE 3000