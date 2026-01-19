// Test script to validate variable replacement logic
// Run with: node test-variable-replacement.js

// OLD VERSION (with bug)
function replaceVariablesOld(text, vars) {
    let result = text;
    for (const [key, value] of Object.entries(vars)) {
        const regex = new RegExp('\\{\\{' + key + '\\}\\}', 'g');
        result = result.replace(regex, value);
    }
    return result;
}

// NEW VERSION (with fix)
function replaceVariables(text, vars) {
    let result = text;
    for (const [key, value] of Object.entries(vars)) {
        // Escape special regex characters in the variable name
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp('\\{\\{' + escapedKey + '\\}\\}', 'g');
        result = result.replace(regex, value);
    }
    return result;
}

// Test cases
const variables = {
    'my-var': 'world',
    'api-key': 'secret123',
    'baseUrl': 'https://api.example.com',
    'user.name': 'john_doe',  // Period in variable name
    'count+1': '42',  // Plus sign in variable name
    'price*tax': '10.50'  // Asterisk in variable name
};

const testCases = [
    {
        input: 'hello {{my-var}}',
        expected: 'hello world',
        description: 'Simple concatenation with dash in variable name'
    },
    {
        input: '{{baseUrl}}/users',
        expected: 'https://api.example.com/users',
        description: 'URL with variable at start'
    },
    {
        input: 'Authorization: Bearer {{api-key}}',
        expected: 'Authorization: Bearer secret123',
        description: 'Header value with variable'
    },
    {
        input: '{{my-var}} {{my-var}}',
        expected: 'world world',
        description: 'Multiple instances of same variable'
    },
    {
        input: 'No variables here',
        expected: 'No variables here',
        description: 'Text without variables'
    },
    {
        input: '{{baseUrl}}/{{my-var}}/{{api-key}}',
        expected: 'https://api.example.com/world/secret123',
        description: 'Multiple different variables'
    },
    {
        input: 'User: {{user.name}}',
        expected: 'User: john_doe',
        description: 'Variable with period (regex special char)'
    },
    {
        input: 'Count: {{count+1}}',
        expected: 'Count: 42',
        description: 'Variable with plus sign (regex special char)'
    },
    {
        input: 'Price: {{price*tax}}',
        expected: 'Price: 10.50',
        description: 'Variable with asterisk (regex special char)'
    }
];

console.log('Testing variable replacement function...\n');
console.log('===== TESTING WITH NEW (FIXED) VERSION =====\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
    const result = replaceVariables(test.input, variables);
    const success = result === test.expected;
    
    if (success) {
        passed++;
        console.log(`✅ Test ${index + 1}: ${test.description}`);
        console.log(`   Input:    "${test.input}"`);
        console.log(`   Output:   "${result}"`);
    } else {
        failed++;
        console.log(`❌ Test ${index + 1}: ${test.description}`);
        console.log(`   Input:    "${test.input}"`);
        console.log(`   Expected: "${test.expected}"`);
        console.log(`   Got:      "${result}"`);
    }
    console.log('');
});

console.log(`Summary (NEW): ${passed} passed, ${failed} failed\n`);

// Test OLD version to show the bug
console.log('===== TESTING WITH OLD (BUGGY) VERSION =====\n');

let passedOld = 0;
let failedOld = 0;

testCases.forEach((test, index) => {
    const result = replaceVariablesOld(test.input, variables);
    const success = result === test.expected;
    
    if (success) {
        passedOld++;
        console.log(`✅ Test ${index + 1}: ${test.description}`);
    } else {
        failedOld++;
        console.log(`❌ Test ${index + 1}: ${test.description}`);
        console.log(`   Input:    "${test.input}"`);
        console.log(`   Expected: "${test.expected}"`);
        console.log(`   Got:      "${result}"`);
        console.log('');
    }
});

console.log(`Summary (OLD): ${passedOld} passed, ${failedOld} failed`);

// Test potential edge cases
console.log('\n--- Edge Cases ---\n');

// Test with hyphens in variable name
const dashTest = replaceVariables('{{my-var}}', {'my-var': 'works'});
console.log(`Hyphen in variable name: "{{my-var}}" -> "${dashTest}" (Expected: "works")`);
console.log(`Status: ${dashTest === 'works' ? '✅ PASS' : '❌ FAIL'}`);
