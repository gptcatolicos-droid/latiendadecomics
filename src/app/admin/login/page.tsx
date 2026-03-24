'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Bienvenido');
        router.push('/admin');
      } else {
        toast.error(data.error || 'Credenciales inválidas');
      }
    } catch { toast.error('Error de conexión'); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-black rounded-xl mb-4">
            <span className="text-red text-xl font-bold">C</span>
          </div>
          <h1 className="font-display text-3xl">Panel Admin</h1>
          <p className="text-gray-400 text-sm mt-1">La Tienda de Comics</p>
        </div>

        <form onSubmit={login} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@latiendadecomics.com"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red transition-colors"
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red transition-colors"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-red text-white font-semibold rounded-xl hover:bg-red-dark transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Ingresando...
              </span>
            ) : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
