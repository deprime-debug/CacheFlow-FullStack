import React, { useState, useEffect } from 'react';
import { CodeFile } from '../types';
import { api } from '../services/api';
import {
  Code2,
  Database,
  Copy,
  Check,
  Server,
  FileCode,
  Layers,
  Terminal,
  Shield,
} from 'lucide-react';

export const SpringBootDocsView: React.FC = () => {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [schemaSql, setSchemaSql] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const [docsFiles, sql] = await Promise.all([
          api.getSpringBootDocs(),
          api.getSchemaSql(),
        ]);
        setFiles(docsFiles);
        setSchemaSql(sql);
      } catch (err) {
        console.error('Failed to load Spring Boot architecture docs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDocs();
  }, []);

  const currentFile = files[selectedFileIndex];

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(schemaSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Enterprise Architecture</span>
            <span aria-hidden="true">·</span>
            <span>Spring Boot 3.x & MySQL 8.x</span>
            <span aria-hidden="true">·</span>
            <span>JWT Bearer Security</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Spring Boot REST API & MySQL Backend Architecture
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySchema}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            Copy MySQL schema.sql
          </button>
        </div>
      </div>

      {/* Architectural Overview Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <Shield className="w-4 h-4" />
            <span>JWT Stateless Authentication</span>
          </div>
          <p className="text-xs text-slate-600">
            Spring Security 6 stateless filter chain validating Bearer tokens on <code className="bg-slate-100 px-1 rounded">/api/expenses/**</code> with BCrypt password hashing.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-600">
            <Server className="w-4 h-4" />
            <span>Spring Boot 3 REST Controllers</span>
          </div>
          <p className="text-xs text-slate-600">
            Clean REST endpoints (<code className="bg-slate-100 px-1 rounded">AuthController</code> & <code className="bg-slate-100 px-1 rounded">ExpenseController</code>) matching the frontend API contract.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
            <Database className="w-4 h-4" />
            <span>MySQL Relational Entities & DDL</span>
          </div>
          <p className="text-xs text-slate-600">
            JPA Hibernate entities for users, categories, expenses, and budgets mapped to InnoDB tables with foreign key integrity.
          </p>
        </div>
      </div>

      {/* Code Viewer Workspace */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
        {/* Workspace Top Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800 text-xs">
          {/* File selector pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {files.map((file, idx) => (
              <button
                key={file.filename}
                onClick={() => setSelectedFileIndex(idx)}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedFileIndex === idx
                    ? 'bg-slate-800 text-white font-medium border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{file.filename}</span>
              </button>
            ))}
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="self-end sm:self-auto px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors flex items-center gap-1.5 shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Path & Description Banner */}
        {currentFile && (
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Path: {currentFile.path}</span>
            <span className="text-slate-400 font-sans hidden sm:inline">{currentFile.description}</span>
          </div>
        )}

        {/* Code Content */}
        <div className="p-4 sm:p-6 overflow-x-auto max-h-[550px] font-mono text-xs text-slate-200 leading-relaxed">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading Spring Boot source code...</div>
          ) : currentFile ? (
            <pre className="selection:bg-indigo-600 selection:text-white">
              <code>{currentFile.code}</code>
            </pre>
          ) : (
            <div className="py-12 text-center text-slate-500">No file selected</div>
          )}
        </div>
      </div>

      {/* MySQL Schema Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              MySQL Production DDL Schema (`schema.sql`)
            </h3>
            <p className="text-xs text-slate-500">
              Tables: <code className="bg-slate-100 px-1 rounded">users</code>, <code className="bg-slate-100 px-1 rounded">categories</code>, <code className="bg-slate-100 px-1 rounded">expenses</code>, and <code className="bg-slate-100 px-1 rounded">budgets</code>
            </p>
          </div>
          <button
            onClick={handleCopySchema}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Schema
          </button>
        </div>

        <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-72">
          <pre>
            <code>{schemaSql}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
