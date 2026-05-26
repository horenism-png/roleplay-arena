import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  Users,
  Copy,
  Plus,
  Trash2,
  Send,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  Loader2,
  Mic,
} from "lucide-react";

const PRESETS = [
  {
    id: "ghost",
    title: "The Poisoned Ghost (C1)",
    desc: "Investigate a murder by interrogating a spirit.",
    opponentName: "Veronica (The Ghost)",
    scenario:
      "You are Veronica, the ghost of a murder victim. You were poisoned by Arthur the Butler for your inheritance. Speak naturally and conversationally, like a normal person who just happens to be a ghost. You ONLY reveal clues or the identity of the murderer if the user naturally uses the required target vocabulary. If they ask off-topic questions, politely guide them back to focusing on your death.",
    vocabulary: [
      {
        phrase: "take something at face value",
        definition: "To accept something as it appears without questioning it",
      },
      {
        phrase: "separate fact from fiction",
        definition: "To distinguish what is true from what is invented",
      },
      {
        phrase: "a telltale sign",
        definition: "An obvious sign or indicator of something",
      },
      { phrase: "ring true", definition: "To sound authentic or plausible" },
      {
        phrase: "cast doubt on",
        definition: "To cause something to be questioned",
      },
      {
        phrase: "look into",
        definition: "To investigate or research a matter",
      },
      {
        phrase: "get to the bottom of",
        definition: "To discover the truth or the root cause of a situation",
      },
    ],
  },
  {
    id: "tech",
    title: "Tech Fraud Audit (C1)",
    desc: "Cross-examine a shady CEO about server logs and payroll.",
    opponentName: "CEO Richard Sterling",
    scenario:
      "You are Richard Sterling, CEO of a tech startup. You are hiding a massive payroll fraud. You are evasive, overly confident, and use corporate jargon. You will only confess to the fraud if the auditor (the user) pressures you using the required target vocabulary phrases. Otherwise, deny everything.",
    vocabulary: [
      {
        phrase: "look at the big picture",
        definition: "To look at the whole situation instead of small details",
      },
      {
        phrase: "a slippery slope",
        definition: "A situation that could lead to a major negative outcome",
      },
      {
        phrase: "play devil's advocate",
        definition: "To argue the opposite side just to test logic",
      },
      {
        phrase: "cut corners",
        definition: "To do something poorly or illegally to save time/money",
      },
    ],
  },
  {
    id: "art",
    title: "Art Forgery (B2/C1)",
    desc: "Argue with an art dealer about a suspicious painting.",
    opponentName: "Julian (Art Dealer)",
    scenario:
      "You are Julian, an elite art dealer trying to sell a fake 1920s Picasso painting. You are offended when questioned but secretly nervous. You will only admit the painting is an AI-generated fake if the appraiser uses the required target vocabulary to trap you.",
    vocabulary: [
      {
        phrase: "too good to be true",
        definition: "So excellent that it is hard to believe",
      },
      { phrase: "point the finger at", definition: "To blame someone" },
      {
        phrase: "cover your tracks",
        definition: "To conceal evidence of what you have done",
      },
    ],
  },
];

export default function App() {
  const [view, setView] = useState("config"); // 'config' | 'chat'

  // Configuration State
  const [opponentName, setOpponentName] = useState(PRESETS[0].opponentName);
  const [scenario, setScenario] = useState(PRESETS[0].scenario);
  const [vocabulary, setVocabulary] = useState(PRESETS[0].vocabulary);
  const [apiKey, setApiKey] = useState("");

  // Chat State
  const [chatHistory, setChatHistory] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) setApiKey(savedKey);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isTyping]);

  // Handlers for Configuration
  const handlePresetSelect = (preset) => {
    setOpponentName(preset.opponentName);
    setScenario(preset.scenario);
    setVocabulary([...preset.vocabulary]);
  };

  const handleVocabChange = (index, field, value) => {
    const newVocab = [...vocabulary];
    newVocab[index][field] = value;
    setVocabulary(newVocab);
  };

  const addVocabPhrase = () => {
    setVocabulary([...vocabulary, { phrase: "", definition: "" }]);
  };

  const removeVocabPhrase = (index) => {
    setVocabulary(vocabulary.filter((_, i) => i !== index));
  };

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem("gemini_api_key", key);
  };

  const startSession = () => {
    if (!apiKey.trim()) {
      alert("Please enter a Gemini API Key to start the session.");
      return;
    }
    setView("chat");
    setChatHistory([
      {
        role: "model",
        text: `*(The simulation begins. You are facing ${opponentName})*\n\nI suppose you're here to ask some questions. Go ahead...`,
      },
    ]);
  };

  // Chat Logic & API Call
  const checkPhraseUsed = (phrase) => {
    return chatHistory.some(
      (msg) =>
        msg.role === "user" &&
        msg.text.toLowerCase().includes(phrase.toLowerCase())
    );
  };

  const toggleRecording = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported in your browser. Please try using Chrome or Edge."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;

    const currentInput = inputText;

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setInputText(
        (currentInput ? currentInput + " " : "") +
          finalTranscript +
          interimTranscript
      );
    };

    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (e) => {
      console.error("Speech recognition error", e);
      setIsRecording(false);
    };

    recognition.start();
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    const userMsg = inputText.trim();
    const newHistory = [...chatHistory, { role: "user", text: userMsg }];
    setChatHistory(newHistory);
    setInputText("");
    setIsTyping(true);
    setError("");

    // Construct API Payload
    const requiredPhrasesList = vocabulary.map((v) => v.phrase).join(", ");
    const systemInstruction = `
      ${scenario}
      
      RULES:
      1. You are talking to a C1-level English student.
      2. The student MUST use these specific phrases in their investigation: ${requiredPhrasesList}.
      3. Acknowledge naturally when they use one of these phrases.
      4. Keep responses concise (under 75 words).
      5. Never break character.
    `;

    const apiHistory = newHistory
      .filter((m) => !m.text.startsWith("*("))
      .map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const payload = {
        contents: apiHistory,
        systemInstruction: { parts: [{ text: systemInstruction }] },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      const botReply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "The entity remains silent...";

      setChatHistory((prev) => [...prev, { role: "model", text: botReply }]);
    } catch (err) {
      console.error(err);
      setError(
        "Failed to connect to the simulation. Please check your API key and try again."
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // RENDERING COMPONENTS
  if (view === "config") {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-200 p-4 md:p-8 font-sans">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
              <MessageSquare className="text-indigo-500" size={32} />
              Roleplay Arena Simulator
            </h1>
            <p className="text-slate-400 mt-2">
              Configure a cooperative speaking & argumentation session.
            </p>
          </div>

          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Presets */}
            <section>
              <h2 className="text-sm font-bold text-slate-400 tracking-wider mb-4 uppercase">
                1. Choose a Lesson Preset
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      opponentName === preset.opponentName
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-slate-800 bg-[#13131A] hover:border-slate-600"
                    }`}
                  >
                    <h3 className="font-bold text-white mb-1">
                      {preset.title}
                    </h3>
                    <p className="text-xs text-slate-400">{preset.desc}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Character Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Opponent Name
                </label>
                <input
                  type="text"
                  value={opponentName}
                  onChange={(e) => setOpponentName(e.target.value)}
                  className="w-full bg-[#13131A] border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Gemini API Key (Required)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => saveApiKey(e.target.value)}
                  placeholder="Paste AI Studio Key here..."
                  className="w-full bg-[#13131A] border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Saves locally in your browser. Never sent to our servers.
                </p>
              </div>
            </div>

            {/* Scenario Prompt */}
            <section>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Lesson Scenario / Debate Prompt
              </label>
              <textarea
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                rows={4}
                className="w-full bg-[#13131A] border border-slate-800 rounded-lg p-4 text-slate-200 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </section>

            {/* Target Vocabulary */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-400 tracking-wider uppercase">
                  2. Target Language Vocabulary
                </h2>
                <button
                  onClick={addVocabPhrase}
                  className="text-indigo-400 text-sm font-medium flex items-center hover:text-indigo-300"
                >
                  <Plus size={16} className="mr-1" /> Add Phrase
                </button>
              </div>
              <div className="space-y-3">
                {vocabulary.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-[#13131A] p-2 rounded-lg border border-slate-800"
                  >
                    <input
                      type="text"
                      value={v.phrase}
                      onChange={(e) =>
                        handleVocabChange(i, "phrase", e.target.value)
                      }
                      placeholder="Target Phrase"
                      className="w-1/3 bg-[#0A0A0F] border border-slate-800 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={v.definition}
                      onChange={(e) =>
                        handleVocabChange(i, "definition", e.target.value)
                      }
                      placeholder="Definition or Context"
                      className="flex-1 bg-[#0A0A0F] border border-slate-800 rounded p-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => removeVocabPhrase(i)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t border-slate-800">
              <button
                onClick={startSession}
                className="w-full py-4 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-900/50"
              >
                Start Session <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CHAT INTERFACE
  return (
    <div className="flex h-screen bg-[#0A0A0F] text-slate-200 font-sans overflow-hidden">
      {/* Sidebar - Target Vocabulary */}
      <div className="w-80 bg-[#13131A] border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <button
            onClick={() => setView("config")}
            className="text-xs text-slate-500 hover:text-white mb-4 flex items-center"
          >
            ← Back to Config
          </button>
          <h2 className="text-lg font-bold text-white">Target Language</h2>
          <p className="text-xs text-slate-400 mt-1">
            Use these phrases in your replies.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {vocabulary.map((v, i) => {
            const isUsed = checkPhraseUsed(v.phrase);
            return (
              <div
                key={i}
                className={`p-4 rounded-xl border transition-all duration-500 ${
                  isUsed
                    ? "bg-indigo-900/20 border-indigo-500/50"
                    : "bg-[#0A0A0F] border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between">
                  <h3
                    className={`font-semibold mb-1 ${
                      isUsed ? "text-indigo-400" : "text-slate-200"
                    }`}
                  >
                    {v.phrase}
                  </h3>
                  {isUsed && (
                    <CheckCircle2
                      size={18}
                      className="text-indigo-500 flex-shrink-0"
                    />
                  )}
                </div>
                <p className="text-xs text-slate-500">{v.definition}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#0A0A0F]">
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-800 bg-[#13131A] flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
              {opponentName.charAt(0)}
            </div>
            <div>
              <h1 className="font-bold text-white">{opponentName}</h1>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected via Neural Link
              </div>
            </div>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-4 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-[#13131A] border border-slate-800 text-slate-200 rounded-bl-none"
                }`}
              >
                {msg.role === "model" && msg.text.startsWith("*(") ? (
                  <span className="italic opacity-70">{msg.text}</span>
                ) : (
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#13131A] border border-slate-800 rounded-2xl rounded-bl-none px-5 py-4 flex items-center gap-2">
                <Loader2 size={18} className="animate-spin text-indigo-500" />
                <span className="text-sm text-slate-400">
                  {opponentName} is typing...
                </span>
              </div>
            </div>
          )}
          {error && (
            <div className="text-center text-red-400 text-sm bg-red-400/10 py-2 rounded-lg border border-red-400/20">
              {error}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#13131A] border-t border-slate-800 shrink-0">
          <div className="max-w-4xl mx-auto relative flex items-end bg-[#0A0A0F] border border-slate-700 rounded-xl focus-within:border-indigo-500 transition-colors">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Formulate your response... (Press Enter to send)"
              className="w-full bg-transparent text-white p-4 max-h-32 min-h-[56px] focus:outline-none resize-none"
              rows={1}
            />
            <div className="flex mb-2 mr-2 gap-2">
              <button
                onClick={toggleRecording}
                className={`p-2 rounded-lg transition-colors ${
                  isRecording
                    ? "bg-red-500/20 text-red-500 animate-pulse"
                    : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
                title={isRecording ? "Stop recording" : "Use microphone"}
              >
                <Mic size={20} />
              </button>
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isTyping}
                className="p-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50 disabled:bg-slate-700 hover:bg-indigo-500 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
          <div className="text-center mt-3 text-xs text-slate-500 flex items-center justify-center gap-1">
            <Sparkles size={12} /> Powered by Gemini
          </div>
        </div>
      </div>
    </div>
  );
}
