import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { UserProvider } from "./src/context/UserContext";

// Import Screens
import LoginScreen from "./src/screens/LoginScreen";
import SSOSelectRoleScreen from "./src/screens/SSOSelectRoleScreen";
import HomeScreen from "./src/screens/HomeScreen";
import AggregateDashboardScreen from "./src/screens/AggregateDashboardScreen";
import AcControlScreen from "./src/screens/AcControlScreen";
import LampControlScreen from "./src/screens/LampControlScreen";
import DevicesListScreen from "./src/screens/DevicesListScreen";
import LocationsScreen from "./src/screens/LocationsScreen";
import ScanScreen from "./src/screens/ScanScreen";
import UsersListScreen from "./src/screens/UsersListScreen";
import UserDetailScreen from "./src/screens/UserDetailScreen";
import AddUserScreen from "./src/screens/AddUserScreen";
import EditUserScreen from "./src/screens/EditUserScreen";
import ReportScreen from "./src/screens/ReportScreen";
import SystemSettingsScreen from "./src/screens/SystemSettingsScreen";
import NotificationDetailScreen from "./src/screens/NotificationDetailScreen";

import { View } from "react-native";
import { useUser } from "./src/context/UserContext";

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const userCtx = useUser();
  const colors = userCtx?.colors || { background: "#ffffff", text: "#0f172a", border: "#f1f5f9" };

  const navTheme = {
    dark: userCtx?.theme === "Dark Mode",
    colors: {
      primary: "#0059AB",
      background: colors.background,
      card: colors.cardBackground || colors.background,
      text: colors.text,
      border: colors.border,
      notification: "#ef4444",
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SSOSelectRole" component={SSOSelectRoleScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AggregateDashboard" component={AggregateDashboardScreen} />
          <Stack.Screen name="AcControl" component={AcControlScreen} />
          <Stack.Screen name="LampControl" component={LampControlScreen} />
          <Stack.Screen name="DevicesList" component={DevicesListScreen} />
          <Stack.Screen name="Locations" component={LocationsScreen} />
          <Stack.Screen name="Scan" component={ScanScreen} />
          <Stack.Screen name="UsersList" component={UsersListScreen} />
          <Stack.Screen name="UserDetail" component={UserDetailScreen} />
          <Stack.Screen name="AddUser" component={AddUserScreen} />
          <Stack.Screen name="EditUser" component={EditUserScreen} />
          <Stack.Screen name="Report" component={ReportScreen} />
          <Stack.Screen name="SystemSettings" component={SystemSettingsScreen} />
          <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <UserProvider>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </UserProvider>
  );
}
