export interface TreeNode {
  id: string;
  title: string;
  path?: string;
  templateId?: string;
  children: TreeNode[];
  order?: number;
}

export interface Template {
  id: string;
  name: string;
  defaultTitle: string;
  body?: string;
}

export interface GrowiPage {
  id: string;
  path: string;
  title?: string;
  body?: string;
  revision?: { body?: string };
  descendantCount?: number;
}

export interface PagesListResponse {
  pages: GrowiPage[];
  totalCount?: number;
}
