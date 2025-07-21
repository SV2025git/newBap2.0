import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MeasurementInterface from "./components/MeasurementInterface";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MeasurementInterface />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;