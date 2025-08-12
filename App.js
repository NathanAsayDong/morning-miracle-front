import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  Switch,
  Alert,
  Platform,
  AppRegistry,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Configure this constant to point at your running backend server.
// If you run the Python backend locally on iOS emulator use "http://127.0.0.1:5000".
// When testing on a physical device you will need to expose your development
// machine on the network (for example using your local IP address).
const SERVER_URL = 'http://127.0.0.1:4000';

function MorningScreen({ navigation }) {
  const [workout, setWorkout] = useState('');
  const [scripture, setScripture] = useState('');
  const [scriptureNotes, setScriptureNotes] = useState('');
  const [goalsText, setGoalsText] = useState('');

  const submitMorning = async () => {
    const currentDate = new Date().toISOString().split('T')[0];
    try {
      // Send workout
      if (workout.trim()) {
        await fetch(`${SERVER_URL}/morning/workout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: currentDate, workout }),
        });
      }
      // Send scripture
      if (scripture.trim()) {
        await fetch(`${SERVER_URL}/morning/scripture`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: currentDate, scripture, notes: scriptureNotes }),
        });
      }
      // Send goals
      if (goalsText.trim()) {
        const goals = goalsText
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        if (goals.length) {
          await fetch(`${SERVER_URL}/morning/goals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: currentDate, goals }),
          });
        }
      }
      Alert.alert('Success', 'Morning routine saved!');
      // Reset fields
      setWorkout('');
      setScripture('');
      setScriptureNotes('');
      setGoalsText('');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save your morning routine.');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Morning Routine</Text>

      <Text style={{ marginTop: 20 }}>Workout</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 4, minHeight: 60 }}
        multiline
        value={workout}
        onChangeText={setWorkout}
        placeholder="Describe your workout"
      />

      <Text style={{ marginTop: 20 }}>Scripture Studied</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 4 }}
        value={scripture}
        onChangeText={setScripture}
        placeholder="Scripture reference"
      />

      <Text style={{ marginTop: 20 }}>Scripture Notes</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 4, minHeight: 60 }}
        multiline
        value={scriptureNotes}
        onChangeText={setScriptureNotes}
        placeholder="Notes on your scripture study"
      />

      <Text style={{ marginTop: 20 }}>Goals for Today (one per line)</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 4, minHeight: 80 }}
        multiline
        value={goalsText}
        onChangeText={setGoalsText}
        placeholder="Enter each goal on a new line"
      />

      <View style={{ marginTop: 30 }}>
        <Button title="Save Morning" onPress={submitMorning} />
      </View>
      <View style={{ marginTop: 20 }}>
        <Button title="Go to Night Review" onPress={() => navigation.navigate('NightReview')} />
      </View>
    </ScrollView>
  );
}

function NightReviewScreen() {
  const [goals, setGoals] = useState([]);
  const [reviewNote, setReviewNote] = useState('');
  const currentDate = new Date().toISOString().split('T')[0];

  // Fetch goals and any existing review note on mount
  useEffect(() => {
    const loadDayData = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/day/${currentDate}`);
        const data = await res.json();
        if (data && data.goals) {
          const loaded = data.goals.map((g) => {
            if (typeof g === 'string') {
              return { text: g, completed: false };
            }
            return { text: g.text, completed: !!g.completed };
          });
          setGoals(loaded);
        }
        if (data && data.review_note) {
          setReviewNote(data.review_note);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadDayData();
  }, [currentDate]);

  const toggleGoalCompletion = (index) => {
    const updated = [...goals];
    updated[index].completed = !updated[index].completed;
    setGoals(updated);
  };

  const submitReview = async () => {
    try {
      const completed = goals.map((g) => g.completed);
      await fetch(`${SERVER_URL}/night/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: currentDate, completed, note: reviewNote }),
      });
      Alert.alert('Success', 'Night review saved!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save your night review.');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Night Review</Text>
      {goals.length > 0 ? (
        goals.map((goal, index) => (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
            <Switch
              value={goal.completed}
              onValueChange={() => toggleGoalCompletion(index)}
            />
            <Text style={{ marginLeft: 10, flex: 1 }}>{goal.text}</Text>
          </View>
        ))
      ) : (
        <Text style={{ marginTop: 20 }}>No goals set for today.</Text>
      )}

      <Text style={{ marginTop: 30 }}>Review Note</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 4, minHeight: 60 }}
        multiline
        value={reviewNote}
        onChangeText={setReviewNote}
        placeholder="Reflect on your day"
      />
      <View style={{ marginTop: 30 }}>
        <Button title="Save Night Review" onPress={submitReview} />
      </View>
    </ScrollView>
  );
}

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Morning">
        <Stack.Screen name="Morning" component={MorningScreen} />
        <Stack.Screen name="NightReview" component={NightReviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Register the main component
AppRegistry.registerComponent('main', () => App);

export default App;
