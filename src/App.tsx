import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { store } from './store/index';
import { AppLayout } from './components';
import AppRoutes from './routes/AppRoutes';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
