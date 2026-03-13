import * as vscode from 'vscode';
import { RequestCollection, SavedRequest, Variable, SessionExport } from './types';
import { SidebarProvider, SidebarItem } from './providers/SidebarProvider';
import { RestClientPanel } from './panels/RestClientPanel';

export function activate(context: vscode.ExtensionContext) {
	console.log('Postgirl REST client is now active!');

	const parsePostmanCollection = (data: any): { requests: SavedRequest[]; variables: Variable[]; collections: RequestCollection[] } => {
		const requests: SavedRequest[] = [];
		const variables: Variable[] = [];
		const collections: RequestCollection[] = [];
		const now = Date.now();
		const collectionIdsByName = new Map<string, string>();

		const normalizeHeaders = (headers: any[] | undefined): { key: string; value: string }[] => {
			if (!Array.isArray(headers)) {
				return [];
			}
			return headers
				.filter(h => h && !h.disabled && (h.key || h.value))
				.map(h => ({ key: String(h.key ?? '').trim(), value: String(h.value ?? '').trim() }))
				.filter(h => h.key || h.value);
		};

		const encodeFormBody = (items: any[] | undefined): string | undefined => {
			if (!Array.isArray(items)) {
				return undefined;
			}
			const pairs = items
				.filter(i => i && !i.disabled && i.key)
				.map(i => `${encodeURIComponent(String(i.key))}=${encodeURIComponent(String(i.value ?? ''))}`);
			return pairs.length ? pairs.join('&') : undefined;
		};

		const buildBody = (body: any): string | undefined => {
			if (!body || typeof body !== 'object') {
				return undefined;
			}
			switch (body.mode) {
				case 'raw':
					return typeof body.raw === 'string' ? body.raw : undefined;
				case 'urlencoded':
					return encodeFormBody(body.urlencoded);
				case 'formdata':
					return encodeFormBody(body.formdata);
				default:
					return undefined;
			}
		};

		const buildUrl = (url: any): string => {
			if (typeof url === 'string') {
				return url;
			}
			if (!url || typeof url !== 'object') {
				return '';
			}
			if (typeof url.raw === 'string') {
				return url.raw;
			}

			const protocol = url.protocol ? `${url.protocol}://` : '';
			const host = Array.isArray(url.host) ? url.host.join('.') : (url.host ?? '');
			const port = url.port ? `:${url.port}` : '';
			const path = Array.isArray(url.path) ? `/${url.path.join('/')}` : (url.path ? `/${url.path}` : '');
			const query = Array.isArray(url.query)
				? `?${url.query
						.filter((q: any) => q && q.key)
						.map((q: any) => `${encodeURIComponent(String(q.key))}=${encodeURIComponent(String(q.value ?? ''))}`)
						.join('&')}`
				: '';

			return `${protocol}${host}${port}${path}${query}`;
		};

		const ensureCollection = (parents: string[]): string | undefined => {
			if (parents.length === 0) {
				return undefined;
			}

			const collectionName = parents.join(' / ');
			const existingCollectionId = collectionIdsByName.get(collectionName);
			if (existingCollectionId) {
				return existingCollectionId;
			}

			const collectionId = `${now}-collection-${collections.length}`;
			collections.push({
				id: collectionId,
				name: collectionName,
				createdAt: new Date().toISOString()
			});
			collectionIdsByName.set(collectionName, collectionId);
			return collectionId;
		};

		const collectItems = (items: any[], parents: string[] = []) => {
			if (!Array.isArray(items)) {
				return;
			}
			items.forEach((item, index) => {
				if (Array.isArray(item?.item)) {
					const folderName = String(item?.name || 'Folder').trim();
					const nextParents = folderName ? [...parents, folderName] : parents;
					ensureCollection(nextParents);
					collectItems(item.item, nextParents);
					return;
				}

				const request = item?.request;
				if (!request) {
					return;
				}

				const name = String(item?.name || 'Request').trim() || 'Request';
				const url = buildUrl(request.url);
				if (!url) {
					return;
				}
				const headers = normalizeHeaders(request.header);
				const body = buildBody(request.body);
				const collectionId = ensureCollection(parents);

				requests.push({
					id: `${now}-${requests.length}-${index}`,
					name,
					url,
					method: request.method || 'GET',
					headers,
					body,
					collectionId,
					createdAt: new Date().toISOString()
				});
			});
		};

		collectItems(data?.item || []);

		if (Array.isArray(data?.variable)) {
			data.variable
				.filter((v: any) => v && v.key)
				.forEach((v: any, index: number) => {
					variables.push({
						id: `${now}-var-${index}`,
						name: String(v.key).trim(),
						value: String(v.value ?? '').trim()
					});
				});
		}

		return { requests, variables, collections };
	};

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

	const addCollectionCommand = vscode.commands.registerCommand('postgirl.addCollection', async () => {
		const name = await vscode.window.showInputBox({
			prompt: 'Enter a collection name',
			placeHolder: 'My Collection',
			validateInput: (value) => {
				const trimmed = value.trim();
				if (!trimmed) {
					return 'Collection name cannot be empty';
				}
				const collections = context.globalState.get<RequestCollection[]>('postgirl.requestCollections', []);
				const exists = collections.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
				return exists ? 'A collection with this name already exists' : null;
			}
		});

		if (!name) {
			return;
		}

		const collections = context.globalState.get<RequestCollection[]>('postgirl.requestCollections', []);
		const collection: RequestCollection = {
			id: Date.now().toString(),
			name: name.trim(),
			createdAt: new Date().toISOString()
		};
		collections.push(collection);
		await context.globalState.update('postgirl.requestCollections', collections);
		sidebarProvider.refresh();
		vscode.window.showInformationMessage(`Collection "${collection.name}" created!`);
	});

	const renameCollectionCommand = vscode.commands.registerCommand('postgirl.renameCollection', async (item: SidebarItem) => {
		const collections = context.globalState.get<RequestCollection[]>('postgirl.requestCollections', []);
		const collection = collections.find(c => c.id === item.requestId);

		if (!collection) {
			return;
		}

		const newName = await vscode.window.showInputBox({
			prompt: 'Rename collection',
			value: collection.name,
			validateInput: (value) => {
				const trimmed = value.trim();
				if (!trimmed) {
					return 'Collection name cannot be empty';
				}
				const exists = collections.some(c => c.id !== collection.id && c.name.toLowerCase() === trimmed.toLowerCase());
				return exists ? 'A collection with this name already exists' : null;
			}
		});

		if (!newName) {
			return;
		}

		collection.name = newName.trim();
		await context.globalState.update('postgirl.requestCollections', collections);
		sidebarProvider.refresh();
		vscode.window.showInformationMessage('Collection renamed successfully!');
	});

	const deleteCollectionCommand = vscode.commands.registerCommand('postgirl.deleteCollection', async (item: SidebarItem) => {
		const collections = context.globalState.get<RequestCollection[]>('postgirl.requestCollections', []);
		const collection = collections.find(c => c.id === item.requestId);

		if (!collection) {
			return;
		}

		const confirmation = await vscode.window.showWarningMessage(
			`Delete collection "${collection.name}"? Requests in this collection will be kept as uncategorized.`,
			{ modal: true },
			'Delete',
			'Cancel'
		);

		if (confirmation !== 'Delete') {
			return;
		}

		const remainingCollections = collections.filter(c => c.id !== collection.id);
		await context.globalState.update('postgirl.requestCollections', remainingCollections);

		const requests = context.globalState.get<SavedRequest[]>('postgirl.savedRequests', []);
		const updatedRequests = requests.map(req =>
			req.collectionId === collection.id
				? { ...req, collectionId: undefined }
				: req
		);
		await context.globalState.update('postgirl.savedRequests', updatedRequests);

		sidebarProvider.refresh();
		vscode.window.showInformationMessage('Collection deleted. Requests moved to Uncategorized.');
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
		// Notify the webview to reload variables
		if (RestClientPanel.currentPanel) {
			RestClientPanel.currentPanel.reloadVariables();
		}
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
		// Notify the webview to reload variables
		if (RestClientPanel.currentPanel) {
			RestClientPanel.currentPanel.reloadVariables();
		}
		vscode.window.showInformationMessage(`Variable "${variable.name}" updated!`);
	});

	const deleteVariableCommand = vscode.commands.registerCommand('postgirl.deleteVariable', async (item: SidebarItem) => {
		const variables = context.globalState.get<Variable[]>('postgirl.variables', []);
		const filtered = variables.filter(v => v.id !== item.requestId);
		await context.globalState.update('postgirl.variables', filtered);
		sidebarProvider.refresh();
		// Notify the webview to reload variables
		if (RestClientPanel.currentPanel) {
			RestClientPanel.currentPanel.reloadVariables();
		}
		vscode.window.showInformationMessage('Variable deleted successfully!');
	});

	const exportSessionCommand = vscode.commands.registerCommand('postgirl.exportSession', async () => {
		const savedRequests = context.globalState.get<SavedRequest[]>('postgirl.savedRequests', []);
		const requestCollections = context.globalState.get<RequestCollection[]>('postgirl.requestCollections', []);
		const variables = context.globalState.get<Variable[]>('postgirl.variables', []);
		const savedHeaders = context.globalState.get('postgirl.savedHeaders', []);

		if (savedRequests.length === 0 && requestCollections.length === 0 && variables.length === 0 && savedHeaders.length === 0) {
			vscode.window.showWarningMessage('No data to export. Your session is empty.');
			return;
		}

		const sessionData: SessionExport = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			savedRequests,
			requestCollections,
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
					`Session exported successfully! (${savedRequests.length} requests, ${requestCollections.length} collections, ${variables.length} variables, ${savedHeaders.length} headers)`
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
			await context.globalState.update('postgirl.requestCollections', sessionData.requestCollections || []);
			await context.globalState.update('postgirl.variables', sessionData.variables || []);
			await context.globalState.update('postgirl.savedHeaders', sessionData.savedHeaders || []);

			sidebarProvider.refresh();
			// Notify the webview to reload variables
			if (RestClientPanel.currentPanel) {
				RestClientPanel.currentPanel.reloadVariables();
			}
			vscode.window.showInformationMessage(
				`Session imported successfully! (${sessionData.savedRequests?.length || 0} requests, ${sessionData.requestCollections?.length || 0} collections, ${sessionData.variables?.length || 0} variables, ${sessionData.savedHeaders?.length || 0} headers)`
			);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to import session: ${error}`);
		}
	});

	const importPostmanCommand = vscode.commands.registerCommand('postgirl.importPostman', async () => {
		const uri = await vscode.window.showOpenDialog({
			canSelectMany: false,
			filters: {
				'Postman Collection': ['json', 'postman_collection'],
				'All Files': ['*']
			},
			openLabel: 'Import Postman Collection'
		});

		if (!uri || uri.length === 0) {
			return;
		}

		try {
			const buffer = await vscode.workspace.fs.readFile(uri[0]);
			const jsonString = Buffer.from(buffer).toString('utf8');
			const postmanData = JSON.parse(jsonString);
			const { requests, variables, collections } = parsePostmanCollection(postmanData);

			if (requests.length === 0 && variables.length === 0 && collections.length === 0) {
				vscode.window.showWarningMessage('No requests or variables found in this Postman collection.');
				return;
			}

			const importMode = await vscode.window.showQuickPick(
				[
					{
						label: 'Append',
						description: 'Keep existing requests and add imported ones'
					},
					{
						label: 'Replace',
						description: 'Overwrite existing requests and variables'
					}
				],
				{
					placeHolder: 'How should imported data be applied?'
				}
			);

			if (!importMode) {
				return;
			}

			const existingRequests = context.globalState.get<SavedRequest[]>('postgirl.savedRequests', []);
			const existingCollections = context.globalState.get<RequestCollection[]>('postgirl.requestCollections', []);
			const existingVariables = context.globalState.get<Variable[]>('postgirl.variables', []);

			let mergedRequests: SavedRequest[] = [];
			let mergedCollections: RequestCollection[] = [];
			let mergedVariables: Variable[] = [];

			if (importMode.label === 'Replace') {
				mergedRequests = requests;
				mergedCollections = collections;
				mergedVariables = variables;
			} else {
				const collectionNameToId = new Map(existingCollections.map(collection => [collection.name.toLowerCase(), collection.id]));
				const importedCollectionIdMap = new Map<string, string>();
				mergedCollections = [...existingCollections];

				collections.forEach((collection) => {
					const existingCollectionId = collectionNameToId.get(collection.name.toLowerCase());
					if (existingCollectionId) {
						importedCollectionIdMap.set(collection.id, existingCollectionId);
						return;
					}

					mergedCollections.push(collection);
					collectionNameToId.set(collection.name.toLowerCase(), collection.id);
					importedCollectionIdMap.set(collection.id, collection.id);
				});

				const remappedRequests = requests.map(request => ({
					...request,
					collectionId: request.collectionId ? importedCollectionIdMap.get(request.collectionId) : undefined
				}));

				mergedRequests = [...existingRequests, ...remappedRequests];
				const existingVariableNames = new Set(existingVariables.map(v => v.name));
				const newVariables = variables.filter(v => !existingVariableNames.has(v.name));
				mergedVariables = [...existingVariables, ...newVariables];
			}

			await context.globalState.update('postgirl.savedRequests', mergedRequests);
			await context.globalState.update('postgirl.requestCollections', mergedCollections);
			await context.globalState.update('postgirl.variables', mergedVariables);

			sidebarProvider.refresh();
			if (RestClientPanel.currentPanel) {
				RestClientPanel.currentPanel.reloadVariables();
			}

			const requestCount = requests.length;
			const collectionCount = collections.length;
			const variableCount = variables.length;
			vscode.window.showInformationMessage(
				`Postman import complete: ${requestCount} request(s), ${collectionCount} collection(s), ${variableCount} variable(s).`
			);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to import Postman collection: ${error}`);
		}
	});

	context.subscriptions.push(openClientCommand, refreshCommand, deleteRequestCommand, loadRequestCommand, addCollectionCommand, renameCollectionCommand, deleteCollectionCommand, searchRequestsCommand, clearSearchCommand, addVariableCommand, editVariableCommand, deleteVariableCommand, exportSessionCommand, importSessionCommand, importPostmanCommand);
}
export function deactivate() {}