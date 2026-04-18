import { saveAnnotatedPhoto } from '@/utils/attachmentStorage';

export interface MigrationResult {
  migrated: number;
  skipped: number;
  failed: number;
  total: number;
}

/**
 * One-time migration: inline annotatedPhotoDataUrl → IndexedDB.
 * Safe to call repeatedly; does not throw.
 */
export async function migrateLegacyPhotosToIdb(
  records: any[]
): Promise<{ records: any[]; result: MigrationResult }> {
  const result: MigrationResult = {
    migrated: 0,
    skipped: 0,
    failed: 0,
    total: records.length,
  };

  const updatedRecords = await Promise.all(
    records.map(async (record) => {
      if (record?.annotatedPhotoRef && !record.annotatedPhotoDataUrl) {
        result.skipped++;
        return record;
      }
      if (
        !record?.annotatedPhotoDataUrl ||
        typeof record.annotatedPhotoDataUrl !== 'string' ||
        !record.annotatedPhotoDataUrl.startsWith('data:')
      ) {
        return record;
      }
      const photoId = record.id;
      if (!photoId) {
        result.failed++;
        return record;
      }
      try {
        await saveAnnotatedPhoto(photoId, record.annotatedPhotoDataUrl);
        result.migrated++;
        return {
          ...record,
          annotatedPhotoRef: photoId,
          annotatedPhotoDataUrl: null,
        };
      } catch (err) {
        console.warn(`[Migration] Failed to migrate photo for record ${photoId}:`, err);
        result.failed++;
        return record;
      }
    })
  );

  return { records: updatedRecords, result };
}
