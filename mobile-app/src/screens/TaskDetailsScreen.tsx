import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { tasksService } from '../services/tasks.service';
import { stepsService } from '../services/steps.service';
import { Task, Step, UpdateTaskDto, CreateStepDto, ReminderConfig, ReminderTimeframe, ReminderSpecificDate } from '../types';
import ReminderConfigComponent from '../components/ReminderConfig';
import DatePicker from '../components/DatePicker';
import { scheduleTaskReminders, cancelAllTaskNotifications } from '../services/notifications.service';
import { EveryDayRemindersStorage, ReminderAlarmsStorage } from '../utils/storage';

type TaskDetailsRouteProp = RouteProp<RootStackParamList, 'TaskDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function TaskDetailsScreen() {
  const route = useRoute<TaskDetailsRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { taskId } = route.params;

  const [task, setTask] = useState<Task | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayEveryDayReminders, setDisplayEveryDayReminders] = useState<ReminderConfig[]>([]);
  const [reminderAlarmStates, setReminderAlarmStates] = useState<Record<string, boolean>>({});

  // Edit form state
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editReminders, setEditReminders] = useState<ReminderConfig[]>([]);

  // Step management
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [newStepDescription, setNewStepDescription] = useState('');

  useEffect(() => {
    loadTaskData();
  }, [taskId]);

  // Format reminder for display
  const formatReminderDisplay = (reminder: ReminderConfig): string => {
    const timeStr = reminder.time || '09:00';
    let description = '';

    if (reminder.daysBefore !== undefined && reminder.daysBefore > 0) {
      description = `${reminder.daysBefore} day(s) before due date at ${timeStr}`;
      return description;
    }

    switch (reminder.timeframe) {
      case ReminderTimeframe.SPECIFIC_DATE:
        if (reminder.specificDate === ReminderSpecificDate.START_OF_WEEK) {
          description = `Every Monday at ${timeStr}`;
        } else if (reminder.specificDate === ReminderSpecificDate.START_OF_MONTH) {
          description = `1st of every month at ${timeStr}`;
        } else if (reminder.specificDate === ReminderSpecificDate.START_OF_YEAR) {
          description = `Jan 1st every year at ${timeStr}`;
        } else if (reminder.customDate) {
          const date = new Date(reminder.customDate);
          description = `${date.toLocaleDateString()} at ${timeStr}`;
        } else {
          description = `Specific date at ${timeStr}`;
        }
        break;
      case ReminderTimeframe.EVERY_DAY:
        description = `Every day at ${timeStr}`;
        break;
      case ReminderTimeframe.EVERY_WEEK:
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = reminder.dayOfWeek !== undefined ? dayNames[reminder.dayOfWeek] : 'Monday';
        description = `Every ${dayName} at ${timeStr}`;
        break;
      case ReminderTimeframe.EVERY_MONTH:
        description = `1st of every month at ${timeStr}`;
        break;
      case ReminderTimeframe.EVERY_YEAR:
        description = `Same date every year at ${timeStr}`;
        break;
    }

    return description;
  };

  // Convert backend format to ReminderConfig format
  const convertBackendToReminders = (
    reminderDaysBefore: number[] | undefined,
    specificDayOfWeek: number | null | undefined,
    dueDate: string | null | undefined,
  ): ReminderConfig[] => {
    const reminders: ReminderConfig[] = [];

    // Convert reminderDaysBefore array to ReminderConfig
    // Only show these if there's a due date, since they're relative to due date
    if (reminderDaysBefore && reminderDaysBefore.length > 0 && dueDate) {
      reminderDaysBefore.forEach((days) => {
        reminders.push({
          id: `days-before-${days}`,
          timeframe: ReminderTimeframe.SPECIFIC_DATE,
          time: '09:00', // Default time, user can edit
          daysBefore: days,
        });
      });
    }

    // Convert specificDayOfWeek to ReminderConfig
    // Note: Backend only supports 0-6 (weekly reminders), so "every day" reminders
    // are handled client-side only via notifications
    if (specificDayOfWeek !== null && specificDayOfWeek !== undefined && specificDayOfWeek >= 0 && specificDayOfWeek <= 6) {
      reminders.push({
        id: `day-of-week-${specificDayOfWeek}`,
        timeframe: ReminderTimeframe.EVERY_WEEK,
        time: '09:00', // Default time, user can edit
        dayOfWeek: specificDayOfWeek,
      });
    }
    
    // Note: EVERY_DAY reminders are stored client-side only (not in backend)
    // They're handled via the notification system but won't persist in task details

    return reminders;
  };

  // Convert ReminderConfig format to backend format (reused from TasksScreen)
  const convertRemindersToBackend = (
    reminders: ReminderConfig[],
    dueDate?: string,
  ): { dueDate?: string; reminderDaysBefore?: number[]; specificDayOfWeek?: number } => {
    const result: { dueDate?: string; reminderDaysBefore?: number[]; specificDayOfWeek?: number } = {};

    if (dueDate) {
      result.dueDate = new Date(dueDate).toISOString();
    }

    const daysBefore: number[] = [];
    let dayOfWeek: number | undefined;

    reminders.forEach((reminder) => {
      // Note: EVERY_DAY reminders are NOT saved to backend (backend only supports 0-6 for weekly)
      // They're handled client-side via notifications only
      // Skip EVERY_DAY reminders for backend storage
      if (reminder.timeframe === ReminderTimeframe.EVERY_DAY) {
        return; // Skip - handled by notification system only
      }
      
      // For reminders with daysBefore (relative to due date) - this is the primary use case
      if (reminder.daysBefore !== undefined && reminder.daysBefore > 0) {
        if (dueDate) {
          daysBefore.push(reminder.daysBefore);
        }
        // Note: daysBefore reminders require a due date, but we still want to save them
        // if a due date is provided in the same request
      }

      // For weekly reminders
      if (reminder.timeframe === ReminderTimeframe.EVERY_WEEK && reminder.dayOfWeek !== undefined) {
        dayOfWeek = reminder.dayOfWeek;
      }

      // For specific date reminders that are relative to due date
      if (reminder.timeframe === ReminderTimeframe.SPECIFIC_DATE && dueDate && reminder.customDate) {
        const reminderDate = new Date(reminder.customDate);
        const due = new Date(dueDate);
        const diffDays = Math.ceil((due.getTime() - reminderDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 365) { // Reasonable range
          daysBefore.push(diffDays);
        }
      }
    });

    // Always set reminderDaysBefore if we have valid daysBefore values
    if (daysBefore.length > 0) {
      // Remove duplicates and sort descending
      result.reminderDaysBefore = [...new Set(daysBefore)].sort((a, b) => b - a);
    } else {
      // Set empty array if no daysBefore reminders
      result.reminderDaysBefore = [];
    }

    // Set specificDayOfWeek (0-6 for weekly reminders only, backend doesn't support "every day")
    if (dayOfWeek !== undefined && dayOfWeek >= 0 && dayOfWeek <= 6) {
      result.specificDayOfWeek = dayOfWeek;
    }

    return result;
  };

  const loadTaskData = async () => {
    try {
      const [taskData, stepsData] = await Promise.all([
        tasksService.getById(taskId),
        stepsService.getByTask(taskId),
      ]);

      setTask(taskData);
      setSteps(stepsData);

      // Initialize edit form
      setEditDescription(taskData.description);
      setEditDueDate(taskData.dueDate ? taskData.dueDate.split('T')[0] : '');
      // Convert reminderDaysBefore to ReminderConfig format
      const convertedReminders = convertBackendToReminders(
        taskData.reminderDaysBefore,
        taskData.specificDayOfWeek,
        taskData.dueDate || undefined,
      );
      
      // Load client-side stored "every day" reminders
      const everyDayReminders = await EveryDayRemindersStorage.getRemindersForTask(taskId);
      setDisplayEveryDayReminders(everyDayReminders || []);
      
      if (everyDayReminders && everyDayReminders.length > 0) {
        convertedReminders.push(...everyDayReminders);
      }
      
      // Load alarm states for all reminders
      const alarmStates = await ReminderAlarmsStorage.getAlarmsForTask(taskId);
      setReminderAlarmStates(alarmStates || {});
      
      if (alarmStates) {
        convertedReminders = convertedReminders.map(r => ({
          ...r,
          hasAlarm: alarmStates[r.id] !== undefined ? alarmStates[r.id] : r.hasAlarm,
        }));
      }
      
      setEditReminders(convertedReminders);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Unable to load task. Please try again.';
      Alert.alert('Error Loading Task', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTaskData();
  };

  const handleSaveEdit = async () => {
    if (!editDescription.trim()) {
      Alert.alert('Validation Error', 'Please enter a task description before saving.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: UpdateTaskDto = {
        description: editDescription.trim(),
      };

      let dueDateStr: string | undefined;
      if (editDueDate.trim()) {
        const date = new Date(editDueDate);
        if (!isNaN(date.getTime())) {
          dueDateStr = date.toISOString();
          updateData.dueDate = dueDateStr;
        }
      } else {
        updateData.dueDate = null;
      }

      // Convert reminders to backend format
      const reminderData = convertRemindersToBackend(editReminders, dueDateStr || undefined);
      
      // Always set reminderDaysBefore - clear if no due date or no valid reminders
      if (dueDateStr && reminderData.reminderDaysBefore && reminderData.reminderDaysBefore.length > 0) {
        updateData.reminderDaysBefore = reminderData.reminderDaysBefore;
      } else {
        // Clear daysBefore reminders if no due date or no valid reminders
        updateData.reminderDaysBefore = [];
      }
      
      // Always set specificDayOfWeek (weekly reminders don't require due date)
      updateData.specificDayOfWeek = reminderData.specificDayOfWeek !== undefined 
        ? reminderData.specificDayOfWeek 
        : null;

      const updatedTask = await tasksService.update(taskId, updateData);
      
      // Separate EVERY_DAY reminders (client-side storage) from others
      const everyDayReminders = editReminders.filter(r => r.timeframe === ReminderTimeframe.EVERY_DAY);
      const otherReminders = editReminders.filter(r => r.timeframe !== ReminderTimeframe.EVERY_DAY);
      
      // Store EVERY_DAY reminders client-side
      if (everyDayReminders.length > 0) {
        await EveryDayRemindersStorage.setRemindersForTask(taskId, everyDayReminders);
      } else {
        await EveryDayRemindersStorage.removeRemindersForTask(taskId);
      }
      
      setIsEditing(false);
      
      // Update scheduled notifications (include all reminders)
      if (editReminders.length > 0) {
        await scheduleTaskReminders(
          taskId,
          updatedTask.description,
          editReminders,
          dueDateStr || null,
        );
      } else {
        // Cancel all notifications if no reminders
        await cancelAllTaskNotifications(taskId);
      }
      
      loadTaskData();
      Alert.alert('Success', 'Task has been updated.');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Unable to update task. Please try again.';
      Alert.alert('Update Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    if (task) {
      setEditDescription(task.description);
      setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      // Reset reminders to original task reminders
      const convertedReminders = convertBackendToReminders(
        task.reminderDaysBefore,
        task.specificDayOfWeek,
        task.dueDate || undefined,
      );
      setEditReminders(convertedReminders);
    }
    setIsEditing(false);
  };

  const handleToggleTask = async () => {
    if (!task) return;

    try {
      await tasksService.update(taskId, { completed: !task.completed });
      loadTaskData();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Unable to toggle task completion. Please try again.';
      Alert.alert('Update Failed', errorMessage);
    }
  };

  const handleAddStep = async () => {
    if (!newStepDescription.trim()) {
      Alert.alert('Validation Error', 'Please enter a step description before adding.');
      return;
    }

    try {
      await stepsService.create(taskId, { description: newStepDescription.trim() });
      setNewStepDescription('');
      setShowAddStepModal(false);
      loadTaskData();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Unable to add step. Please try again.';
      Alert.alert('Add Step Failed', errorMessage);
    }
  };

  const handleToggleStep = async (step: Step) => {
    try {
      await stepsService.update(step.id, { completed: !step.completed });
      loadTaskData();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Unable to update step. Please try again.';
      Alert.alert('Update Failed', errorMessage);
    }
  };

  const handleToggleReminderAlarm = async (reminderId: string) => {
    if (!task) return;

    try {
      // Get current alarm state from storage
      const currentAlarmState = reminderAlarmStates[reminderId] !== undefined 
        ? reminderAlarmStates[reminderId] 
        : false;
      const newAlarmState = !currentAlarmState;

      // Save new alarm state to storage
      await ReminderAlarmsStorage.setAlarmForReminder(taskId, reminderId, newAlarmState);

      // Update local state immediately for instant visual feedback
      setReminderAlarmStates(prev => ({
        ...prev,
        [reminderId]: newAlarmState,
      }));

      // Get all reminders to update notifications
      const backendReminders = convertBackendToReminders(
        task.reminderDaysBefore,
        task.specificDayOfWeek,
        task.dueDate || undefined,
      );
      const everyDayReminders = await EveryDayRemindersStorage.getRemindersForTask(taskId) || [];
      const allReminders = [...backendReminders, ...everyDayReminders];

      // Apply updated alarm states to all reminders
      const updatedAlarmStates = { ...reminderAlarmStates, [reminderId]: newAlarmState };
      const updatedReminders = allReminders.map((r) => ({
        ...r,
        hasAlarm: updatedAlarmStates[r.id] !== undefined ? updatedAlarmStates[r.id] : false,
      }));

      // Reschedule notifications with updated alarm settings
      await scheduleTaskReminders(
        taskId,
        task.description,
        updatedReminders,
        task.dueDate || null,
      );
      
      // No need to reload - state is already updated for immediate visual feedback
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Unable to update reminder alarm. Please try again.';
      Alert.alert('Update Failed', errorMessage);
      // Reload to restore correct state on error
      loadTaskData();
    }
  };

  const handleDeleteStep = (step: Step) => {
    Alert.alert(
      'Delete Step',
      `Are you sure you want to delete "${step.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await stepsService.delete(step.id);
              loadTaskData();
            } catch (error: any) {
              const errorMessage = error?.response?.data?.message || error?.message || 'Unable to delete step. Please try again.';
              Alert.alert('Delete Failed', errorMessage);
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  const isCompleted = Boolean(task.completed);
  const completedSteps = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const stepsProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Task Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}
              onPress={handleToggleTask}
            >
              {isCompleted && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <View style={styles.headerText}>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  multiline
                  autoFocus
                />
              ) : (
                <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
                  {task.description}
                </Text>
              )}
            </View>
          </View>

          {!isEditing && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Task Info */}
        <View style={styles.section}>
              <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Due Date:</Text>
              {isEditing ? (
                <View style={styles.datePickerContainer}>
                  <DatePicker
                    value={editDueDate}
                    onChange={setEditDueDate}
                    placeholder="No due date"
                  />
                </View>
              ) : (
                <Text style={styles.infoValue}>
                  {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                </Text>
              )}
            </View>

          {/* Display Reminders */}
          {(() => {
            const displayReminders = convertBackendToReminders(
              task.reminderDaysBefore,
              task.specificDayOfWeek,
              task.dueDate || undefined,
            );
            
            // Add client-side stored EVERY_DAY reminders for display
            let allDisplayReminders = [...displayReminders, ...displayEveryDayReminders];
            
            // Apply alarm states from state
            allDisplayReminders = allDisplayReminders.map(r => ({
              ...r,
              hasAlarm: reminderAlarmStates[r.id] !== undefined ? reminderAlarmStates[r.id] : (r.hasAlarm || false),
            }));
            
            if (allDisplayReminders.length > 0) {
              return (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Reminders:</Text>
                  <View style={styles.remindersList}>
                    {allDisplayReminders.map((reminder) => (
                      <View key={reminder.id} style={styles.reminderDisplayItem}>
                        <Text style={styles.reminderDisplayText}>
                          {formatReminderDisplay(reminder)}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.alarmToggleButton,
                            reminder.hasAlarm && styles.alarmToggleButtonActive
                          ]}
                          onPress={() => handleToggleReminderAlarm(reminder.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.alarmToggleIcon,
                            reminder.hasAlarm && styles.alarmToggleIconActive
                          ]}>
                            {reminder.hasAlarm ? '🔔' : '🔕'}
                          </Text>
                          <Text style={[
                            styles.alarmToggleText,
                            reminder.hasAlarm && styles.alarmToggleTextActive
                          ]}>
                            {reminder.hasAlarm ? 'ON' : 'OFF'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              );
            }
            return null;
          })()}
        </View>

        {/* Reminders Section (when editing) */}
        {isEditing && (
          <View style={styles.section}>
            <ReminderConfigComponent
              reminders={editReminders}
              onRemindersChange={setEditReminders}
            />
          </View>
        )}

        {/* Steps Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Steps</Text>
            {totalSteps > 0 && (
              <Text style={styles.progressText}>
                {completedSteps}/{totalSteps} completed
              </Text>
            )}
          </View>

          {totalSteps > 0 && (
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${stepsProgress}%` }]}
              />
            </View>
          )}

          {steps.length === 0 ? (
            <Text style={styles.emptyText}>No steps yet</Text>
          ) : (
            steps.map((step) => {
              const stepCompleted = Boolean(step.completed);
              return (
                <TouchableOpacity
                  key={step.id}
                  style={[
                    styles.stepItem,
                    stepCompleted && styles.stepItemCompleted,
                  ]}
                  onPress={() => handleToggleStep(step)}
                  onLongPress={() => handleDeleteStep(step)}
                >
                  <View style={styles.stepCheckbox}>
                    {stepCompleted && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.stepText,
                      stepCompleted && styles.stepTextCompleted,
                    ]}
                  >
                    {step.description}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity
            style={styles.addStepButton}
            onPress={() => setShowAddStepModal(true)}
          >
            <Text style={styles.addStepButtonText}>+ Add Step</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Actions */}
        {isEditing && (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelEdit}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSaveEdit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Step Modal */}
      <Modal
        visible={showAddStepModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddStepModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Step</Text>
            <TextInput
              style={styles.input}
              placeholder="Step description"
              value={newStepDescription}
              onChangeText={setNewStepDescription}
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddStepModal(false);
                  setNewStepDescription('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleAddStep}
              >
                <Text style={styles.submitButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  editButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  editInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
    minWidth: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  datePickerContainer: {
    flex: 1,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stepItemCompleted: {
    opacity: 0.6,
  },
  stepCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  stepTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  addStepButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  addStepButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 50,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
  },
  remindersList: {
    flex: 1,
    marginTop: 4,
  },
  reminderDisplayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reminderDisplayText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    flex: 1,
  },
  alarmToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#ddd',
    minWidth: 70,
    justifyContent: 'center',
  },
  alarmToggleButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  alarmToggleIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  alarmToggleIconActive: {
    fontSize: 20,
  },
  alarmToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
  },
  alarmToggleTextActive: {
    color: '#2196F3',
    fontWeight: '700',
  },
});

