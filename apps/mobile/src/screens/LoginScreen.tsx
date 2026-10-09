import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api, ApiError, setTokens } from "../lib/api";
import { t } from "../lib/theme";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  memberships: { familyId: string }[];
}

export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const nav = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>("/auth/login", { email, password });
      await setTokens(res.accessToken, res.refreshToken, res.memberships[0]?.familyId);
      onSignedIn();
    } catch (e) {
      Alert.alert("Login failed", e instanceof ApiError ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={t.screen}>
      <Text style={t.h1}>Welcome back</Text>
      <TextInput style={[t.input, { marginBottom: 10 }]} placeholder="email" placeholderTextColor="#64748b"
        autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={[t.input, { marginBottom: 16 }]} placeholder="password" placeholderTextColor="#64748b"
        secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={t.button} onPress={submit} disabled={loading}>
        <Text style={t.buttonText}>{loading ? "..." : "Log in"}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[t.button, t.ghost, { marginTop: 10 }]} onPress={() => nav.navigate("Register")}>
        <Text style={t.ghostText}>Create a family instead</Text>
      </TouchableOpacity>
    </View>
  );
}
