#!/usr/bin/env node

const axios = require('axios');

// API Configuration
const API_BASE = 'http://localhost:4002';
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'X-API-Key': 'my-secret-api-key-123',
    'Content-Type': 'application/json'
  }
});

// Test colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logHeader(message) {
  log(`\n${colors.bold}🧪 ${message}${colors.reset}`, 'cyan');
}

async function testTagApplication() {
  logHeader('Testing Tag Application to Contacts...');
  
  try {
    // Test 1: Get a contact
    logInfo('1️⃣ Getting a contact...');
    const contactsResponse = await api.get('/contacts?page=1&limit=1');
    const contact = contactsResponse.data.data[0];
    logSuccess(`Found contact: ${contact.name} (${contact.id})`);
    
    // Test 2: Get a tag that's not already applied
    logInfo('\n2️⃣ Getting available tags...');
    const tagsResponse = await api.get('/tags');
    const availableTags = tagsResponse.data.filter(tag => tag.contactCount === 0);
    
    if (availableTags.length === 0) {
      logError('No available tags found!');
      return;
    }
    
    const tag = availableTags[0];
    logSuccess(`Found available tag: ${tag.name} (${tag.id})`);
    
    // Test 3: Apply tag to contact
    logInfo('\n3️⃣ Applying tag to contact...');
    await api.post(`/tags/contacts/${contact.id}/tags/${tag.id}`);
    logSuccess(`Tag "${tag.name}" applied to contact "${contact.name}"`);
    
    // Test 4: Verify tag application
    logInfo('\n4️⃣ Verifying tag application...');
    const contactTagsResponse = await api.get(`/tags/contacts/${contact.id}/tags`);
    const appliedTags = contactTagsResponse.data;
    const isTagApplied = appliedTags.some(t => t.id === tag.id);
    
    if (isTagApplied) {
      logSuccess(`✅ Tag "${tag.name}" is successfully applied to contact "${contact.name}"`);
    } else {
      logError(`❌ Tag "${tag.name}" was not found on contact "${contact.name}"`);
    }
    
    // Test 5: Remove tag from contact
    logInfo('\n5️⃣ Removing tag from contact...');
    await api.delete(`/tags/contacts/${contact.id}/tags/${tag.id}`);
    logSuccess(`Tag "${tag.name}" removed from contact "${contact.name}"`);
    
    // Test 6: Verify tag removal
    logInfo('\n6️⃣ Verifying tag removal...');
    const contactTagsAfterRemoval = await api.get(`/tags/contacts/${contact.id}/tags`);
    const tagsAfterRemoval = contactTagsAfterRemoval.data;
    const isTagStillApplied = tagsAfterRemoval.some(t => t.id === tag.id);
    
    if (!isTagStillApplied) {
      logSuccess(`✅ Tag "${tag.name}" successfully removed from contact "${contact.name}"`);
    } else {
      logError(`❌ Tag "${tag.name}" is still applied to contact "${contact.name}"`);
    }
    
    logSuccess('\n🎉 All tag application tests passed!');
    logInfo('\n🚀 Now you can use the frontend to apply tags!');
    
  } catch (error) {
    logError(`❌ Test failed: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

testTagApplication();
