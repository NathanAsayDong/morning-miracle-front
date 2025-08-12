import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  AppRegistry,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Theme colors
const theme = {
  primary: '#667eea',
  primaryDark: '#5a6fd8',
  secondary: '#764ba2',
  accent: '#f093fb',
  success: '#10b981',
  warning: '#f59e0b',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1f2937',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  shadow: '#000',
};

// Local Storage Service
class LocalStorageService {
  static async saveWorkout(date, workout) {
    try {
      const key = `workout_${date}`;
      await AsyncStorage.setItem(key, JSON.stringify({ workout, timestamp: Date.now() }));
    } catch (error) {
      console.error('Error saving workout:', error);
      throw error;
    }
  }

  static async saveScripture(date, scripture, notes) {
    try {
      const key = `scripture_${date}`;
      await AsyncStorage.setItem(key, JSON.stringify({ scripture, notes, timestamp: Date.now() }));
    } catch (error) {
      console.error('Error saving scripture:', error);
      throw error;
    }
  }

  static async saveGoals(date, goals) {
    try {
      const key = `goals_${date}`;
      const goalObjects = goals.map(goal => 
        typeof goal === 'string' ? { text: goal, completed: false } : goal
      );
      await AsyncStorage.setItem(key, JSON.stringify({ goals: goalObjects, timestamp: Date.now() }));
    } catch (error) {
      console.error('Error saving goals:', error);
      throw error;
    }
  }

  static async saveReview(date, completed, note) {
    try {
      const key = `review_${date}`;
      await AsyncStorage.setItem(key, JSON.stringify({ completed, note, timestamp: Date.now() }));
    } catch (error) {
      console.error('Error saving review:', error);
      throw error;
    }
  }

  static async getDayData(date) {
    try {
      const [workout, scripture, goals, review] = await Promise.all([
        AsyncStorage.getItem(`workout_${date}`),
        AsyncStorage.getItem(`scripture_${date}`),
        AsyncStorage.getItem(`goals_${date}`),
        AsyncStorage.getItem(`review_${date}`),
      ]);

      return {
        workout: workout ? JSON.parse(workout) : null,
        scripture: scripture ? JSON.parse(scripture) : null,
        goals: goals ? JSON.parse(goals).goals : [],
        review: review ? JSON.parse(review) : null,
      };
    } catch (error) {
      console.error('Error getting day data:', error);
      return { workout: null, scripture: null, goals: [], review: null };
    }
  }

  static async updateGoalCompletion(date, goalIndex, completed) {
    try {
      const dayData = await this.getDayData(date);
      if (dayData.goals && dayData.goals[goalIndex]) {
        dayData.goals[goalIndex].completed = completed;
        await this.saveGoals(date, dayData.goals);
      }
    } catch (error) {
      console.error('Error updating goal completion:', error);
      throw error;
    }
  }
}

// Custom Components
const GradientButton = ({ title, onPress, style, gradient = [theme.primary, theme.primaryDark] }) => (
  <TouchableOpacity style={[styles.gradientButtonContainer, style]} onPress={onPress}>
    <LinearGradient colors={gradient} style={styles.gradientButton}>
      <Text style={styles.gradientButtonText}>{title}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

const InputField = ({ label, value, onChangeText, placeholder, multiline = false, style }) => (
  <View style={[styles.inputContainer, style]}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={[styles.textInput, multiline && styles.multilineInput]}
      multiline={multiline}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.textSecondary}
    />
  </View>
);

function MorningScreen({ navigation }) {
  const [workout, setWorkout] = useState('');
  const [scripture, setScripture] = useState('');
  const [scriptureNotes, setScriptureNotes] = useState('');
  const [goalsText, setGoalsText] = useState('');
  const [loading, setLoading] = useState(false);

  const submitMorning = async () => {
    const currentDate = new Date().toISOString().split('T')[0];
    setLoading(true);
    
    try {
      const promises = [];

      // Save workout
      if (workout.trim()) {
        promises.push(LocalStorageService.saveWorkout(currentDate, workout));
      }
      
      // Save scripture
      if (scripture.trim()) {
        promises.push(LocalStorageService.saveScripture(currentDate, scripture, scriptureNotes));
      }
      
      // Save goals
      if (goalsText.trim()) {
        const goals = goalsText
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        if (goals.length) {
          promises.push(LocalStorageService.saveGoals(currentDate, goals));
        }
      }

      await Promise.all(promises);
      
      Alert.alert('Success! 🌅', 'Your morning routine has been saved!', [
        { text: 'OK', style: 'default' }
      ]);
      
      // Reset fields
      setWorkout('');
      setScripture('');
      setScriptureNotes('');
      setGoalsText('');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save your morning routine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[theme.background, '#ffffff']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌅 Morning Routine</Text>
          <Text style={styles.headerSubtitle}>Start your day with intention</Text>
        </View>

        <Card style={styles.sectionCard}>
          <InputField
            label="💪 Workout"
            value={workout}
            onChangeText={setWorkout}
            placeholder="Describe your workout plan for today"
            multiline
          />
        </Card>

        <Card style={styles.sectionCard}>
          <InputField
            label="📖 Scripture Study"
            value={scripture}
            onChangeText={setScripture}
            placeholder="Scripture reference (e.g., John 3:16)"
          />
          <InputField
            label="📝 Scripture Notes"
            value={scriptureNotes}
            onChangeText={setScriptureNotes}
            placeholder="Your insights and reflections"
            multiline
            style={styles.notesInput}
          />
        </Card>

        <Card style={styles.sectionCard}>
          <InputField
            label="🎯 Goals for Today"
            value={goalsText}
            onChangeText={setGoalsText}
            placeholder="Enter each goal on a new line..."
            multiline
          />
        </Card>

        <View style={styles.buttonContainer}>
          <GradientButton
            title={loading ? "Saving..." : "Save Morning Routine"}
            onPress={submitMorning}
            gradient={[theme.primary, theme.secondary]}
            style={styles.primaryButton}
          />
          <GradientButton
            title="Night Review →"
            onPress={() => navigation.navigate('NightReview')}
            gradient={[theme.accent, theme.secondary]}
            style={styles.secondaryButton}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function NightReviewScreen() {
  const [goals, setGoals] = useState([]);
  const [reviewNote, setReviewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const currentDate = new Date().toISOString().split('T')[0];

  // Load day data on mount
  useEffect(() => {
    const loadDayData = async () => {
      try {
        const data = await LocalStorageService.getDayData(currentDate);
        if (data.goals && data.goals.length > 0) {
          setGoals(data.goals);
        }
        if (data.review && data.review.note) {
          setReviewNote(data.review.note);
        }
      } catch (err) {
        console.error('Error loading day data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDayData();
  }, [currentDate]);

  const toggleGoalCompletion = async (index) => {
    try {
      const updated = [...goals];
      updated[index].completed = !updated[index].completed;
      setGoals(updated);
      await LocalStorageService.updateGoalCompletion(currentDate, index, updated[index].completed);
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update goal status');
    }
  };

  const submitReview = async () => {
    setSaving(true);
    try {
      const completed = goals.map((g) => g.completed);
      await LocalStorageService.saveReview(currentDate, completed, reviewNote);
      
      const completedCount = completed.filter(Boolean).length;
      const totalGoals = goals.length;
      
      Alert.alert(
        'Great work! 🌙', 
        `You completed ${completedCount} out of ${totalGoals} goals today. Rest well!`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save your night review. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const completedGoals = goals.filter(g => g.completed).length;
  const progressPercentage = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

  if (loading) {
    return (
      <LinearGradient colors={[theme.background, '#ffffff']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your day...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[theme.background, '#ffffff']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌙 Night Review</Text>
          <Text style={styles.headerSubtitle}>Reflect on your day</Text>
        </View>

        {goals.length > 0 && (
          <Card style={styles.sectionCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.sectionTitle}>📊 Goal Progress</Text>
              <Text style={styles.progressText}>
                {completedGoals}/{goals.length} completed ({Math.round(progressPercentage)}%)
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={[theme.success, theme.primary]}
                  style={[styles.progressBarFill, { width: `${progressPercentage}%` }]}
                />
              </View>
            </View>

            {goals.map((goal, index) => (
              <View key={index} style={styles.goalItem}>
                <Switch
                  value={goal.completed}
                  onValueChange={() => toggleGoalCompletion(index)}
                  trackColor={{ false: theme.border, true: theme.success }}
                  thumbColor={goal.completed ? '#ffffff' : theme.textSecondary}
                />
                <Text style={[
                  styles.goalText, 
                  goal.completed && styles.completedGoalText
                ]}>
                  {goal.text}
                </Text>
                <Text style={styles.goalStatus}>
                  {goal.completed ? '✅' : '⏳'}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {goals.length === 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.emptyStateText}>📝 No goals were set for today.</Text>
            <Text style={styles.emptyStateSubtext}>Start tomorrow with some goals!</Text>
          </Card>
        )}

        <Card style={styles.sectionCard}>
          <InputField
            label="💭 Daily Reflection"
            value={reviewNote}
            onChangeText={setReviewNote}
            placeholder="How did your day go? What did you learn?"
            multiline
          />
        </Card>

        <View style={styles.buttonContainer}>
          <GradientButton
            title={saving ? "Saving..." : "Save Night Review"}
            onPress={submitReview}
            gradient={[theme.secondary, theme.accent]}
            style={styles.primaryButton}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Morning"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Morning" component={MorningScreen} />
        <Stack.Screen name="NightReview" component={NightReviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: theme.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionCard: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.background,
    minHeight: 50,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesInput: {
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 20,
  },
  gradientButtonContainer: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: theme.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  goalText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: theme.text,
  },
  completedGoalText: {
    textDecorationLine: 'line-through',
    color: theme.textSecondary,
  },
  goalStatus: {
    fontSize: 18,
    marginLeft: 8,
  },
  emptyStateText: {
    fontSize: 18,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: theme.textSecondary,
  },
});

// Register the main component
AppRegistry.registerComponent('main', () => App);

export default App;
