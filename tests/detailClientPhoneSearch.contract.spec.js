/**
 * Контракт: поиск клиента в Detail — только по телефону (без watcher на имя).
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, '../src/components/detail/DetailClientScreen.vue');
const src = readFileSync(filePath, 'utf8');

describe('DetailClientScreen — phone-only lookup', () => {
  it('единственный watch, вызывающий searchByPhone, завязан на clientPhone', () => {
    const parts = src.split(/watch\s*\(/);
    const withCall = parts.filter(
      (p) => p.includes('props.searchByPhone') || p.includes('searchByPhone?.(')
    );
    expect(withCall.length).toBe(1);
    expect(withCall[0]).toContain('localModel.value.clientPhone');
    expect(withCall[0]).not.toContain('localModel.value.clientName');
  });
});
