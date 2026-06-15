##### Lambda caricamento Proof ######
data "archive_file" "presign_upload_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/presign-upload"
  output_path = "${path.module}/presign-upload.zip"
}

resource "aws_iam_role" "presign_upload_lambda" {
  name = "${var.project_name}-presign-upload-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      },
      
    ]
  })
}

resource "aws_iam_role_policy" "presign_upload_lambda" {
  name = "${var.project_name}-presign-upload-lambda-policy"
  role = aws_iam_role.presign_upload_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.proofs.arn}/proofs/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
            "dynamodb:PutItem"
        ]
        Resource = aws_dynamodb_table.mission_proofs.arn
        },
        {
  Effect = "Allow"
  Action = [
    "dynamodb:PutItem"
  ]
  Resource = aws_dynamodb_table.user_achievements.arn
},
{
  Effect = "Allow"
  Action = [
    "dynamodb:Scan"
  ]
  Resource = aws_dynamodb_table.mission_proofs.arn
}
    ]
  })
}

resource "aws_lambda_function" "presign_upload" {
  function_name = "${var.project_name}-presign-upload"
  role          = aws_iam_role.presign_upload_lambda.arn

  filename         = data.archive_file.presign_upload_lambda.output_path
  source_code_hash = data.archive_file.presign_upload_lambda.output_base64sha256

  handler = "index.handler"
  runtime = "nodejs20.x"
  timeout = 180

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.proofs.bucket
      PROOFS_TABLE_NAME = aws_dynamodb_table.mission_proofs.name
      USER_ACHIEVEMENTS_TABLE_NAME = aws_dynamodb_table.user_achievements.name
    }
  }
}


##### Lambda visualizzazione Proof ######
data "archive_file" "list_pending_proofs_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/list-pending-proofs"
  output_path = "${path.module}/list-pending-proofs.zip"
}

resource "aws_iam_role" "list_pending_proofs_lambda" {
  name = "${var.project_name}-list-pending-proofs-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "list_pending_proofs_lambda" {
  name = "${var.project_name}-list-pending-proofs-lambda-policy"
  role = aws_iam_role.list_pending_proofs_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.mission_proofs.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.proofs.arn}/proofs/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "list_pending_proofs" {
  function_name = "${var.project_name}-list-pending-proofs"
  role          = aws_iam_role.list_pending_proofs_lambda.arn

  filename         = data.archive_file.list_pending_proofs_lambda.output_path
  source_code_hash = data.archive_file.list_pending_proofs_lambda.output_base64sha256

  handler = "index.handler"
  runtime = "nodejs20.x"

  environment {
    variables = {
      BUCKET_NAME        = aws_s3_bucket.proofs.bucket
      PROOFS_TABLE_NAME  = aws_dynamodb_table.mission_proofs.name
    }
  }
}


##### Approvare Proof ########
data "archive_file" "approve_proof_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/approve-proof"
  output_path = "${path.module}/approve-proof.zip"
}

resource "aws_iam_role" "approve_proof_lambda" {
  name = "${var.project_name}-approve-proof-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "approve_proof_lambda" {
  name = "${var.project_name}-approve-proof-policy"
  role = aws_iam_role.approve_proof_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.mission_proofs.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
            "dynamodb:GetItem",
            "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.user_progress.arn
        },
        {
        Effect = "Allow"
        Action = [
            "dynamodb:GetItem",
            "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.mission_proofs.arn
        },
        {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem"
        ]
        Resource = aws_dynamodb_table.user_achievements.arn
      }
    ]
  })
}

resource "aws_lambda_function" "approve_proof" {
  function_name = "${var.project_name}-approve-proof"

  role = aws_iam_role.approve_proof_lambda.arn

  filename         = data.archive_file.approve_proof_lambda.output_path
  source_code_hash = data.archive_file.approve_proof_lambda.output_base64sha256

  runtime = "nodejs20.x"
  handler = "index.handler"

  environment {
    variables = {
        PROOFS_TABLE_NAME        = aws_dynamodb_table.mission_proofs.name
        USER_PROGRESS_TABLE_NAME = aws_dynamodb_table.user_progress.name
        USER_ACHIEVEMENTS_TABLE_NAME = aws_dynamodb_table.user_achievements.name
    }
  }
}


##### GET Progress #####
data "archive_file" "get_progress_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/get-progress"
  output_path = "${path.module}/get-progress.zip"
}

resource "aws_iam_role" "get_progress_lambda" {
  name = "${var.project_name}-get-progress-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "get_progress_lambda" {
  name = "${var.project_name}-get-progress-policy"
  role = aws_iam_role.get_progress_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem"
        ]
        Resource = aws_dynamodb_table.user_progress.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "get_progress" {
  function_name = "${var.project_name}-get-progress"

  role = aws_iam_role.get_progress_lambda.arn

  filename         = data.archive_file.get_progress_lambda.output_path
  source_code_hash = data.archive_file.get_progress_lambda.output_base64sha256

  runtime = "nodejs20.x"
  handler = "index.handler"

  environment {
    variables = {
      USER_PROGRESS_TABLE_NAME = aws_dynamodb_table.user_progress.name
    }
  }
}

#### GET Achivement ####
data "archive_file" "get_achievements_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/get-achievements"
  output_path = "${path.module}/get-achievements.zip"
}

resource "aws_iam_role" "get_achievements_lambda" {
  name = "${var.project_name}-get-achievements-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "get_achievements_lambda" {
  name = "${var.project_name}-get-achievements-policy"
  role = aws_iam_role.get_achievements_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.user_achievements.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "get_achievements" {
  function_name = "${var.project_name}-get-achievements"

  role = aws_iam_role.get_achievements_lambda.arn

  filename         = data.archive_file.get_achievements_lambda.output_path
  source_code_hash = data.archive_file.get_achievements_lambda.output_base64sha256

  runtime = "nodejs20.x"
  handler = "index.handler"

  environment {
    variables = {
      USER_ACHIEVEMENTS_TABLE_NAME = aws_dynamodb_table.user_achievements.name
    }
  }
}


###### Reject Proof ######
data "archive_file" "reject_proof" {
  type        = "zip"
  source_dir  = "../backend/reject-proof"
  output_path = "${path.module}/reject-proof.zip"
}


resource "aws_iam_role" "reject_lambda_role" {
  name = "${var.project_name}-reject-proof-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "reject_proof_lambda" {
  name = "${var.project_name}-reject-proof-policy"
  role = aws_iam_role.reject_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.mission_proofs.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
            "dynamodb:GetItem",
            "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.user_progress.arn
        },
        {
        Effect = "Allow"
        Action = [
            "dynamodb:GetItem",
            "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.mission_proofs.arn
        },
        {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem"
        ]
        Resource = aws_dynamodb_table.user_achievements.arn
      }
    ]
  })
}

resource "aws_lambda_function" "reject_proof" {
  function_name = "missione-germania-reject-proof"
  role          = aws_iam_role.reject_lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  filename         = data.archive_file.reject_proof.output_path
  source_code_hash = data.archive_file.reject_proof.output_base64sha256

  environment {
    variables = {
      PROOFS_TABLE_NAME = aws_dynamodb_table.mission_proofs.name
    }
  }
}