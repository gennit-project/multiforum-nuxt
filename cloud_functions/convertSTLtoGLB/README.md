# .stl to .glb converter

```
gcloud pubsub topics create stl-uploads-topic
```


```
gcloud storage buckets notifications create gs://listical-dev \
  --topic=stl-uploads-topic \
  --event-types=OBJECT_FINALIZE
```

```
gcloud functions deploy convertSTLtoGLB \
  --runtime nodejs20 \
  --trigger-topic=stl-uploads-topic \
  --entry-point=convertSTLtoGLB \
  --memory=1GB \
  --timeout=540s \
  --allow-unauthenticated
```