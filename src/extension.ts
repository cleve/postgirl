import * as vscode from 'vscode';
import { SavedRequest, Variable, SessionExport } from './types';
import { SidebarProvider, SidebarItem } from './providers/SidebarProvider';
import { RestClientPanel } from './panels/RestClientPanel';

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

	const addVariableCommand = vscode.commands.registerCommand('postgirl.addVariable', async () => {
		const name = await vscode.window.showInputBox({
			prompt: 'Enter variable name (without {{}})',
			placeHolder: 'e.g., baseUrl, token',
			validateInput: (value) => {
				if (!value.trim()) {
					return 'Variable name cannot be empty';
				}
				if (value.includes('{{') || value.includes('}}')) {
					return 'Do not include {{}} in the variable name';
				}
				return null;
			}
		});

		if (!name) {
			return;
		}

		const value = await vscode.window.showInputBox({
			prompt: `Enter value for variable "${name}"`,
			placeHolder: 'Variable value',
			validateInput: (value) => {
				return value.trim() ? null : 'Value cannot be empty';
			}
		});

		if (!value) {
			return;
		}

		const variables = context.globalState.get<Variable[]>('postgirl.variables', []);
		const newVariable: Variable = {
			id: Date.now().toString(),
			name: name.trim(),
			value: value.trim()
		};
		variables.push(newVariable);
		await context.globalState.update('postgirl.variables', variables);
		sidebarProvider.refresh();
		vscode.window.showInformationMessage(`Variable "${name}" added successfully!`);
	});

	const editVariableCommand = vscode.commands.registerCommand('postgirl.editVariable', async (item: SidebarItem) => {
		const variables = context.globalState.get<Variable[]>('postgirl.variables', []);
		const variable = variables.find(v => v.id === item.requestId);
		
		if (!variable) {
			return;
		}

		const newValue = await vscode.window.showInputBox({
			prompt: `Edit value for variable "${variable.name}"`,
			value: variable.value,
			validateInput: (value) => {
				return value.trim() ? null : 'Value cannot be empty';
			}
		});

		if (newValue === undefined) {
			return;
		}

		variable.value = newValue.trim();
		await context.globalState.update('postgirl.variables', variables);
		sidebarProvider.refresh();
		vscode.window.showInformationMessage(`Variable "${variable.name}" updated!`);
	});

	const deleteVariableCommand = vscode.commands.registerCommand('postgirl.deleteVariable', async (item: SidebarItem) => {
		const variables = context.globalState.get<Variable[]>('postgirl.variables', []);
		const filtered = variables.filter(v => v.id !== item.requestId);
		await context.globalState.update('postgirl.variables', filtered);
		sidebarProvider.refresh();
		vscode.window.showInformationMessage('Variable deleted successfully!');
	});

	const exportSessionCommand = vscode.commands.registerCommand('postgirl.exportSession', async () => {
		const savedRequests = context.globalState.get<SavedRequest[]>('postgirl.savedRequests', []);
		const variables = context.globalState.get<Variable[]>('postgirl.variables', []);
		const savedHeaders = context.globalState.get('postgirl.savedHeaders', []);

		if (savedRequests.length === 0 && variables.length === 0 && savedHeaders.length === 0) {
			vscode.window.showWarningMessage('No data to export. Your session is empty.');
			return;
		}

		const sessionData: SessionExport = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			savedRequests,
			variables,
			savedHeaders
		};

		const uri = await vscode.window.showSaveDialog({
			defaultUri: vscode.Uri.file(`postgirl-session-${Date.now()}.pgrl`),
			filters: {
				'Postgirl Session': ['pgrl'],
				'All Files': ['*']
			},
			saveLabel: 'Export Session'
		});

		if (uri) {
			try {
				const jsonString = JSON.stringify(sessionData);
				// Convert to binary using gzip-like compression (Buffer handles binary format)
				const buffer = Buffer.from(jsonString, 'utf8');
				await vscode.workspace.fs.writeFile(uri, buffer);
				vscode.window.showInformationMessage(
					`Session exported successfully! (${savedRequests.length} requests, ${variables.length} variables, ${savedHeaders.length} headers)`
				);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to export session: ${error}`);
			}
		}
	});

	const importSessionCommand = vscode.commands.registerCommand('postgirl.importSession', async () => {
		const uri = await vscode.window.showOpenDialog({
			canSelectMany: false,
			filters: {
				'Postgirl Session': ['pgrl'],
				'All Files': ['*']
			},
			openLabel: 'Import Session'
		});

		if (!uri || uri.length === 0) {
			return;
		}

		// Warning to the user
		const confirmation = await vscode.window.showWarningMessage(
			'⚠️ Importing a session will replace all your current data (requests, variables, and headers). This action cannot be undone. Do you want to continue?',
			{ modal: true },
			'Import and Replace',
			'Cancel'
		);

		if (confirmation !== 'Import and Replace') {
			return;
		}

		try {
			const buffer = await vscode.workspace.fs.readFile(uri[0]);
			const jsonString = Buffer.from(buffer).toString('utf8');
			const sessionData: SessionExport = JSON.parse(jsonString);

			// Validate the session data structure
			if (!sessionData.version || !sessionData.exportedAt) {
				throw new Error('Invalid session file format');
			}

			// Import all data
			await context.globalState.update('postgirl.savedRequests', sessionData.savedRequests || []);
			await context.globalState.update('postgirl.variables', sessionData.variables || []);
			await context.globalState.update('postgirl.savedHeaders', sessionData.savedHeaders || []);

			sidebarProvider.refresh();
			vscode.window.showInformationMessage(
				`Session imported successfully! (${sessionData.savedRequests?.length || 0} requests, ${sessionData.variables?.length || 0} variables, ${sessionData.savedHeaders?.length || 0} headers)`
			);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to import session: ${error}`);
		}
	});

	context.subscriptions.push(openClientCommand, refreshCommand, deleteRequestCommand, loadRequestCommand, searchRequestsCommand, clearSearchCommand, addVariableCommand, editVariableCommand, deleteVariableCommand, exportSessionCommand, importSessionCommand);
}
export function deactivate() {}