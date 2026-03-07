# Deployment Checklist - Vercel Blob Integration

## ✅ Pre-Deployment (Completed)

- [x] Installed `@vercel/blob` package
- [x] Created `src/utils/vercelBlob.js` upload utility
- [x] Updated `src/middlewares/upload.js` for dual storage (memory + disk)
- [x] Updated `src/controllers/cardController.js` with conditional upload logic
- [x] Added `BLOB_READ_WRITE_TOKEN` to `.env` file
- [x] Updated documentation

## 🚀 Deployment Steps

### 1. Push Code to Git

```bash
git add .
git commit -m "feat: integrate Vercel Blob Storage for file uploads"
git push origin main
```

### 2. Configure Vercel Environment Variable

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Open your project
3. Navigate to: **Settings → Environment Variables**
4. Add new variable:
   - **Name:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** `vercel_blob_rw_vFeWWZ5PPRqNRRpU_aBV9tFdL0f7jEiYnPsmdZxNYNftyIn`
   - **Environment:** Select all (Production, Preview, Development)
5. Click **Save**

### 3. Trigger Deployment

Option A - Automatic (recommended):

- Push to GitHub triggers auto-deployment
- Wait for deployment to complete

Option B - Manual:

- Go to Vercel Dashboard → Deployments
- Click **Redeploy** on latest deployment
- Check "Use existing Build Cache" for faster deployment

### 4. Verify Deployment

Check deployment logs for any errors:

- Go to Vercel Dashboard → Deployments
- Click on latest deployment
- Check **Build Logs** and **Function Logs**

## ✅ Post-Deployment Testing

### Test 1: Health Check

```bash
curl https://your-app.vercel.app/api
```

Expected: `{"message": "BKBS API is running"}`

### Test 2: Login & Get Token

```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

Copy the `accessToken` from response.

### Test 3: Upload Card with Documents

```bash
curl -X POST https://your-app.vercel.app/api/cards \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "firstName=TestUser" \
  -F "lastName=Production" \
  -F "contact=9999999999" \
  -F "documents=@/path/to/test-file.pdf" \
  -F "documents=@/path/to/test-image.jpg"
```

### Test 4: Verify File URLs

Check the response from Test 3:

```json
{
  "documents": [
    {
      "path": "https://vfeuwz5pprqnrrpu.public.blob.vercel-storage.com/2026/test-file-...",
      ...
    }
  ]
}
```

✅ URLs should start with `https://` (Vercel Blob)  
❌ URLs should NOT start with `/uploads/` or `/tmp/`

### Test 5: Access File Directly

Copy a file URL from Test 4 response and open in browser:

```
https://vfeuwz5pprqnrrpu.public.blob.vercel-storage.com/2026/filename.pdf
```

✅ File should open/download successfully  
❌ Should NOT show 404 error

### Test 6: Get Card Details

```bash
curl https://your-app.vercel.app/api/cards/CARD_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Verify `documents` array contains Vercel Blob URLs.

## 🐛 Troubleshooting

### Issue: Files still saving to /tmp

**Symptom:** Document paths start with `/tmp/uploads/`

**Solution:**

1. Check environment variable is set correctly in Vercel
2. Redeploy the application
3. Check if `BLOB_READ_WRITE_TOKEN` is present in function logs

### Issue: "Failed to upload files to cloud storage"

**Symptom:** Error 500 with message about cloud storage

**Possible Causes:**

1. Invalid `BLOB_READ_WRITE_TOKEN`
2. Token not set in Vercel environment variables
3. Vercel Blob service is down

**Solution:**

1. Verify token in Vercel Dashboard → Storage → Blob → bkbs_docs
2. Copy the correct `Read-Write Token`
3. Update environment variable in Vercel
4. Redeploy

### Issue: Files upload but URLs return 404

**Symptom:** File URL returns 404 Not Found

**Possible Causes:**

1. Blob store not set to "public" access
2. Wrong blob store region
3. File upload failed silently

**Solution:**

1. Go to Vercel Dashboard → Storage → Blob → bkbs_docs
2. Check "Access" is set to **Public**
3. Verify files exist in blob store dashboard

### Issue: File size too large

**Symptom:** Error "File too large"

**Current Limits:**

- Max file size: 100 KB per file
- Max files per upload: 5 files
- Vercel function payload limit: 4.5 MB

**Solution:** Compress files before uploading or increase limits in code.

## 📊 Monitor Usage

### Check Vercel Blob Usage

1. Go to: https://vercel.com/dashboard/stores/blob/bkbs_docs
2. Monitor:
   - Storage used / 1 GB
   - Simple Operations / 10k per month
   - Data Transfer / 10 GB per month

### Check Function Logs

1. Go to: Vercel Dashboard → Project → Logs
2. Filter by: **Functions**
3. Look for file upload logs

## 🔄 Rollback Plan

If something goes wrong:

### Quick Rollback

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click **⋯ (three dots)** → **Promote to Production**

### Code Rollback

```bash
git revert HEAD
git push origin main
```

This reverts to previous version.

## 📝 Next Steps After Deployment

1. **Monitor for 24 hours** - Check logs for any errors
2. **Test file uploads** - Upload various file types
3. **Check storage usage** - Monitor Vercel Blob dashboard
4. **Update client apps** - Ensure they handle new URL format
5. **Document changes** - Update API documentation if needed

## 🎉 Success Criteria

Deployment is successful if:

- [x] Application deploys without errors
- [x] Card creation works in production
- [x] Files upload to Vercel Blob (URLs start with `https://`)
- [x] Files are accessible via direct URLs
- [x] No `/tmp` or local paths in production
- [x] File uploads work with multiple files
- [x] File size and type validation works

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs/storage/vercel-blob
- **Vercel Support:** https://vercel.com/support
- **Blob Store Dashboard:** https://vercel.com/dashboard/stores/blob/bkbs_docs

---

**Deployment Date:** _[Fill after deployment]_  
**Deployed By:** _[Your name]_  
**Deployment Status:** _[Success/Failed]_  
**Notes:** _[Any issues or observations]_
