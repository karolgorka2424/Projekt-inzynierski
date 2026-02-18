import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = createRoot(document.getElementById('root'));
root.render(<App />);

// Always clear any existing SW first to avoid stale caches
serviceWorkerRegistration.unregister();

// Register SW only in production
if (process.env.NODE_ENV === 'production') {
	serviceWorkerRegistration.register();
}
