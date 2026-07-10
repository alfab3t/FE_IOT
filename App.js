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
import ReportScreen from "./src/screens/ReportScreen";
import SystemSettingsScreen from "./src/screens/SystemSettingsScreen";
import NotificationDetailScreen from "./src/screens/NotificationDetailScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <UserProvider>
      <SafeAreaProvider>
        <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
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
          <Stack.Screen name="Report" component={ReportScreen} />
          <Stack.Screen name="SystemSettings" component={SystemSettingsScreen} />
          <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      </SafeAreaProvider>
    </UserProvider>
  );
}
