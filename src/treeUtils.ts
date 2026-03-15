import type { TreeNode } from './types';

let idCounter = 0;
export function createNodeId(): string {
  return `n${Date.now()}-${++idCounter}`;
}

export function createTreeNode(
  title: string,
  opts: { templateId?: string; path?: string } = {}
): TreeNode {
  return {
    id: createNodeId(),
    title,
    children: [],
    templateId: opts.templateId,
    path: opts.path,
  };
}

/** ツリーをフラットリストに（深さ優先、深さ付き） */
export function flattenTree(
  nodes: TreeNode[],
  depth: number = 0
): { node: TreeNode; depth: number }[] {
  const out: { node: TreeNode; depth: number }[] = [];
  for (const node of nodes) {
    out.push({ node, depth });
    out.push(...flattenTree(node.children, depth + 1));
  }
  return out;
}

export function findNodeById(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return null;
}

export function findParentAndIndex(
  nodes: TreeNode[],
  id: string,
  parent: TreeNode[] | null = null
): { parent: TreeNode[]; index: number } | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) return { parent: parent ?? nodes, index: i };
    const found = findParentAndIndex(nodes[i].children, id, nodes[i].children);
    if (found) return found;
  }
  return null;
}

/** 深いコピー */
export function cloneTree(nodes: TreeNode[]): TreeNode[] {
  return nodes.map((n) => ({
    ...n,
    children: cloneTree(n.children),
  }));
}

/** ノードを削除（子孫ごと） */
export function removeNode(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => ({ ...n, children: removeNode(n.children, id) }));
}

/** 兄弟の前に挿入 */
export function insertBefore(
  nodes: TreeNode[],
  targetId: string,
  newNode: TreeNode
): TreeNode[] {
  const loc = findParentAndIndex(nodes, targetId);
  if (!loc) return nodes;
  const next = [...loc.parent];
  next.splice(loc.index, 0, newNode);
  return replaceParent(nodes, targetId, next);
}

/** 兄弟の後に挿入 */
export function insertAfter(
  nodes: TreeNode[],
  targetId: string,
  newNode: TreeNode
): TreeNode[] {
  const loc = findParentAndIndex(nodes, targetId);
  if (!loc) return nodes;
  const next = [...loc.parent];
  next.splice(loc.index + 1, 0, newNode);
  return replaceParent(nodes, targetId, next);
}

/** 子の先頭に追加 */
export function prependChild(nodes: TreeNode[], parentId: string, newNode: TreeNode): TreeNode[] {
  return nodes.map((n) => {
    if (n.id !== parentId) return { ...n, children: prependChild(n.children, parentId, newNode) };
    return { ...n, children: [newNode, ...n.children] };
  });
}

/** ノードを移動: 一度削除してから挿入 */
export function moveNode(
  nodes: TreeNode[],
  nodeId: string,
  targetId: string | null,
  type: 'before' | 'after' | 'child'
): TreeNode[] {
  const loc = findParentAndIndex(nodes, nodeId);
  if (!loc) return nodes;
  const node = loc.parent[loc.index];
  let next = removeNode(nodes, nodeId);
  if (targetId == null) {
    return [...next, node];
  }
  if (type === 'child') {
    return prependChild(next, targetId, node);
  }
  if (type === 'before') {
    return insertBefore(next, targetId, node);
  }
  return insertAfter(next, targetId, node);
}

/** ノードのタイトルを更新 */
export function updateNodeTitle(nodes: TreeNode[], id: string, title: string): TreeNode[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, title };
    return { ...n, children: updateNodeTitle(n.children, id, title) };
  });
}

function replaceParent(
  nodes: TreeNode[],
  targetId: string,
  newSiblings: TreeNode[]
): TreeNode[] {
  for (const n of nodes) {
    if (n.children.some((c) => c.id === targetId)) {
      return nodes.map((node) =>
        node.id === n.id ? { ...node, children: newSiblings } : node
      );
    }
  }
  if (nodes.some((n) => n.id === targetId)) return newSiblings;
  return nodes.map((n) => ({
    ...n,
    children: replaceParent(n.children, targetId, newSiblings),
  }));
}

/** インデント（直前の兄弟の子になる） */
export function indentNode(nodes: TreeNode[], id: string): TreeNode[] {
  const loc = findParentAndIndex(nodes, id);
  if (!loc || loc.index === 0) return nodes;
  const prev = loc.parent[loc.index - 1];
  const node = loc.parent[loc.index];
  const without = loc.parent.filter((_, i) => i !== loc.index);
  const newPrev = { ...prev, children: [...prev.children, node] };
  const next = without.map((n) => (n.id === prev.id ? newPrev : n));
  return replaceParent(nodes, id, next);
}

/** 子を持つノードの id を取得（その子リストに id が含まれるノード） */
function findParentIdOf(nodes: TreeNode[], childId: string): string | null {
  for (const n of nodes) {
    if (n.children.some((c) => c.id === childId)) return n.id;
    const found = findParentIdOf(n.children, childId);
    if (found) return found;
  }
  return null;
}

/** アウトデント（親の兄弟になる） */
export function outdentNode(nodes: TreeNode[], id: string): TreeNode[] {
  const loc = findParentAndIndex(nodes, id);
  if (!loc) return nodes;
  const parentId = findParentIdOf(nodes, id);
  if (parentId == null) return nodes;
  const grandparentLoc = findParentAndIndex(nodes, parentId);
  if (!grandparentLoc) return nodes;
  const node = loc.parent[loc.index];
  const parentNode = loc.parent.find((p) => p.id === parentId)!;
  const withoutNode = loc.parent.filter((_, i) => i !== loc.index);
  const newParent = { ...parentNode, children: withoutNode };
  const gpIdx = grandparentLoc.parent.findIndex((p) => p.id === parentId);
  const newGpChildren = [...grandparentLoc.parent];
  newGpChildren[gpIdx] = newParent;
  newGpChildren.splice(gpIdx + 1, 0, node);
  return replaceParent(nodes, parentId, newGpChildren);
}

/** ツリーを JSON 用のシリアライズ可能な形に */
export function serializeTree(nodes: TreeNode[]): unknown[] {
  return nodes.map((n) => ({
    id: n.id,
    title: n.title,
    path: n.path,
    templateId: n.templateId,
    children: serializeTree(n.children),
  }));
}

/** シリアライズから復元（id は新規発行） */
export function deserializeTree(data: unknown[]): TreeNode[] {
  return (data || []).map((item: unknown) => {
    const o = item as Record<string, unknown>;
    return {
      id: createNodeId(),
      title: (o.title as string) ?? '無題',
      path: o.path as string | undefined,
      templateId: o.templateId as string | undefined,
      children: deserializeTree((o.children as unknown[]) ?? []),
    };
  });
}
