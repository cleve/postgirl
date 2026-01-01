import * as vscode from 'vscode';
import { SavedHeader, SavedRequest, Variable } from '../types';

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
