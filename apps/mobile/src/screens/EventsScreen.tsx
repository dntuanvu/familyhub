import { useState } from "react";
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import { t } from "../lib/theme";
import type { CalendarEvent } from "../lib/types";

export function EventsScreen() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["events"], queryFn: () => api.get<CalendarEvent[]>("/events") });

  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const create = useMutation({
    mutationFn: () => api.post("/events", {
      title,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      setTitle(""); setStartsAt(""); setEndsAt("");
    },
    onError: (e) => Alert.alert("Failed", e instanceof ApiError ? e.message : ""),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  return (
    <View style={t.screen}>
      <Text style={t.h1}>📅 Calendar</Text>
      <View style={t.card}>
        <TextInput style={[t.input, { marginBottom: 8 }]} placeholder="Event name" placeholderTextColor="#9ca3af" value={title} onChangeText={setTitle} />
        <TextInput style={[t.input, { marginBottom: 8 }]} placeholder="Starts: 2026-10-10 09:00" placeholderTextColor="#9ca3af" value={startsAt} onChangeText={setStartsAt} />
        <TextInput style={[t.input, { marginBottom: 8 }]} placeholder="Ends: 2026-10-10 10:00" placeholderTextColor="#9ca3af" value={endsAt} onChangeText={setEndsAt} />
        <TouchableOpacity style={t.bigButton} onPress={() => create.mutate()}>
          <Text style={t.bigButtonText}>➕ Add event</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={list.data ?? []}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => (
          <View style={t.kidCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={t.title}>{item.title}</Text>
                <Text style={t.muted}>🕐 {new Date(item.startsAt).toLocaleString()}</Text>
              </View>
              <TouchableOpacity style={[t.button, t.danger]} onPress={() => remove.mutate(item.id)}>
                <Text style={t.buttonText}>🗑</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
