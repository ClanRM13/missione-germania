resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["http://localhost:5173"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["content-type", "authorization"]
  }
}

resource "aws_apigatewayv2_integration" "presign_upload" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.presign_upload.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "presign_upload" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /presign-upload"
  target    = "integrations/${aws_apigatewayv2_integration.presign_upload.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gateway_presign_upload" {
  statement_id  = "AllowApiGatewayInvokePresignUpload"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.presign_upload.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_apigatewayv2_integration" "list_pending_proofs" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.list_pending_proofs.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "list_pending_proofs" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /proofs/pending"
  target    = "integrations/${aws_apigatewayv2_integration.list_pending_proofs.id}"
}

resource "aws_lambda_permission" "api_gateway_list_pending_proofs" {
  statement_id  = "AllowApiGatewayInvokeListPendingProofs"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.list_pending_proofs.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}


resource "aws_apigatewayv2_integration" "approve_proof" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.approve_proof.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "approve_proof" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /proofs/{proofId}/approve"

  target = "integrations/${aws_apigatewayv2_integration.approve_proof.id}"
}

resource "aws_lambda_permission" "approve_proof" {
  statement_id = "AllowApiGatewayApproveProof"

  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.approve_proof.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}


resource "aws_apigatewayv2_integration" "get_achievements" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_achievements.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_achievements" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /me/achievements"

  target = "integrations/${aws_apigatewayv2_integration.get_achievements.id}"
}

resource "aws_lambda_permission" "get_achievements" {
  statement_id = "AllowApiGatewayGetAchievements"

  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_achievements.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_apigatewayv2_integration" "reject_proof" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.reject_proof.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "reject_proof" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /proofs/{proofId}/reject"
  target    = "integrations/${aws_apigatewayv2_integration.reject_proof.id}"
}

resource "aws_lambda_permission" "reject_proof" {
  statement_id  = "AllowExecutionFromApiGatewayRejectProof"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.reject_proof.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}