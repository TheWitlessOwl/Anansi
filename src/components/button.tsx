import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "default" | "danger";
  style?: React.CSSProperties;
  as?: "button" | "span";
};

const Button: React.FC<ButtonProps> = ({ children, onClick, type = "default", style, as = "button" }) => {
  const base: React.CSSProperties = {
    padding: "8px 14px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    background: "#777a7cff",
    color: "white",
    display: "inline-block",
  };

  const danger: React.CSSProperties = {
    ...base,
    background: "#d9534f",
  };

  const styles = type === "danger" ? danger : base;

  const Component = as;

  return (
    <Component style={{ ...styles, ...style }} onClick={onClick}>
      {children}
    </Component>
  );
};

export default Button;
