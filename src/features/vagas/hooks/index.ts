'use client';

import { useState, useCallback } from 'react';
import { Vaga, VagaFilters } from '../types';

interface UseVagasFilterResult {
  filters: VagaFilters;
  setFilters: (filters: VagaFilters) => void;
  updateFilter: (key: keyof VagaFilters, value: string) => void;
  resetFilters: () => void;
  applyFilters: (vagas: Vaga[]) => Vaga[];
}

export function useVagasFilter(): UseVagasFilterResult {
  const [filters, setFilters] = useState<VagaFilters>({
    texto: '',
    cidade: '',
    status: '',
    modelo: '',
    tipoContrato: ''
  });

  const updateFilter = useCallback((key: keyof VagaFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      texto: '',
      cidade: '',
      status: '',
      modelo: '',
      tipoContrato: ''
    });
  }, []);

  const applyFilters = useCallback((vagas: Vaga[]): Vaga[] => {
    return vagas.filter(v => {
      const titulo = (v.titulo || '').toLowerCase();
      const area = (v.area || '').toLowerCase();
      const responsavel = (v.responsavel || '').toLowerCase();
      const texto = filters.texto.toLowerCase().trim();
      
      const matchTexto = !texto ||
        titulo.includes(texto) ||
        area.includes(texto) ||
        responsavel.includes(texto);

      const cid = (v.cidade || '').toLowerCase();
      const cidade = filters.cidade.toLowerCase().trim();
      const matchCidade = !cidade || cid.includes(cidade);

      const st = v.status_processo || '';
      const matchStatus = !filters.status || st === filters.status;

      const mod = v.modelo_trabalho || '';
      const matchModelo = !filters.modelo || mod === filters.modelo;

      const tipo = v.tipo_contrato || '';
      const matchTipo = !filters.tipoContrato || tipo === filters.tipoContrato;

      return matchTexto && matchCidade && matchStatus && matchModelo && matchTipo;
    });
  }, [filters]);

  return { filters, setFilters, updateFilter, resetFilters, applyFilters };
}

interface UseVagasPaginationResult {
  paginaAtual: number;
  vagasPorPagina: number;
  setPaginaAtual: (page: number) => void;
  getPaginatedVagas: (vagas: Vaga[]) => { items: Vaga[]; total: number; totalPages: number };
}

export function useVagasPagination(vagasPorPagina = 6): UseVagasPaginationResult {
  const [paginaAtual, setPaginaAtual] = useState(1);

  const getPaginatedVagas = useCallback((vagas: Vaga[]) => {
    const total = vagas.length;
    const totalPages = Math.ceil(total / vagasPorPagina);
    const inicio = (paginaAtual - 1) * vagasPorPagina;
    const fim = inicio + vagasPorPagina;
    return {
      items: vagas.slice(inicio, fim),
      total,
      totalPages
    };
  }, [paginaAtual, vagasPorPagina]);

  return { paginaAtual, vagasPorPagina, setPaginaAtual, getPaginatedVagas };
}
