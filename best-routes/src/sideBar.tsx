// Sidebar.tsx
import React from 'react';

interface SidebarProps {
  entries: { id: number; address: string }[];
  onRemove: (id: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ entries, onRemove }) => (
  <div
    style={{
      position: 'fixed', top: '212px', right: 0,
      width: '300px', height: '670px', background: 'rgba(255,255,255,0.9)',
      padding: '1rem', zIndex: 1000
    }}
  >
    <h2>Added Addresses</h2>
    <ul>
      {entries.map((e, idx) => (
        <li key={e.id} style={{ marginBottom: 8 }}>
          {idx + 1}. {e.address}
          <button
            onClick={() => onRemove(e.id)}
            style={{
              marginLeft: 8,
              background: 'transparent',
              border: 'none',
              color: 'red',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  </div>
);

export default Sidebar;
