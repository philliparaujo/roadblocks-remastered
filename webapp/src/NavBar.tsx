import React from "react";
import { Link } from "react-router-dom";

interface LinkProps {
  name: string;
  url: string;
}

interface NavBarProps {
  links: LinkProps[];
}

const NavBar: React.FC<NavBarProps> = ({ links }) => {
  const navBarStyle = {
    backgroundColor: "#222", // makes the background black
    width: "100%", // makes the navbar span the full width of the page
    color: "white", // changes the text color to white
    display: "flex", // aligns items in a row
    justifyContent: "space-evenly", // evenly distributes items along the horizontal line
    padding: "10px 0", // adds some vertical padding to the navbar
  };

  const linkStyle = {
    textDecoration: "none", // removes the underline from the links
    color: "white", // changes the link color to white
  };

  return (
    <div style={navBarStyle}>
      {links.map((link, index) => (
        <Link key={index} to={link.url} style={linkStyle}>
          {link.name}
        </Link>
      ))}
    </div>
  );
};

export default NavBar;
