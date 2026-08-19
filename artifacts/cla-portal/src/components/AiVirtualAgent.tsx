import { useState, useRef, useEffect } from "react";
import { useAiChat, useCreateCase } from "@workspace/api-client-react";
import { MessageSquare, X, Send, Bot, User, CheckCircle, AlertCircle, Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Fields we track for progress
const INTAKE_FIELDS = [
  { key: "childName", label: "Child Name" },
  { key: "childAge", label: "Age" },
  { key: "gender", label: "Gender" },
  { key: "lastSeen", label: "Last Location" },
  { key: "dateMissing", label: "Date/Time Missing" },
  { key: "description", label: "Physical Description" },
  { key: "reporterName", label: "Your Name" },
  { key: "reporterPhone", label: "Contact Number" },
  { key: "caseType", label: "Case Type" },
  { key: "gpsEnrolled", label: "GPS Enrolled" },
];

function parseCaseData(text: string): Record<string, string> | null {
  const match = text.match(/\[CASE_DATA\]([\s\S]*?)\[\/CASE_DATA\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

function stripCaseBlock(text: string): string {
  return text.replace(/\[CASE_DATA\][\s\S]*?\[\/CASE_DATA\]/, "").trim();
}

function detectCollectedFields(messages: { role: string; content: string }[]): Set<string> {
  const collected = new Set<string>();
  const fullConversation = messages.map(m => m.content).join(" ").toLowerCase();

  if (/child'?s?\s+name|name.*recorded|name noted/i.test(fullConversation)) collected.add("childName");
  if (/age.*recorded|\bage\b.*\d+|\d+\s+year/i.test(fullConversation)) collected.add("childAge");
  if (/\b(boy|girl|male|female|gender)\b/i.test(fullConversation)) collected.add("gender");
  if (/last seen|last known|location.*noted|location recorded/i.test(fullConversation)) collected.add("lastSeen");
  if (/date.*missing|time.*last seen|missing since/i.test(fullConversation)) collected.add("dateMissing");
  if (/hair|clothing|wearing|height|description noted/i.test(fullConversation)) collected.add("description");
  if (/your name|reporter.*name|name.*recorded/i.test(fullConversation)) collected.add("reporterName");
  if (/phone|contact.*number|number noted/i.test(fullConversation)) collected.add("reporterPhone");
  if (/case type|missing|runaway|kidnap|abduction/i.test(fullConversation)) collected.add("caseType");
  if (/gps|enrolled|bracelet|necklace/i.test(fullConversation)) collected.add("gpsEnrolled");

  return collected;
}

export function AiVirtualAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [filedCase, setFiledCase] = useState<{ caseId: string } | null>(null);
  const [filingError, setFilingError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useAiChat();
  const createCaseMutation = useCreateCase();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

  // Send opening greeting when chat opens for first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initMessages = [{ role: "user", content: "__INIT__" }];
      chatMutation.mutate(
        { data: { messages: initMessages } },
        {
          onSuccess: (data) => {
            setMessages([{ role: "assistant", content: data.reply }]);
          },
        }
      );
    }
  }, [isOpen]);

  const collectedFields = detectCollectedFields(messages);
  const progress = Math.round((collectedFields.size / INTAKE_FIELDS.length) * 100);

  const handleSend = () => {
    if (!input.trim() || filedCase) return;

    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    // Only send the last 16 messages to keep context window manageable
    const sendMessages = newMessages.slice(-16);

    chatMutation.mutate(
      { data: { messages: sendMessages } },
      {
        onSuccess: (data) => {
          const rawReply = data.reply;
          const caseData = parseCaseData(rawReply);
          const cleanReply = caseData ? stripCaseBlock(rawReply) : rawReply;

          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: cleanReply },
          ]);

          // Auto-file the case if we have all data
          if (caseData && !filedCase) {
            const caseId = `CLA-${Date.now().toString(36).toUpperCase()}`;
            createCaseMutation.mutate(
              {
                data: {
                  caseId,
                  reporterName: caseData.reporterName || "Unknown",
                  reporterPhone: caseData.reporterPhone || "Unknown",
                  childName: caseData.childName || "Unknown",
                  childAge: parseInt(caseData.childAge as string) || 0,
                  country: "CANADA",
                  province: caseData.province || "ONTARIO TORONTO",
                  lastSeen: caseData.lastSeen || "Unknown",
                  dateMissing: caseData.dateMissing || "Unknown",
                  description: `${caseData.description || ""}${caseData.additionalDetails ? " | Additional: " + caseData.additionalDetails : ""}`,
                  gpsEnrolled: caseData.gpsEnrolled || "no",
                  caseType: caseData.caseType || "Missing",
                  status: "Open",
                },
              },
              {
                onSuccess: (created) => {
                  setFiledCase({ caseId: created.caseId });
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "system",
                      content: `✅ CASE FILED: ${created.caseId} — Authorized personnel have been alerted. Units are deploying. You will be contacted shortly.`,
                    },
                  ]);
                },
                onError: (err) => {
                  const msg = err instanceof Error ? err.message : "Unknown error";
                  setFilingError(msg);
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "system",
                      content: `⚠ Case data collected but filing failed: ${msg}. Please call our emergency line immediately.`,
                    },
                  ]);
                },
              }
            );
          }
        },
      }
    );
  };

  const handleReset = () => {
    setMessages([]);
    setFiledCase(null);
    setFilingError(null);
    setInput("");
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground z-50 ${isOpen ? "hidden" : "flex"} items-center justify-center border-2 border-primary-foreground/20`}
      >
        <Bot className="w-6 h-6" />
        {/* Pulse indicator */}
        <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-green-400 animate-ping" />
        <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-green-400" />
      </Button>

      {/* Chat Panel */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[370px] h-[580px] shadow-2xl z-50 flex flex-col rounded-sm border-border bg-background">
          {/* Header */}
          <CardHeader className="p-3 bg-muted border-b border-border flex flex-row items-center justify-between space-y-0 rounded-t-sm shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="w-5 h-5 text-primary" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400" />
              </div>
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground leading-none">
                  AI Intelligence Core
                </CardTitle>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  CLIA — Emergency Intake Active
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && !filedCase && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={handleReset}
                  title="New Report"
                >
                  <FileText className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Progress Bar (only show when intake is in progress) */}
          {messages.length > 0 && !filedCase && progress > 0 && (
            <div className="px-3 py-1.5 bg-muted/50 border-b border-border shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                  Intake Progress
                </span>
                <span className="text-[9px] font-mono text-primary font-bold">
                  {collectedFields.size}/{INTAKE_FIELDS.length} fields
                </span>
              </div>
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {INTAKE_FIELDS.map((f) => (
                  <span
                    key={f.key}
                    className={`text-[8px] font-mono px-1 py-0.5 rounded-sm ${
                      collectedFields.has(f.key)
                        ? "bg-green-900/40 text-green-400 border border-green-800"
                        : "bg-border/50 text-muted-foreground border border-border"
                    }`}
                  >
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Case Filed Banner */}
          {filedCase && (
            <div className="mx-3 mt-2 p-2 bg-green-950 border border-green-700 rounded-sm shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-mono font-bold text-green-400 uppercase tracking-wider">
                    Case Filed — Personnel Alerted
                  </p>
                  <p className="text-[10px] font-mono text-green-300">
                    Case ID: <span className="font-bold">{filedCase.caseId}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <CardContent className="flex-1 p-0 overflow-hidden">
            <div
              ref={scrollRef}
              className="h-full overflow-y-auto p-3 space-y-3"
            >
              {messages.length === 0 && chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground border border-border rounded-sm p-3 text-sm font-mono flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-xs text-muted-foreground">Initializing CLIA...</span>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <Bot className="w-4 h-4 text-primary shrink-0 mt-1 mr-1.5" />
                  )}
                  <div
                    className={`max-w-[85%] rounded-sm p-2.5 text-xs font-mono leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : msg.role === "system"
                        ? "bg-green-950 text-green-300 border border-green-800 text-center w-full font-bold"
                        : "bg-muted text-foreground border border-border"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <User className="w-4 h-4 text-muted-foreground shrink-0 mt-1 ml-1.5" />
                  )}
                </div>
              ))}

              {chatMutation.isPending && messages.length > 0 && (
                <div className="flex justify-start items-center gap-1.5">
                  <Bot className="w-4 h-4 text-primary shrink-0" />
                  <div className="bg-muted text-foreground border border-border rounded-sm px-3 py-2 text-xs font-mono flex items-center gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.15s" }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.3s" }}>●</span>
                  </div>
                </div>
              )}

              {createCaseMutation.isPending && (
                <div className="flex justify-center">
                  <div className="bg-yellow-950 border border-yellow-700 rounded-sm px-3 py-2 text-[10px] font-mono text-yellow-300 flex items-center gap-2">
                    <Shield className="w-3 h-3 animate-pulse" />
                    Filing case & alerting personnel...
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          {/* Input */}
          <CardFooter className="p-3 bg-muted/50 border-t border-border rounded-b-sm shrink-0">
            {filedCase ? (
              <div className="w-full flex flex-col gap-2">
                <p className="text-[10px] font-mono text-muted-foreground text-center">
                  Case {filedCase.caseId} is active. Units deploying.
                </p>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-mono"
                >
                  Report Another Case
                </Button>
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex w-full gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={messages.length === 0 ? "Connecting..." : "Type your response..."}
                  className="font-mono text-xs bg-background border-border rounded-sm focus-visible:ring-primary"
                  disabled={chatMutation.isPending || createCaseMutation.isPending || messages.length === 0}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || chatMutation.isPending || createCaseMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
          </CardFooter>
        </Card>
      )}
    </>
  );
}
