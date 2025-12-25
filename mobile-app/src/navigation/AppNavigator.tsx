import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import ListsScreen from '../screens/ListsScreen';
import TasksScreen from '../screens/TasksScreen';
import TaskDetailsScreen from '../screens/TaskDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
<<<<<<< HEAD
  Tasks: { listId: number; listName: string; listType: string };
=======
  Tasks: { listId: number; listName: string };
>>>>>>> main
  TaskDetails: { taskId: number };
};

export type MainTabParamList = {
  Lists: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
<<<<<<< HEAD
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // Screens have their own custom headers
      }}
    >
=======
    <Tab.Navigator>
>>>>>>> main
      <Tab.Screen
        name="Lists"
        component={ListsScreen}
        options={{ title: 'My Lists' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Tasks"
              component={TasksScreen}
<<<<<<< HEAD
              options={{ headerShown: false }}
=======
              options={{ headerShown: true }}
>>>>>>> main
            />
            <Stack.Screen
              name="TaskDetails"
              component={TaskDetailsScreen}
<<<<<<< HEAD
              options={{ headerShown: false }}
=======
              options={{ headerShown: true, title: 'Task Details' }}
>>>>>>> main
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

