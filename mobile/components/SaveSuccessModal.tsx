import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SaveSuccessModal({ visible, onClose }: Props) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>저장이 완료되었습니다.</Text>
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>확인</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    width: "80%",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#66BB6A",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
