import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleArrowLeft } from "@fortawesome/free-solid-svg-icons";

import "./HowToPlay.css";

function HowToPlay() {
  return (
    <div className="howToPlay">
      <div id="background" />

      <Link to="/home" className="back-button">
        <FontAwesomeIcon icon={faCircleArrowLeft} />
        <span className="tooltip-text">Back To Home</span>
      </Link>

      <h2 className="how-to-play-header">How to Play</h2>

      <p className="description">Every turn, you and your opponent will...</p>
      <ol className="how-to-play-list">
        <li>
          <b>Roll a dice</b> to determine movement
        </li>
        <li>
          <b>Add and remove walls</b> to block your opponent
        </li>
        <li>
          <b>Move your piece</b> closer to the finish
        </li>
      </ol>

      <p className="description">Rules:</p>
      <ul className="how-to-play-list">
        <li>
          You may never <b>fully</b> block your opponent's path to the finish
        </li>
        <li>
          Red can only place vertical walls, blue can only place horizontal
          walls
        </li>
        <li>You may only have six walls in play at one time</li>
        <li>All player movements must be adjacent (up, down, left, right)</li>
        <li>
          Every addition and removal of a wall counts as one wall movement
        </li>
      </ul>
    </div>
  );
}

export default HowToPlay;
