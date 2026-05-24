import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Merhaba! Ben bütçe ve finans yapay zekası asistanınızım. Harcamalarınızı, borçlarınızı analiz edebilir ve size tasarruf ipuçları sunabilirim. Nasıl yardımcı olabilirim?',
      sender: 'ai'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { id: Date.now().toString(), text: userMessageText, sender: 'user' }]);

    try {
      // Hiçbir kütüphaneye ihtiyaç duymadan doğrudan Google API'sine bağlanıyoruz
      const response = await fetch(
        `https://googleapis.com`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Sen bir finans danışmanısın. Şu soruya Türkçe cevap ver: ${userMessageText}` }] }]
          })
        }
      );

      const data = await response.json();
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Anlayamadım, tekrar dener misiniz?';

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: responseText, sender: 'ai' }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: 'Bağlantı hatası oluştu.', sender: 'ai' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '450px', background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <div style={{ background: '#4f46e5', padding: '12px', color: '#fff', fontWeight: 'bold' }}>
        HESAP YAPAY ZEKASI
      </div>
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: '12px', fontSize: '14px', background: msg.sender === 'user' ? '#4f46e5' : '#f1f5f9', color: msg.sender === 'user' ? '#fff' : '#1e293b' }}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && <div style={{ color: '#64748b', fontSize: '13px' }}>Düşünüyor...</div>}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Sorunuzu yazın..."
          disabled={isLoading}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
        />
        <button type="submit" disabled={isLoading || !input.trim()} style={{ background: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
          Gönder
        </button>
      </form>
    </div>
  );
}
