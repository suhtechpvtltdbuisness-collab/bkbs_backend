# Vercel Blob Storage Integration Guide

## ✅ Integration Complete!

Your application now uses **Vercel Blob Storage** for file uploads in production, solving the serverless file storage limitations.

## How It Works

### Local Development

- Files are stored locally in `./uploads/YYYY/`
- Accessible at: `http://localhost:5003/uploads/2026/filename.pdf`
- Uses disk storage with multer

### Production (Vercel)

- Files are uploaded directly to **Vercel Blob Storage**
- Returns permanent CDN URLs like: `https://vfeuwz5pprqnrrpu.public.blob.vercel-storage.com/2026/filename-123456.pdf`
- Files are **permanent** and **accessible globally**
- Uses memory storage with multer + Vercel Blob SDK

## Configuration

### Environment Variables

Add to your `.env` file:

```env
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_vFeWWZ5PPRqNRRpU_aBV9tFdL0f7jEiYnPsmdZxNYNftyIn"
```

### Vercel Environment Variables

In your Vercel dashboard, add:

1. Go to your project → Settings → Environment Variables
2. Add: `BLOB_READ_WRITE_TOKEN` = `your_token_here`
3. Apply to: Production, Preview, Development

## File Upload Response

When you upload files in production, the response will now include Vercel Blob URLs:

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "applicationId": "AC-0000000001",
    "firstName": "Rajesh",
    "documents": [
      {
        "filename": "2-1772878941944-256752610.jpg",
        "originalName": "2.jpg",
        "path": "https://vfeuwz5pprqnrrpu.public.blob.vercel-storage.com/2026/2-1772878941944-256752610.jpg",
        "size": 93742,
        "mimetype": "image/jpeg",
        "uploadedAt": "2026-03-07T10:22:21.946Z"
      }
    ]
  }
}
```

## API Usage (No Changes Required!)

The API endpoint remains the same:

```bash
POST /api/cards
Content-Type: multipart/form-data

Fields:
- firstName: string
- middleName: string
- lastName: string
- contact: string
- documents: file[] (max 5 files, 100KB each)
- members: JSON string
```

## Storage Limits

**Vercel Blob - Free Tier:**

- Storage: 1 GB
- Simple Operations: 10k/month
- Advanced Operations: 2k/month
- Data Transfer: 10 GB/month

**Your Current Usage:**

- Storage: 0 B / 1 GB ✅
- Simple Operations: 0 / 10k ✅
- Advanced Operations: 4 / 2k ✅
- Data Transfer: 0 B / 10 GB ✅

## Benefits

✅ **Permanent Storage** - Files don't get deleted after function execution  
✅ **Global CDN** - Fast access from anywhere in the world  
✅ **No /tmp Issues** - Works perfectly in serverless environments  
✅ **Automatic Cleanup** - Old files can be managed via Vercel dashboard  
✅ **Public Access** - Files are accessible via direct URLs  
✅ **Scalable** - Can upgrade to Pro plan for more storage

## Testing

### Test in Local Development

```bash
curl -X POST http://localhost:5003/api/cards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "firstName=Test" \
  -F "lastName=User" \
  -F "contact=1234567890" \
  -F "documents=@/path/to/file.pdf"
```

Files will be stored locally in `./uploads/2026/`

### Test in Production

```bash
curl -X POST https://your-app.vercel.app/api/cards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "firstName=Test" \
  -F "lastName=User" \
  -F "contact=1234567890" \
  -F "documents=@/path/to/file.pdf"
```

Files will be uploaded to Vercel Blob and you'll get a permanent CDN URL.

## Accessing Uploaded Files

### Local Development

```
http://localhost:5003/uploads/2026/filename.pdf
```

### Production

```
https://vfeuwz5pprqnrrpu.public.blob.vercel-storage.com/2026/filename.pdf
```

The URL is stored in the `documents.path` field in the database.

## Migration Notes

### Old Files (Local/Temp)

- Files previously uploaded to `/tmp` are no longer accessible
- Consider them expired/deleted
- New uploads will go to Vercel Blob automatically

### Database Records

- Old cards may have broken file paths (starting with `/tmp/uploads/`)
- These files no longer exist
- New uploads will have permanent Vercel Blob URLs

## Troubleshooting

### Error: "Failed to upload files to cloud storage"

- Check that `BLOB_READ_WRITE_TOKEN` is set correctly
- Verify the token is valid in Vercel dashboard
- Check Vercel Blob storage limits

### Files not accessible

- Verify the blob URL in the database
- Check if blob storage is active in Vercel dashboard
- Ensure blob access is set to "public"

### Local development not working

- Files should still save to `./uploads/` locally
- Make sure the `uploads` directory exists
- Check file permissions

## Managing Files

### View All Files

Go to: https://vercel.com/dashboard/stores/blob/bkbs_docs

### Delete Old Files

```javascript
import { del } from "@vercel/blob";
await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
```

### List All Files

```javascript
import { list } from "@vercel/blob";
const { blobs } = await list({ token: process.env.BLOB_READ_WRITE_TOKEN });
```

## Cost Optimization

To stay within free tier limits:

- Compress images before upload (client-side)
- Set reasonable file size limits (currently 100KB)
- Implement file cleanup for old/deleted cards
- Monitor usage in Vercel dashboard

## Upgrade Path

If you exceed free tier limits:

- **Pro Plan**: $20/month - 100 GB storage, 1M operations
- **Enterprise**: Custom pricing for larger needs

## Next Steps

1. ✅ Deploy to Vercel - changes will take effect automatically
2. ✅ Test file upload in production
3. ✅ Verify files are accessible via CDN URLs
4. ⚠️ Consider implementing file cleanup for deleted cards
5. ⚠️ Monitor usage in Vercel dashboard

## Support

- Vercel Blob Docs: https://vercel.com/docs/storage/vercel-blob
- Vercel Support: https://vercel.com/support
- Your Blob Store: https://vercel.com/dashboard/stores/blob/bkbs_docs
