import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';

interface SavedHeader {
	key: string;
	value: string;
}

interface SavedRequest {
	id: string;
	name: string;
	url: string;
	method: string;
	headers: SavedHeader[];
	body?: string;
	createdAt: string;
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Postgirl REST client is now active!');

	const sidebarProvider = new SidebarProvider(context);
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider('postgirlSidebar', sidebarProvider)
	);

	const openClientCommand = vscode.commands.registerCommand('postgirl.openRestClient', () => {
		RestClientPanel.createOrShow(context.extensionUri, context, undefined, true);
	});

	const refreshCommand = vscode.commands.registerCommand('postgirl.refreshSidebar', () => {
		sidebarProvider.refresh();
	});

	const deleteRequestCommand = vscode.commands.registerCommand('postgirl.deleteRequest', async (item: SidebarItem) => {
		const requests = context.globalState.get<SavedRequest[]>('postgirl.savedRequests', []);
		const filtered = requests.filter(r => r.id !== item.requestId);
		await context.globalState.update('postgirl.savedRequests', filtered);
		sidebarProvider.refresh();
		vscode.window.showInformationMessage('Request deleted successfully!');
	});

	const loadRequestCommand = vscode.commands.registerCommand('postgirl.loadRequest', (request: SavedRequest) => {
		RestClientPanel.createOrShow(context.extensionUri, context, request, false);
	});

	const searchRequestsCommand = vscode.commands.registerCommand('postgirl.searchRequests', async () => {
		const searchTerm = await vscode.window.showInputBox({
			prompt: 'Search saved requests by name, URL, or method',
			placeHolder: 'Enter search term...',
			value: ''
		});
		if (searchTerm !== undefined) {
			sidebarProvider.setFilter(searchTerm);
		}
	});

	const clearSearchCommand = vscode.commands.registerCommand('postgirl.clearSearch', () => {
		sidebarProvider.clearFilter();
	});

	context.subscriptions.push(openClientCommand, refreshCommand, deleteRequestCommand, loadRequestCommand, searchRequestsCommand, clearSearchCommand);
}

export function deactivate() {}

class SidebarProvider implements vscode.TreeDataProvider<SidebarItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<SidebarItem | undefined | null | void> = new vscode.EventEmitter<SidebarItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<SidebarItem | undefined | null | void> = this._onDidChangeTreeData.event;
	private searchFilter: string = '';

	constructor(private context: vscode.ExtensionContext) {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	setFilter(filter: string): void {
		this.searchFilter = filter.toLowerCase();
		this.refresh();
	}

	clearFilter(): void {
		this.searchFilter = '';
		this.refresh();
	}

	getTreeItem(element: SidebarItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: SidebarItem): Promise<SidebarItem[]> {
		if (!element) {
			const items: SidebarItem[] = [
				new SidebarItem(
					'New Request',
					'Click to open REST client',
					vscode.TreeItemCollapsibleState.None,
					'postgirl.openRestClient',
					'$(add)'
				)
			];

			const savedRequests = this.context.globalState.get<SavedRequest[]>('postgirl.savedRequests', []);
			if (savedRequests.length > 0) {
				items.push(
					new SidebarItem(
						'Saved Requests',
						`${savedRequests.length} request(s) saved`,
						vscode.TreeItemCollapsibleState.Collapsed,
						undefined,
						'$(inbox)'
					)
				);
			}

			const savedHeaders = this.context.globalState.get<SavedHeader[]>('postgirl.savedHeaders', []);
			if (savedHeaders.length > 0) {
				items.push(
					new SidebarItem(
						'Saved Headers',
						`${savedHeaders.length} header(s) saved`,
						vscode.TreeItemCollapsibleState.Collapsed,
						undefined,
						'$(key)'
					)
				);
			}

			return items;
		} else if (element.label === 'Saved Requests') {
			const savedRequests = this.context.globalState.get<SavedRequest[]>('postgirl.savedRequests', []);
			const filteredRequests = this.searchFilter
				? savedRequests.filter(req =>
					req.name.toLowerCase().includes(this.searchFilter) ||
					req.url.toLowerCase().includes(this.searchFilter) ||
					req.method.toLowerCase().includes(this.searchFilter)
				)
				: savedRequests;
			return filteredRequests.map(req => {
				const item = new SidebarItem(
					req.name,
					`${req.method} - ${req.url}`,
					vscode.TreeItemCollapsibleState.None,
					undefined,
					'$(globe)',
					req.id
				);
				item.contextValue = 'savedRequest';
				item.command = {
					command: 'postgirl.loadRequest',
					title: 'Load Request',
					arguments: [req]
				};
				return item;
			});
		} else if (element.label === 'Saved Headers') {
			const savedHeaders = this.context.globalState.get<SavedHeader[]>('postgirl.savedHeaders', []);
			return savedHeaders.map(h => 
				new SidebarItem(
					`${h.key}: ${h.value}`,
					'',
					vscode.TreeItemCollapsibleState.None,
					undefined,
					'$(note)'
				)
			);
		}
		return [];
	}
}

class SidebarItem extends vscode.TreeItem {
	declare contextValue?: string;
	requestId?: string;
	
	constructor(
		public readonly label: string,
		public description: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		private commandId?: string,
		private icon?: string,
		requestId?: string
	) {
		super(label, collapsibleState);
		this.description = description;
		this.requestId = requestId;
		if (commandId) {
			this.command = {
				command: commandId,
				title: label
			};
		}
		if (icon) {
			this.iconPath = new vscode.ThemeIcon(icon.replace('$(', '').replace(')', ''));
		}
	}
}

class RestClientPanel {
	public static currentPanel: RestClientPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];
	private _context: vscode.ExtensionContext;

	public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext, savedRequest?: SavedRequest, clearForm: boolean = false) {
		const column = vscode.window.activeTextEditor?.viewColumn;

		if (RestClientPanel.currentPanel) {
			RestClientPanel.currentPanel._panel.reveal(column);
			if (savedRequest) {
				RestClientPanel.currentPanel.loadSavedRequest(savedRequest);
			} else if (clearForm) {
				RestClientPanel.currentPanel.clearForm();
			}
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			'postgirlRestClient',
			'Postgirl REST Client',
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [extensionUri],
				retainContextWhenHidden: true
			}
		);

		RestClientPanel.currentPanel = new RestClientPanel(panel, extensionUri, context, savedRequest);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext, savedRequest?: SavedRequest) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._context = context;

		this._update();

		if (savedRequest) {
			setTimeout(() => this.loadSavedRequest(savedRequest), 100);
		}

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		this._panel.webview.onDidReceiveMessage(
			async (message) => {
				switch (message.command) {
					case 'makeRequest':
						await this.handleRequest(message.url, message.method, message.headers, message.body);
						break;
					case 'saveHeaders':
						await this.saveHeaders(message.headers);
						break;
					case 'loadHeaders':
						await this.loadHeaders();
						break;
					case 'exportResults':
						await this.exportResults(message.data);
						break;
					case 'saveRequest':
						await this.saveRequestWithPrompt(message.request);
						break;
					case 'showError':
						vscode.window.showErrorMessage(message.message);
						break;
				}
			},
			null,
			this._disposables
		);
	}

	private async handleRequest(url: string, method: string, headers: SavedHeader[], body?: string) {
		try {
			const parsedUrl = new URL(url);
			const isHttps = parsedUrl.protocol === 'https:';
			const httpModule = isHttps ? https : http;

			const headersObj: { [key: string]: string } = {};
			headers.forEach(h => {
				if (h.key && h.value) {
					headersObj[h.key] = h.value;
				}
			});

			const options = {
				hostname: parsedUrl.hostname,
				port: parsedUrl.port,
				path: parsedUrl.pathname + parsedUrl.search,
				method: method,
				headers: headersObj
			};

			const startTime = Date.now();

			const requestPromise = new Promise<{
				statusCode: number;
				statusMessage: string;
				headers: any;
				body: string;
				duration: number;
			}>((resolve, reject) => {
				const req = httpModule.request(options, (res) => {
					let data = '';

					res.on('data', (chunk) => {
						data += chunk;
					});

					res.on('end', () => {
						const duration = Date.now() - startTime;
						resolve({
							statusCode: res.statusCode || 0,
							statusMessage: res.statusMessage || '',
							headers: res.headers,
							body: data,
							duration: duration
						});
					});
				});

				req.on('error', (error) => {
					reject(error);
				});

				if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
					req.write(body);
				}

				req.end();
			});

			const response = await requestPromise;

			this._panel.webview.postMessage({
				command: 'requestComplete',
				success: true,
				response: response,
				request: {
					url: url,
					method: method,
					headers: headersObj,
					body: body
				}
			});

		} catch (error: any) {
			this._panel.webview.postMessage({
				command: 'requestComplete',
				success: false,
				error: error.message
			});
		}
	}

	private async saveHeaders(headers: SavedHeader[]) {
		await this._context.globalState.update('postgirl.savedHeaders', headers);
		vscode.window.showInformationMessage('Headers saved successfully!');
	}

	private async loadHeaders() {
		const savedHeaders = this._context.globalState.get<SavedHeader[]>('postgirl.savedHeaders', []);
		this._panel.webview.postMessage({
			command: 'headersLoaded',
			headers: savedHeaders
		});
	}

	private async exportResults(data: any) {
		const uri = await vscode.window.showSaveDialog({
			defaultUri: vscode.Uri.file('request-response.json'),
			filters: {
				'JSON': ['json'],
				'All Files': ['*']
			}
		});

		if (uri) {
			const content = JSON.stringify(data, null, 2);
			await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
			vscode.window.showInformationMessage('Results exported successfully!');
		}
	}

	private async saveRequest(request: { name: string; url: string; method: string; headers: SavedHeader[]; body?: string }) {
		const savedRequests = this._context.globalState.get<SavedRequest[]>('postgirl.savedRequests', []);
		const newRequest: SavedRequest = {
			id: Date.now().toString(),
			name: request.name,
			url: request.url,
			method: request.method,
			headers: request.headers,
			body: request.body,
			createdAt: new Date().toISOString()
		};
		savedRequests.push(newRequest);
		await this._context.globalState.update('postgirl.savedRequests', savedRequests);
		vscode.window.showInformationMessage(`Request "${request.name}" saved successfully!`);
		vscode.commands.executeCommand('postgirl.refreshSidebar');
	}

	private async saveRequestWithPrompt(request: { url: string; method: string; headers: SavedHeader[]; body?: string }) {
		const name = await vscode.window.showInputBox({
			prompt: 'Enter a name for this request',
			placeHolder: 'My API Request',
			value: request.url,
			validateInput: (value) => {
				return value.trim() ? null : 'Name cannot be empty';
			}
		});

		if (!name) {
			return;
		}

		await this.saveRequest({
			name: name,
			url: request.url,
			method: request.method,
			headers: request.headers,
			body: request.body
		});
	}

	private loadSavedRequest(request: SavedRequest) {
		this._panel.webview.postMessage({
			command: 'loadRequest',
			request: request
		});
	}

	private clearForm() {
		this._panel.webview.postMessage({
			command: 'clearForm'
		});
	}

	public dispose() {
		RestClientPanel.currentPanel = undefined;

		this._panel.dispose();

		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}

	private _update() {
		this._panel.webview.html = this._getHtmlForWebview();
	}

	private _getHtmlForWebview(): string {
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
				<button id="sendBtn" onclick="sendRequest()">Send</button>
			</div>

			<div class="headers-section">
				<label>Headers</label>
				<div id="headersContainer">
					<div class="header-row">
						<input type="text" class="header-key" placeholder="Key" />
						<input type="text" class="header-value" placeholder="Value" />
						<button class="secondary" onclick="removeHeader(this)">Remove</button>
					</div>
				</div>
				<div class="header-actions">
					<button class="secondary" onclick="addHeader()">Add Header</button>
					<button class="secondary" onclick="saveHeaders()">Save Headers</button>
					<button class="secondary" onclick="loadHeaders()">Load Saved Headers</button>
				</div>
			</div>

			<div class="body-section">
				<label>Request Body (JSON)</label>
				<textarea id="requestBody" placeholder='{"key": "value"}'></textarea>
			</div>

			<div class="header-actions">
				<button onclick="saveCurrentRequest()">💾 Save Request</button>
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
				<div class="tab active" onclick="switchTab('body')">Response Body</div>
				<div class="tab" onclick="switchTab('headers')">Response Headers</div>
				<div class="tab" onclick="switchTab('request')">Request Info</div>
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
				<button onclick="exportResults()">Export Results</button>
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

		function addHeader() {
			const container = document.getElementById('headersContainer');
			const headerRow = document.createElement('div');
			headerRow.className = 'header-row';
			headerRow.innerHTML = \`
				<input type="text" class="header-key" placeholder="Key" />
				<input type="text" class="header-value" placeholder="Value" />
				<button class="secondary" onclick="removeHeader(this)">Remove</button>
			\`;
			container.appendChild(headerRow);
		}

		function removeHeader(button) {
			const container = document.getElementById('headersContainer');
			if (container.children.length > 1) {
				button.parentElement.remove();
			}
		}

		function getHeaders() {
			const headers = [];
			const headerRows = document.querySelectorAll('.header-row');
			headerRows.forEach(row => {
				const key = row.querySelector('.header-key').value.trim();
				const value = row.querySelector('.header-value').value.trim();
				if (key || value) {
					headers.push({ key, value });
				}
			});
			return headers;
		}

		function sendRequest() {
			const url = document.getElementById('url').value.trim();
			const method = document.getElementById('method').value;
			const body = document.getElementById('requestBody').value.trim();
			const headers = getHeaders();

			if (!url) {
				alert('Please enter a URL');
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

		function switchTab(tabName) {
			const tabs = document.querySelectorAll('.tab');
			const tabContents = document.querySelectorAll('.tab-content');

			tabs.forEach(tab => tab.classList.remove('active'));
			tabContents.forEach(content => content.classList.remove('active'));

			event.target.classList.add('active');
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
							<button class="secondary" onclick="removeHeader(this)">Remove</button>
						\`;
						container.appendChild(headerRow);
					} else {
						message.headers.forEach(header => {
							const headerRow = document.createElement('div');
							headerRow.className = 'header-row';
							headerRow.innerHTML = \`
								<input type="text" class="header-key" placeholder="Key" value="\${header.key}" />
								<input type="text" class="header-value" placeholder="Value" value="\${header.value}" />
								<button class="secondary" onclick="removeHeader(this)">Remove</button>
							\`;
							container.appendChild(headerRow);
						});
					}
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
							<button class="secondary" onclick="removeHeader(this)">Remove</button>
						\`;
						headersContainer.appendChild(headerRow);
					} else {
						message.request.headers.forEach(header => {
							const headerRow = document.createElement('div');
							headerRow.className = 'header-row';
							headerRow.innerHTML = \`
								<input type="text" class="header-key" placeholder="Key" value="\${header.key}" />
								<input type="text" class="header-value" placeholder="Value" value="\${header.value}" />
								<button class="secondary" onclick="removeHeader(this)">Remove</button>
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
						<button class="secondary" onclick="removeHeader(this)">Remove</button>
					\`;
					clearContainer.appendChild(clearHeaderRow);
					
					document.getElementById('responseSection').style.display = 'none';
					document.getElementById('errorSection').style.display = 'none';
					break;
			}
		});

		// Load saved headers on startup
		loadHeaders();
	</script>
</body>
</html>`;
	}
}
