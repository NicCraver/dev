export type MongoStatusResponse = {
  configured: boolean;
  databaseName?: string;
  pagePasswordRequired: boolean;
  message?: string;
};

export type MongoCollectionInfo = {
  name: string;
  count?: number;
};

export type MongoCollectionsResponse = {
  collections: MongoCollectionInfo[];
};

export type MongoDocsResponse = {
  docs: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
};

export type MongoDocResponse = {
  doc: Record<string, unknown>;
};
