'use client';

import React, { useState } from 'react';
import { Vaga } from '../types';
import { formatSalary } from '../services/vagasApi';

interface VagasModalsProps {
  showDetalhes: boolean;
  detalhesVaga: Vaga | null;
  onCloseDetalhes: () => void;
  onEditar: (vaga: Vaga) => void;
  showEditar: boolean;
  onCloseEditar: () => void;
  onSaveEditar: (vaga: Partial<Vaga>) => void;
  editarVaga: Vaga | null;
  showCriar: boolean;
  onCloseCriar: () => void;
  onSaveCriar: (vaga: Partial<Vaga>) => void;
}

export function VagasModals({
  showDetalhes,
  detalhesVaga,
  onCloseDetalhes,
  onEditar,
  showEditar,
  onCloseEditar,
  onSaveEditar,
  editarVaga,
  showCriar,
  onCloseCriar,
  onSaveCriar
}: VagasModalsProps) {
  const [detalhesTab, setDetalhesTab] = useState<'resumo' | 'candidatos' | 'sugestoes' | 'historico'>('resumo');

  return (
    <>
      {/* MODAL DETALHES */}
      {showDetalhes && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-xl relative fade-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={onCloseDetalhes}
              className="absolute top-4 right-4 text-gray-400 hover:text-[#F58634] text-xl font-bold"
              aria-label="Fechar detalhes"
            >
              &times;
            </button>

            {detalhesVaga && (
              <>
                <h2 className="text-lg font-semibold text-[#0A2725] mb-3">{detalhesVaga.titulo || 'Vaga'}</h2>
                <p className="text-sm text-gray-600 mb-4">
                  {detalhesVaga.cidade || 'Cidade não informada'} • {detalhesVaga.modelo_trabalho || 'Modelo não informado'}
                </p>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(['resumo', 'candidatos', 'sugestoes', 'historico'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setDetalhesTab(tab)}
                      className={`px-3 py-2 text-xs font-semibold rounded-full transition-colors ${
                        detalhesTab === tab
                          ? 'bg-[#F58634] text-white'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Resumo */}
                {detalhesTab === 'resumo' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                      <p>
                        <span className="font-semibold text-[#0A2725]">Área:</span> {detalhesVaga.area || '-'}
                      </p>
                      <p>
                        <span className="font-semibold text-[#0A2725]">Tipo:</span> {detalhesVaga.tipo_contrato || '-'}
                      </p>
                      <p>
                        <span className="font-semibold text-[#0A2725]">Nível:</span> {detalhesVaga.nivel || '-'}
                      </p>
                      <p>
                        <span className="font-semibold text-[#0A2725]">Status:</span> {detalhesVaga.status_processo || '-'}
                      </p>
                      <p>
                        <span className="font-semibold text-[#0A2725]">Responsável:</span> {detalhesVaga.responsavel || '-'}
                      </p>
                      <p>
                        <span className="font-semibold text-[#0A2725]">Abertura:</span>{' '}
                        {detalhesVaga.data_abertura ? new Date(detalhesVaga.data_abertura).toLocaleDateString('pt-BR') : '-'}
                      </p>
                      <p>
                        <span className="font-semibold text-[#0A2725]">Candidatos:</span>{' '}
                        {typeof detalhesVaga.total_candidatos === 'number' ? detalhesVaga.total_candidatos : '-'}
                      </p>
                      <p>
                        <span className="font-semibold text-[#0A2725]">Faixa salarial:</span> {formatSalary(detalhesVaga.salario_min, detalhesVaga.salario_max)}
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-semibold text-[#0A2725] mb-1">Descrição da vaga</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {detalhesVaga.descricao || detalhesVaga.descricao_curta || 'Nenhuma descrição informada.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Candidatos, Sugestões, Histórico */}
                {['candidatos', 'sugestoes', 'historico'].includes(detalhesTab) && (
                  <div className="text-sm text-gray-600">
                    <p className="mb-3">Esta seção será integrada com o Banco de Talentos.</p>
                    <a
                      href="/banco-talentos"
                      className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#0A2725] hover:bg-slate-50"
                    >
                      Ver Banco de Talentos
                    </a>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-2 text-xs">
                  <button
                    onClick={onCloseDetalhes}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => {
                      onEditar(detalhesVaga);
                      onCloseDetalhes();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#F58634] text-white font-semibold hover:bg-[#d87026]"
                  >
                    Editar vaga
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {showEditar && editarVaga && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-xl relative fade-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={onCloseEditar}
              className="absolute top-4 right-4 text-gray-400 hover:text-[#F58634] text-xl font-bold"
              aria-label="Fechar edição"
            >
              &times;
            </button>

            <h2 className="text-lg font-semibold text-[#0A2725] mb-4">Editar Vaga</h2>

            <VagaForm
              initialVaga={editarVaga}
              onSubmit={onSaveEditar}
              onCancel={onCloseEditar}
            />
          </div>
        </div>
      )}

      {/* MODAL CRIAR */}
      {showCriar && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-xl relative fade-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={onCloseCriar}
              className="absolute top-4 right-4 text-gray-400 hover:text-[#F58634] text-xl font-bold"
              aria-label="Fechar criação"
            >
              &times;
            </button>

            <h2 className="text-lg font-semibold text-[#0A2725] mb-4">Nova Vaga</h2>

            <VagaForm
              onSubmit={onSaveCriar}
              onCancel={onCloseCriar}
            />
          </div>
        </div>
      )}
    </>
  );
}

interface VagaFormProps {
  initialVaga?: Vaga;
  onSubmit: (vaga: Partial<Vaga>) => void;
  onCancel: () => void;
}

function VagaForm({ initialVaga, onSubmit, onCancel }: VagaFormProps) {
  const [formData, setFormData] = useState({
    titulo: String(initialVaga?.titulo || ''),
    cidade: String(initialVaga?.cidade || ''),
    area: String(initialVaga?.area || ''),
    responsavel: String(initialVaga?.responsavel || ''),
    tipo_contrato: String(initialVaga?.tipo_contrato || ''),
    modelo_trabalho: String(initialVaga?.modelo_trabalho || ''),
    nivel: String(initialVaga?.nivel || initialVaga?.senioridade || ''),
    salario_min: String(initialVaga?.salario_min || ''),
    salario_max: String(initialVaga?.salario_max || ''),
    status_processo: String(initialVaga?.status_processo || initialVaga?.status || 'Recebendo Currículos'),
    descricao_curta: String(initialVaga?.descricao_curta || ''),
    descricao: String(initialVaga?.descricao || '')
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: Partial<Vaga> = {
      titulo: formData.titulo,
      cidade: formData.cidade,
      area: formData.area,
      responsavel: formData.responsavel,
      tipo_contrato: formData.tipo_contrato,
      modelo_trabalho: formData.modelo_trabalho,
      nivel: formData.nivel,
      salario_min: formData.salario_min ? Number(formData.salario_min) : undefined,
      salario_max: formData.salario_max ? Number(formData.salario_max) : undefined,
      status_processo: formData.status_processo,
      descricao_curta: formData.descricao_curta,
      descricao: formData.descricao
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <div>
        <label className="font-semibold text-[#0A2725] block mb-1">Título</label>
        <input
          name="titulo"
          value={formData.titulo}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded-lg focus-visible:ring-1 focus-visible:ring-[#F58634]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-semibold text-[#0A2725] block mb-1">Cidade</label>
          <input
            name="cidade"
            value={formData.cidade}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus-visible:ring-1 focus-visible:ring-[#F58634]"
          />
        </div>
        <div>
          <label className="font-semibold text-[#0A2725] block mb-1">Área</label>
          <input
            name="area"
            value={formData.area}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus-visible:ring-1 focus-visible:ring-[#F58634]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="font-semibold text-[#0A2725] block mb-1">Responsável</label>
          <input
            name="responsavel"
            value={formData.responsavel}
            onChange={handleChange}
            placeholder="Nome do responsável"
            className="w-full px-3 py-2 border rounded-lg focus-visible:ring-1 focus-visible:ring-[#F58634]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="font-semibold text-[#0A2725] block mb-1">Tipo de Contrato</label>
          <input
            name="tipo_contrato"
            value={formData.tipo_contrato}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus-visible:ring-1 focus-visible:ring-[#F58634]"
          />
        </div>
        <div>
          <label className="font-semibold text-[#0A2725] block mb-1">Modelo</label>
          <input
            name="modelo_trabalho"
            value={formData.modelo_trabalho}
            onChange={handleChange}
            placeholder="Presencial / Remoto / Híbrido"
            className="w-full px-3 py-2 border rounded-lg focus-visible:ring-1 focus-visible:ring-[#F58634]"
          />
        </div>
        <div>
          <label className="font-semibold text-[#0A2725] block mb-1">Nível</label>
          <input
            name="nivel"
            value={formData.nivel}
            onChange={handleChange}
            placeholder="Júnior / Pleno / Sênior"
            className="w-full px-3 py-2 border rounded-lg focus-visible:ring-1 focus-visible:ring-[#F58634]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-semibold text-[#0A2725] block mb-1">Salário Mínimo</label>
          <input
            name="salario_min"
            type="number"
            value={formData.salario_min}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus-visible:ring-1 focus-visible:ring-[#F58634]"
          />
        </div>
        <div>
          <label className="font-semibold text-[#0A2725] block mb-1">Salário Máximo</label>
          <input
            name="salario_max"
            type="number"
            value={formData.salario_max}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus-visible:ring-1 focus-visible:ring-[#F58634]"
          />
        </div>
      </div>

      <div>
        <label className="font-semibold text-[#0A2725] block mb-1">Status do Processo</label>
        <select
          name="status_processo"
          value={formData.status_processo}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg focus-visible:ring-1 focus-visible:ring-[#F58634]"
        >
          <option>Recebendo Currículos</option>
          <option>Triagem</option>
          <option>Entrevista RH</option>
          <option>Entrevista Gestor</option>
          <option>Proposta</option>
          <option>Contratado</option>
          <option>Reprovado</option>
          <option>Encerrada</option>
        </select>
      </div>

      <div>
        <label className="font-semibold text-[#0A2725] block mb-1">Descrição Curta</label>
        <input
          name="descricao_curta"
          value={formData.descricao_curta}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg focus-visible:ring-1 focus-visible:ring-[#F58634]"
        />
      </div>

      <div>
        <label className="font-semibold text-[#0A2725] block mb-1">Descrição Completa</label>
        <textarea
          name="descricao"
          value={formData.descricao}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus-visible:ring-1 focus-visible:ring-[#F58634]"
        ></textarea>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-[#F58634] text-white text-sm font-semibold hover:bg-[#d87026]"
        >
          {initialVaga ? 'Salvar alterações' : 'Criar Vaga'}
        </button>
      </div>
    </form>
  );
}
