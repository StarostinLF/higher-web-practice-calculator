import { renderEditBudgetPage } from './pages/edit-budget-page';
import { renderHistoryPage } from './pages/history-page';
import { renderMainPage } from './pages/main-page';
import { renderStartPage } from './pages/start-page';
import { getState, loadInitial, subscribe } from './utils/state';

function render(root: HTMLElement): void {
  const state = getState();
  if (!state.loaded) {
    root.innerHTML = '';
    return;
  }
  switch (state.route) {
    case 'start':
      renderStartPage(root);
      break;
    case 'main':
      renderMainPage(root);
      break;
    case 'history':
      renderHistoryPage(root);
      break;
    case 'edit':
      renderEditBudgetPage(root);
      break;
  }
}

export function initApp(): void {
  const root = document.getElementById('app');
  if (!root) {
    return;
  }

  subscribe(() => render(root));
  void loadInitial();
}
