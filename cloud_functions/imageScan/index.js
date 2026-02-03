// This file is used for setting up a cloud function via the gcloud CLI.
// I used it to set up the function to be triggered by a Pub/Sub message,
// specifically the message that is triggered by a new file being uploaded to
// a GCS bucket.
const { Storage } = require('@google-cloud/storage');
const vision = require('@google-cloud/vision');
const storage = new Storage();
const client = new vision.ImageAnnotatorClient();

exports.scanImage = async (event, context) => {
  const data = JSON.parse(Buffer.from(event.data, 'base64').toString());
  const bucketName = data.bucket;
  const fileName = data.name;

  try {
    // This is where we have the newly uploaded image scanned by Google SafeSearch.
    const [result] = await client.safeSearchDetection(`gs://${bucketName}/${fileName}`);
    const safeSearch = result.safeSearchAnnotation;

    if (
        safeSearch.adult === 'VERY_LIKELY' || 
        safeSearch.adult === 'LIKELY' ||
        safeSearch.racy === 'VERY_LIKELY' ||
        safeSearch.medical === 'VERY_LIKELY' ||
        safeSearch.violence === 'VERY_LIKELY' ||
        safeSearch.violence === 'LIKELY'
    ) {
      // And this is where we delete an image that doesn't pass the check.
      await storage.bucket(bucketName).file(fileName).delete();

      // These logs show in the Google cloud console whenever the cloud function
      // is triggered.
      // In the future I will also update this area of the code so that it triggers a 
      // notification, which will tell the user that their image was deleted because it didn't 
      // pass the content filter.
    } else {
    }
  } catch (error) {
    console.error(`Error scanning image: ${fileName}`, error);
  }
};