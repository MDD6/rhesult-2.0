'use client';

import React from 'react';
import { Vaga } from '../types';
import { formatSalary, getStatusBadgeClass } from '../services/vagasApi';

interface VagasCardsProps {
  vagas: Vaga[];
  onDetalhes: (vaga: Vaga, index: number) => void;
  onEditar: (vaga: Vaga, index: number) => void;
  onCandidatar: (vaga: Vaga) => void;
}

export function VagasCards({ vagas, onDetalhes, onEditar, onCandidatar }: VagasCardsProps) {
  if (vagas.length === 0) {
    return (
      <div className="col-span-full py-12 text-center">
        <p className="text-gray-400 text-base font-medium">Nenhuma vaga encontrada.</p>
        <p className="text-gray-300 text-sm mt-1">Tente ajustar os filtros de busca.</p>
      </div>
    );
  }

  return (
    <div className="grid [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))] gap-5">
      {vagas.map((v, idx) => {
        const faixa = v.tipo_contrato || 'CLT';
        const badgeClass =
          faixa === 'PJ' ? 'bg-purple-50 text-purple-700' :
          faixa === 'Estágio' ? 'bg-orange-50 text-orange-600' :
          'bg-emerald-50 text-emerald-700';

        const faixaStatus = v.status_processo || '-';
        const salarioTexto = formatSalary(v.salario_min, v.salario_max);
        const { dot } = getStatusBadgeClass(v.status_processo);

        return (
          <article
            key={v.id}
            className="group bg-white rounded-2xl shadow-sm border border-slate-200/70 p-5 sm:p-6 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-sm relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-1.5 h-full ${v.status_processo === 'Encerrada' ? 'bg-gray-200' : 'bg-[#F58634]'}`}></div>

            <div className="pl-4 mb-4">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-[#0A2725] text-lg leading-tight group-hover:text-[#F58634] transition-colors line-clamp-2" title={v.titulo}>
                    {v.titulo || 'Vaga sem título'}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wide line-clamp-1">
                    {v.area || 'Geral'} • {v.cidade || 'Remoto'}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
                  {faixa}
                </span>
              </div>

              <p className="text-sm text-slate-600 mt-3 line-clamp-3 leading-relaxed min-h-[64px]">
                {v.descricao_curta || v.descricao || 'Sem descrição disponível.'}
              </p>
            </div>

            <div className="pl-4 mt-auto">
              <div className="flex flex-wrap gap-2 text-[11px] items-center mb-4">
                <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-md font-semibold border border-slate-100">
                  {v.modelo_trabalho || 'Híbrido'}
                </span>
                <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-md font-semibold border border-slate-100">
                  {v.nivel || 'Pleno'}
                </span>
                <span className="ml-auto">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getStatusBadgeClass(faixaStatus).badge}`}>
                    <span className={`w-2 h-2 rounded-full ${dot}`}></span>
                    {faixaStatus}
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center gap-3 pt-3 border-t border-gray-100/60">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Salário</span>
                  <span className="text-lg font-extrabold text-[#0A2725] leading-tight">{salarioTexto}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onCandidatar(v)}
                    className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title="Candidatura"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 5v14m7-7H5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDetalhes(v, idx)}
                    className="p-2 rounded-lg text-gray-400 hover:text-[#0A2725] hover:bg-gray-50 transition-colors"
                    title="Ver Detalhes"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onEditar(v, idx)}
                    className="p-2 rounded-lg text-gray-400 hover:text-[#F58634] hover:bg-orange-50 transition-colors"
                    title="Editar Vaga"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
