import { Link } from "react-router-dom";
import NavBar from "./NavBar";

function Home() {
  const links = [
    { name: "Start Game", url: "/game" },
    { name: "Settings", url: "/settings" },
    { name: "About", url: "/about" },
  ];

  return (
    <>
      <NavBar links={links} />
    </>
  );
}

export default Home;
