'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Vaga, VagaView, DEMO_VAGAS } from '../types';
import { useVagasFilter, useVagasPagination } from '../hooks';
import { fetchVagas, createVaga, updateVaga, deleteVaga, normalizeVaga, loadLocalVagas, saveLocalVagas, mergeVagas } from '../services/vagasApi';
import { VagasFilters } from './VagasFilters';
import { VagasDashboard } from './VagasDashboard';
import { VagasLista } from './VagasLista';
import { VagasCards } from './VagasCards';
import { VagasKanban } from './VagasKanban';
import { VagasModals } from './VagasModals';

export function VagasPageClient() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [filteredVagas, setFilteredVagas] = useState<Vaga[]>([]);
  const [currentView, setCurrentView] = useState<VagaView>('dashboard');

  const { filters, updateFilter, resetFilters: resetFiltersState, applyFilters } = useVagasFilter();
  const { paginaAtual, setPaginaAtual } = useVagasPagination(6);

  // Modal states
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [detalhesVaga, setDetalhesVaga] = useState<Vaga | null>(null);

  const [showEditar, setShowEditar] = useState(false);
  const [editarVaga, setEditarVaga] = useState<Vaga | null>(null);

  const [showCriar, setShowCriar] = useState(false);

  const loadVagas = useCallback(async () => {
    try {
      const apiVagas = await fetchVagas();
      const localVagas = loadLocalVagas();
      const merged = mergeVagas(
        apiVagas.map(normalizeVaga),
        localVagas.map(normalizeVaga)
      );
      const finalVagas = merged.length > 0 ? merged : DEMO_VAGAS;
      setVagas(finalVagas);
      setFilteredVagas(finalVagas);
    } catch (error) {
      console.error('Error loading vagas:', error);
      setVagas(DEMO_VAGAS);
      setFilteredVagas(DEMO_VAGAS);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const fetchData = async () => {
      await loadVagas();
    };
    void fetchData();
  }, [loadVagas]);

  const handleApplyFilters = () => {
    const filtered = applyFilters(vagas);
    setFilteredVagas(filtered);
    setPaginaAtual(1);
  };

  const handleResetFilters = () => {
    resetFiltersState();
    setFilteredVagas(vagas);
    setPaginaAtual(1);
  };

  const handleDetalhes = (vaga: Vaga) => {
    setDetalhesVaga(vaga);
    setShowDetalhes(true);
  };

  const handleEditar = (vaga: Vaga) => {
    setEditarVaga(vaga);
    setShowEditar(true);
  };

  const handleSaveEditar = async (vaga: Partial<Vaga>) => {
    if (!editarVaga || !editarVaga.id) return;

    const success = await updateVaga(editarVaga.id, vaga);
    if (success) {
      const updated = vagas.map(v =>
        v.id === editarVaga.id ? { ...editarVaga, ...vaga } : v
      );
      setVagas(updated);
      setFilteredVagas(updated);
      saveLocalVagas(updated);
      setShowEditar(false);
    }
  };

  const handleExcluir = async (vaga: Vaga) => {
    if (!confirm('Tem certeza que deseja excluir esta vaga?')) return;

    if (vaga.id) {
      await deleteVaga(vaga.id);
    }

    const updated = vagas.filter(v => v.id !== vaga.id);
    setVagas(updated);
    setFilteredVagas(updated);
    saveLocalVagas(updated);
  };

  const handleCreateVaga = async (formData: Partial<Vaga>) => {
    const novaVaga = await createVaga(formData);
    if (novaVaga) {
      const updated = [...vagas, novaVaga];
      setVagas(updated);
      setFilteredVagas(updated);
      saveLocalVagas(updated);
      setShowCriar(false);
    }
  };

  return (
    <main className="flex-1 w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Título + ação */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0A2725] tracking-tight">
              Gestão de Vagas
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              Gerencie o ciclo de vida das oportunidades em aberto.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCriar(true)}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg shadow-orange-500/20 bg-gradient-to-r from-[#F58634] to-[#f79955] hover:to-[#F58634] hover:shadow-orange-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4"></path>
            </svg>
            Nova vaga
          </button>
        </div>

        {/* Filtros */}
        <VagasFilters
          filters={filters}
          onFilterChange={updateFilter}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />

        {/* Tabs de visão */}
        <div className="mb-6 flex flex-wrap gap-2 text-xs sm:text-sm p-1 bg-white/50 backdrop-blur rounded-full w-fit border border-gray-200/60">
          {(['dashboard', 'lista', 'cards', 'kanban'] as VagaView[]).map(view => (
            <button
              key={view}
              type="button"
              onClick={() => setCurrentView(view)}
              className={`px-5 py-2 rounded-full font-bold transition-all shadow-sm ${
                currentView === view
                  ? 'bg-white text-[#F58634]'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>

        {/* Views */}
        {currentView === 'dashboard' && <VagasDashboard vagas={filteredVagas} />}

        {currentView === 'lista' && (
          <VagasLista
            vagas={filteredVagas}
            paginaAtual={paginaAtual}
            vagasPorPagina={6}
            onPageChange={setPaginaAtual}
            onDetalhes={handleDetalhes}
            onEditar={handleEditar}
            onExcluir={handleExcluir}
          />
        )}

        {currentView === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <VagasCards
              vagas={filteredVagas}
              onDetalhes={handleDetalhes}
              onEditar={handleEditar}
            />
          </div>
        )}

        {currentView === 'kanban' && (
          <VagasKanban
            vagas={filteredVagas}
            onDetalhes={handleDetalhes}
          />
        )}
      </div>

      {/* Modals */}
      <VagasModals
        showDetalhes={showDetalhes}
        detalhesVaga={detalhesVaga}
        onCloseDetalhes={() => setShowDetalhes(false)}
        onEditar={handleEditar}
        showEditar={showEditar}
        onCloseEditar={() => setShowEditar(false)}
        onSaveEditar={handleSaveEditar}
        editarVaga={editarVaga}
        showCriar={showCriar}
        onCloseCriar={() => setShowCriar(false)}
        onSaveCriar={handleCreateVaga}
      />
    </main>
  );
}
