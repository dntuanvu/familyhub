import { useState } from "react";
import { Alert, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import { t } from "../lib/theme";
import type { Member, MemberRole } from "../lib/types";

const KID_EMOJIS = ["🧒", "👦", "👧", "👶", "🦸", "🧚", "🦄", "🐱", "🐶", "🐼", "🦊", "🧑"];

export function MembersScreen() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["members"], queryFn: () => api.get<Member[]>("/members") });

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🧒");
  const [role, setRole] = useState<MemberRole>("child");

  const create = useMutation({
    mutationFn: () => api.post("/members", { name, role, avatarEmoji: emoji }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      setName("");
    },
    onError: (e) => Alert.alert("Failed", e instanceof ApiError ? e.message : ""),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/members/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });

  return (
    <View style={t.screen}>
      <ScrollView>
        <View style={t.card}>
          <Text style={t.h2}>Add someone</Text>
          <TextInput style={[t.input, { marginBottom: 10 }]} placeholder="Their name" placeholderTextColor="#9ca3af" value={name} onChangeText={setName} />
          <Text style={t.muted}>Pick an avatar</Text>
          <View style={[t.row, { marginVertical: 8 }]}>
            {KID_EMOJIS.map((e) => (
              <TouchableOpacity key={e} style={[t.chip, emoji === e && t.chipOn]} onPress={() => setEmoji(e)}>
                <Text style={{ fontSize: 24 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[t.row, { marginBottom: 10 }]}>
            <TouchableOpacity style={[t.chip, role === "child" && t.chipOn]} onPress={() => setRole("child")}>
              <Text style={[t.chipText, role === "child" && t.chipOnText]}>🧒 Kid</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[t.chip, role === "parent" && t.chipOn]} onPress={() => setRole("parent")}>
              <Text style={[t.chipText, role === "parent" && t.chipOnText]}>🧑 Grown-up</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={t.bigButton} onPress={() => create.mutate()}>
            <Text style={t.bigButtonText}>➕ Add {emoji}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <FlatList
        data={data ?? []}
        keyExtractor={(m) => m.id}
        renderItem={({ item: m }) => (
          <View style={t.kidCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Text style={{ fontSize: 44 }}>{m.avatarEmoji}</Text>
                <View>
                  <Text style={t.title}>{m.name}</Text>
                  <Text style={t.muted}>{m.role === "parent" ? "🧑 Grown-up" : "🧒 Kid"}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[t.button, t.danger]}
                onPress={() =>
                  Alert.alert("Remove?", `Remove ${m.name}?`, [
                    { text: "Cancel" },
                    { text: "Remove", style: "destructive", onPress: () => remove.mutate(m.id) },
                  ])
                }
              >
                <Text style={t.buttonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
