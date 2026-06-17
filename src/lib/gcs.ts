/**
 * Helper functions to attach to Google Cloud Storage endpoints.
 */

/**
 * Uploads a file directly through our backend proxy using Multer.
 * Best for smaller files across slower networks where signed URLs might expire,
 * or when you want the server to do pre-processing.
 */
export async function uploadToGCSProxy(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/gcs/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to upload file to GCS");
  }

  const data = await response.json();
  return data.url; // Returns the public URL of the uploaded object
}

/**
 * Uploads a file via Signed URL directly to Google Cloud Storage.
 * Best for large files as it bypasses the Node backend and pipes directly to Google.
 */
export async function uploadToGCS(file: File): Promise<string> {
  // 1. Get the signed URL
  const signedUrlRes = await fetch("/api/gcs/generate-upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
    }),
  });

  if (!signedUrlRes.ok) {
    const errorData = await signedUrlRes.json();
    throw new Error(errorData.error || "Failed to get signed URL");
  }

  const { signedUrl, publicUrl } = await signedUrlRes.json();

  // 2. Upload directly to GCS using the signed URL
  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error("Failed to upload file directly to Google Cloud Storage");
  }

  // 3. Return the public URL
  return publicUrl;
}
