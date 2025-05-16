"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_client_s3 = require("@aws-sdk/client-s3");
var import_util_dynamodb = require("@aws-sdk/util-dynamodb");
const s3Client = new import_client_s3.S3Client({
  region: "ap-southeast-1"
});
const dynamoDbClient = new import_client_dynamodb.DynamoDBClient({
  region: "ap-southeast-1"
});
const BUCKET_NAME = "clickstream-analytics-bucket";
const PREFIX = "clickstream-events/";
const CLICKSTREAM_DATA_TABLE = "clickstream-data";
const CLICKSTREAM_DATA_ANALYTICS_TABLE = "clickstream-data-analytics";
async function handler(event) {
  console.log("Received event:", JSON.stringify(event, null, 2));
  for (const record of event.Records) {
    const payload = Buffer.from(record.kinesis.data, "base64").toString("utf-8");
    console.log("Decoded payload:", payload);
    try {
      const parsedPayload = JSON.parse(payload);
      const timestamp = record.kinesis.approximateArrivalTimestamp || Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const key = `${PREFIX}${new Date(timestamp * 1e3).toISOString()}-${randomId}.json`;
      const s3Command = new import_client_s3.PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: payload,
        ContentType: "application/json"
      });
      const transactItems = [
        {
          Put: {
            TableName: CLICKSTREAM_DATA_TABLE,
            Item: (0, import_util_dynamodb.marshall)(parsedPayload)
          }
        }
      ];
      if (parsedPayload.event === "pageView") {
        transactItems.push({
          Update: {
            TableName: CLICKSTREAM_DATA_ANALYTICS_TABLE,
            Key: (0, import_util_dynamodb.marshall)({ userId: parsedPayload.userId, event: "pageView" }),
            UpdateExpression: "SET #count = if_not_exists(#count, :start) + :inc",
            ExpressionAttributeNames: { "#count": "count" },
            ExpressionAttributeValues: (0, import_util_dynamodb.marshall)({ ":start": 0, ":inc": 1 })
          }
        });
      }
      const transactCommand = new import_client_dynamodb.TransactWriteItemsCommand({
        TransactItems: transactItems
      });
      const [s3Response, dynamoDbResponse] = await Promise.all([
        s3Client.send(s3Command),
        dynamoDbClient.send(transactCommand)
      ]);
      console.log(`Successfully saved to S3: ${JSON.stringify(s3Response)}`);
      console.log(`Successfully saved to DynamoDB: ${JSON.stringify(dynamoDbResponse)}`);
    } catch (error) {
      console.error("Error processing record:", error);
    }
  }
  return `Successfully processed ${event.Records.length} records and saved them to S3 and DynamoDB.`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
