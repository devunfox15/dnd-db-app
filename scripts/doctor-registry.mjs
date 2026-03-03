#!/usr/bin/env node
import { execSync } from 'node:child_process';

const keys = ['NPM_CONFIG_REGISTRY', 'NPM_REGISTRY_URL', 'NODE_AUTH_TOKEN', 'NPM_TOKEN', 'HTTP_PROXY', 'HTTPS_PROXY'];
console.log('Registry environment check:');
for (const key of keys) {
  const value = process.env[key];
  const shown = value ? `${value.slice(0, 6)}...` : '(not set)';
  console.log(`- ${key}: ${shown}`);
}

try {
  const registry = process.env.NPM_CONFIG_REGISTRY || process.env.NPM_REGISTRY_URL || 'https://registry.npmjs.org/';
  console.log(`\nUsing registry: ${registry}`);
  execSync(`npm ping --registry=${registry}`, { stdio: 'inherit' });
  console.log('\n✅ npm registry ping succeeded.');
} catch (error) {
  console.log('\n⚠️ npm registry ping failed.');
  console.log('If your environment restricts public npm, configure a private mirror and token (see docs/ENV_REGISTRY_RESTRICTIONS.md).');
  process.exitCode = 1;
}
