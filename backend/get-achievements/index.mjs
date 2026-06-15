import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const USER_ACHIEVEMENTS_TABLE_NAME =
  process.env.USER_ACHIEVEMENTS_TABLE_NAME;

export const handler = async (event) => {
  try {
    const username = event.queryStringParameters?.username;

    if (!username) {
      return response(400, { message: "username obbligatorio" });
    }

    const result = await dynamo.send(
      new QueryCommand({
        TableName: USER_ACHIEVEMENTS_TABLE_NAME,
        KeyConditionExpression: "username = :username",
        ExpressionAttributeValues: {
          ":username": username,
        },
      })
    );

    return response(200, {
      username,
      achievements: (result.Items || []).map((item) => item.achievementId),
    });
  } catch (error) {
    console.error(error);
    return response(500, { message: "Errore caricamento distintivi" });
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