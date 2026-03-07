# Serverless File Upload Notes

## Current Implementation

The file upload system now works in both **local development** and **serverless environments** (Vercel, AWS Lambda, etc.).

### How it Works:

1. **Local Development:**
   - Files are stored in `./uploads/YYYY/` directory
   - Files are accessible via: `http://localhost:3000/uploads/2026/filename.pdf`

2. **Serverless (Vercel/Lambda):**
   - Files are stored in `/tmp/uploads/YYYY/` directory
   - The `/tmp` directory is the only writable location in serverless environments
   - **⚠️ Important Limitations:**
     - Files in `/tmp` are **temporary** and will be deleted after function execution
     - Files are **not accessible via URL** in serverless environments
     - Maximum `/tmp` storage: 512 MB (AWS Lambda), 100 MB (Vercel)

## Production Recommendations

For production serverless deployments, **DO NOT** use local file storage. Instead, use cloud storage services:

### Recommended Solutions:

1. **AWS S3** (recommended)
   - Unlimited storage
   - Direct file uploads
   - CDN integration via CloudFront
   - npm: `@aws-sdk/client-s3`

2. **Cloudinary**
   - Image/document hosting
   - Automatic optimization
   - Free tier available
   - npm: `cloudinary`

3. **Vercel Blob Storage**
   - Native Vercel integration
   - Simple API
   - npm: `@vercel/blob`

4. **Azure Blob Storage**
   - Microsoft cloud storage
   - Good for .NET apps migrating to Node
   - npm: `@azure/storage-blob`

## Migration to Cloud Storage (Example: AWS S3)

### 1. Install AWS SDK
```bash
npm install @aws-sdk/client-s3 multer-s3
```

### 2. Update `src/middlewares/upload.js`
```javascript
import { S3Client } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_S3_BUCKET_NAME,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const year = new Date().getFullYear();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const sanitizedName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
    
    cb(null, `${year}/${sanitizedName}-${uniqueSuffix}${ext}`);
  },
});
```

### 3. Environment Variables
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your-bucket-name
```

## Current Workaround for Testing

For now, the system will:
- ✅ Work perfectly in local development
- ✅ Accept file uploads in serverless (stored in `/tmp`)
- ⚠️ Files won't be accessible via URL in serverless
- ⚠️ Files will be deleted after function execution

## Next Steps

1. Choose a cloud storage provider (AWS S3 recommended)
2. Set up the cloud storage account
3. Update the upload middleware to use cloud storage
4. Update the Card model to store cloud URLs instead of local paths
5. Remove the local file system utilities

## Testing

Test file uploads:
```bash
# Local development - should work
curl -X POST http://localhost:3000/api/cards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "firstName=Test" \
  -F "contact=1234567890" \
  -F "documents=@/path/to/file.pdf"

# Check uploaded file
ls -la uploads/2026/
```
