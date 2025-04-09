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
    text1Style: {
      fontSize: 20,
      fontWeight: 'bold'
    },
    text2Style: {
      fontSize: 18
    }
  });
};

/**
 * Muestra un mensaje de éxito
 * @param title Título del toast
 * @param message Mensaje del toast
 */
export const showSuccess = (title: string, message: string) => {
  showToast('success', title, message);
};

/**
 * Muestra un mensaje de error
 * @param title Título del toast
 * @param message Mensaje del toast
 */
export const showError = (title: string, message: string) => {
  showToast('error', title, message);
};

/**
 * Muestra un mensaje informativo
 * @param title Título del toast
 * @param message Mensaje del toast
 */
export const showInfo = (title: string, message: string) => {
  showToast('info', title, message);
};

/**
 * Muestra un mensaje de confirmación con opciones
 * @param title Título del mensaje
 * @param message Mensaje de confirmación
 * @param onConfirm Función a ejecutar si se confirma
 * @param confirmText Texto del botón de confirmación (opcional)
 * @param cancelText Texto del botón de cancelación (opcional)
 */
export const showConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
) => {
  // Para confirmaciones seguimos usando Alert por ahora
  // ya que Toast no tiene una API para confirmaciones
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'bottom',
    bottomOffset: 60,
    visibilityTime: 4000,
    autoHide: true,
    onPress: onConfirm,
    text1Style: {
      fontSize: 20,
      fontWeight: 'bold'
    },
    text2Style: {
      fontSize: 18
    }
  });
};
