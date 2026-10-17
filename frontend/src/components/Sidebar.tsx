import Dashboard from '@mui/icons-material/Dashboard';
import AccountTree from '@mui/icons-material/AccountTree';
import ListAlt from '@mui/icons-material/ListAlt';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import OpenInNew from '@mui/icons-material/OpenInNew';
import { useState } from 'react';

const items = [
  { label: 'Dashboard', target: 'dashboard', icon: <Dashboard /> },
  { label: 'Integrations', target: 'integrations', icon: <AccountTree /> },
  { label: 'Logs & trends', target: 'logs', icon: <ListAlt /> },
  { label: 'AI Insights', target: 'insights', icon: <AutoAwesome /> },
];

export function Sidebar({ onNavigate }: { onNavigate: (target: string) => void }) {
  const [active, setActive] = useState('Dashboard');
  return <aside className="sidebar"><nav aria-label="Dashboard sections">{items.map(item => <button key={item.label} className={`nav-item ${active === item.label ? 'active' : ''}`} onClick={() => { setActive(item.label); onNavigate(item.target); }}><span>{item.icon}</span>{item.label}</button>)}</nav><a className="sidebar-bottom" href="http://localhost:8080/swagger-ui/index.html" target="_blank" rel="noreferrer"><span>Java API documentation</span><OpenInNew fontSize="small" /></a></aside>;
}
