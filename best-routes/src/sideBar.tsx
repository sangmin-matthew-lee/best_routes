// Sidebar.tsx
import React from 'react';

interface SidebarProps {
  headerText: string;
  entries: string[] | {id:number;address:string}[];
  onRemove?: (id:number)=>void;
}

const Sidebar: React.FC<SidebarProps> = ({ headerText, entries, onRemove }) => (
  <div
    style={{
      position: 'fixed', top: '212px', right: 0,
      width: '300px', height: '670px', background: 'rgba(255,255,255,0.9)',
      padding: '1rem', zIndex: 1000
    }}>

    <h2>{headerText}</h2>
        <ul>
          {entries.map((entry, idx) => {
            const label =
              typeof entry === 'string'
                ? entry
                : entry.address;
            const id = typeof entry === 'string'
                ? idx        // or generate unique
                : entry.id;
            return (
              <li key={id}>
                {idx + 1}. {label}
                {onRemove && (
                  <button onClick={() => onRemove(id)}>×</button>
                )}
              </li>
            );
          })}
    </ul>
  </div>
);

export default Sidebar;
