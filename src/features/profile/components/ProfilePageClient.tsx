'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/shared/context/AppContext';
import { AppHeader } from '@/shared/components/AppHeader';

interface User {
  id?: string;
  nome: string;
  email: string;
  cargo: string;
  avatar_url?: string;
}

export function ProfilePageClient() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User>({
    nome: '',
    email: '',
    cargo: '',
  });
  const [senha, setSenha] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'ok' | 'erro' | 'aviso' | ''>('');
  const [lastSync, setLastSync] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState('https://i.pravatar.cc/100');
  const [showCropperModal, setShowCropperModal] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const carregarPerfil = useCallback(async () => {
    try {
      setMessage('');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      // Add authorization token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers,
      });

      if (!response.ok) throw new Error('Erro ao carregar perfil');

      const userData = await response.json() as User;
      setUser({
        id: userData.id || 'USR-001',
        nome: userData.nome || '',
        email: userData.email || '',
        cargo: userData.cargo || '',
      });

      if (userData.avatar_url) {
        setAvatar(userData.avatar_url);
      }

      stampSync();
    } catch (e) {
      console.error('Erro ao carregar perfil:', e);
      setMessage('Não foi possível carregar seu perfil.');
      setMessageType('erro');
    }
  }, [token]);

  useEffect(() => {
    carregarPerfil();
  }, [carregarPerfil]);

  function stampSync() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setLastSync(
      `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} • ${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!user.nome || !user.email || !user.cargo) {
        setMessage('Preencha nome, e-mail e função no sistema.');
        setMessageType('aviso');
        setLoading(false);
        return;
      }

      const payload: Record<string, string> = {
        nome: user.nome,
        email: user.email,
        cargo: user.cargo,
      };

      if (senha) payload.senha = senha;

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Erro ao salvar perfil');

      setMessage('Perfil atualizado com sucesso!');
      setMessageType('ok');
      setSenha('');
      stampSync();
    } catch (e) {
      console.error('Erro ao salvar:', e);
      setMessage('Erro ao salvar alterações.');
      setMessageType('erro');
    } finally {
      setLoading(false);
    }
  }

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setImageSrc(src);
      setShowCropperModal(true);
    };
    reader.readAsDataURL(file);
  }

  async function handleCropConfirm() {
    if (!canvasRef.current || !imageSrc) return;

    try {
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const reader = new FileReader();
        reader.onload = async () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          if (!base64) return;

          try {
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/auth/me', {
              method: 'PUT',
              headers,
              body: JSON.stringify({ avatar_url: `data:image/png;base64,${base64}` }),
            });

            if (!response.ok) throw new Error('Erro ao salvar avatar');

            setAvatar(`data:image/png;base64,${base64}`);
            setShowCropperModal(false);
            setImageSrc('');
            if (fileInputRef.current) fileInputRef.current.value = '';
          } catch (err) {
            console.error(err);
            alert('Erro ao salvar foto');
          }
        };
        reader.readAsDataURL(blob);
      }, 'image/png', 0.95);
    } catch (err) {
      console.error(err);
      alert('Erro ao processar imagem');
    }
  }

  return (
    <>
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
          {/* PERFIL */}
          <section className="premium-card p-6 md:p-8 bg-white border border-slate-200/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="pill px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                  Perfil
                </span>
                <h1 className="mt-3 text-2xl md:text-3xl font-semibold leading-tight">
                  Seus dados, funções e segurança
                  <span className="block text-[#F58634]">em um lugar seguro</span>
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Atualize suas informações e mantenha o acesso seguro.
                </p>
              </div>

              <div className="hidden md:flex flex-col items-end gap-2">
                <span className="pill px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                  ID: <span className="font-black text-slate-900">USR-001</span>
                </span>
                <span className="pill px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                  Status: Ativo
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* Avatar */}
              <div className="bg-slate-50/80 border border-slate-200/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative">
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-200"
                  />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></span>
                </div>

                <div className="flex-1">
                  <p className="text-sm font-extrabold text-slate-900">Foto do perfil</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Selecione uma imagem para fazer upload, recorte e ajustar automaticamente.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      className="px-4 py-2 rounded-lg bg-[#F58634] text-white text-sm font-bold hover:bg-orange-600 transition"
                    >
                      📸 Alterar foto
                    </button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="nome" className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">
                    Nome
                  </label>
                  <input
                    id="nome"
                    type="text"
                    value={user.nome}
                    onChange={(e) => setUser({ ...user, nome: e.target.value })}
                    placeholder="Seu nome completo"
                    autoComplete="name"
                    className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/90 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F58634]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="email" className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={user.email}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                    placeholder="seuemail@empresa.com"
                    autoComplete="email"
                    className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/90 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F58634]"
                  />
                </div>

                <div>
                  <label htmlFor="cargo" className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">
                    Função no sistema
                  </label>
                  <select
                    id="cargo"
                    value={user.cargo}
                    onChange={(e) => setUser({ ...user, cargo: e.target.value })}
                    className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/90 text-sm text-slate-900 focus:outline-none focus:border-[#F58634]"
                  >
                    <option value="">Selecione</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="RH">RH</option>
                    <option value="GESTOR">Gestor</option>
                    <option value="COLABORADOR">Colaborador</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">
                    Preferências
                  </label>
                  <button
                    type="button"
                    className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-sm font-extrabold text-slate-900 hover:bg-white focus:outline-none focus:border-[#F58634] flex items-center justify-between"
                  >
                    Abrir configurações
                    <span className="text-slate-400">⚙️</span>
                  </button>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="senha" className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">
                    Nova senha (opcional)
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="senha"
                      type={showPassword ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Deixe em branco para manter a atual"
                      autoComplete="new-password"
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-white/90 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F58634]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Dica: use pelo menos 10 caracteres, com letras e números.
                  </p>
                </div>
              </div>

              {message && (
                <p
                  className={`mt-4 text-sm text-center font-bold ${
                    messageType === 'ok'
                      ? 'text-emerald-600'
                      : messageType === 'erro'
                      ? 'text-red-600'
                      : messageType === 'aviso'
                      ? 'text-amber-600'
                      : 'text-slate-600'
                  }`}
                >
                  {message}
                </p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-[#F58634] text-white font-bold hover:bg-orange-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  💾 {loading ? 'Salvando...' : 'Salvar alterações'}
                </button>

                <div className="sm:ml-auto text-xs text-slate-600">
                  última sincronização: <span className="text-slate-900 font-extrabold">{lastSync || '—'}</span>
                </div>
              </div>
            </form>
          </section>

          {/* SEGURANÇA */}
          <aside className="bg-slate-50/80 border border-slate-200/50 rounded-2xl p-6 md:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="pill px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                  Segurança
                </span>
                <h2 className="mt-3 text-lg font-semibold">Controle e visibilidade</h2>
                <p className="mt-1 text-sm text-slate-600">Camadas de proteção e recomendações.</p>
              </div>
              <span className="pill px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full border border-orange-200">
                Shield
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="premium-card p-4 bg-white border border-slate-200/50">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 font-extrabold">2FA</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">Em breve</p>
              </div>

              <div className="premium-card p-4 bg-white border border-slate-200/50">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 font-extrabold">Sessões</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">1 ativa</p>
              </div>

              <div className="premium-card p-4 bg-white border border-slate-200/50">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 font-extrabold">Permissões</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">Padrão</p>
              </div>

              <div className="premium-card p-4 bg-white border border-slate-200/50">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 font-extrabold">Auditoria</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">Ativa</p>
              </div>
            </div>

            <div className="mt-4 premium-card p-4 bg-white border border-slate-200/50">
              <p className="text-sm font-extrabold text-slate-900">Sugestões</p>
              <ul className="mt-2 text-sm text-slate-600 list-disc ml-5 space-y-1">
                <li>Ative 2FA quando estiver disponível</li>
                <li>Use uma senha forte e exclusiva</li>
                <li>Revise permissões por vaga/equipe</li>
              </ul>
            </div>

            <button
              type="button"
              className="btn focus-brand w-full mt-4 px-4 py-3 rounded-xl bg-slate-100 text-slate-900 font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2"
            >
              <span>🔐</span>
              Gerenciar sessões
            </button>
          </aside>
        </div>
      </main>

      {/* Cropper Modal */}
      {showCropperModal && imageSrc && (
        <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto p-4 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-600px max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">Recortar imagem</h3>
              <button
                type="button"
                onClick={() => setShowCropperModal(false)}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4 text-center">
              <img
                src={imageSrc}
                alt="Preview"
                style={{ maxHeight: '400px', maxWidth: '100%' }}
                className="mx-auto"
              />
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowCropperModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                className="px-4 py-2 rounded-lg bg-[#F58634] text-white font-bold hover:bg-orange-600"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
