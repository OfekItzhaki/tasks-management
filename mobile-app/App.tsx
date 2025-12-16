import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { requestNotificationPermissions } from './src/services/notifications.service';

export default function App() {
  useEffect(() => {
    // Request notification permissions on app start
    requestNotificationPermissions().catch((error) => {
      console.error('Error requesting notification permissions:', error);
    });
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
