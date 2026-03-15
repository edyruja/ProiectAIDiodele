export const SELECTED_COMPANY_ID_KEY = 'selectedCompanyId';
export const SELECTED_COMPANY_NAME_KEY = 'selectedCompanyName';
export const SELECTED_COMPANY_CHANGED_EVENT = 'selected-company-changed';

export interface SelectedCompanyState {
  id: number | null;
  name: string | null;
}

const parseId = (value: string | null): number | null => {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const readSelectedCompanyState = (): SelectedCompanyState => ({
  id: parseId(localStorage.getItem(SELECTED_COMPANY_ID_KEY)),
  name: localStorage.getItem(SELECTED_COMPANY_NAME_KEY),
});

export const writeSelectedCompanyState = (next: Partial<SelectedCompanyState>) => {
  if (next.id == null) {
    localStorage.removeItem(SELECTED_COMPANY_ID_KEY);
  } else {
    localStorage.setItem(SELECTED_COMPANY_ID_KEY, String(next.id));
  }

  const trimmedName = next.name?.trim();
  if (!trimmedName) {
    localStorage.removeItem(SELECTED_COMPANY_NAME_KEY);
  } else {
    localStorage.setItem(SELECTED_COMPANY_NAME_KEY, trimmedName);
  }

  const detail = readSelectedCompanyState();
  window.dispatchEvent(new CustomEvent<SelectedCompanyState>(SELECTED_COMPANY_CHANGED_EVENT, { detail }));
};

export const subscribeSelectedCompanyChanges = (
  callback: (state: SelectedCompanyState) => void,
) => {
  const onCustomChange = (event: Event) => {
    const customEvent = event as CustomEvent<SelectedCompanyState>;
    callback(customEvent.detail || readSelectedCompanyState());
  };

  const onStorageChange = (event: StorageEvent) => {
    if (
      event.key === SELECTED_COMPANY_ID_KEY ||
      event.key === SELECTED_COMPANY_NAME_KEY ||
      event.key === null
    ) {
      callback(readSelectedCompanyState());
    }
  };

  window.addEventListener(SELECTED_COMPANY_CHANGED_EVENT, onCustomChange as EventListener);
  window.addEventListener('storage', onStorageChange);

  return () => {
    window.removeEventListener(SELECTED_COMPANY_CHANGED_EVENT, onCustomChange as EventListener);
    window.removeEventListener('storage', onStorageChange);
  };
};
