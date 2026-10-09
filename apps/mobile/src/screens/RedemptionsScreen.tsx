import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import { t } from "../lib/theme";
import type { Member, Redemption, Reward } from "../lib/types";

export function RedemptionsScreen() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["redemptions"], queryFn: () => api.get<Redemption[]>("/redemptions") });
  const rewards = useQuery({ queryKey: ["rewards"], queryFn: () => api.get<Reward[]>("/rewards") });
  const members = useQuery({ queryKey: ["members"], queryFn: () => api.get<Member[]>("/members") });

  const decide = useMutation({
    mutationFn: (args: { id: string; status: "approved" | "rejected" }) =>
      api.patch(`/redemptions/${args.id}`, { status: args.status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["redemptions"] });
      qc.invalidateQueries({ queryKey: ["balances"] });
    },
    onError: (e) => Alert.alert("Failed", e instanceof ApiError ? e.message : ""),
  });

  const reward = (id: string) => rewards.data?.find((r) => r.id === id);
  const member = (id: string) => members.data?.find((m) => m.id === id);

  return (
    <View style={t.screen}>
      <Text style={t.h1}>📬 Requests</Text>
      <FlatList
        data={list.data ?? []}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => {
          const rw = reward(item.rewardId);
          const m = member(item.memberId);
          return (
            <View style={t.kidCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 44 }}>{rw?.icon ?? "🎁"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={t.title}>{m?.avatarEmoji} {m?.name} → {rw?.title}</Text>
                  <Text style={t.muted}>⭐ {item.starsSpent} · {item.status}</Text>
                </View>
              </View>
              {item.status === "pending" && (
                <View style={[t.row, { marginTop: 10 }]}>
                  <TouchableOpacity style={[t.bigButton, t.happy, { flex: 1 }]} onPress={() => decide.mutate({ id: item.id, status: "approved" })}>
                    <Text style={t.bigButtonText}>✓ Yes!</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[t.bigButton, t.danger, { flex: 1 }]} onPress={() => decide.mutate({ id: item.id, status: "rejected" })}>
                    <Text style={t.bigButtonText}>✗ Not yet</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}
