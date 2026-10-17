import Autorenew from '@mui/icons-material/Autorenew';
import Circle from '@mui/icons-material/Circle';
interface Props { updatedAt: string; refreshing: boolean; connected: boolean; onRefresh: () => void; }
export function TopBar({ updatedAt, refreshing, connected, onRefresh }: Props) {
  const updated = updatedAt ? new Intl.DateTimeFormat(undefined, { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(updatedAt)) : 'Waiting for data';
  return <header className="topbar"><div className="brand-mark">✣</div><strong className="brand-title">Integration Health</strong><div className="topbar-spacer"/><span className="last-updated">Last updated <strong>{updated}</strong></span><span className={`connection-state ${connected ? 'connected' : 'disconnected'}`}><Circle fontSize="small"/>{connected ? 'Java connected' : 'Java unavailable'}</span><button className="refresh-button" onClick={onRefresh} disabled={refreshing} aria-label="Refresh health data" title="Refresh from Java"><Autorenew className={refreshing ? 'spin' : ''}/></button></header>;
}
