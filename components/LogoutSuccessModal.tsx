import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  role?: "elderly" | "guardian"; // ✅ 역할 구분
}

export default function LogoutSuccessModal({ visible, onClose, role = "elderly" }: Props) {
  // ✅ 역할별 색상 정의
  const colors = {
    elderly: "#2196F3", // 파랑
    guardian: "#4CAF50", // 초록
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.box}>
          <Text style={styles.title}>로그아웃 완료</Text>
          <Text style={styles.message}>로그아웃이 완료되었습니다!</Text>

          <Pressable
            style={[styles.confirmBtn, { backgroundColor: colors[role] }]}
            onPress={onClose}
          >
            <Text style={styles.confirmText}>확인</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: "center",
    width: "75%",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  title: { fontSize: 18, fontWeight: "700" },
  message: {
    fontSize: 14,
    color: "#555",
    marginVertical: 12,
    textAlign: "center",
  },
  confirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
  },
  confirmText: { color: "#fff", fontWeight: "700" },
});
