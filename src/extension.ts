import * as vscode from 'vscode';
import { SavedRequest, Variable } from './types';
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

	context.subscriptions.push(openClientCommand, refreshCommand, deleteRequestCommand, loadRequestCommand, searchRequestsCommand, clearSearchCommand, addVariableCommand, editVariableCommand, deleteVariableCommand);
}
export function deactivate() {}