import './presentation/styles/index.css';
import { mountApp } from './bootstrap/setup';

const root = document.getElementById('app');
if (!root) {
  throw new Error('#app root element not found');
}

mountApp(root);
