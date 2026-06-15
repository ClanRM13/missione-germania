import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const PROOFS_TABLE_NAME = process.env.PROOFS_TABLE_NAME;
const USER_PROGRESS_TABLE_NAME = process.env.USER_PROGRESS_TABLE_NAME;
const USER_ACHIEVEMENTS_TABLE_NAME = process.env.USER_ACHIEVEMENTS_TABLE_NAME;

const headers = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

const FOOD_MISSIONS = ["acqua", "panino", "cambusa-frutta", "gelato"];

const COUNT_ACHIEVEMENTS = [
  { count: 1, id: "fuochista", title: "Fuochista" },
  { count: 6, id: "zaino-pronto", title: "Zaino Sempre Pronto" },
  { count: 18, id: "kaiser-clan", title: "Kaiser del Clan" },
  { count: 21, id: "aquila-sassonia", title: "Aquila di Sassonia" },
];

function normalizeStringSet(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (value instanceof Set) return Array.from(value);
  return [];
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

async function evaluateAchievements(username, completedMissionIds) {
  for (const achievement of COUNT_ACHIEVEMENTS) {
    if (completedMissionIds.length >= achievement.count) {
      await unlockAchievement(username, achievement.id, achievement.title);
    }
  }

  const completedAllFoodMissions = FOOD_MISSIONS.every((missionId) =>
    completedMissionIds.includes(missionId)
  );

  if (completedAllFoodMissions) {
    await unlockAchievement(
      username,
      "kaiser-cambusa",
      "Kaiser della Cambusa"
    );
  }
}

export const handler = async (event) => {
  try {
    if (event.requestContext?.http?.method === "OPTIONS") {
      return {
        statusCode: 200,
        headers,
        body: "",
      };
    }

    const proofId = event.pathParameters?.proofId;

    if (!proofId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "proofId mancante" }),
      };
    }

    const proofResult = await dynamo.send(
      new GetCommand({
        TableName: PROOFS_TABLE_NAME,
        Key: { proofId },
      })
    );

    const proof = proofResult.Item;

    if (!proof) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "Prova non trovata" }),
      };
    }

    if (proof.status !== "PENDING") {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          message: `La prova non è approvabile perché è già ${proof.status}`,
        }),
      };
    }

    const approvedAt = new Date().toISOString();

    await dynamo.send(
      new UpdateCommand({
        TableName: PROOFS_TABLE_NAME,
        Key: { proofId },
        UpdateExpression: "SET #status = :approved, approvedAt = :approvedAt",
        ConditionExpression: "#status = :pending",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":approved": "APPROVED",
          ":pending": "PENDING",
          ":approvedAt": approvedAt,
        },
      })
    );

    const progressResult = await dynamo.send(
      new UpdateCommand({
        TableName: USER_PROGRESS_TABLE_NAME,
        Key: {
          username: proof.username,
        },
        UpdateExpression: "ADD completedMissions :missionSet",
        ExpressionAttributeValues: {
          ":missionSet": new Set([proof.missionId]),
        },
        ReturnValues: "ALL_NEW",
      })
    );

    const completedMissionIds = normalizeStringSet(
      progressResult.Attributes?.completedMissions
    );

    await evaluateAchievements(proof.username, completedMissionIds);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        proofId,
        username: proof.username,
        missionId: proof.missionId,
        status: "APPROVED",
        approvedAt,
        completedMissions: completedMissionIds,
      }),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Errore durante l'approvazione della prova",
      }),
    };
  }
};