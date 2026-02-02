import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Task } from '../../types';
import { createTaskDetailsStyles } from '../../screens/styles/TaskDetailsScreen.styles';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useThemedStyles } from '../../utils/useThemedStyles';

interface TaskHeaderProps {
  task: Task;
  isEditing: boolean;
  editDescription: string;
  onEditDescriptionChange: (text: string) => void;
  onToggleTask: () => void;
  onEditPress: () => void;
  completionCount?: number;
  isRepeatingTask?: boolean;
}

export function TaskHeader({
  task,
  isEditing,
  editDescription,
  onEditDescriptionChange,
  onToggleTask,
  onEditPress,
  completionCount = 0,
  isRepeatingTask = false,
}: TaskHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createTaskDetailsStyles);
  const isCompleted = Boolean(task.completed);

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}
          onPress={onToggleTask}
        >
          {isCompleted && <Ionicons name="checkmark" size={20} color="#fff" />}
        </TouchableOpacity>
        <View style={styles.headerText}>
          {isEditing ? (
            <TextInput
              style={styles.editInput}
              value={editDescription}
              onChangeText={onEditDescriptionChange}
              multiline
              autoFocus
            />
          ) : (
            <>
              <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
                {task.description}
              </Text>
              {/* Show completion count for repeating tasks */}
              {isRepeatingTask && completionCount > 0 && (
                <Text style={styles.completionCountBadge}>
                  🔄 Completed {completionCount} time{completionCount !== 1 ? 's' : ''}
                </Text>
              )}
            </>
          )}
        </View>
      </View>

      {!isEditing && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={onEditPress}
        >
          <Ionicons name="create-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.editButtonText}>Edit Task</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
