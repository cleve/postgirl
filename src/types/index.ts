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
