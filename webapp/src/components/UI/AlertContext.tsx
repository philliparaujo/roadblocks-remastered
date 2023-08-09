import { createContext, useContext, useRef, useState } from "react";

interface Alert {
  message: string;
  className?: string;
  id?: number;
}

const AlertContext = createContext<
  | {
      alerts: Alert[];
      addAlert: (alert: Alert) => number;
      removeAlert: (id: number) => void;
      updateAlertClass: (id: number, className: string) => void;
    }
  | undefined
>(undefined);

interface AlertProviderProps {
  children: React.ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const idCounter = useRef<number>(0);

  const addAlert = (alert: Alert): number => {
    idCounter.current += 1;
    setAlerts((prevAlerts) => [
      ...prevAlerts,
      { ...alert, id: idCounter.current },
    ]);
    return idCounter.current;
  };

  const removeAlert = (id: number) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== id));
  };

  const updateAlertClass = (id: number, className: string) => {
    setAlerts((prevAlerts) =>
      prevAlerts.map((alert) => {
        if (alert.id === id) {
          return { ...alert, className };
        }
        return alert;
      })
    );
  };

  return (
    <AlertContext.Provider
      value={{ alerts, addAlert, removeAlert, updateAlertClass }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlerts must be used within a AlertProvider");
  }
  return context;
};
