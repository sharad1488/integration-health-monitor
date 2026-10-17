import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningAmber from '@mui/icons-material/WarningAmber';
import { Box, Paper, Typography } from '@mui/material';
interface SummaryCardProps { label:string; value:number; percent?:string; tone:'blue'|'green'|'amber'|'red'; }
const iconMap={blue:<span className="summary-glyph">◈</span>,green:<CheckCircle/>,amber:<WarningAmber/>,red:<ErrorIcon/>};
export function SummaryCard({label,value,percent,tone}:SummaryCardProps){return <Paper className="summary-card"><div className={`summary-icon ${tone}`}>{iconMap[tone]}</div><Box><Typography className="summary-label">{label}</Typography><Box className="summary-value-line"><strong>{value}</strong>{percent&&<span>{percent}</span>}</Box></Box></Paper>}
