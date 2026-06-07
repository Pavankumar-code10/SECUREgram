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

        // Squeeze the image completely (no cropping)
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, targetWidth, targetHeight);

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
