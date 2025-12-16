import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import {
  ReminderConfig,
  ReminderTimeframe,
  ReminderSpecificDate,
} from '../types';
import DatePicker from './DatePicker';

interface ReminderConfigProps {
  reminders: ReminderConfig[];
  onRemindersChange: (reminders: ReminderConfig[]) => void;
}

export default function ReminderConfigComponent({
  reminders,
  onRemindersChange,
}: ReminderConfigProps) {
  const [editingReminder, setEditingReminder] = useState<ReminderConfig | null>(null);
  const [showTimeframePicker, setShowTimeframePicker] = useState(false);

  const addReminder = () => {
    const newReminder: ReminderConfig = {
      id: Date.now().toString(),
      timeframe: ReminderTimeframe.SPECIFIC_DATE,
      time: '09:00',
      specificDate: ReminderSpecificDate.CUSTOM_DATE,
    };
    setEditingReminder(newReminder);
    setShowTimeframePicker(true);
  };

  const saveReminder = (reminder: ReminderConfig) => {
    if (editingReminder) {
      // Check if this reminder already exists in the list
      const existingIndex = reminders.findIndex((r) => r.id === editingReminder.id);
      if (existingIndex >= 0) {
        // Update existing
        const updated = reminders.map((r) =>
          r.id === editingReminder.id ? reminder : r,
        );
        onRemindersChange(updated);
      } else {
        // Add new (editingReminder was set but reminder doesn't exist in list yet)
        onRemindersChange([...reminders, reminder]);
      }
    } else {
      // Add new
      onRemindersChange([...reminders, reminder]);
    }
    setEditingReminder(null);
    setShowTimeframePicker(false);
  };

  const removeReminder = (id: string) => {
    onRemindersChange(reminders.filter((r) => r.id !== id));
  };

  const editReminder = (reminder: ReminderConfig) => {
    setEditingReminder(reminder);
    setShowTimeframePicker(true);
  };

  const formatReminder = (reminder: ReminderConfig): string => {
    const timeStr = reminder.time || '09:00';
    let description = '';

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

    if (reminder.daysBefore !== undefined) {
      description = `${reminder.daysBefore} day(s) before due date at ${timeStr}`;
    }

    return description;
  };

  const timeframes = [
    { value: ReminderTimeframe.SPECIFIC_DATE, label: 'Specific Date' },
    { value: ReminderTimeframe.EVERY_DAY, label: 'Every Day' },
    { value: ReminderTimeframe.EVERY_WEEK, label: 'Every Week' },
    { value: ReminderTimeframe.EVERY_MONTH, label: 'Every Month' },
    { value: ReminderTimeframe.EVERY_YEAR, label: 'Every Year' },
  ];

  const specificDates = [
    { value: ReminderSpecificDate.START_OF_WEEK, label: 'Start of Week (Monday)' },
    { value: ReminderSpecificDate.START_OF_MONTH, label: 'Start of Month (1st)' },
    { value: ReminderSpecificDate.START_OF_YEAR, label: 'Start of Year (Jan 1st)' },
    { value: ReminderSpecificDate.CUSTOM_DATE, label: 'Custom Date' },
  ];

  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reminders</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={addReminder}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {reminders.length === 0 ? (
        <Text style={styles.emptyText}>No reminders set</Text>
      ) : (
        <ScrollView style={styles.remindersList}>
          {reminders.map((reminder) => (
            <View key={reminder.id} style={styles.reminderItem}>
              <View style={styles.reminderContent}>
                <Text style={styles.reminderText}>{formatReminder(reminder)}</Text>
              </View>
              <View style={styles.reminderActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => editReminder(reminder)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeReminder(reminder.id)}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Reminder Configuration Modal */}
      <Modal
        visible={showTimeframePicker && editingReminder !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setEditingReminder(null);
          setShowTimeframePicker(false);
        }}
      >
        {editingReminder && (
          <ReminderEditor
            reminder={editingReminder}
            onSave={saveReminder}
            onCancel={() => {
              setEditingReminder(null);
              setShowTimeframePicker(false);
            }}
            timeframes={timeframes}
            specificDates={specificDates}
            dayNames={dayNames}
          />
        )}
      </Modal>
    </View>
  );
}

interface ReminderEditorProps {
  reminder: ReminderConfig;
  onSave: (reminder: ReminderConfig) => void;
  onCancel: () => void;
  timeframes: Array<{ value: ReminderTimeframe; label: string }>;
  specificDates: Array<{ value: ReminderSpecificDate; label: string }>;
  dayNames: string[];
}

function ReminderEditor({
  reminder,
  onSave,
  onCancel,
  timeframes,
  specificDates,
  dayNames,
}: ReminderEditorProps) {
  const [config, setConfig] = useState<ReminderConfig>({ ...reminder });

  const handleTimeframeChange = (timeframe: ReminderTimeframe) => {
    setConfig({
      ...config,
      timeframe,
      specificDate:
        timeframe === ReminderTimeframe.SPECIFIC_DATE
          ? ReminderSpecificDate.CUSTOM_DATE
          : undefined,
    });
  };

  const handleTimeChange = (time: string) => {
    // Validate HH:MM format
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      setConfig({ ...config, time });
    } else if (time.length <= 5) {
      // Allow partial input
      setConfig({ ...config, time });
    }
  };

  const handleSave = () => {
    // Ensure time is valid (default to 09:00 if not set)
    let timeToUse = config.time;
    if (!timeToUse || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeToUse)) {
      timeToUse = '09:00';
    }
    
    // Validate EVERY_WEEK reminders have dayOfWeek set
    if (config.timeframe === ReminderTimeframe.EVERY_WEEK && config.dayOfWeek === undefined) {
      // Default to Monday (1) if not set
      config.dayOfWeek = 1;
    }
    
    // For SPECIFIC_DATE with CUSTOM_DATE, customDate is optional (user might use daysBefore instead)
    // For SPECIFIC_DATE with other options (START_OF_WEEK, etc.), no customDate needed
    
    onSave({
      ...config,
      time: timeToUse,
    });
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        {/* Drag Handle */}
        <View style={styles.dragHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Configure Reminder</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.editorContent}
          contentContainerStyle={styles.editorContentContainer}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
          bounces={false}
        >
          {/* Timeframe Selection */}
          <Text style={styles.label}>Timeframe:</Text>
          <View style={styles.optionsGrid}>
            {timeframes.map((tf) => (
              <TouchableOpacity
                key={tf.value}
                style={[
                  styles.optionButton,
                  config.timeframe === tf.value && styles.optionButtonSelected,
                ]}
                onPress={() => handleTimeframeChange(tf.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    config.timeframe === tf.value && styles.optionTextSelected,
                  ]}
                >
                  {tf.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Specific Date Options (for SPECIFIC_DATE timeframe) */}
          {config.timeframe === ReminderTimeframe.SPECIFIC_DATE && (
            <>
              <Text style={styles.label}>Date Option:</Text>
              <View style={styles.optionsGrid}>
                {specificDates.map((sd) => (
                  <TouchableOpacity
                    key={sd.value}
                    style={[
                      styles.optionButton,
                      config.specificDate === sd.value && styles.optionButtonSelected,
                    ]}
                    onPress={() =>
                      setConfig({ ...config, specificDate: sd.value })
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        config.specificDate === sd.value && styles.optionTextSelected,
                      ]}
                    >
                      {sd.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Date Input */}
              {config.specificDate === ReminderSpecificDate.CUSTOM_DATE && (
                <>
                  <Text style={styles.label}>Date:</Text>
                  <DatePicker
                    value={config.customDate?.split('T')[0] || ''}
                    onChange={(dateStr) => {
                      if (dateStr) {
                        const date = new Date(dateStr);
                        if (!isNaN(date.getTime())) {
                          setConfig({ ...config, customDate: date.toISOString() });
                        }
                      } else {
                        setConfig({ ...config, customDate: undefined });
                      }
                    }}
                    placeholder="Select a date"
                  />
                </>
              )}
            </>
          )}

          {/* Day of Week (for EVERY_WEEK) */}
          {config.timeframe === ReminderTimeframe.EVERY_WEEK && (
            <>
              <Text style={styles.label}>Day of Week:</Text>
              <View style={styles.optionsGrid}>
                {dayNames.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      config.dayOfWeek === index && styles.optionButtonSelected,
                    ]}
                    onPress={() => setConfig({ ...config, dayOfWeek: index })}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        config.dayOfWeek === index && styles.optionTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Days Before (only show for reminders that can use due dates) */}
          {(config.timeframe === ReminderTimeframe.SPECIFIC_DATE || 
            config.timeframe === ReminderTimeframe.EVERY_DAY) && (
            <>
              <Text style={styles.label}>Days Before Due Date (optional):</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 7 for 7 days before due date"
                value={config.daysBefore?.toString() || ''}
                onChangeText={(text) => {
                  const days = parseInt(text, 10);
                  if (!isNaN(days) && days > 0) {
                    setConfig({ ...config, daysBefore: days });
                  } else if (text === '') {
                    setConfig({ ...config, daysBefore: undefined });
                  }
                }}
                keyboardType="numeric"
              />
              <Text style={styles.helperText}>
                {config.timeframe === ReminderTimeframe.EVERY_DAY 
                  ? 'Note: Daily reminders will repeat on the same day each week. Leave empty to remind on the due date itself.'
                  : 'Leave empty if this reminder is not relative to due date'}
              </Text>
            </>
          )}

          {/* Info for Every Day reminders */}
          {config.timeframe === ReminderTimeframe.EVERY_DAY && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ℹ️ Daily reminders will notify you on the same day each week. For true daily reminders, consider creating the task in a DAILY list.
              </Text>
            </View>
          )}

          {/* Time Input */}
          <Text style={styles.label}>Time (HH:MM):</Text>
          <TextInput
            style={styles.input}
            placeholder="09:00"
            value={config.time}
            onChangeText={handleTimeChange}
            keyboardType="numeric"
            maxLength={5}
          />

          {/* Alarm Toggle */}
          <View style={styles.alarmOption}>
            <Text style={styles.label}>Sound & Vibration:</Text>
            <TouchableOpacity
              style={styles.alarmToggle}
              onPress={() => setConfig({ ...config, hasAlarm: !config.hasAlarm })}
              activeOpacity={0.7}
            >
              <View style={[
                styles.toggleSwitch,
                config.hasAlarm && styles.toggleSwitchActive,
                { justifyContent: config.hasAlarm ? 'flex-end' : 'flex-start' }
              ]}>
                <View style={styles.toggleThumb} />
              </View>
              <Text style={styles.alarmLabel}>
                {config.hasAlarm ? 'Alarm enabled' : 'Alarm disabled'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Play sound and vibration when reminder triggers
            </Text>
          </View>
        </ScrollView>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.saveButton]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  remindersList: {
    maxHeight: 200,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reminderContent: {
    flex: 1,
  },
  reminderText: {
    fontSize: 14,
    color: '#333',
  },
  reminderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f44336',
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    height: Dimensions.get('window').height * 0.85,
    maxHeight: Dimensions.get('window').height * 0.9,
    padding: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    width: '100%',
    flexDirection: 'column',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  editorContent: {
    flex: 1,
  },
  editorContentContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 8,
    color: '#333',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: -8,
    marginBottom: 15,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginRight: 8,
    marginBottom: 8,
    minHeight: 44,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 10,
    color: '#333',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: -8,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    flexShrink: 0,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
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
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#1976d2',
    lineHeight: 18,
  },
  alarmOption: {
    marginTop: 15,
  },
  alarmToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    paddingHorizontal: 2,
    marginRight: 12,
  },
  toggleSwitchActive: {
    backgroundColor: '#007AFF',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  alarmLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

