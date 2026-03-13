import * as vscode from 'vscode';
import { RequestCollection, SavedHeader, SavedRequest, Variable } from '../types';

export class SidebarItem extends vscode.TreeItem {
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

export class SidebarProvider implements vscode.TreeDataProvider<SidebarItem> {
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

	private applySearchFilter(requests: SavedRequest[]): SavedRequest[] {
		if (!this.searchFilter) {
			return requests;
		}

		return requests.filter(req =>
			req.name.toLowerCase().includes(this.searchFilter) ||
			req.url.toLowerCase().includes(this.searchFilter) ||
			req.method.toLowerCase().includes(this.searchFilter)
		);
	}

	private mapRequestToTreeItem(req: SavedRequest): SidebarItem {
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

			const variables = this.context.globalState.get<Variable[]>('postgirl.variables', []);
			items.push(
				new SidebarItem(
					'Variables',
					`${variables.length} variable(s)`,
					vscode.TreeItemCollapsibleState.Expanded,
					undefined,
					'$(symbol-variable)'
				)
			);

			const savedRequests = this.context.globalState.get<SavedRequest[]>('postgirl.savedRequests', []);
			const requestCollections = this.context.globalState.get<RequestCollection[]>('postgirl.requestCollections', []);
			if (savedRequests.length > 0 || requestCollections.length > 0) {
				items.push(
					new SidebarItem(
						'Collections',
						`${requestCollections.length} collection(s), ${savedRequests.length} request(s)`,
						vscode.TreeItemCollapsibleState.Collapsed,
						undefined,
						'$(folder-library)'
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
		} else if (element.label === 'Collections') {
			const savedRequests = this.context.globalState.get<SavedRequest[]>('postgirl.savedRequests', []);
			const requestCollections = this.context.globalState.get<RequestCollection[]>('postgirl.requestCollections', []);
			const items: SidebarItem[] = requestCollections.map(collection => {
				const requestCount = savedRequests.filter(req => req.collectionId === collection.id).length;
				const collectionItem = new SidebarItem(
					collection.name,
					`${requestCount} request(s)`,
					vscode.TreeItemCollapsibleState.Collapsed,
					undefined,
					'$(folder)',
					collection.id
				);
				collectionItem.contextValue = 'requestCollection';
				return collectionItem;
			});

			const uncategorizedCount = savedRequests.filter(req => !req.collectionId).length;
			if (uncategorizedCount > 0) {
				const uncategorized = new SidebarItem(
					'Uncategorized',
					`${uncategorizedCount} request(s)`,
					vscode.TreeItemCollapsibleState.Collapsed,
					undefined,
					'$(inbox)'
				);
				uncategorized.contextValue = 'uncategorizedRequests';
				items.push(uncategorized);
			}

			items.push(
				new SidebarItem(
					'Add Collection',
					'',
					vscode.TreeItemCollapsibleState.None,
					'postgirl.addCollection',
					'$(add)'
				)
			);

			return items;
		} else if (element.contextValue === 'requestCollection') {
			const savedRequests = this.context.globalState.get<SavedRequest[]>('postgirl.savedRequests', []);
			const collectionRequests = savedRequests.filter(req => req.collectionId === element.requestId);
			return this.applySearchFilter(collectionRequests).map(req => this.mapRequestToTreeItem(req));
		} else if (element.contextValue === 'uncategorizedRequests') {
			const savedRequests = this.context.globalState.get<SavedRequest[]>('postgirl.savedRequests', []);
			const uncategorizedRequests = savedRequests.filter(req => !req.collectionId);
			return this.applySearchFilter(uncategorizedRequests).map(req => this.mapRequestToTreeItem(req));
		} else if (element.label === 'Variables') {
			const variables = this.context.globalState.get<Variable[]>('postgirl.variables', []);
			const items = variables.map(v => {
				const item = new SidebarItem(
					v.name,
					v.value,
					vscode.TreeItemCollapsibleState.None,
					undefined,
					'$(symbol-variable)',
					v.id
				);
				item.contextValue = 'variable';
				return item;
			});
			// Add "New Variable" button
			const addItem = new SidebarItem(
				'Add Variable',
				'',
				vscode.TreeItemCollapsibleState.None,
				'postgirl.addVariable',
				'$(add)'
			);
			return [...items, addItem];
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
