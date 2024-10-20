import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import './index.css';
import configureStore from './store/store';
import { restoreCSRF, csrfFetch } from './store/csrf';
import * as sessionActions from './store/session'; // <-- ADD THIS LINE
import { ModalProvider } from './context/Modal';

const store = configureStore();

if (import.meta.env.MODE !== 'production') {
	restoreCSRF();

	window.csrfFetch = csrfFetch;
	window.store = store;
  window.sessionActions = sessionActions; // <-- ADD THIS LINE
}

//Create a variable to access your store and expose it on the window. It should not be exposed in production; 
//make sure this is only set in development.
if (process.env.NODE_ENV !== 'production') {
  window.store = store;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ModalProvider>
    <Provider store={store}>
      <App />
    </Provider>
    </ModalProvider>
  </React.StrictMode>
);
