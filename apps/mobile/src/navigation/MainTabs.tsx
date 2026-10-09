import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import { DashboardScreen } from "../screens/DashboardScreen";
import { MembersScreen } from "../screens/MembersScreen";
import { TasksScreen } from "../screens/TasksScreen";
import { RewardsScreen } from "../screens/RewardsScreen";
import { RedemptionsScreen } from "../screens/RedemptionsScreen";
import { EventsScreen } from "../screens/EventsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function tabIcon(label: string) {
  return () => <Text style={{ fontSize: 18 }}>{label}</Text>;
}

export function MainTabs({ onLogout }: { onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#111827" },
        headerTintColor: "#e5e7eb",
        tabBarStyle: { backgroundColor: "#111827", borderTopColor: "#1f2937" },
        tabBarActiveTintColor: "#60a5fa",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <Tab.Screen name="Home" options={{ tabBarIcon: tabIcon("🏠") }}>
        {() => <DashboardScreen onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Tasks" component={TasksScreen} options={{ tabBarIcon: tabIcon("✅") }} />
      <Tab.Screen name="Rewards" component={RewardsScreen} options={{ tabBarIcon: tabIcon("🎁") }} />
      <Tab.Screen
        name="Requests"
        component={RedemptionsScreen}
        options={{ tabBarIcon: tabIcon("📬") }}
      />
      <Tab.Screen name="Members" component={MembersScreen} options={{ tabBarIcon: tabIcon("👨‍👩‍👧") }} />
      <Tab.Screen name="Calendar" component={EventsScreen} options={{ tabBarIcon: tabIcon("📅") }} />
    </Tab.Navigator>
  );
}
