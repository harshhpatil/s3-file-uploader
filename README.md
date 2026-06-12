# Cloud Storage Microservice (Node.js & AWS S3)

A production-grade asynchronous file uploading service that intercepts user files, temporarily stores them in memory buffers, and streams them directly to an AWS S3 bucket.

## The Problem: The "Hard Drive Crash"

In modern applications, storing user-generated content (images, PDFs, videos) on the local application server quickly exhausts disk space, leading to inevitable server crashes. Furthermore, writing large files to a local disk blocks the Node.js event loop, destroying concurrent request performance.

## The Solution: Memory Buffers & Cloud Streaming

This microservice completely bypasses the local hard drive. Using multer with memory storage, incoming files are captured in RAM and instantly streamed to an infinite-capacity AWS S3 bucket via the AWS SDK v3. The database only needs to store the resulting lightweight CDN string (URL).

## Tech Stack

- **Node.js & Express**: Core server architecture
- **Multer**: Multipart/form-data interception and memory buffering
- **AWS SDK v3** (`@aws-sdk/client-s3`): Cloud streaming and PutObject commands
- **Crypto**: Cryptographic hash generation for collision-free file naming

## API Endpoints

### Upload File

```
POST /upload
```

- Accepts `multipart/form-data` with a file key
- Sanitizes the filename to prevent browser encoding errors
- Appends a cryptographic hash to prevent overwriting cloud objects
- **Returns**: HTTP 200 with the live, publicly accessible Amazon S3 URL

## Setup & Local Development

### Prerequisites

- AWS account with an S3 Bucket created and "Public Access" enabled via a Bucket Policy
- IAM User with `AmazonS3FullAccess` and generated Access Keys

### Installation

1. Clone the repo and install dependencies:

```bash
pnpm install
```

2. Create a `.env` file (ensure it is in your `.gitignore`):

```env
PORT=3000
AWS_REGION=your_region
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
```

3. Start the server:

```bash
node index.js
```
