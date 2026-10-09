import { useState } from "react";
import { Alert, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import { t } from "../lib/theme";
import type { Member, Reward, StarBalance } from "../lib/types";

const REWARD_ICONS = ["🎁", "🍦", "🍫", "🎮", "📱", "🎬", "🛝", "🏀", "🧸", "🚲", "🎨", "🧩"];

export function RewardsScreen() {
  const qc = useQueryClient();
  const rewards = useQuery({ queryKey: ["rewards"], queryFn: () => api.get<Reward[]>("/rewards") });
  const members = useQuery({ queryKey: ["members"], queryFn: () => api.get<Member[]>("/members") });
  const balances = useQuery({ queryKey: ["balances"], queryFn: () => api.get<StarBalance[]>("/star-balance") });

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("🎁");
  const [cost, setCost] = useState("10");
  const [picked, setPicked] = useState<string>("");

  const kids = members.data?.filter((m) => m.role === "child") ?? [];
  const activeKid = kids.find((k) => k.id === picked) ?? kids[0];
  const activeBalance = balances.data?.find((b) => b.memberId === activeKid?.id);

  const create = useMutation({
    mutationFn: () => api.post("/rewards", { title, icon, starCost: Number(cost) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rewards"] });
      setTitle("");
    },
    onError: (e) => Alert.alert("Failed", e instanceof ApiError ? e.message : ""),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/rewards/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rewards"] }),
  });
  const redeem = useMutation({
    mutationFn: (args: { rewardId: string; memberId: string }) => api.post("/redemptions", args),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["redemptions"] });
      qc.invalidateQueries({ queryKey: ["balances"] });
      Alert.alert("Sent!", "Waiting for a grown-up to approve.");
    },
    onError: (e) => Alert.alert("Can't do that", e instanceof ApiError ? e.message : ""),
  });

  return (
    <View style={t.screen}>
      <Text style={t.h1}>🎁 Reward store</Text>
      {kids.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <View style={t.row}>
            {kids.map((k) => {
              const b = balances.data?.find((x) => x.memberId === k.id);
              const on = (activeKid?.id ?? "") === k.id;
              return (
                <TouchableOpacity key={k.id} style={[t.chip, on && t.chipOn, { height: 52, paddingHorizontal: 16 }]} onPress={() => setPicked(k.id)}>
                  <Text style={[t.chipText, on && t.chipOnText]}>{k.avatarEmoji} {k.name} · ⭐{b?.balance ?? 0}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
      <FlatList
        data={rewards.data ?? []}
        keyExtractor={(x) => x.id}
        ListFooterComponent={
          <View style={t.card}>
            <Text style={t.h2}>➕ New reward (grown-ups)</Text>
            <TextInput style={[t.input, { marginBottom: 10 }]} placeholder="e.g. Ice cream" placeholderTextColor="#9ca3af" value={title} onChangeText={setTitle} />
            <View style={[t.row, { marginBottom: 8 }]}>
              {REWARD_ICONS.map((i) => (
                <TouchableOpacity key={i} style={[t.chip, icon === i && t.chipOn]} onPress={() => setIcon(i)}>
                  <Text style={{ fontSize: 22 }}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={t.muted}>Star cost</Text>
            <TextInput style={[t.input, { marginVertical: 8 }]} keyboardType="numeric" value={cost} onChangeText={setCost} />
            <TouchableOpacity style={t.bigButton} onPress={() => create.mutate()}>
              <Text style={t.bigButtonText}>➕ Add reward</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const canAfford = (activeBalance?.balance ?? 0) >= item.starCost;
          return (
            <View style={t.kidCard}>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 60 }}>{item.icon}</Text>
                <Text style={t.title}>{item.title}</Text>
                <View style={[t.starPill, { marginTop: 6 }]}><Text style={t.starPillText}>⭐ {item.starCost}</Text></View>
                {item.maxPerWeek && <Text style={t.muted}>max {item.maxPerWeek}/week</Text>}
              </View>
              <View style={[t.row, { marginTop: 10, justifyContent: "center" }]}>
                <TouchableOpacity
                  style={[t.bigButton, canAfford ? t.happy : t.ghost, { flex: 1 }]}
                  disabled={!activeKid || !canAfford}
                  onPress={() => activeKid && redeem.mutate({ rewardId: item.id, memberId: activeKid.id })}
                >
                  <Text style={canAfford ? t.bigButtonText : t.ghostText}>
                    {canAfford ? "I want it!" : "Need more ⭐"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[t.button, t.ghost]} onPress={() => remove.mutate(item.id)}>
                  <Text style={t.ghostText}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
