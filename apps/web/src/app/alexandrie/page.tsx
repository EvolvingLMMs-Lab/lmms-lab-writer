'use client';

import { useChat } from '@ai-sdk/react';
import React from 'react';

export default function AlexandriePage() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = React.useState('');
  const isLoading = status === 'submitted' || status === 'streaming';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ parts: [{ type: 'text', text: input }] });
    setInput('');
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans">
      
      {/* Left side: PDF Viewer */}
      <div className="w-1/2 p-6 border-r border-slate-200 flex flex-col">
        <h1 className="text-2xl font-bold mb-2">Alexandrie Librairie</h1>
        <p className="text-sm text-slate-500 mb-4">Viewing: The Callens Conjectures Monograph</p>
        <div className="flex-1 bg-white shadow-lg rounded-xl overflow-hidden border border-slate-200">
          <iframe 
            src="/alexandrie/symbrain_callens_conjectures_monograph.pdf" 
            className="w-full h-full border-none"
            title="The Callens Conjectures Monograph"
          />
        </div>
      </div>

      {/* Right side: AI Copilot */}
      <div className="w-1/2 p-6 flex flex-col">
        <div className="flex items-center mb-6">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
          <h2 className="text-xl font-semibold">Gemini Scientific Copilot</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-white rounded-xl shadow-lg border border-slate-200 mb-4">
          {messages.length === 0 ? (
            <div className="text-slate-400 text-center mt-10">
              Ask me anything about the Callens Conjectures, Lean 4 formalization, or the Galileo numerical simulations!
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-slate-100 text-slate-800 rounded-bl-none'
                }`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n')}
                  </p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-bl-none px-4 py-2 text-sm animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <input
            className="w-full bg-white border border-slate-300 rounded-full px-6 py-4 pr-16 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            value={input}
            placeholder="Ask a question about the document..."
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white rounded-full px-4 font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
      
    </div>
  );
}
