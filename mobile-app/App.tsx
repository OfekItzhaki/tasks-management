import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { requestNotificationPermissions, rescheduleAllReminders } from './src/services/notifications.service';
import { TokenStorage } from './src/utils/storage';

export default function App() {
  useEffect(() => {
    const initializeNotifications = async () => {
      // Request notification permissions on app start
      const hasPermission = await requestNotificationPermissions();
      
      if (hasPermission) {
        // Check if user is logged in before rescheduling reminders
        const hasToken = await TokenStorage.hasToken();
        if (hasToken) {
          // Reschedule all reminders on app startup
          // This ensures notifications persist after app restart
          await rescheduleAllReminders();
        }
      }
    };

    initializeNotifications().catch((error) => {
      console.error('Error initializing notifications:', error);
    });
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
