import { createContext, useContext, useState, useCallback } from "react";

import Toast from "../components/Modal";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ message: "", type: "", show: false });

  const showToast = useCallback((message, type) => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast({ message: "", type: "", show: "false" }), 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  return useContext(ToastContext);
};
