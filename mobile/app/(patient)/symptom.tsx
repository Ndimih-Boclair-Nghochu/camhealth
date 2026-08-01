import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";

import { ScreenHeader } from "../../components/kit";
import { api } from "../../lib/api";
import { colors, radius } from "../../lib/theme";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content: "Hi! I'm the CamHealth Assistant. Tell me what you're feeling — your symptoms, how long, and how severe — and I'll give safe guidance. I'm not a doctor, so I'll help you decide whether to book a consultation.",
};

export default function SymptomChecker() {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<ScrollView>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const history = messages.filter((m) => m !== GREETING);
    const next = [...messages, { role: "user", content: text } as Msg];
    setMessages(next);
    setInput("");
    setBusy(true);
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50);
    try {
      const { data } = await api.post<{ reply: string }>("/symptom-check/", { message: text, history });
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't respond just now. Please try again." }]);
    } finally {
      setBusy(false);
      setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 60);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Symptom checker" subtitle="AI guidance · not a diagnosis" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <ScrollView ref={scroller} contentContainerStyle={{ padding: 16, paddingBottom: 20 }}>
          {messages.map((m, i) => (
            <View key={i} style={[styles.bubbleRow, m.role === "user" ? styles.rowUser : styles.rowAI]}>
              {m.role === "assistant" && (
                <View style={styles.aiIcon}><Ionicons name="sparkles" size={14} color="#fff" /></View>
              )}
              <View style={[styles.bubble, m.role === "user" ? styles.user : styles.ai]}>
                <Text style={[styles.text, m.role === "user" && { color: "#fff" }]}>{m.content}</Text>
              </View>
            </View>
          ))}
          {busy && (
            <View style={[styles.bubbleRow, styles.rowAI]}>
              <View style={styles.aiIcon}><Ionicons name="sparkles" size={14} color="#fff" /></View>
              <View style={[styles.bubble, styles.ai]}><ActivityIndicator color={colors.teal} /></View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            placeholder="Describe your symptoms…"
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            style={styles.input}
            multiline
          />
          <Pressable onPress={send} disabled={busy || !input.trim()} style={[styles.sendBtn, (busy || !input.trim()) && { opacity: 0.5 }]}>
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 12, gap: 8 },
  rowUser: { justifyContent: "flex-end" },
  rowAI: { justifyContent: "flex-start" },
  aiIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.teal, alignItems: "center", justifyContent: "center" },
  bubble: { maxWidth: "82%", padding: 12, borderRadius: 16 },
  ai: { backgroundColor: colors.card, borderTopLeftRadius: 4, borderWidth: 1, borderColor: colors.line },
  user: { backgroundColor: colors.teal, borderTopRightRadius: 4 },
  text: { fontSize: 14.5, color: colors.ink, lineHeight: 21 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card },
  input: { flex: 1, maxHeight: 120, minHeight: 44, backgroundColor: "#f4f7fa", borderRadius: radius.md, paddingHorizontal: 14, paddingTop: 12, fontSize: 15, color: colors.ink },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.teal, alignItems: "center", justifyContent: "center" },
});
