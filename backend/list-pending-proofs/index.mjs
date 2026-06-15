import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

const BUCKET_NAME = process.env.BUCKET_NAME;
const PROOFS_TABLE_NAME = process.env.PROOFS_TABLE_NAME;

export const handler = async () => {
  try {
    const result = await dynamo.send(
      new ScanCommand({
        TableName: PROOFS_TABLE_NAME,
        FilterExpression: "#status = :pending",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":pending": "PENDING",
        },
      })
    );

    const proofs = await Promise.all(
      (result.Items || []).map(async (item) => {
        const fileUrl = await getSignedUrl(
          s3,
          new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: item.s3Key,
          }),
          { expiresIn: 300 }
        );

        return {
          id: item.proofId,
          username: item.username,
          missionId: item.missionId,
          missionTitle: item.missionId,
          fileUrl,
          submittedAt: item.createdAt,
        };
      })
    );

    return response(200, proofs);
  } catch (error) {
    console.error(error);
    return response(500, { message: "Errore caricamento prove pending" });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "OPTIONS,GET",
      "access-control-allow-headers": "content-type,authorization",
    },
    body: JSON.stringify(body),
  };
}