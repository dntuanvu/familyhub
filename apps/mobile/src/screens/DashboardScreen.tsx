import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { api, clearAuth } from "../lib/api";
import { t, colors } from "../lib/theme";
import type { Member, StarBalance, Task, TaskCompletion } from "../lib/types";

const WEEKDAY_INDEX_TO_ISO = [7, 1, 2, 3, 4, 5, 6];
const todayISO = () => new Date().toISOString().slice(0, 10);
const todayWeekday = () => WEEKDAY_INDEX_TO_ISO[new Date().getDay()]!;

function tasksForMemberToday(tasks: Task[], memberId: string) {
  const d = todayISO();
  const wd = todayWeekday();
  return tasks.filter((task) => {
    if (!task.active) return false;
    if (task.startDate.slice(0, 10) > d) return false;
    if (task.endDate && task.endDate.slice(0, 10) < d) return false;
    if (task.assigneeId && task.assigneeId !== memberId) return false;
    if (task.recurrenceDays.length > 0 && !task.recurrenceDays.includes(wd)) return false;
    return true;
  });
}

export function DashboardScreen({ onLogout }: { onLogout: () => void }) {
  const qc = useQueryClient();
  const members = useQuery({ queryKey: ["members"], queryFn: () => api.get<Member[]>("/members") });
  const balances = useQuery({ queryKey: ["balances"], queryFn: () => api.get<StarBalance[]>("/star-balance") });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => api.get<Task[]>("/tasks") });
  const completions = useQuery({
    queryKey: ["completions", "today"],
    queryFn: () => api.get<TaskCompletion[]>("/task-completions", { from: todayISO(), to: todayISO() }),
  });

  const kids = (members.data ?? []).filter((m) => m.role === "child");

  async function logout() {
    await clearAuth();
    qc.clear();
    onLogout();
  }

  return (
    <View style={t.screen}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={t.h1}>👋 Hi family!</Text>
        <TouchableOpacity style={[t.button, t.ghost]} onPress={logout}>
          <Text style={t.ghostText}>🚪</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={kids}
        keyExtractor={(m) => m.id}
        ListEmptyComponent={
          <View style={t.card}>
            <Text style={t.title}>Add your kids first 👶</Text>
            <Text style={t.muted}>Go to Members and add a child.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={members.isFetching}
            onRefresh={() => {
              members.refetch(); balances.refetch(); tasks.refetch(); completions.refetch();
            }}
            tintColor={colors.accent}
          />
        }
        renderItem={({ item: m }) => {
          const b = balances.data?.find((x) => x.memberId === m.id);
          const due = tasksForMemberToday(tasks.data ?? [], m.id);
          const doneIds = new Set(
            (completions.data ?? [])
              .filter((c) => c.memberId === m.id && c.completedOn.slice(0, 10) === todayISO())
              .map((c) => c.taskId),
          );
          const done = due.filter((t) => doneIds.has(t.id)).length;
          const ratio = due.length === 0 ? 0 : done / due.length;
          return (
            <View style={[t.kidCard, { backgroundColor: `${m.color}22` }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={{ fontSize: 50 }}>{m.avatarEmoji}</Text>
                  <View>
                    <Text style={t.title}>{m.name}</Text>
                    <Text style={t.muted}>{due.length} tasks today</Text>
                  </View>
                </View>
                <Text style={t.big}>⭐ {b?.balance ?? 0}</Text>
              </View>
              <View style={t.progressTrack}>
                <View style={[t.progressFill, { width: `${Math.round(ratio * 100)}%` }]} />
              </View>
              <Text style={[t.muted, { marginTop: 6 }]}>
                {done} / {due.length} done {ratio === 1 && due.length > 0 ? "🎉" : ""}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}
