import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info';

/**
 * Muestra un mensaje toast personalizado
 * @param type Tipo de toast: success, error, info
 * @param title Título del toast
 * @param message Mensaje del toast
 * @param duration Duración en milisegundos (opcional, por defecto 3000ms)
 */
export const showToast = (
  type: ToastType,
  title: string,
  message: string,
  duration = 3000
) => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    visibilityTime: duration,
    position: 'bottom',
    bottomOffset: 60,
  });
};

export const showSuccess = (title: string, message: string) => {
  showToast('success', title, message);
};

export const showError = (title: string, message: string) => {
  showToast('error', title, message);
};

export const showInfo = (title: string, message: string) => {
  showToast('info', title, message);
};
