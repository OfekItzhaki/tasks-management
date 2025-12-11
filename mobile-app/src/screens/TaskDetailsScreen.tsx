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
import { Task, Step, UpdateTaskDto, CreateStepDto, ReminderConfig } from '../types';
import ReminderConfigComponent from '../components/ReminderConfig';
import DatePicker from '../components/DatePicker';

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
      // TODO: Convert reminderDaysBefore to ReminderConfig format
      setEditReminders([]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load task');
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
      Alert.alert('Error', 'Task description cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: UpdateTaskDto = {
        description: editDescription.trim(),
      };

      if (editDueDate.trim()) {
        const date = new Date(editDueDate);
        if (!isNaN(date.getTime())) {
          updateData.dueDate = date.toISOString();
        }
      } else {
        updateData.dueDate = null;
      }

      // Convert reminders (similar to TasksScreen)
      // TODO: Implement reminder conversion

      await tasksService.update(taskId, updateData);
      setIsEditing(false);
      loadTaskData();
      Alert.alert('Success', 'Task updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    if (task) {
      setEditDescription(task.description);
      setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setEditReminders([]);
    }
    setIsEditing(false);
  };

  const handleToggleTask = async () => {
    if (!task) return;

    try {
      await tasksService.update(taskId, { completed: !task.completed });
      loadTaskData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update task');
    }
  };

  const handleAddStep = async () => {
    if (!newStepDescription.trim()) {
      Alert.alert('Error', 'Please enter a step description');
      return;
    }

    try {
      await stepsService.create(taskId, { description: newStepDescription.trim() });
      setNewStepDescription('');
      setShowAddStepModal(false);
      loadTaskData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add step');
    }
  };

  const handleToggleStep = async (step: Step) => {
    try {
      await stepsService.update(step.id, { completed: !step.completed });
      loadTaskData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update step');
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
              Alert.alert('Error', error.message || 'Failed to delete step');
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

          {task.reminderDaysBefore && task.reminderDaysBefore.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reminders:</Text>
              <Text style={styles.infoValue}>
                {task.reminderDaysBefore.join(', ')} day(s) before
              </Text>
            </View>
          )}
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
});

