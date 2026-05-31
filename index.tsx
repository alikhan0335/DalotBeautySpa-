import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/')({
  component: RedirectToHome,
  head: () => ({
    meta: [
      { title: 'Dalot Beauty Spa — Refresh Your Beauty, Reveal Your Radiance' },
      { name: 'description', content: 'Dalot Beauty Spa — premium salon & spa services. Book hair, skin, nails & bridal treatments today.' },
    ],
  }),
});

function RedirectToHome() {
  useEffect(() => {
    window.location.replace('/pages/home.html');
  }, []);
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'serif', background: '#fdf6f0', color: '#6b4226' }}>
      <p>Loading Dalot Beauty Spa…</p>
    </div>
  );
}
