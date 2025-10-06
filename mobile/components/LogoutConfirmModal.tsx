import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  role?: "elderly" | "guardian";
}

export default function LogoutConfirmModal({
  visible,
  loading,
  onCancel,
  onConfirm,
  role = "elderly",
}: Props) {
  const insets = useSafeAreaInsets();

  // 탭 바 높이 (기본 49 + 하단 safe area)
  const TAB_BAR_HEIGHT = 49 + insets.bottom;

  const colors = {
    elderly: "#4CAF50",
    guardian: "#2196F3",
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={[styles.sheet, { bottom: TAB_BAR_HEIGHT / 2 }]}>
        <Text style={styles.title}>로그아웃 하시겠습니까?</Text>
        <Text style={styles.message}>확인을 누르면 로그아웃됩니다.</Text>

        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.button, styles.cancel]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelText}>취소</Text>
          </Pressable>
          <Pressable
            style={[
              styles.button,
              { backgroundColor: colors[role], marginLeft: 10 },
            ]}
            onPress={onConfirm}
            disabled={loading}
          >
            <Text style={styles.confirmText}>
              {loading ? "처리 중…" : "확인"}
            </Text>
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
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    position: "absolute",
    width: "100%",
  },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  message: {
    fontSize: 14,
    color: "#555",
    marginTop: 8,
    marginBottom: 20,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancel: {
    backgroundColor: "#eee",
    marginRight: 10,
  },
  cancelText: { color: "#333", fontWeight: "600" },
  confirmText: { color: "#fff", fontWeight: "700" },
});