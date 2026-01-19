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
			min-height: 150px;
			font-family: 'Courier New', monospace;
			font-size: 13px;
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
				<label>Request Body (JSON)</label>
				<textarea id="requestBody" placeholder='{"key": "value"}'></textarea>
			</div>

			<div class="header-actions">
				<button id="saveRequestBtn">💾 Save Request</button>
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
				<button id="exportBtn">Export Results</button>
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
			headerRows.forEach(row => {
				const key = row.querySelector('.header-key').value.trim();
				const value = row.querySelector('.header-value').value.trim();
				if (key || value) {
					headers.push({ key, value });
				}
			});
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

		function sendRequest() {
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

			vscode.postMessage({
				command: 'makeRequest',
				url: url,
				method: method,
				headers: headers,
				body: body || undefined
			});
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

		function exportResults() {
			if (currentResponse && currentRequest) {
				vscode.postMessage({
					command: 'exportResults',
					data: {
						request: currentRequest,
						response: currentResponse,
						timestamp: new Date().toISOString()
					}
				});
			}
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

		function formatJSON(json) {
			try {
				const parsed = JSON.parse(json);
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
					document.getElementById('url').value = message.request.url;
					document.getElementById('method').value = message.request.method;
					document.getElementById('requestBody').value = message.request.body || '';
					
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
					document.getElementById('url').value = '';
					document.getElementById('method').value = 'GET';
					document.getElementById('requestBody').value = '';
					
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
		document.getElementById('addHeaderBtn').addEventListener('click', addHeader);
		document.getElementById('saveHeadersBtn').addEventListener('click', saveHeaders);
		document.getElementById('loadHeadersBtn').addEventListener('click', loadHeaders);
		document.getElementById('saveRequestBtn').addEventListener('click', saveCurrentRequest);
		document.getElementById('exportBtn').addEventListener('click', exportResults);
		
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
		loadHeaders();
		vscode.postMessage({ command: 'loadVariables' });
	</script>
</body>
</html>`;
}
