import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View, ScrollView } from "react-native";
import { api, ApiError, setTokens } from "../lib/api";
import { t } from "../lib/theme";

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  familyId: string;
}

export function RegisterScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [parentName, setParentName] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const res = await api.post<RegisterResponse>("/auth/register", {
        email,
        password,
        familyName,
        parentName,
        timezone: "UTC",
      });
      await setTokens(res.accessToken, res.refreshToken, res.familyId);
      onSignedIn();
    } catch (e) {
      Alert.alert("Registration failed", e instanceof ApiError ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={t.screen}>
      <Text style={t.h1}>Create a family</Text>
      <TextInput style={[t.input, { marginBottom: 10 }]} placeholder="email" placeholderTextColor="#64748b"
        autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={[t.input, { marginBottom: 10 }]} placeholder="password (min 8)" placeholderTextColor="#64748b"
        secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={[t.input, { marginBottom: 10 }]} placeholder="family name" placeholderTextColor="#64748b"
        value={familyName} onChangeText={setFamilyName} />
      <TextInput style={[t.input, { marginBottom: 16 }]} placeholder="your name" placeholderTextColor="#64748b"
        value={parentName} onChangeText={setParentName} />
      <TouchableOpacity style={t.button} onPress={submit} disabled={loading}>
        <Text style={t.buttonText}>{loading ? "..." : "Create"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
