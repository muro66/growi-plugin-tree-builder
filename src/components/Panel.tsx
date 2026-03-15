import React from 'react';
import TreeEditor from './TreeEditor';
import TemplatePanel from './TemplatePanel';
import type { TreeNode } from '../types';
import { createTreeNode, prependChild, serializeTree, deserializeTree } from '../treeUtils';
import { DEFAULT_TEMPLATES } from '../templates';
import { getCurrentPath, fetchPagesUnderPath, filterDirectChildren } from '../api';
import './Panel.css';

const TREE_STORAGE_KEY = 'grw-tree-builder-data';

interface PanelProps {
  onClose: () => void;
}

function loadTreeFromStorage(rootPath: string): TreeNode[] {
  try {
    const raw = localStorage.getItem(TREE_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (data.rootPath !== rootPath) return [];
    return deserializeTree(data.nodes ?? []);
  } catch {
    return [];
  }
}

function saveTreeToStorage(rootPath: string, nodes: TreeNode[]): void {
  try {
    localStorage.setItem(
      TREE_STORAGE_KEY,
      JSON.stringify({ rootPath, nodes: serializeTree(nodes) })
    );
  } catch {
    // ignore
  }
}

export default function Panel({ onClose }: PanelProps) {
  const rootPath = getCurrentPath();
  const [nodes, setNodes] = React.useState<TreeNode[]>(() => {
    const stored = loadTreeFromStorage(rootPath);
    if (stored.length > 0) return stored;
    return [createTreeNode(rootPath === '/' ? 'ルート' : rootPath.split('/').filter(Boolean).pop() ?? 'ルート')];
  });
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<string | null>(null);

  const handleToggleExpand = React.useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handlePickTemplate = React.useCallback(
    (template: { defaultTitle: string; id: string }) => {
      const newNode = createTreeNode(template.defaultTitle, { templateId: template.id });
      if (selectedId) {
        setNodes((prev) => prependChild(prev, selectedId, newNode));
        setExpandedIds((prev) => new Set(prev).add(selectedId));
      } else {
        setNodes((prev) => [...prev, newNode]);
      }
    },
    [selectedId]
  );

  React.useEffect(() => {
    saveTreeToStorage(rootPath, nodes);
  }, [rootPath, nodes]);

  const handleLoadFromGrowi = React.useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetchPagesUnderPath(rootPath);
      const children = filterDirectChildren(res.pages ?? [], rootPath);
      const rootTitle = rootPath === '/' ? 'ルート' : rootPath.split('/').filter(Boolean).pop() ?? 'ルート';
      const newNodes: TreeNode[] = [
        {
          id: `n${Date.now()}-0`,
          title: rootTitle,
          path: rootPath,
          children: children.map((p) => ({
            id: `n${Date.now()}-${p.id}`,
            title: p.title ?? p.path?.split('/').pop() ?? '無題',
            path: p.path,
            children: [],
          })),
        },
      ];
      setNodes(newNodes);
      setExpandedIds(new Set([newNodes[0].id]));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : '読み込みに失敗しました');
    }
  }, [rootPath]);

  const handleSaveToGrowi = React.useCallback(async () => {
    setSaveStatus(null);
    try {
      saveTreeToStorage(rootPath, nodes);
      setSaveStatus('ローカルに保存しました（ブラウザに保持）');
    } catch (e) {
      setSaveStatus(e instanceof Error ? e.message : '保存に失敗しました');
    }
  }, [rootPath, nodes]);

  return (
    <div className="grw-tree-panel" role="dialog" aria-label="ツリー構築">
      <header className="grw-tree-panel-header">
        <span className="grw-tree-panel-title">📋 ツリー構築</span>
        <div className="grw-tree-panel-actions">
          <button type="button" className="grw-tree-btn" onClick={onClose}>
            閉じる
          </button>
        </div>
      </header>
      <div className="grw-tree-panel-body">
        <aside className="grw-tree-panel-left">
          <div className="grw-tree-label">ルートパス</div>
          <div className="grw-tree-path-display" title={rootPath}>
            {rootPath === '/' ? '（ルート）' : rootPath}
          </div>
          <button type="button" className="grw-tree-btn" onClick={handleLoadFromGrowi}>
            GROWI から読み込み
          </button>
          {loadError && <div className="grw-tree-label" style={{ color: '#ef9a9a' }}>{loadError}</div>}
          <button type="button" className="grw-tree-btn grw-tree-btn-primary" onClick={handleSaveToGrowi}>
            ツリーを保存（ローカル）
          </button>
          {saveStatus && <div className="grw-tree-label">{saveStatus}</div>}
        </aside>
        <main className="grw-tree-panel-center">
          <TreeEditor
            nodes={nodes}
            onChange={setNodes}
            selectedId={selectedId}
            onSelect={setSelectedId}
            expandedIds={expandedIds}
            onToggleExpand={handleToggleExpand}
          />
        </main>
        <aside className="grw-tree-panel-right">
          <TemplatePanel templates={DEFAULT_TEMPLATES} onPick={handlePickTemplate} />
        </aside>
      </div>
    </div>
  );
}
