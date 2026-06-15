resource "aws_s3_bucket" "proofs" {
  bucket = "missione-germania-clan-betelgeuse-2025"
}

resource "aws_s3_bucket_public_access_block" "proofs" {
  bucket = aws_s3_bucket.proofs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "proofs" {
  bucket = aws_s3_bucket.proofs.id

  cors_rule {
    allowed_methods = ["PUT"]
    allowed_origins = ["http://localhost:5173"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "proofs" {
  bucket = aws_s3_bucket.proofs.id

  rule {
    id     = "delete-proofs-after-10-days"
    status = "Enabled"

    filter {
      prefix = "proofs/"
    }

    expiration {
      days = 10
    }
  }
}