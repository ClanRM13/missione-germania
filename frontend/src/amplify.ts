import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "eu-west-1_M7ynGfGL2",
      userPoolClientId: "18u5epgkqp21de70s600btot1j",
    },
  },
});