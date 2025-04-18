import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RouteOptimizer from "./RouteOptimizer";
import Signup from "./registerPage";
import Login from "./loginPage";
//import DashboardPage from "./dashboardPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RouteOptimizer />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App; 