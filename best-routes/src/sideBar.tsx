import React from 'react';

interface SidebarProps {
  headerText: string;
  entries: string[] | { id: number; address: string }[];
  onRemove?: (id: number) => void;
  children?: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ headerText, entries, onRemove, children }) => (
  <div
    style={{
      position: 'fixed',
      top: '215px',
      right: '60px',
      width: '300px',
      height: '660px',
      background: 'rgba(255,255,255,0.9)',
      padding: '1rem',
      zIndex: 1000,
      overflowY: 'auto'
    }}
  >
    <h2>{headerText}</h2>
    <ul>
      {entries.map((entry, idx) => {
        const label = typeof entry === 'string' ? entry : entry.address;
        const id = typeof entry === 'string' ? idx : entry.id;

        return (
          <li key={id}>
            {label}
            {onRemove && (
              <button onClick={() => onRemove(id)} style={{ marginLeft: '0.5rem' }}>
                X
              </button>
            )}
          </li>
        );
      })}
    </ul>
    {children}
  </div>
);

export default Sidebar;
