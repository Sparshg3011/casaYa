export type NavbarEventDetail = { count: number };

export const clearNotification = () => {
  const event = new CustomEvent<NavbarEventDetail>('clearNotification', { 
    detail: { count: 0 } 
  });
  window.dispatchEvent(event);
}; 