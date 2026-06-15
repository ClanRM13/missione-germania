import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({})
);

const USER_PROGRESS_TABLE_NAME =
  process.env.USER_PROGRESS_TABLE_NAME;

export const handler = async (event) => {
  try {
    const username =
      event.queryStringParameters?.username;

    if (!username) {
      return response(400, {
        message: "username obbligatorio",
      });
    }

    const result = await dynamo.send(
      new GetCommand({
        TableName: USER_PROGRESS_TABLE_NAME,
        Key: {
          username,
        },
      })
    );

    return response(200, {
        username,
        completedMissions: result.Item?.completedMissions
            ? Array.from(result.Item.completedMissions)
            : [],
        });
  } catch (error) {
    console.error(error);

    return response(500, {
      message: "Errore caricamento progressi",
    });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
    body: JSON.stringify(body),
  };
}