import { defineConfig } from '@playwright/test';
import base from './playwright.config.mjs';

export default defineConfig({ ...base, testDir: './tests/live', timeout: 120000, workers: 1 });
