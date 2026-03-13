import * as vscode from 'vscode';
import { RequestCollection, SavedHeader, SavedRequest, Variable } from '../types';

const POSTGIRL_REQUEST_DROP_MIME = 'application/vnd.postgirl.savedrequests';

export class SidebarItem extends vscode.TreeItem {
	declare contextValue?: string;
	requestId?: string;
	parentCollectionId?: string | null;
	
	constructor(
		public readonly label: string,
		public description: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		private commandId?: string,
		private icon?: string,
		requestId?: string,
		parentCollectionId?: string | null
	) {
		super(label, collapsibleState);
		this.description = description;
		this.requestId = requestId;
		this.parentCollectionId = parentCollectionId;
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

	private mapRequestToTreeItem(req: SavedRequest, parentCollectionId: string | null): SidebarItem {
		const item = new SidebarItem(
			req.name,
			`${req.method} - ${req.url}`,
			vscode.TreeItemCollapsibleState.None,
			undefined,
			'$(globe)',
			req.id,
			parentCollectionId
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
			return this.applySearchFilter(collectionRequests).map(req => this.mapRequestToTreeItem(req, element.requestId ?? null));
		} else if (element.contextValue === 'uncategorizedRequests') {
			const savedRequests = this.context.globalState.get<SavedRequest[]>('postgirl.savedRequests', []);
			const uncategorizedRequests = savedRequests.filter(req => !req.collectionId);
			return this.applySearchFilter(uncategorizedRequests).map(req => this.mapRequestToTreeItem(req, null));
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

export class SidebarDragAndDropController implements vscode.TreeDragAndDropController<SidebarItem> {
	readonly dragMimeTypes = [POSTGIRL_REQUEST_DROP_MIME];
	readonly dropMimeTypes = [POSTGIRL_REQUEST_DROP_MIME, 'text/uri-list', 'text/plain'];

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly sidebarProvider: SidebarProvider
	) {}

	handleDrag(source: readonly SidebarItem[], dataTransfer: vscode.DataTransfer): void {
		const requestIds = source
			.filter(item => item.contextValue === 'savedRequest' && item.requestId)
			.map(item => item.requestId as string);

		if (!requestIds.length) {
			return;
		}

		dataTransfer.set(
			POSTGIRL_REQUEST_DROP_MIME,
			new vscode.DataTransferItem(JSON.stringify(requestIds))
		);
	}

	async handleDrop(target: SidebarItem | undefined, dataTransfer: vscode.DataTransfer): Promise<void> {
		const targetCollectionId = this.getDropCollectionId(target);
		if (targetCollectionId === undefined) {
			return;
		}

		const movedCount = await this.moveDroppedRequests(dataTransfer, targetCollectionId);
		if (movedCount > 0) {
			vscode.window.showInformationMessage(`Moved ${movedCount} request(s) to ${this.describeDropTarget(target)}.`);
			return;
		}

		const urls = await this.extractDroppedUrls(dataTransfer);
		if (!urls.length) {
			return;
		}

		await this.createRequestsFromUrls(urls, targetCollectionId);
		vscode.window.showInformationMessage(`Saved ${urls.length} URL(s) to ${this.describeDropTarget(target)}.`);
	}

	private getDropCollectionId(target: SidebarItem | undefined): string | null | undefined {
		if (!target) {
			return undefined;
		}

		if (target.label === 'Collections' || target.contextValue === 'uncategorizedRequests') {
			return null;
		}

		if (target.contextValue === 'requestCollection') {
			return target.requestId ?? undefined;
		}

		if (target.contextValue === 'savedRequest') {
			return target.parentCollectionId ?? null;
		}

		return undefined;
	}

	private describeDropTarget(target: SidebarItem | undefined): string {
		if (!target || target.label === 'Collections' || target.contextValue === 'uncategorizedRequests') {
			return 'Uncategorized';
		}

		return target.label;
	}

	private async moveDroppedRequests(dataTransfer: vscode.DataTransfer, targetCollectionId: string | null): Promise<number> {
		const item = dataTransfer.get(POSTGIRL_REQUEST_DROP_MIME);
		if (!item) {
			return 0;
		}

		let requestIds: string[] = [];
		try {
			requestIds = JSON.parse(await item.asString()) as string[];
		} catch {
			return 0;
		}

		if (!Array.isArray(requestIds) || !requestIds.length) {
			return 0;
		}

		const idSet = new Set(requestIds);
		const nextCollectionId = targetCollectionId ?? undefined;
		const savedRequests = this.context.globalState.get<SavedRequest[]>('postgirl.savedRequests', []);
		let movedCount = 0;

		const updatedRequests = savedRequests.map(request => {
			if (!idSet.has(request.id) || request.collectionId === nextCollectionId) {
				return request;
			}

			movedCount += 1;
			return {
				...request,
				collectionId: nextCollectionId
			};
		});

		if (!movedCount) {
			return 0;
		}

		await this.context.globalState.update('postgirl.savedRequests', updatedRequests);
		this.sidebarProvider.refresh();
		return movedCount;
	}

	private async extractDroppedUrls(dataTransfer: vscode.DataTransfer): Promise<string[]> {
		const urls: string[] = [];
		const uriListItem = dataTransfer.get('text/uri-list');
		if (uriListItem) {
			urls.push(...this.parseUriList(await uriListItem.asString()));
		}

		const plainTextItem = dataTransfer.get('text/plain');
		if (plainTextItem) {
			urls.push(...this.parsePlainTextUrls(await plainTextItem.asString()));
		}

		return [...new Set(urls)];
	}

	private parseUriList(rawValue: string): string[] {
		return rawValue
			.split(/\r?\n/)
			.map(line => line.trim())
			.filter(line => line && !line.startsWith('#'))
			.map(line => this.normalizeHttpUrl(line))
			.filter((url): url is string => Boolean(url));
	}

	private parsePlainTextUrls(rawValue: string): string[] {
		return rawValue
			.split(/\s+/)
			.map(token => token.trim())
			.filter(Boolean)
			.map(token => this.normalizeHttpUrl(token))
			.filter((url): url is string => Boolean(url));
	}

	private normalizeHttpUrl(value: string): string | undefined {
		try {
			const url = new URL(value);
			if (url.protocol !== 'http:' && url.protocol !== 'https:') {
				return undefined;
			}
			return url.toString();
		} catch {
			return undefined;
		}
	}

	private async createRequestsFromUrls(urls: string[], targetCollectionId: string | null): Promise<void> {
		const now = Date.now();
		const createdAt = new Date().toISOString();
		const savedRequests = this.context.globalState.get<SavedRequest[]>('postgirl.savedRequests', []);
		const newRequests: SavedRequest[] = urls.map((url, index) => ({
			id: `${now}-dnd-${index}`,
			name: url,
			url,
			method: 'GET',
			headers: [],
			collectionId: targetCollectionId ?? undefined,
			createdAt
		}));

		await this.context.globalState.update('postgirl.savedRequests', [...savedRequests, ...newRequests]);
		this.sidebarProvider.refresh();
	}
}
