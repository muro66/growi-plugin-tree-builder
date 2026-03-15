import React from 'react';
import type { TreeNode } from '../types';
import './TreeCard.css';

export type DropZoneType = 'before' | 'after' | 'child';

interface TreeCardProps {
  node: TreeNode;
  depth: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onTitleChange: (title: string) => void;
  onIndent: () => void;
  onOutdent: () => void;
  onDelete: () => void;
  onDragOverZone: (zone: DropZoneType | null) => void;
  onDrop: (e: React.DragEvent, zone: DropZoneType) => void;
  dragOverZone: DropZoneType | null;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
}

export default function TreeCard({
  node,
  depth,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onTitleChange,
  onIndent,
  onOutdent,
  onDelete,
  onDragOverZone,
  onDrop,
  dragOverZone,
  isDragging,
  onDragStart,
}: TreeCardProps) {
  const hasChildren = node.children.length > 0;

  const handleDrop = (e: React.DragEvent, zone: DropZoneType) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop(e, zone);
  };

  const handleDragOver = (e: React.DragEvent, zone: DropZoneType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOverZone(zone);
  };

  return (
    <div className="grw-tree-card-wrap" style={{ marginLeft: depth * 24 }}>
      <div
        className={`grw-tree-drop-zone ${dragOverZone === 'before' ? 'is-drag-over' : ''}`}
        onDragOver={(e) => handleDragOver(e, 'before')}
        onDrop={(e) => handleDrop(e, 'before')}
        onDragLeave={() => onDragOverZone(null)}
      />
      <div
        className={`grw-tree-card grw-tree-card-depth-${Math.min(depth, 3)} ${isSelected ? 'is-selected' : ''} ${isDragging ? 'opacity-50' : ''}`}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        draggable
        onDragStart={onDragStart}
      >
        <span
          className="grw-tree-card-drag"
          title="ドラッグで移動"
          onClick={(e) => e.stopPropagation()}
        >
          ⋮⋮
        </span>
        <button
          type="button"
          className={`grw-tree-card-expand ${hasChildren && !isExpanded ? 'is-closed' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
          aria-label={isExpanded ? '折りたたむ' : '展開'}
          disabled={!hasChildren}
        >
          ▼
        </button>
        <input
          type="text"
          className="grw-tree-card-title"
          value={node.title}
          onChange={(e) => onTitleChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
        {hasChildren && (
          <span className="grw-tree-card-meta">{node.children.length} 件</span>
        )}
        <div className="grw-tree-card-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="grw-tree-card-btn" title="インデント" onClick={onIndent}>
            →
          </button>
          <button type="button" className="grw-tree-card-btn" title="アウトデント" onClick={onOutdent}>
            ←
          </button>
          <button type="button" className="grw-tree-card-btn grw-tree-card-btn-delete" title="削除" onClick={onDelete}>
            ×
          </button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div
          className={`grw-tree-drop-zone-child ${dragOverZone === 'child' ? 'is-drag-over' : ''}`}
          onDragOver={(e) => handleDragOver(e, 'child')}
          onDrop={(e) => handleDrop(e, 'child')}
          onDragLeave={() => onDragOverZone(null)}
          style={{ marginLeft: 24 }}
        >
          ここにドロップで子として追加
        </div>
      )}
      <div
        className={`grw-tree-drop-zone ${dragOverZone === 'after' ? 'is-drag-over' : ''}`}
        onDragOver={(e) => handleDragOver(e, 'after')}
        onDrop={(e) => handleDrop(e, 'after')}
        onDragLeave={() => onDragOverZone(null)}
      />
    </div>
  );
}
