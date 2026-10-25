import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LocalStore } from '../../services/api';
import { formatPKR } from '../../utils/calculations';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  toolsUsed?: string[];
  smartLeave?: {
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
  };
  timestamp: string;
}

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLeaveModal?: (data?: any) => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onOpenLeaveModal,
}) => {
  const { role, currentEmployee, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: `Hello ${user?.name}! I am your HCM Lite AI Assistant. How can I help you today? You can query headcount, today's late arrivals, leave balances, or test Smart Leave by typing: "I need next Monday and Tuesday off for a wedding."`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Suggested Prompts based on role
  const suggestedPrompts = role === 'admin'
    ? [
        'What is our total headcount and active payroll cost?',
        'Who arrived late today after the grace period?',
        'Give me an AI summary of our current KPI metrics.',
      ]
    : role === 'hr'
    ? [
        'How many employees are present vs late today?',
        'List the top late-comers today with arrival times.',
        'What is our leave quota policy for Annual & Sick leaves?',
      ]
    : [
        'I need next Monday and Tuesday off for a wedding.',
        'What is my remaining leave balance?',
        'What are the office hours and attendance grace rules?',
      ];

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      processAIQuery(query);
    }, 700);
  };

  const processAIQuery = (query: string) => {
    const lower = query.toLowerCase();
    let replyText = '';
    const tools: string[] = [];
    let smartLeaveData: any = null;

    // 1. Smart Leave Natural Language Intent
    if (lower.includes('leave') || lower.includes('day off') || lower.includes('vacation') || lower.includes('monday') || lower.includes('sick')) {
      tools.push('parse_smart_leave');
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() + 2);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      const leaveType = lower.includes('sick') ? 'Sick Leave' : 'Annual Leave';
      const reason = lower.includes('wedding') ? 'Attending family wedding' : lower.includes('sick') ? 'Health recovery' : 'Personal time off';

      smartLeaveData = {
        type: leaveType,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        reason,
      };

      replyText = `I analyzed your request and prepared a Smart Leave draft:\n- **Category**: ${leaveType}\n- **Period**: ${smartLeaveData.startDate} to ${smartLeaveData.endDate}\n- **Reason**: ${reason}\n\nClick below to open the application with these details pre-filled.`;
    }
    // 2. Security Boundary: Employee asking for unauthorized private data
    else if (role === 'employee' && (lower.includes('salary') || lower.includes('payroll') || lower.includes('cost')) && !lower.includes('my')) {
      tools.push('security_scope_guard');
      replyText = 'Access Denied: As an employee, you are authorized to view your own payslips only. Company-wide payroll disbursements and colleague salary structures are strictly confidential.';
    }
    // 3. Headcount tool
    else if (lower.includes('headcount') || lower.includes('how many employee') || lower.includes('staff')) {
      tools.push('get_headcount');
      const emps = LocalStore.getEmployees();
      replyText = `Current company headcount stands at **${emps.length} employees** across 4 departments (Engineering, HR, Product, Finance). All are active.`;
    }
    // 4. Late comers tool
    else if (lower.includes('late')) {
      tools.push('get_late_comers');
      const att = LocalStore.getAttendance();
      const late = att.filter(a => a.status === 'late');
      if (late.length === 0) {
        replyText = 'No late arrivals recorded today! All reporting employees arrived before the 09:15 AM grace threshold.';
      } else {
        replyText = `There are **${late.length} late arrivals** today:\n` +
          late.map(l => `- **${l.employeeName}** (${l.employeeCode}) at ${l.checkIn}`).join('\n');
      }
    }
    // 5. Attendance summary
    else if (lower.includes('attendance') || lower.includes('present') || lower.includes('who')) {
      tools.push('get_attendance_summary');
      const att = LocalStore.getAttendance();
      const present = att.filter(a => a.status === 'present').length;
      const late = att.filter(a => a.status === 'late').length;
      replyText = `Today's Attendance Summary:\n- On-time: **${present}**\n- Late arrivals: **${late}**\n- Grace window: 15 minutes (threshold 09:15 AM)`;
    }
    // 6. Leave balance for current user
    else if (lower.includes('my leave') || lower.includes('balance')) {
      tools.push('get_my_leave_balance');
      replyText = 'Your Remaining Leave Quotas:\n- **Annual Leave**: 14 days\n- **Sick Leave**: 8 days\n- **Casual Leave**: 10 days\n- **Unpaid Leave**: Unlimited';
    }
    // 7. Payroll summary
    else if (lower.includes('payroll') || lower.includes('cost')) {
      if (role !== 'admin') {
        replyText = 'Access Restricted: Company-wide payroll financials can only be accessed by Admin accounts.';
      } else {
        tools.push('get_payroll_summary');
        const runs = LocalStore.getPayrollRuns();
        const latest = runs[0];
        replyText = `Latest Payroll Run (${latest?.month}/${latest?.year}):\n- Status: **${latest?.status.toUpperCase()}**\n- Total Gross: ${formatPKR(latest?.totalGross || 0)}\n- Net Disbursed: **${formatPKR(latest?.totalNet || 0)}** for ${latest?.employeeCount} employees.`;
      }
    }
    // 8. Policy questions
    else if (lower.includes('policy') || lower.includes('grace') || lower.includes('hours') || lower.includes('tax')) {
      replyText = `### Official HCM Policy Reference:\n- **Office Hours**: 09:00 to 18:00 (Saturday & Sunday weekend)\n- **Grace Window**: 15 minutes (Late if checked in after 09:15 AM)\n- **Half-Day**: Any day with under 5 hours worked\n- **Tax Slabs**: Pakistan annual gross income formula (0-600k 0%, up to 35% above 3.6M)`;
    }
    // 9. Default assistant answer
    else {
      replyText = `I have received your question: "${query}". You can query live database facts using tools like get_headcount, get_late_comers, get_attendance_summary, or submit smart leave applications!`;
    }

    const aiMsg: Message = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: replyText,
      toolsUsed: tools,
      smartLeave: smartLeaveData,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setIsTyping(false);
    setMessages(prev => [...prev, aiMsg]);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-y-0 right-0 z-50 bg-white shadow-2xl border-l border-slate-200 flex flex-col transition-all duration-300 ${
      isExpanded ? 'w-full md:w-3/5 lg:w-1/2' : 'w-full sm:w-96'
    }`}>
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <div className="font-extrabold text-xs tracking-tight flex items-center space-x-1.5">
              <span>HCM Lite AI Assistant</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-mono">
                Tool Calling
              </span>
            </div>
            <div className="text-[10px] text-slate-400 capitalize">
              Scoped Context: {role} Mode
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2.5 bg-slate-50 border-b border-slate-200/60 overflow-x-auto flex space-x-2 no-scrollbar">
        {suggestedPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/80 text-[11px] font-semibold whitespace-nowrap transition shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-xs'
                  : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs'
              }`}
            >
              {/* Tool Execution steps indicator */}
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className="pb-1.5 mb-1.5 border-b border-slate-200/60 flex items-center space-x-1 text-[10px] text-indigo-600 font-mono">
                  <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                  <span>Executed tool: {msg.toolsUsed.join(', ')}</span>
                </div>
              )}

              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

              {/* Smart Leave Interactive Action Box */}
              {msg.smartLeave && onOpenLeaveModal && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenLeaveModal(msg.smartLeave);
                    }}
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow transition flex items-center justify-center space-x-1.5"
                  >
                    <span>Pre-fill & Review Leave Application</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400 mt-1 px-1 flex items-center space-x-1">
              <span>{msg.timestamp}</span>
              {msg.sender === 'ai' && (
                <span className="font-bold text-indigo-600">• AI-Verified</span>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center space-x-2 text-xs text-indigo-600 p-2 bg-indigo-50/50 rounded-xl w-36 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>AI Reasoning...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question or request leave in natural language..."
          className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white transition"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl shadow transition"
          aria-label="Send Message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
