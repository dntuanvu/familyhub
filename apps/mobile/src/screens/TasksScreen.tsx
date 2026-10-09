import { useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import { t } from "../lib/theme";
import type { Member, Task, TaskCompletion, TimeOfDay } from "../lib/types";

const WEEKDAYS: [number, string][] = [
  [1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [7, "Sun"],
];
const TASK_ICONS = ["✅", "🪥", "🛏️", "📚", "🧦", "🚿", "🍎", "🥦", "🐶", "🧹", "🎒", "🚶"];
const TIME_LABEL: Record<TimeOfDay, string> = {
  morning: "🌅 Morning",
  afternoon: "☀️ Afternoon",
  evening: "🌙 Evening",
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export function TasksScreen() {
  const qc = useQueryClient();
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => api.get<Task[]>("/tasks") });
  const members = useQuery({ queryKey: ["members"], queryFn: () => api.get<Member[]>("/members") });
  const completions = useQuery({
    queryKey: ["completions", "today"],
    queryFn: () => api.get<TaskCompletion[]>("/task-completions", { from: todayISO(), to: todayISO() }),
  });

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("✅");
  const [tod, setTod] = useState<TimeOfDay>("morning");
  const [stars, setStars] = useState("1");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [days, setDays] = useState<Set<number>>(new Set());

  const create = useMutation({
    mutationFn: () =>
      api.post("/tasks", {
        title,
        icon,
        timeOfDay: tod,
        stars: Number(stars) || 0,
        assigneeId: assigneeId || null,
        recurrenceDays: Array.from(days),
        startDate: todayISO(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setTitle("");
    },
    onError: (e) => Alert.alert("Failed", e instanceof ApiError ? e.message : ""),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const complete = useMutation({
    mutationFn: ({ task, memberId }: { task: Task; memberId: string }) =>
      api.post("/task-completions", {
        taskId: task.id,
        memberId,
        completedOn: todayISO(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["completions"] });
      qc.invalidateQueries({ queryKey: ["balances"] });
    },
    onError: (e) => Alert.alert("Failed", e instanceof ApiError ? e.message : ""),
  });

  const kids = members.data?.filter((m) => m.role === "child") ?? [];
  const doneToday = new Set((completions.data ?? []).map((c) => `${c.taskId}:${c.memberId}`));
  const groups: Record<TimeOfDay, Task[]> = { morning: [], afternoon: [], evening: [] };
  for (const task of tasks.data ?? []) groups[task.timeOfDay].push(task);

  function toggleDay(d: number) {
    const next = new Set(days);
    next.has(d) ? next.delete(d) : next.add(d);
    setDays(next);
  }

  return (
    <ScrollView style={t.screen}>
      <Text style={t.h1}>✅ Today's tasks</Text>

      {(["morning", "afternoon", "evening"] as TimeOfDay[]).map((slot) => (
        <View key={slot} style={{ marginBottom: 12 }}>
          <Text style={t.h2}>{TIME_LABEL[slot]}</Text>
          {groups[slot].length === 0 && <Text style={t.muted}>Nothing here yet.</Text>}
          {groups[slot].map((task) => {
            const assigneeIds = task.assigneeId ? [task.assigneeId] : kids.map((k) => k.id);
            const allDone = assigneeIds.every((id) => doneToday.has(`${task.id}:${id}`));
            return (
              <View key={task.id} style={[t.kidCard, allDone && { opacity: 0.5 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={{ fontSize: 40 }}>{task.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={t.title}>{task.title}</Text>
                    <Text style={t.muted}>
                      {task.recurrenceDays.length === 0 ? "every day" : task.recurrenceDays.map((d) => WEEKDAYS[d - 1]![1]).join(" ")}
                    </Text>
                  </View>
                  <View style={t.starPill}><Text style={t.starPillText}>⭐ {task.stars}</Text></View>
                </View>
                <View style={[t.row, { marginTop: 10 }]}>
                  {assigneeIds.map((id) => {
                    const member = kids.find((k) => k.id === id);
                    if (!member) return null;
                    const isDone = doneToday.has(`${task.id}:${id}`);
                    return (
                      <TouchableOpacity
                        key={id}
                        style={[t.button, isDone ? t.ghost : t.happy, { flex: 1 }]}
                        disabled={isDone}
                        onPress={() => complete.mutate({ task, memberId: id })}
                      >
                        <Text style={isDone ? t.ghostText : t.buttonText}>
                          {isDone ? "✓" : "Done!"} {member.avatarEmoji}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={[t.button, t.ghost]}
                    onPress={() => Alert.alert("Delete?", `Delete "${task.title}"?`, [
                      { text: "Cancel" },
                      { text: "Delete", style: "destructive", onPress: () => remove.mutate(task.id) },
                    ])}
                  >
                    <Text style={t.ghostText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      ))}

      <View style={t.card}>
        <Text style={t.h2}>➕ New task</Text>
        <TextInput style={[t.input, { marginBottom: 10 }]} placeholder="e.g. Brush teeth" placeholderTextColor="#9ca3af" value={title} onChangeText={setTitle} />
        <Text style={t.muted}>Icon</Text>
        <View style={[t.row, { marginVertical: 8 }]}>
          {TASK_ICONS.map((i) => (
            <TouchableOpacity key={i} style={[t.chip, icon === i && t.chipOn]} onPress={() => setIcon(i)}>
              <Text style={{ fontSize: 22 }}>{i}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={t.muted}>When</Text>
        <View style={[t.row, { marginVertical: 8 }]}>
          {(["morning", "afternoon", "evening"] as TimeOfDay[]).map((v) => (
            <TouchableOpacity key={v} style={[t.chip, tod === v && t.chipOn, { flex: 1 }]} onPress={() => setTod(v)}>
              <Text style={[t.chipText, tod === v && t.chipOnText]}>{TIME_LABEL[v]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={t.muted}>Stars</Text>
        <TextInput style={[t.input, { marginVertical: 8 }]} keyboardType="numeric" value={stars} onChangeText={setStars} />
        <Text style={t.muted}>Days (empty = every day)</Text>
        <View style={[t.row, { marginVertical: 8 }]}>
          {WEEKDAYS.map(([d, label]) => (
            <TouchableOpacity key={d} style={[t.chip, days.has(d) && t.chipOn]} onPress={() => toggleDay(d)}>
              <Text style={[t.chipText, days.has(d) && t.chipOnText]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={t.muted}>Who's it for</Text>
        <View style={[t.row, { marginVertical: 8 }]}>
          <TouchableOpacity style={[t.chip, assigneeId === "" && t.chipOn]} onPress={() => setAssigneeId("")}>
            <Text style={[t.chipText, assigneeId === "" && t.chipOnText]}>👥 anyone</Text>
          </TouchableOpacity>
          {kids.map((k) => (
            <TouchableOpacity key={k.id} style={[t.chip, assigneeId === k.id && t.chipOn]} onPress={() => setAssigneeId(k.id)}>
              <Text style={[t.chipText, assigneeId === k.id && t.chipOnText]}>{k.avatarEmoji} {k.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={t.bigButton} onPress={() => create.mutate()}>
          <Text style={t.bigButtonText}>➕ Add task</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
