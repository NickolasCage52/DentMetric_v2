/**
 * Утилиты для работы с изображениями.
 * correctImageOrientation: перерисовка через canvas для корректировки EXIF orientation (iOS).
 */

/**
 * Корректирует ориентацию фото (особенно с iOS) без внешних библиотек.
 * Рисует изображение на canvas и возвращает blob — браузер применяет EXIF при drawImage.
 * @param {File|Blob} file — исходный файл
 * @returns {Promise<Blob>} — blob с корректной ориентацией
 */
export function correctImageOrientation(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => resolve(blob ?? file),
          file.type || 'image/jpeg',
          0.92
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result ?? '';
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
