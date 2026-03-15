import type { Template } from './types';

export const DEFAULT_TEMPLATES: Template[] = [
  { id: 'section', name: 'セクション', defaultTitle: 'セクション', body: '## {{title}}\n\n' },
  { id: 'overview', name: '概要', defaultTitle: '概要', body: '## 概要\n\n（ここに概要を書く）\n' },
  { id: 'detail', name: '詳細', defaultTitle: '詳細', body: '## 詳細\n\n（ここに詳細を書く）\n' },
  { id: 'reference', name: '参照', defaultTitle: '参照', body: '## 参照\n\n（参照リンクなど）\n' },
];
