output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  value = aws_cognito_user_pool_client.web.id
}

output "cognito_user_pool_arn" {
  value = aws_cognito_user_pool.main.arn
}

output "proofs_bucket_name" {
  value = aws_s3_bucket.proofs.bucket
}

output "api_base_url" {
  value = aws_apigatewayv2_api.main.api_endpoint
}

output "mission_proofs_table_name" {
  value = aws_dynamodb_table.mission_proofs.name
}