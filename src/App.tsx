import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {Stage }from './pages/stage';
import { Backstage } from './pages/manage';


const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/stage" element={<Stage />} />
        <Route path="/static" element={<Backstage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
