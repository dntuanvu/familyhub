import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";

const Stack = createNativeStackNavigator();

export function AuthStack({ onSignedIn }: { onSignedIn: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: "#111827" }, headerTintColor: "#e5e7eb" }}>
      <Stack.Screen name="Login" options={{ title: "Log in" }}>
        {() => <LoginScreen onSignedIn={onSignedIn} />}
      </Stack.Screen>
      <Stack.Screen name="Register" options={{ title: "Create a family" }}>
        {() => <RegisterScreen onSignedIn={onSignedIn} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
