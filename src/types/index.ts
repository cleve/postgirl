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
	collectionId?: string;
	createdAt: string;
}

export interface RequestCollection {
	id: string;
	name: string;
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
	requestCollections?: RequestCollection[];
	variables: Variable[];
	savedHeaders: SavedHeader[];
}
