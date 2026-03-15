import React from 'react';
import type { TreeNode } from '../types';
import { flattenTree, moveNode, removeNode, updateNodeTitle, indentNode, outdentNode, prependChild, insertBefore, insertAfter } from '../treeUtils';
import { createTreeNode } from '../treeUtils';
import type { DropZoneType } from './TreeCard';
import TreeCard from './TreeCard';
import './TreeEditor.css';

const DRAG_NODE_KEY = 'grw-tree-drag-node-id';
const DRAG_TEMPLATE_KEY = 'application/json';

interface TreeEditorProps {
  nodes: TreeNode[];
  onChange: (nodes: TreeNode[]) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}

export default function TreeEditor({
  nodes,
  onChange,
  selectedId,
  onSelect,
  expandedIds,
  onToggleExpand,
}: TreeEditorProps) {
  const [dragOver, setDragOver] = React.useState<{
    targetId: string | null;
    zone: DropZoneType;
  } | null>(null);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  const flat = flattenTree(nodes);

  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    setDraggingId(nodeId);
    e.dataTransfer.setData('text/plain', nodeId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(DRAG_NODE_KEY, nodeId);
  };

  const handleDrop = (e: React.DragEvent, targetId: string | null, zone: DropZoneType) => {
    const templateRaw = e.dataTransfer.getData(DRAG_TEMPLATE_KEY);
    setDragOver(null);
    setDraggingId(null);

    if (templateRaw) {
      try {
        const { type, template } = JSON.parse(templateRaw);
        if (type === 'template' && template) {
          const newNode = createTreeNode(template.defaultTitle ?? template.name, { templateId: template.id });
          if (targetId == null && zone === 'after') {
            onChange([...nodes, newNode]);
          } else if (targetId != null) {
            if (zone === 'before') onChange(insertBefore(nodes, targetId, newNode));
            else if (zone === 'after') onChange(insertAfter(nodes, targetId, newNode));
            else onChange(prependChild(nodes, targetId, newNode));
          }
          return;
        }
      } catch {
        // ignore
      }
    }

    const nodeId = draggingId ?? e.dataTransfer.getData(DRAG_NODE_KEY);
    if (!nodeId) return;
    if (zone === 'after' && targetId == null) {
      onChange(moveNode(nodes, nodeId, null, 'after'));
      return;
    }
    if (targetId == null) return;
    if (zone === 'before') {
      onChange(moveNode(nodes, nodeId, targetId, 'before'));
    } else if (zone === 'after') {
      onChange(moveNode(nodes, nodeId, targetId, 'after'));
    } else {
      onChange(moveNode(nodes, nodeId, targetId, 'child'));
    }
  };

  return (
    <div className="grw-tree-editor" onClick={() => onSelect(null)}>
      {flat.map(({ node, depth }) => (
        <React.Fragment key={node.id}>
          <div
            className={`grw-tree-drop-zone ${dragOver?.targetId === node.id && dragOver?.zone === 'before' ? 'is-drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = e.dataTransfer.types.includes(DRAG_TEMPLATE_KEY) ? 'copy' : 'move';
              setDragOver({ targetId: node.id, zone: 'before' });
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(e, node.id, 'before');
            }}
            onDragLeave={() => setDragOver(null)}
          />
          <TreeCard
            node={node}
            depth={depth}
            isSelected={selectedId === node.id}
            isExpanded={expandedIds.has(node.id)}
            onSelect={() => onSelect(node.id)}
            onToggleExpand={() => onToggleExpand(node.id)}
            onTitleChange={(title) => onChange(updateNodeTitle(nodes, node.id, title))}
            onIndent={() => onChange(indentNode(nodes, node.id))}
            onOutdent={() => onChange(outdentNode(nodes, node.id))}
            onDelete={() => onChange(removeNode(nodes, node.id))}
            onDragOverZone={(zone) => setDragOver(zone == null ? null : { targetId: node.id, zone })}
            onDrop={(e, zone) => handleDrop(e, node.id, zone)}
            dragOverZone={dragOver?.targetId === node.id ? dragOver.zone : null}
            isDragging={draggingId === node.id}
            onDragStart={(e) => handleDragStart(e, node.id)}
          />
        </React.Fragment>
      ))}
      <div
        className={`grw-tree-drop-zone grw-tree-drop-zone-append ${dragOver?.targetId === null && dragOver?.zone === 'after' ? 'is-drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setDragOver({ targetId: null, zone: 'after' });
        }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(e, null, 'after');
            }}
        onDragLeave={() => setDragOver(null)}
      >
        ここにドロップで末尾に追加
      </div>
    </div>
  );
}
