'use client';

import '@/styles/admin.css';
import AdminShell from '@/components/admin/AdminShell';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/admin/login') return <>{children}</>;
  return <Suspense fallback={<div className="admin-auth-loading" role="status"><span className="admin-spinner"/><p>Preparando tu espacio</p></div>}><AdminShell>{children}</AdminShell></Suspense>;
}
