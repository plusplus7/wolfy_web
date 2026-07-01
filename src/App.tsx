import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { HashRouter, Routes, Route } from "react-router-dom";
import {Stage }from './pages/stage';
import { Backstage } from './pages/manage';
import { SystemPage } from './pages/system';


const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route index element={<Backstage />} />
        <Route path="/" element={<Backstage />} />
        <Route path="/stage" element={<Stage />} />
        <Route path="/static" element={<Backstage />} />
        <Route path="/static/" element={<Backstage />} />
        <Route path="/system" element={<SystemPage />} />
        <Route path="*" element={<Backstage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
