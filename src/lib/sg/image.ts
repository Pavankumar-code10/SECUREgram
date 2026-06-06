/**
 * Resizes and compresses any image file to a fixed size of 600x600 pixels (center-cropped)
 * and returns it as a JPEG Blob.
 */
export function resizeAndCompressImage(file: File, targetWidth = 600, targetHeight = 600): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get 2d context"));
          return;
        }

        // Draw image stretched or centered to the fixed target size
        // Crop-center the image (fill cover style):
        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;

        if (imgRatio > targetRatio) {
          // Image is wider
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          // Image is taller
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas conversion to blob failed"));
            }
          },
          "image/jpeg",
          0.85 // quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
