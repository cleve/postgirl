import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import { SavedHeader, SavedRequest, Variable } from '../types';
import { getRestClientHtml } from '../webview/restClientHtml';

export class RestClientPanel {
	public static currentPanel: RestClientPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];
	private _context: vscode.ExtensionContext;
	private _activeRequests: Map<string, http.ClientRequest> = new Map();

	public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext, savedRequest?: SavedRequest, clearForm: boolean = false) {
		const column = vscode.window.activeTextEditor?.viewColumn;

		if (RestClientPanel.currentPanel) {
			RestClientPanel.currentPanel._panel.reveal(column);
			if (savedRequest) {
				// Add small delay to ensure webview is ready after reveal
				setTimeout(() => {
					RestClientPanel.currentPanel?.loadSavedRequest(savedRequest);
				}, 50);
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
					await this.handleRequest(message.requestId, message.url, message.method, message.headers, message.body);
					break;
				case 'cancelRequest':
					this.cancelRequest(message.requestId);
						break;
					case 'saveHeaders':
						await this.saveHeaders(message.headers);
						break;
					case 'loadHeaders':
						await this.loadHeaders();
					break;
				case 'loadVariables':
					await this.loadVariables();
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

	private async handleRequest(requestId: string, url: string, method: string, headers: SavedHeader[], body?: string) {
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
						// Clean up request from active requests
						this._activeRequests.delete(requestId);
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
					// Clean up request from active requests
					this._activeRequests.delete(requestId);
					reject(error);
				});

				// Store the request so it can be cancelled
				this._activeRequests.set(requestId, req);

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

	private cancelRequest(requestId: string) {
		const req = this._activeRequests.get(requestId);
		if (req) {
			req.destroy();
			this._activeRequests.delete(requestId);
			vscode.window.showInformationMessage('Request cancelled');
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

	private async loadVariables() {
		const variables = this._context.globalState.get<Variable[]>('postgirl.variables', []);
		const variablesObj: { [key: string]: string } = {};
		variables.forEach(v => {
			variablesObj[v.name] = v.value;
		});
		this._panel.webview.postMessage({
			command: 'variablesLoaded',
			variables: variablesObj
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
		return getRestClientHtml();
	}
}
