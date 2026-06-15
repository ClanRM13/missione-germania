import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const PROOFS_TABLE_NAME = process.env.PROOFS_TABLE_NAME;

const headers = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

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

    const body = event.body ? JSON.parse(event.body) : {};
    const reason = String(body.reason || "").trim();

    if (!reason) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Motivo del rifiuto mancante" }),
      };
    }

    const rejectedAt = new Date().toISOString();

    await dynamo.send(
      new UpdateCommand({
        TableName: PROOFS_TABLE_NAME,
        Key: { proofId },
        UpdateExpression:
          "SET #status = :rejected, rejectedAt = :rejectedAt, rejectionReason = :reason",
        ConditionExpression: "#status = :pending",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":rejected": "REJECTED",
          ":pending": "PENDING",
          ":rejectedAt": rejectedAt,
          ":reason": reason,
        },
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        proofId,
        status: "REJECTED",
        rejectedAt,
        rejectionReason: reason,
      }),
    };
  } catch (error) {
    console.error(error);

    if (error.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          message: "La prova non è più in stato PENDING",
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Errore durante il rifiuto della prova",
      }),
    };
  }
};
