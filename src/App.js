import React, { useState } from "react";
import PoseDetection from "./components/PoseDetection";
import "./App.css";
import styled from "styled-components";
import { ToastProvider } from "./context/ToastContext";

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f0f0f0;
`;

function App() {
  return (
    <ToastProvider>
      <AppContainer>
        <h1>Voice and Pose Detection</h1>
        <PoseDetection />
      </AppContainer>
    </ToastProvider>
  );
}

export default App;
