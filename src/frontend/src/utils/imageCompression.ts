/**
 * Compresses and resizes an image File before uploading.
 *
 * - Resizes to a max width/height of 1200px (preserves aspect ratio)
 * - Compresses to JPEG at 78% quality
 * - Returns a new File object ready for upload
 * - Falls back to the original file if compression fails
 *
 * Typical result: 3–4 MB camera photo → 120–200 KB
 */
export async function compressImage(
  file: File,
  maxDimension = 1200,
  quality = 0.78,
): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const { width, height } = img;

      // Calculate new dimensions keeping aspect ratio
      let newWidth = width;
      let newHeight = height;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          newWidth = maxDimension;
          newHeight = Math.round((height / width) * maxDimension);
        } else {
          newHeight = maxDimension;
          newWidth = Math.round((width / height) * maxDimension);
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file); // fallback
        return;
      }

      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file); // fallback
            return;
          }
          // Keep original name but with .jpg extension
          const name = `${file.name.replace(/\.[^.]+$/, "")}.jpg`;
          const compressed = new File([blob], name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // fallback to original on error
    };

    img.src = objectUrl;
  });
}
