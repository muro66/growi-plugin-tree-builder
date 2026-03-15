import React from 'react';
import { createRoot } from 'react-dom/client';
import Panel from './src/components/Panel';

const PLUGIN_ID = 'growi-plugin-tree-builder';
const SIDEBAR_BTN_ID = 'grw-tree-builder-sidebar-btn';
const PANEL_ROOT_ID = 'grw-tree-builder-panel-root';
const FALLBACK_BTN_ID = 'grw-tree-builder-fallback-btn';

function getSidebarContainer(): HTMLElement | null {
  return (
    document.querySelector('.grw-sidebar-nav') ||
    document.querySelector('.grw-sidebar-content') ||
    document.querySelector('.grw-sidebar .grw-sidebar-nav-container') ||
    document.querySelector('.grw-sidebar-nav-container') ||
    document.querySelector('#grw-sidebar-nav') ||
    document.querySelector('[class*="grw-sidebar"]') ||
    document.querySelector('[class*="sidebar"]') ||
    document.querySelector('.sidebar')
  ) as HTMLElement | null;
}

function ensurePanelRoot(): HTMLDivElement {
  let root = document.getElementById(PANEL_ROOT_ID) as HTMLDivElement | null;
  if (!root) {
    root = document.createElement('div');
    root.id = PANEL_ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
}

function createButton(id: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.id = id;
  btn.type = 'button';
  btn.className = 'btn btn-outline-secondary grw-tree-builder-sidebar-btn';
  btn.setAttribute('aria-label', 'ツリー構築を開く');
  btn.title = 'ツリー構築を開く';
  btn.innerHTML = '<span class="grw-tree-builder-sidebar-icon" aria-hidden="true">📋</span>';
  btn.style.marginTop = '0.5rem';
  btn.style.marginLeft = '0.25rem';
  btn.style.marginRight = '0.25rem';
  btn.addEventListener('click', openPanel);
  return btn;
}

function addSidebarButton(): boolean {
  if (document.getElementById(SIDEBAR_BTN_ID) || document.getElementById(FALLBACK_BTN_ID)) return true;
  const container = getSidebarContainer();
  if (container) {
    const btn = createButton(SIDEBAR_BTN_ID);
    container.insertBefore(btn, container.firstChild);
    return true;
  }
  return false;
}

function addFallbackButton(): void {
  if (document.getElementById(FALLBACK_BTN_ID)) return;
  const btn = createButton(FALLBACK_BTN_ID);
  btn.style.position = 'fixed';
  btn.style.left = '8px';
  btn.style.top = '50%';
  btn.style.transform = 'translateY(-50%)';
  btn.style.zIndex = '1040';
  btn.style.borderRadius = '8px';
  btn.style.padding = '0.5rem 0.75rem';
  document.body.appendChild(btn);
}

function openPanel(): void {
  const rootEl = ensurePanelRoot();
  rootEl.innerHTML = '';
  const root = createRoot(rootEl);
  root.render(
    React.createElement(Panel, {
      onClose: () => {
        root.unmount();
        rootEl.innerHTML = '';
      },
    })
  );
}

function removeSidebarButton(): void {
  document.getElementById(SIDEBAR_BTN_ID)?.remove();
  document.getElementById(FALLBACK_BTN_ID)?.remove();
}

function removePanelRoot(): void {
  document.getElementById(PANEL_ROOT_ID)?.remove();
}

const activate = (): void => {
  if (typeof window === 'undefined') return;
  function tryAdd() {
    if (addSidebarButton()) return;
    addFallbackButton();
  }
  tryAdd();
  if (document.readyState !== 'complete') {
    window.addEventListener('load', tryAdd);
  }
  [500, 1500, 3000, 5000].forEach((ms) =>
    setTimeout(() => {
      if (document.getElementById(SIDEBAR_BTN_ID)) return;
      if (addSidebarButton()) {
        document.getElementById(FALLBACK_BTN_ID)?.remove();
      } else {
        addFallbackButton();
      }
    }, ms)
  );
};

const deactivate = (): void => {
  removeSidebarButton();
  removePanelRoot();
};

declare global {
  interface Window {
    pluginActivators?: Record<string, { activate: () => void; deactivate: () => void }>;
  }
}

if (typeof window !== 'undefined') {
  if (window.pluginActivators == null) window.pluginActivators = {};
  window.pluginActivators[PLUGIN_ID] = { activate, deactivate };
}
