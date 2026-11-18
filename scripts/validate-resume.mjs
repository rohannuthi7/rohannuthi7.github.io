// Validates public/resume.json against the JSON Resume schema (jsonresume.org).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const schema = require('resume-schema');
const resume = JSON.parse(readFileSync(fileURLToPath(new URL('../public/resume.json', import.meta.url)), 'utf8'));
schema.validate(resume, (err) => {
  if (err) { console.error('resume.json is invalid:', JSON.stringify(err, null, 2)); process.exit(1); }
  console.log('resume.json is valid JSON Resume');
});
