# GCS image scanner setup

## Create a Pub/Sub topic

gcloud pubsub topics create image-uploads-topic

## Link the Pub/Sub topic to your bucket

gcloud storage buckets notifications create gs://listical-dev \
  --topic=image-uploads-topic \
  --event-types=OBJECT_FINALIZE

logs from the above:
selfLink: https://www.googleapis.com/storage/v1/b/listical-dev/notificationConfigs/12
topic: //pubsub.googleapis.com/projects/listical-dev/topics/image-uploads-topic

## Trigger the cloud function

gcloud functions deploy scanImage \
  --runtime nodejs20 \
  --trigger-topic=image-uploads-topic \
  --allow-unauthenticated

## deploy function (backend => config/index.js)

gcloud functions deploy scanImage \
  --runtime nodejs20 \
  --trigger-topic=image-uploads-topic \
  --entry-point=scanImage \
  --allow-unauthenticated

## JSON response example

{
  "responses": [
    {
      "safeSearchAnnotation": {
        "adult": "UNLIKELY",
        "spoof": "VERY_UNLIKELY",
        "medical": "VERY_UNLIKELY",
        "violence": "LIKELY",
        "racy": "POSSIBLE"
      }
    }
  ]
}

## logs when deploying cloud function

catherineluse@Catherines-MBP scanImage % gcloud functions deploy scanImage \
  --runtime nodejs20 \
  --trigger-topic=image-uploads-topic \
  --entry-point=scanImage \
  --allow-unauthenticated
As of this Cloud SDK release, new functions will be deployed as 2nd gen  functions by default. This is equivalent to currently deploying new  with the --gen2 flag. Existing 1st gen functions will not be impacted and will continue to deploy as 1st gen functions.
You can disable this behavior by explicitly specifying the --no-gen2 flag or by setting the functions/gen2 config property to 'off'.
To learn more about the differences between 1st gen and 2nd gen functions, visit:
https://cloud.google.com/functions/docs/concepts/version-comparison
API [run.googleapis.com] not enabled on project [listical-dev]. Would you like to enable and retry 
(this will take a few minutes)? (y/N)?  y

Enabling service [run.googleapis.com] on project [listical-dev]...
Operation "operations/acf.p2-307227928161-ca12107c-7c6a-41df-bd5c-d0012b9789e8" finished successfully.
API [cloudbuild.googleapis.com] not enabled on project [listical-dev]. Would you like to enable and
 retry (this will take a few minutes)? (y/N)?  y

Enabling service [cloudbuild.googleapis.com] on project [listical-dev]...
Operation "operations/acf.p2-307227928161-042e5133-e14e-40ac-b620-94052a116e34" finished successfully.
API [eventarc.googleapis.com] not enabled on project [listical-dev]. Would you like to enable and 
retry (this will take a few minutes)? (y/N)?  y

Enabling service [eventarc.googleapis.com] on project [listical-dev]...
Operation "operations/acat.p2-307227928161-a00c1d3c-59d7-4feb-bc35-01b38a8a0f47" finished successfully.
Preparing function...done.                                                                        
X Deploying function...                                                                           
    [Build] Logs are available at [https://console.cloud.google.com/cloud-build/builds;region=us-c
  entral1/5f3cec3b-4809-4fcd-9e25-b6692a394a33?project=307227928161]                              
  ✓ [Service]                                                                                     
  ✓ [Trigger]                                                                                     
  . [ArtifactRegistry]                                                                            
  . [Healthcheck]                                                                                 
  . [Triggercheck]                                                                                
Completed with warnings:                                                                          
  [WARNING] *** Improve build performance by generating and committing package-lock.json.
You can view your function in the Cloud Console here: https://console.cloud.google.com/functions/details/us-central1/scanImage?project=listical-dev

buildConfig:
  automaticUpdatePolicy: {}
  build: projects/307227928161/locations/us-central1/builds/5f3cec3b-4809-4fcd-9e25-b6692a394a33
  dockerRegistry: ARTIFACT_REGISTRY
  dockerRepository: projects/listical-dev/locations/us-central1/repositories/gcf-artifacts
  entryPoint: scanImage
  runtime: nodejs20
  serviceAccount: projects/listical-dev/serviceAccounts/307227928161-compute@developer.gserviceaccount.com
  source:
    storageSource:
      bucket: gcf-v2-sources-307227928161-us-central1
      generation: '1736974871307642'
      object: scanImage/function-source.zip
  sourceProvenance:
    resolvedStorageSource:
      bucket: gcf-v2-sources-307227928161-us-central1
      generation: '1736974871307642'
      object: scanImage/function-source.zip
createTime: '2025-01-15T21:01:13.162801926Z'
environment: GEN_2
eventTrigger:
  eventType: google.cloud.pubsub.topic.v1.messagePublished
  pubsubTopic: projects/listical-dev/topics/image-uploads-topic
  retryPolicy: RETRY_POLICY_DO_NOT_RETRY
  serviceAccountEmail: 307227928161-compute@developer.gserviceaccount.com
  trigger: projects/listical-dev/locations/us-central1/triggers/scanimage-399967
  triggerRegion: us-central1
labels:
  deployment-tool: cli-gcloud
name: projects/listical-dev/locations/us-central1/functions/scanImage
serviceConfig:
  allTrafficOnLatestRevision: true
  availableCpu: '0.1666'
  availableMemory: 256M
  environmentVariables:
    LOG_EXECUTION_ID: 'true'
  ingressSettings: ALLOW_ALL
  maxInstanceCount: 100
  maxInstanceRequestConcurrency: 1
  revision: scanimage-00001-kix
  service: projects/listical-dev/locations/us-central1/services/scanimage
  serviceAccountEmail: 307227928161-compute@developer.gserviceaccount.com
  timeoutSeconds: 60
  uri: https://scanimage-sb7ei43ttq-uc.a.run.app
state: ACTIVE
updateTime: '2025-01-15T21:03:22.061472594Z'
url: https://us-central1-listical-dev.cloudfunctions.net/scanImage
```