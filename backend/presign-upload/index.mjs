import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";

const s3 = new S3Client({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const BUCKET_NAME = process.env.BUCKET_NAME;
const PROOFS_TABLE_NAME = process.env.PROOFS_TABLE_NAME;
const USER_ACHIEVEMENTS_TABLE_NAME =
  process.env.USER_ACHIEVEMENTS_TABLE_NAME;

export const handler = async (event) => {
  try {
    if (event.requestContext?.http?.method === "OPTIONS") {
      return response(200, {});
    }

    const body = JSON.parse(event.body || "{}");
    console.log("REQUEST BODY", body);

    const { fileName, contentType, username, missionId, category, fileSize } =
      body;

    if (!fileName || !contentType || !username || !missionId || !category) {
      return response(400, {
        message:
          "fileName, contentType, username, missionId e category sono obbligatori",
      });
    }

    if (!contentType.startsWith("image/")) {
      return response(400, { message: "Sono ammesse solo immagini" });
    }

    const maxSizeBytes = 5 * 1024 * 1024;

    if (fileSize && fileSize > maxSizeBytes) {
      return response(400, { message: "File troppo grande. Massimo 5 MB." });
    }

    const proofId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const safeUsername = username.replace(/[^a-zA-Z0-9._-]/g, "_");
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `proofs/${safeUsername}/${proofId}-${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    await dynamo.send(
      new PutCommand({
        TableName: PROOFS_TABLE_NAME,
        Item: {
          proofId,
          username,
          missionId,
          category,
          s3Key: key,
          status: "PENDING",
          createdAt,
        },
      })
    );

    await evaluateUploadAchievements(username, createdAt);

    return response(200, {
      uploadUrl,
      key,
      proofId,
    });
  } catch (error) {
    console.error(error);

    return response(500, {
      message: "Errore generazione upload URL",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

async function evaluateUploadAchievements(username, createdAt) {
  const uploadHour = new Date(createdAt).getHours();

  if (uploadHour >= 22 || uploadHour < 6) {
    await unlockAchievement(username, "gufo-clan", "Gufo del Clan");
  }

  const uploadsResult = await dynamo.send(
    new ScanCommand({
      TableName: PROOFS_TABLE_NAME,
      FilterExpression: "username = :username",
      ExpressionAttributeValues: {
        ":username": username,
      },
    })
  );

  if ((uploadsResult.Items || []).length >= 5) {
    await unlockAchievement(
      username,
      "paparazzo-pirna",
      "Paparazzo di Pirna"
    );
  }
}

async function unlockAchievement(username, achievementId, title) {
  try {
    await dynamo.send(
      new PutCommand({
        TableName: USER_ACHIEVEMENTS_TABLE_NAME,
        Item: {
          username,
          achievementId,
          title,
          unlockedAt: new Date().toISOString(),
        },
        ConditionExpression:
          "attribute_not_exists(username) AND attribute_not_exists(achievementId)",
      })
    );
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      return;
    }

    throw error;
  }
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "OPTIONS,POST",
      "access-control-allow-headers": "content-type,authorization",
    },
    body: JSON.stringify(body),
  };
}