// src/app.js or src/index.js

import "./index.css";

import App from "./App";
import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import axios from "axios";

// Axios configuration
axios.defaults.baseURL = process.env.REACT_APP_API_BASEURL;
axios.defaults.headers.common["Content-Type"] = "application/json";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect on auth failure, let components handle it
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Toaster />
    <App />
  </React.StrictMode>
);
