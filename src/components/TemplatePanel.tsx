import React from 'react';
import type { Template } from '../types';
import './TemplatePanel.css';

interface TemplatePanelProps {
  templates: Template[];
  onPick: (template: Template) => void;
}

export default function TemplatePanel({ templates, onPick }: TemplatePanelProps) {
  const handleDragStart = (e: React.DragEvent, t: Template) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'template', template: t }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="grw-tree-template-panel">
      <h3 className="grw-tree-template-panel-title">テンプレート</h3>
      <p className="grw-tree-template-panel-hint">クリックで追加 / ドラッグで配置</p>
      <div className="grw-tree-template-grid">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            className="grw-tree-template-card"
            onClick={() => onPick(t)}
            draggable
            onDragStart={(e) => handleDragStart(e, t)}
          >
            <span className="grw-tree-template-card-name">{t.name}</span>
            <span className="grw-tree-template-card-default">{t.defaultTitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
