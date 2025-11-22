#!/usr/bin/env ts-node
/**
 * Test Dynamic Configuration Loading
 * Verifies that field values (State, Priority, Type, Resolution) are loaded correctly
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const YOUTRACK_URL = process.env.YOUTRACK_URL;
const YOUTRACK_TOKEN = process.env.YOUTRACK_TOKEN;

if (!YOUTRACK_URL || !YOUTRACK_TOKEN) {
  console.error('❌ Missing YOUTRACK_URL or YOUTRACK_TOKEN in .env file');
  process.exit(1);
}

// Ensure baseURL ends with /api
let baseURL = YOUTRACK_URL!;
if (!baseURL.endsWith('/api')) {
  baseURL = baseURL.replace(/\/$/, '') + '/api';
}

const axiosInstance = axios.create({
  baseURL: baseURL,
  headers: {
    Authorization: `Bearer ${YOUTRACK_TOKEN}`,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

interface FieldValue {
  name: string;
  archived?: boolean;
  ordinal?: number;
}

interface Bundle {
  id: string;
  name: string;
  values?: FieldValue[];
}

interface CustomField {
  id: string;
  name: string;
  fieldType?: {
    id: string;
    valueType?: string;
  };
  fieldDefaults?: {
    bundle?: {
      id: string;
      values?: FieldValue[];
    };
  };
}

async function testFieldFetching(fieldName: string): Promise<string[]> {
  console.log(`\n🔍 Testing field: ${fieldName}`);
  
  try {
    // Method 1: Try fieldDefaults.bundle.values
    console.log('   Method 1: Trying fieldDefaults.bundle.values...');
    const fieldsResponse = await axiosInstance.get('/admin/customFieldSettings/customFields', {
      params: {
        fields: 'id,name,fieldType(id,valueType),fieldDefaults(bundle(id,values(name,archived,ordinal)))',
        $top: 100
      }
    });

    console.log(`      API response type: ${typeof fieldsResponse.data}`);
    console.log(`      Is array: ${Array.isArray(fieldsResponse.data)}`);
    console.log(`      Response content: ${JSON.stringify(fieldsResponse.data).substring(0, 200)}`);
    
    // Handle both array and object responses
    const fieldsArray = Array.isArray(fieldsResponse.data) ? fieldsResponse.data : [];
    
    const field = fieldsArray.find(
      (f: CustomField) => f.name.toLowerCase() === fieldName.toLowerCase()
    );

    if (!field) {
      console.log(`   ❌ Field "${fieldName}" not found in custom fields`);
      return [];
    }

    console.log(`   ✅ Found field: ${field.name} (ID: ${field.id})`);
    console.log(`      Field type: ${field.fieldType?.id || 'unknown'}, value type: ${field.fieldType?.valueType || 'unknown'}`);

    if (field.fieldDefaults?.bundle?.values) {
      const values = field.fieldDefaults.bundle.values
        .filter(v => !v.archived)
        .sort((a, b) => (a.ordinal || 0) - (b.ordinal || 0))
        .map(v => v.name);
      
      console.log(`   ✅ Method 1 SUCCESS: Found ${values.length} values from fieldDefaults`);
      console.log(`      Values: ${values.join(', ')}`);
      return values;
    }

    // Method 2: Try bundles enumeration
    console.log('   Method 2: Trying bundle enumeration...');
    if (field.fieldType?.valueType) {
      const bundleType = field.fieldType.valueType.replace(/\[.*\]/, '').toLowerCase();
      console.log(`      Looking for bundles of type: ${bundleType}`);
      
      try {
        const bundlesResponse = await axiosInstance.get<Bundle[]>(
          `/admin/customFieldSettings/bundles/${bundleType}`,
          {
            params: {
              fields: 'id,name,values(name,archived,ordinal)',
              $top: 100
            }
          }
        );

        console.log(`      Found ${bundlesResponse.data.length} bundles of type ${bundleType}`);
        
        if (bundlesResponse.data.length > 0 && bundlesResponse.data[0].values) {
          const values = bundlesResponse.data[0].values
            .filter(v => !v.archived)
            .sort((a, b) => (a.ordinal || 0) - (b.ordinal || 0))
            .map(v => v.name);
          
          console.log(`   ✅ Method 2 SUCCESS: Found ${values.length} values from bundle ${bundlesResponse.data[0].name}`);
          console.log(`      Values: ${values.join(', ')}`);
          return values;
        }
      } catch (bundleError: any) {
        console.log(`   ⚠️  Method 2 failed: ${bundleError.message}`);
      }
    }

    // Method 3: Try project-specific fields
    console.log('   Method 3: Trying project-specific fields...');
    const projectsResponse = await axiosInstance.get('/admin/projects', {
      params: { fields: 'id,shortName', $top: 1 }
    });

    if (projectsResponse.data.length === 0) {
      console.log('   ❌ No projects found for fallback');
      return [];
    }

    const projectId = projectsResponse.data[0].id;
    console.log(`      Using project: ${projectsResponse.data[0].shortName} (${projectId})`);

    const projectFieldsResponse = await axiosInstance.get(
      `/admin/projects/${projectId}/customFields`,
      {
        params: {
          fields: 'field(id,name),bundle(id,values(name,archived,ordinal))',
          $top: 100
        }
      }
    );

    const projectField = projectFieldsResponse.data.find(
      (pf: any) => pf.field.name.toLowerCase() === fieldName.toLowerCase()
    );

    if (projectField?.bundle?.values) {
      const values = projectField.bundle.values
        .filter((v: FieldValue) => !v.archived)
        .sort((a: FieldValue, b: FieldValue) => (a.ordinal || 0) - (b.ordinal || 0))
        .map((v: FieldValue) => v.name);
      
      console.log(`   ✅ Method 3 SUCCESS: Found ${values.length} values from project ${projectsResponse.data[0].shortName}`);
      console.log(`      Values: ${values.join(', ')}`);
      return values;
    }

    console.log('   ❌ All methods failed to find values');
    return [];
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return [];
  }
}

async function main() {
  console.log('[TEST] Testing Dynamic Configuration Loading');
  console.log(`   YouTrack URL: ${YOUTRACK_URL}`);
  console.log(`   Token: ${YOUTRACK_TOKEN?.substring(0, 10)}...`);

  const results: Record<string, string[]> = {};

  // Test each field
  for (const fieldName of ['State', 'Priority', 'Type', 'Resolution']) {
    const values = await testFieldFetching(fieldName);
    results[fieldName] = values;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('[RESULTS] SUMMARY');
  console.log('='.repeat(60));
  
  let allSuccessful = true;
  for (const [fieldName, values] of Object.entries(results)) {
    const status = values.length > 0 ? '[OK]' : '[FAIL]';
    console.log(`${status} ${fieldName}: ${values.length} values`);
    if (values.length === 0) allSuccessful = false;
  }

  console.log('='.repeat(60));
  
  if (allSuccessful) {
    console.log('[SUCCESS] All fields loaded successfully!');
    console.log('\n[INFO] The dynamic config loader should now work correctly.');
    console.log('   Restart the MCP server to see the changes in effect.');
    process.exit(0);
  } else {
    console.log('[ERROR] Some fields failed to load.');
    console.log('\n[INFO] Check the error messages above for details.');
    console.log('   This may indicate an issue with the YouTrack API structure.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
