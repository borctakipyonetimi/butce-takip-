import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/genai';
import { Send, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Merhaba! Ben bütçe ve finans yapay zekası asistanınızım. Harcamalarınızı, borçlarınızı analiz edebilir ve size tasarruf ipuçları sunabilirim. Nasıl yardımcı olabilirim?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Doğrudan tarayıcıdan Gemini modeline bağlanıyoruz
  const genAI = new GoogleGenerativeAI("AIzaSyAbSGGo_wbm6gzCaOxXazHITbxIYHzDXQc");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();
    setInput('');
    setIsLoading(true);

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: userMessageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Backend /api/chat yerine doğrudan Google Gemini API'ına istek atıyoruz
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      // Finans asistanı kişiliği kazandırmak için sistem talimatı ekliyoruz
      const prompt = `Sen bütçe, borç takibi ve kişisel finans konularında uzman bir yapay zeka asistanısın. Kullanıcının şu mesajına yardımcı, motive edici ve çözüm odaklı bir finansal danışman gibi Türkçe cevap ver: ${userMessageText}`;
      
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const newAIMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText || 'Anlayamadım, lütfen tekrar dener misiniz?',
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newAIMessage]);
    } catch (error) {
      console.error('Gemini API Hatası:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: 'Üzgünüm, yapay zeka servisiyle iletişim kurulurken bir hata oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin.',
        sender: 'ai',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white dark:bg-slate-900 rounded-xl shadow-md overflow-hidden border border-slate-100 dark:border-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <h3 className="font-semibold text-lg">HESAP YAPAY ZEKASI</h3>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                msg.sender === 'user'
                  ? 'bg-violet-600 text-white rounded-br-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-3 text-sm text-slate-500 rounded-bl-none flex items-center gap-2">
              <span className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Yapay zekaya bütçeni sor..."
          disabled={isLoading}
          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
