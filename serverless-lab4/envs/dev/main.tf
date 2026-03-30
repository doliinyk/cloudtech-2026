provider "aws" {
  region = "eu-central-1"
}

locals {
  prefix = "oliinyk-denys-11"
}

module "database" {
  source     = "../../modules/dynamodb"
  table_name = "${local.prefix}-table"
}

resource "aws_sqs_queue" "feedback_queue" {
  name = "${local.prefix}-feedback-queue"
}

resource "aws_s3_bucket" "archive" {
  bucket = "${local.prefix}-feedback-archive"
}

module "api_handler" {
  source              = "../../modules/lambda"
  function_name       = "${local.prefix}-api-handler"
  source_dir         = "${path.root}/../../src"
  handler             = "api.handler"
  dynamodb_table_arn  = module.database.table_arn
  dynamodb_table_name = module.database.table_name

  extra_env = {
    QUEUE_URL = aws_sqs_queue.feedback_queue.url
  }

  extra_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["sqs:SendMessage"]
      Resource = aws_sqs_queue.feedback_queue.arn
    }]
  })
}

module "consumer" {
  source              = "../../modules/lambda"
  function_name       = "${local.prefix}-consumer"
  source_dir          = "${path.root}/../../src"
  handler             = "consumer.handler"
  dynamodb_table_arn  = module.database.table_arn
  dynamodb_table_name = module.database.table_name

  extra_env = {
    BUCKET_NAME = aws_s3_bucket.archive.bucket
  }

  extra_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = "${aws_s3_bucket.archive.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Resource = aws_sqs_queue.feedback_queue.arn
      }
    ]
  })
}

resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn        = aws_sqs_queue.feedback_queue.arn
  function_name           = module.consumer.function_name
  batch_size              = 10
  function_response_types = ["ReportBatchItemFailures"]
}

module "api" {
  source               = "../../modules/api_gateway"
  api_name             = "${local.prefix}-http-api"
  lambda_invoke_arn    = module.api_handler.invoke_arn
  lambda_function_name = module.api_handler.function_name
}

output "api_url" {
  value = module.api.api_endpoint
}
