import React, { ReactNode } from "react";

import {
  faGear,
  faQuestionCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Popup.css";

interface PopupIcon {
  toggle: () => void;
}

interface PopupProps {
  title?: string;
  children?: ReactNode;
  show: boolean;
  toggle: () => void;
}

const Popup: React.FC<PopupProps> = ({ title, children, show, toggle }) => {
  if (!show) return null;

  return (
    <div className="popup-overlay" onClick={toggle}>
      <div className="popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-close" onClick={toggle}>
          <FontAwesomeIcon icon={faTimes} />
        </div>
        <div className="popup-container">
          <h1 className="popup-header">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
};

export const AboutIcon: React.FC<PopupIcon> = ({ toggle }) => {
  return (
    <div className="about-icon" onClick={toggle}>
      <FontAwesomeIcon icon={faQuestionCircle} />
    </div>
  );
};

export const AboutPopup: React.FC<PopupProps> = ({ show, toggle }) => {
  return (
    <Popup title={"About"} show={show} toggle={toggle}>
      <p>Version {process.env.BUILD_NUMBER}</p>
      <p className="description">
        Roadblocks is a strategic, turn-based board game. Players must navigate
        their pieces to the finish while blocking their opponents with walls. Do
        you have what it takes to outmaneuver your foes and claim victory?
      </p>
    </Popup>
  );
};

export const SettingsIcon: React.FC<PopupIcon> = ({ toggle }) => {
  return (
    <div className="settings-icon" onClick={toggle}>
      <FontAwesomeIcon icon={faGear} />
    </div>
  );
};

export const SettingsPopup: React.FC<PopupProps> = ({ show, toggle }) => {
  return (
    <Popup title={"Settings"} show={show} toggle={toggle}>
      <p className="description">TBD: Add music and sound volume.</p>
    </Popup>
  );
};
