import { defineConfig } from 'vitest/config';

/**
 * شبكة اختبارات المكوّنات المعتمدة على DOM (R60).
 *
 * تبقى مستقلة عن `vitest.config.ts`: اختبارات H16 للوحدات تعمل في Node وبمقام
 * تغطية محروس، أما هذه فتحتاج jsdom وReact Testing Library ولا تدخل ذلك المقام.
 */
export default defineConfig({
  test: {
    include: ['tests/components/**/*.test.tsx'],
    environment: 'jsdom',
    setupFiles: ['tests/components/setup.ts'],
    globals: false,
    reporters: ['default'],
  },
});
