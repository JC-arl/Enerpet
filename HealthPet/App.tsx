import React from "react";
import { View, StyleSheet } from "react-native";
import PetScreen from "./src/PetScreen";

export default function App() {
  return (
    <View style={styles.container}>
      <PetScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
