import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';
const theme=createTheme({palette:{primary:{main:'#0864e8'},background:{default:'#f4f7fb',paper:'#ffffff'},text:{primary:'#10213e',secondary:'#5e6e85'}},typography:{fontFamily:'Inter, "Segoe UI", Arial, sans-serif',h6:{fontSize:16,fontWeight:700},button:{textTransform:'none',fontWeight:600}},shape:{borderRadius:10}});
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><ThemeProvider theme={theme}><CssBaseline/><App/></ThemeProvider></React.StrictMode>);
