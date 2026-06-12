# Cloud Storage Microservice (Node.js & AWS S3)

A production-grade asynchronous file uploading service that intercepts user files, temporarily stores them in memory buffers, and streams them directly to an AWS S3 bucket. Features rate limiting and collision-free file naming.

## The Problem: The "Hard Drive Crash"

In modern applications, storing user-generated content (images, PDFs, videos) on the local application server quickly exhausts disk space, leading to inevitable server crashes. Furthermore, writing large files to a local disk blocks the Node.js event loop, destroying concurrent request performance.

## The Solution: Memory Buffers & Cloud Streaming

This microservice completely bypasses the local hard drive. Using multer with memory storage, incoming files are captured in RAM and instantly streamed to an infinite-capacity AWS S3 bucket via the AWS SDK v3. The database only needs to store the resulting lightweight CDN string (URL).

## Tech Stack

- **Node.js & Express**: Core server architecture
- **Multer**: Multipart/form-data interception and memory buffering
- **AWS SDK v3** (`@aws-sdk/client-s3`): Cloud streaming and PutObject commands
- **Redis & ioredis**: Rate limiting by IP address
- **Crypto**: Cryptographic hash generation for collision-free file naming
- **Dotenv**: Environment variable management

## Features

- ✅ **Memory-based uploads**: No local disk writes, pure streaming to S3
- ✅ **Rate limiting**: Max 5 uploads per minute per IP address (Redis-backed)
- ✅ **File size limit**: 5MB maximum file size
- ✅ **Collision-free naming**: Random 14-byte hex prefix + original filename
- ✅ **Error handling**: Graceful error responses with proper HTTP status codes

## API Endpoints

### Upload File

```
POST /upload
```

**Request:**
- `Content-Type`: `multipart/form-data`
- `file` (form field): The file to upload (max 5MB)

**Response (Success - 200):**
```json
{
  "message": "File uploaded successfully",
  "url": "https://your-bucket.s3.region.amazonaws.com/randomhash-filename.ext",
  "size": 1024
}
```

**Rate Limit Exceeded (429):**
```json
{
  "error": "Too many requests"
}
```

**No File Provided (400):**
```json
{
  "error": "No file uploaded"
}
```

**Server Error (500):**
```json
{
  "error": "Failed to upload file"
}
```

## Setup & Local Development

### Prerequisites

- **Node.js** (v18+) and **pnpm** (or npm/yarn)
- **AWS account** with an S3 Bucket created and "Public Access" enabled via a Bucket Policy
- **IAM User** with `AmazonS3FullAccess` permission and generated Access Keys
- **Redis** running locally (for rate limiting) or accessible via remote connection

### Installation

1. Clone the repo and install dependencies:

```bash
pnpm install
```

2. Create a `.env` file in the root directory (ensure it is in your `.gitignore`):

```env
PORT=3000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET_NAME=your_bucket_name
```

3. Start the server:

```bash
# Production mode
pnpm start

# Development mode (with auto-reload)
pnpm dev
```

The server will be running on `http://localhost:3000`

### Redis Configuration

By default, the rate limiter connects to a local Redis instance on `localhost:6379`. To use a remote Redis server, modify the connection in [src/middleware/rateLimiter.middleware.js](src/middleware/rateLimiter.middleware.js):

```javascript
const redis = new Redis({
  host: 'your-redis-host',
  port: 6379,
  password: 'your-redis-password' // if required
});
```

### Testing the API

```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@/path/to/your/file.jpg"
```

Expected response:
```json
{
  "message": "File uploaded successfully",
  "url": "https://your-bucket.s3.us-east-1.amazonaws.com/randomhash-filename.jpg",
  "size": 15234
}
```
