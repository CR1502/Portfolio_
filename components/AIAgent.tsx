'use client';

import { useEffect, useRef, useState } from 'react';

interface Message {
  role: 'bot' | 'user';
  content: string;
  id?: string;
  isTyping?: boolean;
}

interface HistoryEntry {
  role: string;
  parts: { text: string }[];
}

function localFallback(q: string): string {
  const ql = q.toLowerCase();
  if (ql.match(/\bhire\b|why\sshould|good fit|good candidate|\bresume\b|\bcv\b/))
    return `**Why hire Craig?**\n\n▸ MS in AI from Northeastern (3.83 GPA)\n▸ Currently building multi-agent LLM systems at Staples\n▸ 8 shipped projects across NLP, CV, RAG, and IoT\n▸ 2 live deployed apps\n▸ Teaching experience in AI and NLP\n▸ Full-stack ML: research → production\n▸ Hands-on with LangGraph, LangChain, BERT, PyTorch, Docker, CI/CD`;
  if (ql.match(/^(hi|hello|hey|sup|what'?s up)[\s!?.]*$/))
    return "Hey there! I'm Craig's AI agent. Ask me about his projects, experience, skills, education, or contact info!";
  if (ql.match(/contact|email|phone|reach/))
    return `📧 roberts.cr@northeastern.edu\n📞 +1 857-399-8600\n🔗 linkedin.com/in/croberts02\n💻 github.com/CR1502\n📍 Boston, MA`;
  if (ql.match(/education|school|university|degree|gpa|college/))
    return `🎓 **MS in Artificial Intelligence** — Northeastern University, Khoury College (Sep 2024 – May 2026, GPA: 3.83/4.0)\nCoursework: AI Capstone, ML, NLP, Algorithms, Foundations of AI\n\n🎓 **B.Tech in CS (AI & ML)** — VIT Bhopal University (Jul 2020 – May 2024, GPA: 3.52/4.0)`;
  if (ql.match(/experience|work|job|staples|deeproot|intern|co-?op|teaching|ta\b/))
    return `💼 **AI Engineer Co-op @ Staples** (Jan 2026–Present)\n▸ Multi-agent LLM orchestration with LangGraph/LangChain\n▸ Context-aware QA system with persistent memory, Docker, CI/CD\n\n💼 **GTA — CS5100: Foundations of AI** @ NEU (Sep–Dec 2025)\n\n💼 **GTA — CS6120: NLP** @ NEU (May–Aug 2025)\n▸ Led labs on PyTorch, NLTK, spaCy, LLM frameworks\n\n💼 **ML Intern @ DeepRoot Minds** (Jun–Dec 2023)\n▸ CNN diagnostics on 3K+ images (+12% accuracy), MLFlow pipelines`;
  if (ql.match(/project|built|made|portfolio/))
    return `🚀 **8 Projects:**\n\n01. **AI Candidate Recommender** — SBERT + FLAN-T5, 89% precision@5 (Live demo!)\n02. **NomadAI** — RAG over 2400+ Reddit threads (Live demo!)\n03. **SignSynth** — Gesture-controlled MIDI with MediaPipe\n04. **MediScan** — BERT + LangChain misinformation classifier\n05. **Chest X-R-AI** — ResNet-50 + ViT for 14 thoracic diseases\n06. **PiGaze** — CNN real-time gaze estimation\n07. **SoundScape** — Audio-to-generative artwork\n08. **SmartSprout** — ANN + IoT smart irrigation`;
  if (ql.match(/skill|tech|stack|tool/))
    return `🛠️ **Skills:**\n▸ Programming: Python, C++, Java, SQL, Git, TypeScript\n▸ ML: Scikit-learn, TensorFlow, PyTorch, Keras, HuggingFace\n▸ Deep Learning: CNNs, ViTs, Sequence Models, LLMs\n▸ NLP: BERT, SBERT, TF-IDF, NER\n▸ AI Systems: RAG, AI Agents, Multi-Agent Orchestration, Memory Design\n▸ Deploy: MLFlow, Databricks, Docker, Jenkins, Azure DevOps, CI/CD`;
  if (ql.match(/llm|nlp|bert|language model|transformer/))
    return `Craig has deep NLP/LLM expertise:\n\n▸ Multi-agent LLM orchestration at Staples (LangGraph + LangChain)\n▸ TA for CS6120: NLP (PyTorch, NLTK, spaCy, LLMs)\n▸ MediScan: BERT + LangChain for misinformation detection\n▸ Candidate Recommender: Sentence-BERT + FLAN-T5\n▸ Skills: BERT, SBERT, RAG, AI Agents, Memory Design`;
  if (ql.match(/rag|retrieval/))
    return `Craig's RAG experience:\n\n▸ **NomadAI**: Full RAG pipeline over 2400+ Reddit threads with sentiment classification and entity extraction\n▸ **Staples**: Scalable inference pipelines with experiment tracking on Databricks\n▸ Skills: RAG, AI Agents, Retrieval Systems`;
  if (ql.match(/agent|orchestrat/))
    return `Craig's agent experience:\n\n▸ **Staples**: Multi-agent LLM orchestration using LangGraph & LangChain\n▸ Conversational Memory Design for context-aware QA systems\n▸ Skills: AI Agents, Multi-Agent Orchestration, Memory Architecture`;
  return `I can answer questions about Craig like:\n\n▸ "What are his projects?"\n▸ "Tell me about his experience"\n▸ "What skills does he have?"\n▸ "Is he a good fit for [role]?"\n▸ "Education and GPA?"\n▸ "Contact info"\n▸ "Why hire Craig?"`;
}

function formatMessage(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- /gm, '▸ ')
    .replace(/\n/g, '<br>');
}

export default function AIAgent() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      content: `Hey! I'm Craig's AI agent, powered by Gemini. Ask me anything — "Is Craig a good fit for an ML Engineer role?", "What projects has he built?", or "Why should we hire him?"`,
    },
  ]);
  const [input, setInput] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || waiting) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: q }]);

    const typingId = `typing-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { role: 'bot', content: '', id: typingId, isTyping: true },
    ]);
    setWaiting(true);

    const newHistory: HistoryEntry[] = [
      ...history,
      { role: 'user', parts: [{ text: q }] },
    ];

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory }),
      });
      const data = await res.json();

      if (data.answer) {
        setHistory([
          ...newHistory,
          { role: 'model', parts: [{ text: data.answer }] },
        ]);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === typingId
              ? { role: 'bot', content: data.answer, isTyping: false }
              : m
          )
        );
      } else {
        const fallback = localFallback(q);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === typingId
              ? { role: 'bot', content: fallback, isTyping: false }
              : m
          )
        );
      }
    } catch {
      const fallback = localFallback(q);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingId
            ? { role: 'bot', content: fallback, isTyping: false }
            : m
        )
      );
    } finally {
      setWaiting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        className="agent-fab"
        onClick={() => setOpen((v) => !v)}
        title="Ask Craig's AI Agent anything"
      >
        ⚡
      </button>

      <div className={`agent-modal${open ? ' open' : ''}`}>
        <div className="agent-bar">
          <div className="dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="bar-title">craig_agent v2.0 — powered by gemini</span>
          <button className="bar-close" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>

        <div className="agent-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`agent-msg ${msg.role}`}>
              {msg.isTyping ? (
                <div className="typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                <span dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="agent-input-row">
          <input
            ref={inputRef}
            className="agent-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Craig..."
            autoComplete="off"
          />
          <button className="agent-send" onClick={sendMessage} disabled={waiting}>
            Send
          </button>
        </div>
      </div>
    </>
  );
}
