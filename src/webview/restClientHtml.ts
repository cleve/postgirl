export function getRestClientHtml(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Postgirl REST Client</title>
	<style>
		* {
			box-sizing: border-box;
		}
		
		body {
			padding: 20px;
			font-family: var(--vscode-font-family);
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
		}

		.container {
			max-width: 1200px;
			margin: 0 auto;
		}

		h1 {
			margin-bottom: 20px;
			color: var(--vscode-foreground);
		}

		.request-section {
			background: var(--vscode-editorWidget-background);
			border: 1px solid var(--vscode-editorWidget-border);
			padding: 20px;
			margin-bottom: 20px;
			border-radius: 4px;
		}

		.url-section {
			display: flex;
			gap: 10px;
			margin-bottom: 20px;
		}

		select, input[type="text"], textarea {
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			padding: 8px;
			border-radius: 2px;
			font-family: var(--vscode-font-family);
		}

		select {
			min-width: 120px;
		}

		input[type="text"] {
			flex: 1;
		}

		button {
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			padding: 8px 16px;
			cursor: pointer;
			border-radius: 2px;
			font-weight: 500;
		}

		button:hover {
			background: var(--vscode-button-hoverBackground);
		}

		button.secondary {
			background: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
		}

		button.secondary:hover {
			background: var(--vscode-button-secondaryHoverBackground);
		}

		.headers-section {
			margin: 20px 0;
		}

		.header-row {
			display: flex;
			gap: 10px;
			margin-bottom: 10px;
			align-items: center;
		}

		.header-row input {
			flex: 1;
		}

		.header-row button {
			padding: 8px 12px;
		}

		.header-actions {
			display: flex;
			gap: 10px;
			margin-top: 10px;
		}

		.body-section {
			margin: 20px 0;
		}

		.body-section textarea {
			width: 100%;
			min-height: 240px;
			font-family: 'Courier New', monospace;
			font-size: 13px;
			line-height: 1.45;
			resize: vertical;
			tab-size: 2;
		}

		.body-editor-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 10px;
			margin-bottom: 8px;
			flex-wrap: wrap;
		}

		.body-editor-actions {
			display: flex;
			gap: 8px;
			align-items: center;
			flex-wrap: wrap;
		}

		button.ghost {
			background: transparent;
			color: var(--vscode-button-foreground);
			border: 1px solid var(--vscode-button-border, var(--vscode-editorWidget-border));
			padding: 6px 10px;
			font-size: 12px;
		}

		button.ghost:hover {
			background: var(--vscode-list-hoverBackground);
		}

		.json-editor-hint {
			font-size: 11px;
			color: var(--vscode-descriptionForeground);
		}

		.request-body-meta {
			display: flex;
			justify-content: space-between;
			gap: 10px;
			margin-top: 8px;
			font-size: 11px;
			color: var(--vscode-descriptionForeground);
			flex-wrap: wrap;
		}

		.json-status-valid {
			color: var(--vscode-testing-iconPassed, #4caf50);
		}

		.json-status-invalid {
			color: var(--vscode-inputValidation-errorBorder, #f44336);
		}

		#requestBody.invalid {
			border-color: var(--vscode-inputValidation-errorBorder);
		}

		#requestBody.validation-warning {
			border-color: var(--vscode-inputValidation-warningBorder);
		}

		.response-section {
			background: var(--vscode-editorWidget-background);
			border: 1px solid var(--vscode-editorWidget-border);
			padding: 20px;
			border-radius: 4px;
			margin-top: 20px;
		}

		.response-info {
			display: flex;
			gap: 20px;
			margin-bottom: 15px;
			flex-wrap: wrap;
		}

		.info-item {
			display: flex;
			flex-direction: column;
		}

		.info-label {
			font-size: 11px;
			color: var(--vscode-descriptionForeground);
			margin-bottom: 4px;
		}

		.info-value {
			font-weight: 500;
		}

		.status-success {
			color: #4caf50;
		}

		.status-error {
			color: #f44336;
		}

		.tabs {
			display: flex;
			gap: 10px;
			border-bottom: 1px solid var(--vscode-editorWidget-border);
			margin-bottom: 15px;
		}

		.tab {
			padding: 8px 16px;
			cursor: pointer;
			border-bottom: 2px solid transparent;
		}

		.tab.active {
			border-bottom-color: var(--vscode-focusBorder);
		}

		.tab-content {
			display: none;
		}

		.tab-content.active {
			display: block;
		}

		pre {
			background: var(--vscode-editor-background);
			padding: 15px;
			border-radius: 4px;
			overflow-x: auto;
			font-size: 13px;
			line-height: 1.5;
		}

		.error-message {
			background: var(--vscode-inputValidation-errorBackground);
			border: 1px solid var(--vscode-inputValidation-errorBorder);
			color: var(--vscode-errorForeground);
			padding: 15px;
			border-radius: 4px;
			margin: 10px 0;
		}

		.export-section {
			margin-top: 15px;
		}

		label {
			display: block;
			margin-bottom: 8px;
			font-weight: 500;
		}

		h3 {
			margin-top: 0;
			margin-bottom: 15px;
		}

		.json-toggle {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 15px;
		}

		.json-toggle input[type="checkbox"] {
			cursor: pointer;
		}

		.json-toggle label {
			margin: 0;
			cursor: pointer;
			font-weight: normal;
		}

		.auth-fields {
			display: flex;
			gap: 10px;
			margin-top: 8px;
			margin-bottom: 15px;
		}

		.auth-fields input {
			flex: 1;
		}

		.schema-section {
			margin-top: 14px;
		}

		.schema-section textarea {
			width: 100%;
			min-height: 140px;
			font-family: 'Courier New', monospace;
			font-size: 12px;
			line-height: 1.4;
			resize: vertical;
			tab-size: 2;
		}

		.schema-meta {
			display: flex;
			justify-content: space-between;
			gap: 10px;
			margin-top: 6px;
			font-size: 11px;
			color: var(--vscode-descriptionForeground);
			flex-wrap: wrap;
		}

		.schema-status-invalid {
			color: var(--vscode-inputValidation-errorBorder, #f44336);
		}

		.schema-status-valid {
			color: var(--vscode-testing-iconPassed, #4caf50);
		}

		#requestSchema.invalid {
			border-color: var(--vscode-inputValidation-errorBorder);
		}
	</style>
</head>
<body>
	<div class="container">
		<h1>🚀 Postgirl REST Client</h1>
		
		<div class="request-section">
			<h3>Request</h3>
			
			<div class="url-section">
				<select id="method">
					<option value="GET">GET</option>
					<option value="POST">POST</option>
					<option value="PUT">PUT</option>
					<option value="PATCH">PATCH</option>
					<option value="DELETE">DELETE</option>
				</select>
				<input type="text" id="url" placeholder="https://api.example.com/endpoint" />
				<button id="sendBtn">Send</button>
				<button id="cancelBtn" class="secondary" style="display: none;">Cancel</button>
			</div>

			<div class="headers-section">
				<label>Headers</label>
				<div id="headersContainer">
					<div class="header-row">
						<input type="text" class="header-key" placeholder="Key" />
						<input type="text" class="header-value" placeholder="Value" />
						<button class="secondary remove-header-btn">Remove</button>
					</div>
				</div>
				<div class="header-actions">
					<button class="secondary" id="addHeaderBtn">Add Header</button>
					<button class="secondary" id="saveHeadersBtn">Save Headers</button>
					<button class="secondary" id="loadHeadersBtn">Load Saved Headers</button>
				</div>
			</div>

			<div class="body-section">
				<div class="json-toggle">
					<input type="checkbox" id="jsonContentType" checked />
					<label for="jsonContentType">Automatically add JSON Content-Type header</label>
				</div>
				<div class="json-toggle">
					<input type="checkbox" id="basicAuthEnabled" />
					<label for="basicAuthEnabled">Basic Auth</label>
				</div>
				<div class="json-toggle">
					<input type="checkbox" id="schemaValidationEnabled" />
					<label for="schemaValidationEnabled">Validate request body against JSON Schema before send</label>
				</div>
				<div class="auth-fields" id="basicAuthFields" style="display: none;">
					<input type="text" id="basicAuthUser" placeholder="Username" />
					<input type="password" id="basicAuthPass" placeholder="Password" />
				</div>
				<div class="body-editor-header">
					<label for="requestBody" style="margin-bottom: 0;">Request Body (JSON)</label>
					<div class="body-editor-actions">
						<button type="button" class="ghost" id="formatJsonBtn">Format</button>
						<button type="button" class="ghost" id="minifyJsonBtn">Minify</button>
						<button type="button" class="ghost" id="clearJsonBtn">Clear</button>
					</div>
				</div>
				<textarea id="requestBody" placeholder='{"key": "value"}' spellcheck="false"></textarea>
				<div class="request-body-meta">
					<span id="jsonValidationStatus">Empty body</span>
					<span id="requestBodyStats">0 chars | Ln 1, Col 1</span>
				</div>
				<div class="schema-section" id="schemaSection" style="display: none;">
					<label for="requestSchema">Request Schema (JSON Schema)</label>
					<textarea id="requestSchema" placeholder='{"type":"object","required":["name"],"properties":{"name":{"type":"string"}}}' spellcheck="false"></textarea>
					<div class="schema-meta">
						<span id="schemaValidationStatus">Schema validator disabled</span>
						<span id="schemaStats">0 chars</span>
					</div>
				</div>
			</div>

			<div class="header-actions">
				<button id="saveRequestBtn">💾 Save Request</button>
				<button class="secondary" id="saveAsNewBtn" style="display: none;">➕ Save as New</button>
				<button class="secondary" id="exportCurlBtn">Copy as cURL</button>
			</div>
		</div>

		<div id="responseSection" class="response-section" style="display: none;">
			<h3>Response</h3>
			
			<div class="response-info">
				<div class="info-item">
					<span class="info-label">Status</span>
					<span class="info-value" id="statusCode"></span>
				</div>
				<div class="info-item">
					<span class="info-label">Time</span>
					<span class="info-value" id="duration"></span>
				</div>
				<div class="info-item">
					<span class="info-label">Size</span>
					<span class="info-value" id="size"></span>
				</div>
			</div>

			<div class="tabs">
				<div class="tab active" data-tab="body">Response Body</div>
				<div class="tab" data-tab="headers">Response Headers</div>
				<div class="tab" data-tab="request">Request Info</div>
			</div>

			<div id="bodyTab" class="tab-content active">
				<pre id="responseBody"></pre>
			</div>

			<div id="headersTab" class="tab-content">
				<pre id="responseHeaders"></pre>
			</div>

			<div id="requestTab" class="tab-content">
				<pre id="requestInfo"></pre>
			</div>

			<div class="export-section">
				<button id="copyResultsBtn">Copy Results</button>
			</div>
		</div>

		<div id="errorSection" style="display: none;">
			<div class="error-message" id="errorMessage"></div>
		</div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();
		let currentResponse = null;
		let currentRequest = null;
		let variables = {}; // Variables loaded from sidebar
		let currentRequestId = null; // Track active request for cancellation
		let editingRequest = null; // Track loaded saved request for in-place updates

		function addHeader() {
			const container = document.getElementById('headersContainer');
			const headerRow = document.createElement('div');
			headerRow.className = 'header-row';
			headerRow.innerHTML = \`
				<input type="text" class="header-key" placeholder="Key" />
				<input type="text" class="header-value" placeholder="Value" />
				<button class="secondary remove-header-btn">Remove</button>
			\`;
			container.appendChild(headerRow);
		}

		function removeHeader(event) {
			const button = event.target;
			const container = document.getElementById('headersContainer');
			const headerRow = button.closest('.header-row');
			
			if (container.children.length > 1) {
				// Remove the row if there are multiple headers
				headerRow.remove();
			} else {
				// Clear the inputs if it's the last header row
				headerRow.querySelector('.header-key').value = '';
				headerRow.querySelector('.header-value').value = '';
			}
		}

		function getHeaders() {
			const headers = [];
			const headerRows = document.querySelectorAll('#headersContainer .header-row');
			const jsonContentTypeEnabled = document.getElementById('jsonContentType').checked;
			const basicAuthEnabled = document.getElementById('basicAuthEnabled').checked;
			
			headerRows.forEach(row => {
				const key = row.querySelector('.header-key').value.trim();
				const value = row.querySelector('.header-value').value.trim();
				if (key || value) {
					headers.push({ key, value });
				}
			});
			
			// Add Content-Type header if JSON option is enabled and not already present
			if (jsonContentTypeEnabled) {
				const hasContentType = headers.some(h => 
					h.key.toLowerCase() === 'content-type'
				);
				if (!hasContentType) {
					headers.push({ key: 'Content-Type', value: 'application/json' });
				}
			}

			// Add Authorization header if Basic Auth is enabled and not already present
			if (basicAuthEnabled) {
				const user = document.getElementById('basicAuthUser').value;
				const pass = document.getElementById('basicAuthPass').value;
				const hasAuthorization = headers.some(h =>
					h.key.toLowerCase() === 'authorization'
				);
				if (!hasAuthorization) {
					const encoded = btoa(user + ':' + pass);
					headers.push({ key: 'Authorization', value: 'Basic ' + encoded });
				}
			}
			
			return headers;
		}

		function replaceVariables(text, vars) {
			let result = text;
			for (const [key, value] of Object.entries(vars)) {
				// Escape special regex characters in the variable name
				const escapedKey = key.replace(/[-\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
				const regex = new RegExp('\\\\{\\\\{' + escapedKey + '\\\\}\\\\}', 'g');
				result = result.replace(regex, value);
			}
			return result;
		}

		function getRequestBodyElement() {
			return document.getElementById('requestBody');
		}

		function parseRequestBodyJson() {
			const body = getRequestBodyElement().value.trim();
			if (!body) {
				return { state: 'empty' };
			}

			try {
				const parsed = JSON.parse(body);
				return { state: 'valid', parsed: parsed };
			} catch (error) {
				return {
					state: 'invalid',
					error: error && error.message ? error.message : 'Invalid JSON'
				};
			}
		}

		function getCaretLineAndColumn(text, caretPosition) {
			const beforeCaret = text.slice(0, caretPosition);
			const lines = beforeCaret.split('\\n');
			const line = lines.length;
			const column = lines[lines.length - 1].length + 1;
			return { line: line, column: column };
		}

		function updateRequestBodyMeta() {
			const bodyElement = getRequestBodyElement();
			const statusElement = document.getElementById('jsonValidationStatus');
			const statsElement = document.getElementById('requestBodyStats');
			const parseResult = parseRequestBodyJson();
			const caret = getCaretLineAndColumn(bodyElement.value, bodyElement.selectionStart || 0);

			statsElement.textContent = bodyElement.value.length + ' chars | Ln ' + caret.line + ', Col ' + caret.column;

			statusElement.classList.remove('json-status-valid', 'json-status-invalid');
			bodyElement.classList.remove('invalid', 'validation-warning');

			if (parseResult.state === 'empty') {
				statusElement.textContent = 'Empty body';
				return;
			}

			if (parseResult.state === 'valid') {
				statusElement.textContent = 'Valid JSON';
				statusElement.classList.add('json-status-valid');
				return;
			}

			statusElement.textContent = parseResult.error;
			statusElement.classList.add('json-status-invalid');
			bodyElement.classList.add('invalid');
		}

		function formatRequestBodyJson(minify) {
			const bodyElement = getRequestBodyElement();
			const parseResult = parseRequestBodyJson();

			if (parseResult.state === 'empty') {
				return;
			}

			if (parseResult.state === 'invalid') {
				bodyElement.classList.add('validation-warning');
				updateRequestBodyMeta();
				return;
			}

			bodyElement.value = minify
				? JSON.stringify(parseResult.parsed)
				: JSON.stringify(parseResult.parsed, null, 2);
			bodyElement.selectionStart = bodyElement.value.length;
			bodyElement.selectionEnd = bodyElement.value.length;
			updateRequestBodyMeta();
		}

		function clearRequestBody() {
			getRequestBodyElement().value = '';
			updateRequestBodyMeta();
		}

		function getRequestSchemaElement() {
			return document.getElementById('requestSchema');
		}

		function parseJsonText(text, label) {
			const content = text.trim();
			if (!content) {
				return { ok: false, error: label + ' is empty' };
			}

			try {
				return { ok: true, value: JSON.parse(content) };
			} catch (error) {
				return {
					ok: false,
					error: label + ' is not valid JSON: ' + (error && error.message ? error.message : 'Invalid JSON')
				};
			}
		}

		function isInteger(value) {
			return Number.isInteger(value);
		}

		function getDataType(value) {
			if (value === null) {
				return 'null';
			}
			if (Array.isArray(value)) {
				return 'array';
			}
			if (typeof value === 'number' && isInteger(value)) {
				return 'integer';
			}
			return typeof value;
		}

		function isTypeMatch(value, expectedType) {
			if (expectedType === 'number') {
				return typeof value === 'number' && !Number.isNaN(value);
			}
			if (expectedType === 'integer') {
				return typeof value === 'number' && isInteger(value);
			}
			if (expectedType === 'array') {
				return Array.isArray(value);
			}
			if (expectedType === 'null') {
				return value === null;
			}
			if (expectedType === 'object') {
				return value !== null && typeof value === 'object' && !Array.isArray(value);
			}
			return typeof value === expectedType;
		}

		function validateBySchema(data, schema, path, errors) {
			const currentPath = path || '$';

			if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
				errors.push(currentPath + ': schema must be an object');
				return;
			}

			if (schema.type !== undefined) {
				const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
				const matched = allowedTypes.some(type => isTypeMatch(data, type));

				if (!matched) {
					errors.push(currentPath + ': expected type ' + allowedTypes.join(' or ') + ' but got ' + getDataType(data));
					return;
				}
			}

			if (schema.const !== undefined && JSON.stringify(data) !== JSON.stringify(schema.const)) {
				errors.push(currentPath + ': value must equal const ' + JSON.stringify(schema.const));
			}

			if (schema.enum && Array.isArray(schema.enum)) {
				const enumMatch = schema.enum.some(item => JSON.stringify(item) === JSON.stringify(data));
				if (!enumMatch) {
					errors.push(currentPath + ': value is not in enum');
				}
			}

			if (typeof data === 'string') {
				if (typeof schema.minLength === 'number' && data.length < schema.minLength) {
					errors.push(currentPath + ': minLength is ' + schema.minLength);
				}
				if (typeof schema.maxLength === 'number' && data.length > schema.maxLength) {
					errors.push(currentPath + ': maxLength is ' + schema.maxLength);
				}
				if (schema.pattern) {
					try {
						const pattern = new RegExp(schema.pattern);
						if (!pattern.test(data)) {
							errors.push(currentPath + ': does not match pattern ' + schema.pattern);
						}
					} catch (_) {
						errors.push(currentPath + ': invalid pattern in schema');
					}
				}
			}

			if (typeof data === 'number') {
				if (typeof schema.minimum === 'number' && data < schema.minimum) {
					errors.push(currentPath + ': minimum is ' + schema.minimum);
				}
				if (typeof schema.maximum === 'number' && data > schema.maximum) {
					errors.push(currentPath + ': maximum is ' + schema.maximum);
				}
				if (typeof schema.exclusiveMinimum === 'number' && data <= schema.exclusiveMinimum) {
					errors.push(currentPath + ': must be > ' + schema.exclusiveMinimum);
				}
				if (typeof schema.exclusiveMaximum === 'number' && data >= schema.exclusiveMaximum) {
					errors.push(currentPath + ': must be < ' + schema.exclusiveMaximum);
				}
			}

			if (Array.isArray(data)) {
				if (typeof schema.minItems === 'number' && data.length < schema.minItems) {
					errors.push(currentPath + ': minItems is ' + schema.minItems);
				}
				if (typeof schema.maxItems === 'number' && data.length > schema.maxItems) {
					errors.push(currentPath + ': maxItems is ' + schema.maxItems);
				}

				if (schema.items && typeof schema.items === 'object') {
					data.forEach((item, index) => {
						validateBySchema(item, schema.items, currentPath + '[' + index + ']', errors);
					});
				}
			}

			if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
				const required = Array.isArray(schema.required) ? schema.required : [];
				required.forEach(key => {
					if (!(key in data)) {
						errors.push(currentPath + ': missing required property "' + key + '"');
					}
				});

				const properties = schema.properties && typeof schema.properties === 'object'
					? schema.properties
					: {};

				Object.keys(properties).forEach(key => {
					if (key in data) {
						validateBySchema(data[key], properties[key], currentPath + '.' + key, errors);
					}
				});

				if (schema.additionalProperties === false) {
					Object.keys(data).forEach(key => {
						if (!(key in properties)) {
							errors.push(currentPath + ': additional property "' + key + '" is not allowed');
						}
					});
				} else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
					Object.keys(data).forEach(key => {
						if (!(key in properties)) {
							validateBySchema(data[key], schema.additionalProperties, currentPath + '.' + key, errors);
						}
					});
				}
			}
		}

		function validateRequestBodyAgainstSchema(bodyText) {
			if (!document.getElementById('schemaValidationEnabled').checked) {
				return { ok: true };
			}

			const schemaElement = getRequestSchemaElement();
			const schemaText = schemaElement.value.trim();
			const bodyContent = bodyText.trim();

			// If there is no request body, there is nothing to validate.
			if (!bodyContent) {
				return { ok: true };
			}

			// Keep schema validation opt-in: empty schema means "skip" instead of hard-blocking send.
			if (!schemaText) {
				return { ok: true };
			}

			const schemaResult = parseJsonText(schemaElement.value, 'Schema');
			if (!schemaResult.ok) {
				return { ok: false, error: schemaResult.error };
			}

			const bodyResult = parseJsonText(bodyText, 'Request body');
			if (!bodyResult.ok) {
				return { ok: false, error: bodyResult.error };
			}

			const errors = [];
			validateBySchema(bodyResult.value, schemaResult.value, '$', errors);
			if (errors.length > 0) {
				return { ok: false, error: errors.slice(0, 5).join(' | ') };
			}

			return { ok: true };
		}

		function updateSchemaMeta() {
			const schemaElement = getRequestSchemaElement();
			const statusElement = document.getElementById('schemaValidationStatus');
			const statsElement = document.getElementById('schemaStats');
			const schemaEnabled = document.getElementById('schemaValidationEnabled').checked;

			statsElement.textContent = schemaElement.value.length + ' chars';
			statusElement.classList.remove('schema-status-valid', 'schema-status-invalid');
			schemaElement.classList.remove('invalid');

			if (!schemaEnabled) {
				statusElement.textContent = 'Schema validator disabled';
				return;
			}

			if (!schemaElement.value.trim()) {
				statusElement.textContent = 'Schema is empty (validation skipped)';
				return;
			}

			const result = parseJsonText(schemaElement.value, 'Schema');
			if (result.ok) {
				statusElement.textContent = 'Schema JSON is valid';
				statusElement.classList.add('schema-status-valid');
				return;
			}

			statusElement.textContent = result.error;
			statusElement.classList.add('schema-status-invalid');
			schemaElement.classList.add('invalid');
		}

		function toggleSchemaSection() {
			const isEnabled = document.getElementById('schemaValidationEnabled').checked;
			document.getElementById('schemaSection').style.display = isEnabled ? '' : 'none';
			updateSchemaMeta();
		}

		function sendRequest() {
			if (document.getElementById('sendBtn').disabled) {
				return;
			}

			let url = document.getElementById('url').value.trim();
			const method = document.getElementById('method').value;
			let body = document.getElementById('requestBody').value.trim();
			const headers = getHeaders();

			// Log available variables for debugging
			console.log('[Postgirl] Available variables:', variables);

			// Replace variables in URL
			const originalUrl = url;
			url = replaceVariables(url, variables);
			if (originalUrl !== url) {
				console.log('[Postgirl] URL after variable replacement:', url);
			}
			
			// Replace variables in headers
			headers.forEach(header => {
				header.key = replaceVariables(header.key, variables);
				header.value = replaceVariables(header.value, variables);
			});
			
			// Replace variables in body
			body = replaceVariables(body, variables);

			const schemaValidation = validateRequestBodyAgainstSchema(body);
			if (!schemaValidation.ok) {
				document.getElementById('responseSection').style.display = 'none';
				document.getElementById('errorSection').style.display = 'block';
				document.getElementById('errorMessage').textContent = 'Schema validation failed: ' + schemaValidation.error;
				return;
			}

			if (!url) {
				vscode.postMessage({
					command: 'showError',
					message: 'Please enter a URL'
				});
				return;
			}

			document.getElementById('errorSection').style.display = 'none';
			document.getElementById('responseSection').style.display = 'none';
			document.getElementById('sendBtn').textContent = 'Sending...';
			document.getElementById('sendBtn').disabled = true;
			document.getElementById('cancelBtn').style.display = 'inline-block';

			// Generate unique request ID
			currentRequestId = Date.now().toString();

			vscode.postMessage({
				command: 'makeRequest',
				requestId: currentRequestId,
				url: url,
				method: method,
				headers: headers,
				body: body || undefined
			});
		}

		function cancelRequest() {
			if (currentRequestId) {
				vscode.postMessage({
					command: 'cancelRequest',
					requestId: currentRequestId
				});
				document.getElementById('sendBtn').textContent = 'Send';
				document.getElementById('sendBtn').disabled = false;
				document.getElementById('cancelBtn').style.display = 'none';
				currentRequestId = null;
				
				document.getElementById('errorSection').style.display = 'block';
				document.getElementById('errorMessage').textContent = 'Request cancelled by user';
			}
		}

		function saveHeaders() {
			const headers = getHeaders();
			vscode.postMessage({
				command: 'saveHeaders',
				headers: headers
			});
		}

		function loadHeaders() {
			vscode.postMessage({
				command: 'loadHeaders'
			});
		}

		function copyResults() {
			if (currentResponse && currentRequest) {
				vscode.postMessage({
					command: 'copyResults',
					data: {
						request: currentRequest,
						response: currentResponse,
						timestamp: new Date().toISOString()
					}
				});
			}
		}

		function shellEscape(value) {
			return "'" + value.replace(/'/g, "'\\''") + "'";
		}

		function buildCurlCommand(url, method, headers, body) {
			const commandParts = [];

			if (method !== 'GET') {
				commandParts.push('-X ' + method);
			}

			headers.forEach(header => {
				if (!header.key) {
					return;
				}
				const headerValue = header.value ? header.key + ': ' + header.value : header.key + ':';
				commandParts.push('-H ' + shellEscape(headerValue));
			});

			if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
				commandParts.push('--data-raw ' + shellEscape(body));
			}

			commandParts.push(shellEscape(url));

			if (commandParts.length === 1) {
				return 'curl ' + commandParts[0];
			}

			return ['curl', ...commandParts].join(' ');
		}

		function exportRequestAsCurl() {
			let url = document.getElementById('url').value.trim();
			const method = document.getElementById('method').value;
			let body = document.getElementById('requestBody').value.trim();
			const headers = getHeaders();

			if (!url) {
				vscode.postMessage({
					command: 'showError',
					message: 'Please enter a URL before exporting'
				});
				return;
			}

			url = replaceVariables(url, variables);
			headers.forEach(header => {
				header.key = replaceVariables(header.key, variables);
				header.value = replaceVariables(header.value, variables);
			});
			body = replaceVariables(body, variables);

			const curlCommand = buildCurlCommand(url, method, headers, body);

			vscode.postMessage({
				command: 'exportRequestAsCurl',
				curl: curlCommand
			});
		}

		function saveCurrentRequest() {
			try {
				const url = document.getElementById('url').value.trim();
				const method = document.getElementById('method').value;
				const body = document.getElementById('requestBody').value.trim();
				const headers = getHeaders();

				if (!url) {
					vscode.postMessage({
						command: 'showError',
						message: 'Please enter a URL before saving'
					});
					return;
				}

				vscode.postMessage({
					command: 'saveRequest',
					request: {
						id: editingRequest ? editingRequest.id : undefined,
						name: editingRequest ? editingRequest.name : undefined,
						collectionId: editingRequest ? editingRequest.collectionId : undefined,
						url: url,
						method: method,
						headers: headers,
						body: body || undefined
					}
				});
			} catch (error) {
				console.error('Error saving request:', error);
			}
		}

		function saveAsNewRequest() {
			try {
				const url = document.getElementById('url').value.trim();
				const method = document.getElementById('method').value;
				const body = document.getElementById('requestBody').value.trim();
				const headers = getHeaders();

				if (!url) {
					vscode.postMessage({
						command: 'showError',
						message: 'Please enter a URL before saving'
					});
					return;
				}

				vscode.postMessage({
					command: 'saveRequest',
					request: {
						url: url,
						method: method,
						headers: headers,
						body: body || undefined
					}
				});
			} catch (error) {
				console.error('Error saving as new request:', error);
			}
		}

		function switchTab(event) {
			const clickedTab = event.target;
			const tabName = clickedTab.dataset.tab;
			
			const tabs = document.querySelectorAll('.tab');
			const tabContents = document.querySelectorAll('.tab-content');

			tabs.forEach(tab => tab.classList.remove('active'));
			tabContents.forEach(content => content.classList.remove('active'));

			clickedTab.classList.add('active');
			document.getElementById(tabName + 'Tab').classList.add('active');
		}

		function formatBytes(bytes) {
			if (bytes === 0) return '0 Bytes';
			const k = 1024;
			const sizes = ['Bytes', 'KB', 'MB'];
			const i = Math.floor(Math.log(bytes) / Math.log(k));
			return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
		}

		function unwrapJsonString(value) {
			let currentValue = value;

			for (let depth = 0; depth < 2; depth++) {
				if (typeof currentValue !== 'string') {
					break;
				}

				const trimmedValue = currentValue.trim();
				if (!trimmedValue) {
					break;
				}

				try {
					currentValue = JSON.parse(trimmedValue);
				} catch (error) {
					break;
				}
			}

			return currentValue;
		}

		function formatJSON(json) {
			try {
				const parsed = unwrapJsonString(json);

				if (typeof parsed === 'string') {
					return parsed;
				}

				return JSON.stringify(parsed, null, 2);
			} catch (e) {
				return json;
			}
		}

		window.addEventListener('message', event => {
			const message = event.data;

			switch (message.command) {
				case 'requestComplete':
					document.getElementById('sendBtn').textContent = 'Send';
					document.getElementById('sendBtn').disabled = false;
					document.getElementById('cancelBtn').style.display = 'none';
					currentRequestId = null;

					if (message.success) {
						currentResponse = message.response;
						currentRequest = message.request;

						document.getElementById('errorSection').style.display = 'none';
						document.getElementById('responseSection').style.display = 'block';

						const statusCode = message.response.statusCode;
						const statusElement = document.getElementById('statusCode');
						statusElement.textContent = statusCode + ' ' + message.response.statusMessage;
						statusElement.className = 'info-value ' + (statusCode >= 200 && statusCode < 300 ? 'status-success' : 'status-error');

						document.getElementById('duration').textContent = message.response.duration + ' ms';
						document.getElementById('size').textContent = formatBytes(message.response.body.length);

						document.getElementById('responseBody').textContent = formatJSON(message.response.body);
						document.getElementById('responseHeaders').textContent = JSON.stringify(message.response.headers, null, 2);
						document.getElementById('requestInfo').textContent = JSON.stringify({
							url: message.request.url,
							method: message.request.method,
							headers: message.request.headers,
							body: message.request.body
						}, null, 2);
					} else {
						document.getElementById('responseSection').style.display = 'none';
						document.getElementById('errorSection').style.display = 'block';
						document.getElementById('errorMessage').textContent = 'Error: ' + message.error;
					}
					break;

				case 'headersLoaded':
					const container = document.getElementById('headersContainer');
					container.innerHTML = '';
					
					if (message.headers.length === 0) {
						const headerRow = document.createElement('div');
						headerRow.className = 'header-row';
						headerRow.innerHTML = \`
							<input type="text" class="header-key" placeholder="Key" />
							<input type="text" class="header-value" placeholder="Value" />
						<button class="secondary remove-header-btn">Remove</button>
						\`;
						container.appendChild(headerRow);
					} else {
						message.headers.forEach(header => {
							const headerRow = document.createElement('div');
							headerRow.className = 'header-row';
							headerRow.innerHTML = \`
								<input type="text" class="header-key" placeholder="Key" value="\${header.key}" />
								<input type="text" class="header-value" placeholder="Value" value="\${header.value}" />
								<button class="secondary remove-header-btn">Remove</button>
							\`;
							container.appendChild(headerRow);
						});
					}
					break;

				case 'variablesLoaded':
					variables = message.variables || {};
					console.log('[Postgirl] Variables loaded:', variables);
					break;

				case 'loadRequest':
					editingRequest = {
						id: message.request.id,
						name: message.request.name,
						collectionId: message.request.collectionId
					};
					document.getElementById('saveRequestBtn').textContent = '✏️ Update Request';
					document.getElementById('saveAsNewBtn').style.display = '';
					document.getElementById('url').value = message.request.url;
					document.getElementById('method').value = message.request.method;
					document.getElementById('requestBody').value = message.request.body || '';
					updateRequestBodyMeta();
					
					// Check if Content-Type: application/json is in the headers
					const hasJsonContentType = message.request.headers.some(h => 
						h.key.toLowerCase() === 'content-type' && h.value.toLowerCase().includes('application/json')
					);
					document.getElementById('jsonContentType').checked = hasJsonContentType;

					// Check if Authorization: Basic ... is in the headers
					const basicAuthHeader = message.request.headers.find(h =>
						h.key.toLowerCase() === 'authorization' && h.value.toLowerCase().startsWith('basic ')
					);
					if (basicAuthHeader) {
						try {
							const decoded = atob(basicAuthHeader.value.slice(6));
							const colonIdx = decoded.indexOf(':');
							document.getElementById('basicAuthUser').value = colonIdx >= 0 ? decoded.slice(0, colonIdx) : decoded;
							document.getElementById('basicAuthPass').value = colonIdx >= 0 ? decoded.slice(colonIdx + 1) : '';
						} catch (e) {
							document.getElementById('basicAuthUser').value = '';
							document.getElementById('basicAuthPass').value = '';
						}
						document.getElementById('basicAuthEnabled').checked = true;
						document.getElementById('basicAuthFields').style.display = '';
					} else {
						document.getElementById('basicAuthEnabled').checked = false;
						document.getElementById('basicAuthUser').value = '';
						document.getElementById('basicAuthPass').value = '';
						document.getElementById('basicAuthFields').style.display = 'none';
					}
					
					const headersContainer = document.getElementById('headersContainer');
					headersContainer.innerHTML = '';
					
					if (message.request.headers.length === 0) {
						const headerRow = document.createElement('div');
						headerRow.className = 'header-row';
						headerRow.innerHTML = \`
							<input type="text" class="header-key" placeholder="Key" />
							<input type="text" class="header-value" placeholder="Value" />
						<button class="secondary remove-header-btn">Remove</button>
						\`;
						headersContainer.appendChild(headerRow);
					} else {
						message.request.headers.forEach(header => {
							const headerRow = document.createElement('div');
							headerRow.className = 'header-row';
							headerRow.innerHTML = \`
								<input type="text" class="header-key" placeholder="Key" value="\${header.key}" />
								<input type="text" class="header-value" placeholder="Value" value="\${header.value}" />
								<button class="secondary remove-header-btn">Remove</button>
							\`;
							headersContainer.appendChild(headerRow);
						});
					}
					break;

				case 'clearForm':
					editingRequest = null;
					document.getElementById('saveRequestBtn').textContent = '💾 Save Request';
					document.getElementById('saveAsNewBtn').style.display = 'none';
					document.getElementById('url').value = '';
					document.getElementById('method').value = 'GET';
					document.getElementById('requestBody').value = '';
					updateRequestBodyMeta();
					document.getElementById('schemaValidationEnabled').checked = false;
					document.getElementById('requestSchema').value = '';
					toggleSchemaSection();
					document.getElementById('jsonContentType').checked = true;
					document.getElementById('basicAuthEnabled').checked = false;
					document.getElementById('basicAuthUser').value = '';
					document.getElementById('basicAuthPass').value = '';
					document.getElementById('basicAuthFields').style.display = 'none';
					
					const clearContainer = document.getElementById('headersContainer');
					clearContainer.innerHTML = '';
					const clearHeaderRow = document.createElement('div');
					clearHeaderRow.className = 'header-row';
					clearHeaderRow.innerHTML = \`
						<input type="text" class="header-key" placeholder="Key" />
						<input type="text" class="header-value" placeholder="Value" />
						<button class="secondary remove-header-btn">Remove</button>
					\`;
					clearContainer.appendChild(clearHeaderRow);
					
					document.getElementById('responseSection').style.display = 'none';
					document.getElementById('errorSection').style.display = 'none';
					break;
			}
		});

		// Event listeners
		document.getElementById('sendBtn').addEventListener('click', sendRequest);
		document.getElementById('cancelBtn').addEventListener('click', cancelRequest);
		document.getElementById('addHeaderBtn').addEventListener('click', addHeader);
		document.getElementById('saveHeadersBtn').addEventListener('click', saveHeaders);
		document.getElementById('loadHeadersBtn').addEventListener('click', loadHeaders);
		document.getElementById('saveRequestBtn').addEventListener('click', saveCurrentRequest);
		document.getElementById('saveAsNewBtn').addEventListener('click', saveAsNewRequest);
		document.getElementById('exportCurlBtn').addEventListener('click', exportRequestAsCurl);
		document.getElementById('formatJsonBtn').addEventListener('click', function() {
			formatRequestBodyJson(false);
		});
		document.getElementById('minifyJsonBtn').addEventListener('click', function() {
			formatRequestBodyJson(true);
		});
		document.getElementById('clearJsonBtn').addEventListener('click', clearRequestBody);
		document.getElementById('basicAuthEnabled').addEventListener('change', function() {
			document.getElementById('basicAuthFields').style.display = this.checked ? '' : 'none';
		});
		document.getElementById('schemaValidationEnabled').addEventListener('change', toggleSchemaSection);
		document.getElementById('requestSchema').addEventListener('input', updateSchemaMeta);
		document.getElementById('requestSchema').addEventListener('keyup', updateSchemaMeta);
		document.getElementById('copyResultsBtn').addEventListener('click', copyResults);
		document.getElementById('requestBody').addEventListener('input', updateRequestBodyMeta);
		document.getElementById('requestBody').addEventListener('click', updateRequestBodyMeta);
		document.getElementById('requestBody').addEventListener('keyup', updateRequestBodyMeta);
		
		// Event delegation for remove header buttons
		document.getElementById('headersContainer').addEventListener('click', function(e) {
			if (e.target.classList.contains('remove-header-btn')) {
				removeHeader(e);
			}
		});
		
		// Tab switching
		document.querySelectorAll('.tab').forEach(tab => {
			tab.addEventListener('click', switchTab);
		});

		// Load saved headers and variables on startup
		updateRequestBodyMeta();
		toggleSchemaSection();
		loadHeaders();
		vscode.postMessage({ command: 'loadVariables' });
	</script>
</body>
</html>`;
}
