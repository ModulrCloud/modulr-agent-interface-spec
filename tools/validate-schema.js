#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Initialize AJV with JSON Schema 2020-12 support
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false,
  validateFormats: true,
  // Disable meta-schema validation
  validateSchema: false
});

addFormats(ajv);

/**
 * Load all schema files and add them to AJV
 */
async function loadSchemas() {
  const schemaFiles = await glob('schemas/**/*.json');

  console.log(`Loading ${schemaFiles.length} schema files...`);

  for (const schemaFile of schemaFiles) {
    try {
      const schemaContent = fs.readFileSync(schemaFile, 'utf8');
      const schema = JSON.parse(schemaContent);

      // Only add schemas that have an $id
      if (schema.$id) {
        ajv.addSchema(schema);
        console.log(`  ✓ Loaded schema: ${schema.$id}`);
      }
    } catch (error) {
      console.error(`  ✗ Error loading schema ${schemaFile}:`, error.message);
      throw error;
    }
  }

  console.log();
}

/**
 * Validate example files against their corresponding schemas
 */
async function validateExamples() {
  const exampleFiles = await glob('examples/**/*.json');

  console.log(`Validating ${exampleFiles.length} example files...\n`);

  let hasErrors = false;

  for (const exampleFile of exampleFiles) {
    try {
      const exampleContent = fs.readFileSync(exampleFile, 'utf8');
      const example = JSON.parse(exampleContent);

      // Determine schema ID based on the message type
      if (!example.type) {
        console.error(`✗ ${exampleFile}: Missing 'type' field`);
        hasErrors = true;
        continue;
      }

      if (!example.version) {
        console.error(`✗ ${exampleFile}: Missing 'version' field`);
        hasErrors = true;
        continue;
      }

      // Map message type to schema URL
      const [category, messageName] = example.type.split('.');
      const version = example.version;
      const majorVersion = 'v' + version.split('.')[0];

      const schemaId = `https://github.com/ModulrCloud/modulr-agent-interface-spec/schemas/${category}/${majorVersion}/${messageName}.json`;

      // Get the compiled schema
      const validate = ajv.getSchema(schemaId);

      if (!validate) {
        console.error(`✗ ${exampleFile}: Schema not found for type '${example.type}' (${schemaId})`);
        hasErrors = true;
        continue;
      }

      // Validate the example
      const valid = validate(example);

      if (valid) {
        console.log(`✓ ${exampleFile}: Valid`);
      } else {
        console.error(`✗ ${exampleFile}: Validation failed`);
        console.error('  Errors:');
        for (const error of validate.errors) {
          console.error(`    - ${error.instancePath || '/'}: ${error.message}`);
          if (error.params) {
            console.error(`      Params: ${JSON.stringify(error.params)}`);
          }
        }
        hasErrors = true;
      }
    } catch (error) {
      console.error(`✗ ${exampleFile}: ${error.message}`);
      hasErrors = true;
    }
  }

  console.log();

  if (hasErrors) {
    console.error('Example validation failed with errors.\n');
  } else {
    console.log('All examples are valid! ✓\n');
  }

  return hasErrors;
}

/**
 * Check that all message schemas have corresponding examples
 */
async function checkExampleCoverage() {
  console.log('Checking example coverage...\n');

  // List of schema patterns that don't need examples (common/infrastructure schemas)
  const EXCLUDED_PATTERNS = [
    /[\/\\]common[\/\\]/,      // Common schemas like envelope, error
    /[\/\\]index\.json$/,      // Index schemas
  ];

  const schemaFiles = await glob('schemas/**/*.json');
  const exampleFiles = await glob('examples/**/*.json');

  // Parse all examples to get their types and versions
  const exampleMap = new Map();
  for (const exampleFile of exampleFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(exampleFile, 'utf8'));
      if (content.type && content.version) {
        const key = `${content.type}:${content.version.split('.')[0]}`;
        exampleMap.set(key, exampleFile);
      }
    } catch (error) {
      // Skip invalid files, they'll be caught in validateExamples
    }
  }

  let hasErrors = false;
  let checkedCount = 0;

  for (const schemaFile of schemaFiles) {
    // Skip excluded patterns
    if (EXCLUDED_PATTERNS.some(pattern => pattern.test(schemaFile))) {
      continue;
    }

    try {
      const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));

      if (!schema.$id) {
        continue;
      }

      // Extract message type from schema
      // Expected format: https://github.com/ModulrCloud/modulr-agent-interface-spec/schemas/{category}/{version}/{messageName}.json
      const idMatch = schema.$id.match(/schemas\/([^\/]+)\/(v\d+)\/([^\/]+)\.json$/);
      if (!idMatch) {
        continue;
      }

      const [, category, version, messageName] = idMatch;
      const messageType = `${category}.${messageName}`;
      const majorVersion = version.replace('v', '');
      const key = `${messageType}:${majorVersion}`;

      checkedCount++;

      if (!exampleMap.has(key)) {
        console.error(`✗ Missing example for schema: ${messageType} (${version})`);
        console.error(`  Schema: ${schemaFile}`);
        console.error(`  Expected example with type="${messageType}" and version="${majorVersion}.x"\n`);
        hasErrors = true;
      } else {
        console.log(`✓ ${messageType} (${version}): ${exampleMap.get(key)}`);
      }
    } catch (error) {
      // Skip files that can't be parsed
    }
  }

  console.log(`\nChecked ${checkedCount} message schemas for example coverage.\n`);

  return hasErrors;
}

/**
 * Check semantic versioning rules
 * This validates that schema IDs follow semver conventions
 */
async function checkSemanticVersioning() {
  console.log('Checking semantic versioning...\n');

  const schemaFiles = await glob('schemas/**/*.json', {
    ignore: ['**/examples/**', '**/node_modules/**']
  });

  let hasErrors = false;

  for (const schemaFile of schemaFiles) {
    try {
      const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));

      if (!schema.$id) {
        continue;
      }

      // Extract version from schema $id
      const idMatch = schema.$id.match(/schemas\/[^\/]+\/(v\d+)\/[^\/]+\.json$/);
      if (!idMatch) {
        // Not a versioned schema, skip
        continue;
      }

      const [, versionInId] = idMatch;

      // Extract version from file path
      const pathMatch = schemaFile.match(/schemas[\\\/][^\\\/]+[\\\/](v\d+)[\\\/]/);
      if (!pathMatch) {
        continue;
      }

      const [, versionInPath] = pathMatch;

      // Check that schema $id version matches file path version
      if (versionInId !== versionInPath) {
        console.error(`✗ Version mismatch in ${schemaFile}`);
        console.error(`  Schema $id uses: ${versionInId}`);
        console.error(`  File path uses: ${versionInPath}`);
        console.error(`  These must match!\n`);
        hasErrors = true;
      } else {
        console.log(`✓ ${schema.$id}: Version ${versionInId} is consistent`);
      }

      // Check description mentions correct version
      if (schema.description) {
        const descMatch = schema.description.match(/\(v(\d+)\.[x\d]+\)/);
        if (descMatch) {
          const descVersion = 'v' + descMatch[1];
          if (descVersion !== versionInId) {
            console.warn(`⚠ ${schemaFile}: Description mentions ${descVersion} but schema is ${versionInId}`);
          }
        }
      }
    } catch (error) {
      // Skip files that can't be parsed
    }
  }

  console.log();
  return hasErrors;
}

/**
 * Check that index.json is correct and complete
 * 
 * index.json should reference all schema messages, but not infrastructure
 * messages like envelope.json. No schema message should exist without being
 * included in the index, and any entry in index should have a corresponding
 * schema file.
 */
async function checkIndexFile() {
  console.log('Checking index.json completeness...\n');

  const indexPath = 'schemas/index.json';

  if (!fs.existsSync(indexPath)) {
    console.error('✗ index.json not found at schemas/index.json\n');
    return true;
  }

  let hasErrors = false;

  try {
    const indexSchema = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

    // Get all message schemas (excluding common and index files)
    const schemaFiles = await glob('schemas/**/*.json');
    const messageSchemas = new Map();

    for (const schemaFile of schemaFiles) {
      // Skip common schemas and index files
      if (/[\/\\]common[\/\\]/.test(schemaFile) || /[\/\\]index\.json$/.test(schemaFile)) {
        continue;
      }

      try {
        const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));

        if (!schema.$id) {
          continue;
        }

        // Extract category, version, and message name from schema $id
        const idMatch = schema.$id.match(/schemas\/([^\/]+)\/(v\d+)\/([^\/]+)\.json$/);
        if (idMatch) {
          const [, category, version, messageName] = idMatch;

          if (!messageSchemas.has(category)) {
            messageSchemas.set(category, new Map());
          }

          const categoryMap = messageSchemas.get(category);
          if (!categoryMap.has(version)) {
            categoryMap.set(version, new Set());
          }

          categoryMap.get(version).add(messageName);
        }
      } catch (error) {
        // Skip files that can't be parsed
      }
    }

    // Check that index.json schema has all required categories and messages
    if (!indexSchema.properties || !indexSchema.properties.schemas || !indexSchema.properties.schemas.properties) {
      console.error('✗ index.json missing expected schema structure (properties.schemas.properties)\n');
      return true;
    }

    const indexedMessages = new Map();

    // Parse index.json schema structure (it's a schema definition with $refs)
    const schemasProps = indexSchema.properties.schemas.properties;

    for (const [category, categoryDef] of Object.entries(schemasProps)) {
      if (!categoryDef.properties) {
        continue;
      }

      indexedMessages.set(category, new Map());

      for (const [version, versionDef] of Object.entries(categoryDef.properties)) {
        if (!versionDef.properties) {
          continue;
        }

        indexedMessages.get(category).set(version, new Set(Object.keys(versionDef.properties)));
      }
    }

    // Check for missing entries in index.json
    for (const [category, versionMap] of messageSchemas) {
      if (!indexedMessages.has(category)) {
        console.error(`✗ Category "${category}" exists in schemas but not in index.json`);
        console.error(`  Add it under properties.schemas.properties.${category}\n`);
        hasErrors = true;
        continue;
      }

      for (const [version, messages] of versionMap) {
        const indexCategory = indexedMessages.get(category);

        if (!indexCategory.has(version)) {
          console.error(`✗ Version "${version}" for category "${category}" exists in schemas but not in index.json`);
          console.error(`  Add it under properties.schemas.properties.${category}.properties.${version}\n`);
          hasErrors = true;
          continue;
        }

        const indexMessages = indexCategory.get(version);

        for (const message of messages) {
          if (!indexMessages.has(message)) {
            console.error(`✗ Message "${category}.${message}" (${version}) exists in schemas but not in index.json`);
            console.error(`  Add "$ref": "./${category}/${version}/${message}.json" to properties.schemas.properties.${category}.properties.${version}.properties.${message}\n`);
            hasErrors = true;
          } else {
            console.log(`✓ ${category}.${message} (${version}) is in index.json`);
          }
        }
      }
    }

    // Check for $refs in index.json that don't have corresponding schemas
    for (const [category, versionMap] of indexedMessages) {
      for (const [version, messages] of versionMap) {
        for (const message of messages) {
          const schemaPath = `schemas/${category}/${version}/${message}.json`;

          if (!fs.existsSync(schemaPath)) {
            console.error(`✗ index.json references ${category}.${message} (${version}) but schema not found at ${schemaPath}\n`);
            hasErrors = true;
          }
        }
      }
    }

    console.log();

  } catch (error) {
    console.error('✗ Error parsing index.json:', error.message);
    console.error(error.stack);
    return true;
  }

  return hasErrors;
}

/**
 * Main execution
 */
async function main() {
  console.log('=== JSON Schema Validation ===\n');

  let hasErrors = false;

  try {
    await loadSchemas();
    if (await validateExamples()) {
      hasErrors = true;
    }
  } catch (error) {
    console.error('Fatal error:', error.message);
    hasErrors = true;
  }

  // Run additional checks
  try {
    if (await checkSemanticVersioning()) {
      hasErrors = true;
    }

    if (await checkExampleCoverage()) {
      hasErrors = true;
    }

    if (await checkIndexFile()) {
      hasErrors = true;
    }
  } catch (error) {
    console.error('Error in additional checks:', error.message);
    hasErrors = true;
  }

  if (hasErrors) {
    console.error('\n❌ Validation completed with errors.');
    process.exit(1);
  } else {
    console.log('\n✅ All validations passed!');
    process.exit(0);
  }
}

main();
