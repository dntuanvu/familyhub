import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View } from "react-native";
import { AuthStack } from "./src/navigation/AuthStack";
import { MainTabs } from "./src/navigation/MainTabs";
import { auth, loadAuth } from "./src/lib/api";

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

export default function App() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    (async () => {
      await loadAuth();
      setSignedIn(!!auth.accessToken);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator color="#60a5fa" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={qc}>
        <NavigationContainer>
          {signedIn ? <MainTabs onLogout={() => setSignedIn(false)} /> : <AuthStack onSignedIn={() => setSignedIn(true)} />}
        </NavigationContainer>
        <StatusBar style="light" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
