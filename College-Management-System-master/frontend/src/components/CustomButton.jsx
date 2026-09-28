import React from "react";
import Button from "./ui/Button";

const CustomButton = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  variant = "primary",
}) => {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      variant={variant}
    >
      {children}
    </Button>
  );
};

export default CustomButton;
