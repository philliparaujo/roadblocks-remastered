import { useAlerts } from "./AlertContext";

export const AlertDisplay: React.FC = () => {
  const { alerts } = useAlerts();

  return (
    <div className="alert-container">
      {alerts.map((alert) => (
        <div key={alert.id} className={`custom-alert ${alert.className}`}>
          {alert.message}
        </div>
      ))}
    </div>
  );
};
