export interface SavedHeader {
	key: string;
	value: string;
}

export interface SavedRequest {
	id: string;
	name: string;
	url: string;
	method: string;
	headers: SavedHeader[];
	body?: string;
	createdAt: string;
}

export interface Variable {
	id: string;
	name: string;
	value: string;
}

export interface SessionExport {
	version: string;
	exportedAt: string;
	savedRequests: SavedRequest[];
	variables: Variable[];
	savedHeaders: SavedHeader[];
}
