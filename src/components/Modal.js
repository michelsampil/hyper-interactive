// Toast.js
import React from "react";
import styled, { keyframes } from "styled-components";

const fadeInOut = keyframes`
  0%, 100% { opacity: 0; }
  20%, 80% { opacity: 1; }
`;

const ToastContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 5px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeInOut} 3s;
  font-size: 5rem;
`;

const Toast = ({ message, type, show }) => {
  if (!show) return null;

  const getEmoji = () => {
    switch (type) {
      case "jump":
        return "⬆️"; // Emoji for jump
      case "crouch":
        return "⬇️"; // Emoji for crouch
      default:
        return "";
    }
  };

  return <ToastContainer>{getEmoji()}</ToastContainer>;
};

export default Toast;
