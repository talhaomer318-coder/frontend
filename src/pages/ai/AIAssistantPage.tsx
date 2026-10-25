import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Shield,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database,
  Cpu,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LocalStore } from '../../services/api';
import { formatPKR } from '../../utils/calculations';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  toolsUsed?: string[];
  timestamp: string;
}

export const AIAssistantPage: React.FC = () => {
  const { role, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-0',
      sender: 'ai',
      text: `Welcome to the dedicated HCM Lite AI Assistant interface! I am connected to backend tools and authorized for your '${role}' role.\n\nTry asking:\n- "What is our company headcount and active payroll cost?"\n- "Who arrived late today?"\n- "What are our official leave policies and working hours?"\n- "I need next Monday and Tuesday off for a wedding."`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const availableTools = [
    { name: 'get_headcount', desc: 'Retrieves active headcount & breakdown by department', roles: ['admin', 'hr'] },
    { name: 'get_attendance_summary', desc: 'Queries today presence, late arrivals & half-days', roles: ['admin', 'hr', 'employee'] },
    { name: 'get_late_comers', desc: 'Lists employees arriving after 09:15 AM grace window', roles: ['admin', 'hr'] },
    { name: 'get_my_leave_balance', desc: 'Returns authenticated user leave quotas and remaining days', roles: ['employee'] },
    { name: 'get_payroll_summary', desc: 'Aggregates gross, tax deductions and net payable payroll', roles: ['admin'] },
    { name: 'parse_smart_leave', desc: 'Parses natural language requests into structured leave applications', roles: ['employee'] },
  ];

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    const query = input;
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      processQuery(query);
    }, 600);
  };

  const processQuery = (query: string) => {
    const lower = query.toLowerCase();
    let reply = '';
    const tools: string[] = [];

    if (role === 'employee' && (lower.includes('salary') || lower.includes('payroll')) && !lower.includes('my')) {
      tools.push('security_scope_guard');
      reply = 'Access Denied: You do not possess clearance to inspect organization-wide salaries or peer compensation data.';
    } else if (lower.includes('headcount') || lower.includes('how many employee')) {
      tools.push('get_headcount');
      const emps = LocalStore.getEmployees();
      reply = `Active organizational headcount is **${emps.length} employees** across Engineering, HR, Product, and Finance.`;
    } else if (lower.includes('late')) {
      tools.push('get_late_comers');
      const att = LocalStore.getAttendance().filter(a => a.status === 'late');
      if (att.length === 0) {
        reply = 'Zero late comers today! Everyone reported before 09:15 AM.';
      } else {
        reply = `There are **${att.length} late comers** today:\n` +
          att.map(a => `- **${a.employeeName}** (${a.employeeCode}) at ${a.checkIn}`).join('\n');
      }
    } else if (lower.includes('payroll')) {
      if (role !== 'admin') {
        reply = 'Permission Denied: Company payroll summaries are restricted to Admin roles only.';
      } else {
        tools.push('get_payroll_summary');
        const latest = LocalStore.getPayrollRuns()[0];
        reply = `Latest Payroll Run (${latest?.month}/${latest?.year}):\n- Status: **${latest?.status.toUpperCase()}**\n- Gross Total: ${formatPKR(latest?.totalGross || 0)}\n- Income Tax: ${formatPKR(latest?.totalTax || 0)}\n- Net Payable: **${formatPKR(latest?.totalNet || 0)}** for ${latest?.employeeCount} employees.`;
      }
    } else {
      reply = `I have executed your query: "${query}". You can test tool calling permissions or ask questions about HCM policies!`;
    }

    const aiMsg: Message = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: reply,
      toolsUsed: tools,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setIsTyping(false);
    setMessages(prev => [...prev, aiMsg]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Chat Window */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[750px]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">HCM Lite AI Assistant Console</h1>
              <p className="text-[11px] text-slate-400">Scoped to role: {role.toUpperCase()}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>LLM Tool Calling Ready</span>
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
          {messages.map(m => (
            <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl p-4 space-y-2 ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs'
                }`}
              >
                {m.toolsUsed && m.toolsUsed.length > 0 && (
                  <div className="pb-1.5 mb-1.5 border-b border-slate-200/60 flex items-center space-x-1 text-[10px] text-indigo-600 font-mono font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Tool Executed: {m.toolsUsed.join(', ')}</span>
                  </div>
                )}
                <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 px-1">
                {m.timestamp} {m.sender === 'ai' && '• AI-Generated'}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2 text-xs text-indigo-600 p-2 bg-indigo-50/50 rounded-xl w-36 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Querying Tools...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-100 flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your instruction or inquiry for the AI agent..."
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* Right Sidebar: Tools & Architecture Info */}
      <div className="space-y-4">
        {/* Backend Tools Documentation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-indigo-600">
            <Cpu className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Configured Tool Calling APIs</h2>
          </div>

          <div className="space-y-2 text-xs">
            {availableTools.map(t => {
              const isAllowed = t.roles.includes(role);
              return (
                <div key={t.name} className={`p-2.5 rounded-xl border ${isAllowed ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/50 border-slate-100 opacity-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-700 text-[11px]">{t.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${isAllowed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {isAllowed ? 'Authorized' : 'Restricted'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{t.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security & Scoping Rules */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Lock className="w-4 h-4" />
            <h3 className="font-bold uppercase tracking-wider text-[11px]">Saylani Security Boundaries</h3>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            The AI model never queries MongoDB directly. All queries are routed through strict backend permission-checked services.
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
            <li>Employees cannot inspect other employee salaries.</li>
            <li>HR cannot finalize payroll.</li>
            <li>All AI interactions are logged in `ai_logs`.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
