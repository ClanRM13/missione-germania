resource "aws_dynamodb_table" "mission_proofs" {
  name         = "${var.project_name}-mission-proofs"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "proofId"

  attribute {
    name = "proofId"
    type = "S"
  }

  tags = {
    Project = var.project_name
  }
}


resource "aws_dynamodb_table" "user_progress" {
  name         = "${var.project_name}-user-progress"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "username"

  attribute {
    name = "username"
    type = "S"
  }

  tags = {
    Project = var.project_name
  }
}

resource "aws_apigatewayv2_integration" "get_progress" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_progress.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_progress" {
  api_id = aws_apigatewayv2_api.main.id

  route_key = "GET /me/progress"

  target = "integrations/${aws_apigatewayv2_integration.get_progress.id}"
}

resource "aws_lambda_permission" "get_progress" {
  statement_id = "AllowApiGatewayGetProgress"

  action = "lambda:InvokeFunction"

  function_name = aws_lambda_function.get_progress.function_name

  principal = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_dynamodb_table" "user_achievements" {
  name         = "${var.project_name}-user-achievements"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "username"
  range_key = "achievementId"

  attribute {
    name = "username"
    type = "S"
  }

  attribute {
    name = "achievementId"
    type = "S"
  }

  tags = {
    Project = var.project_name
  }
}