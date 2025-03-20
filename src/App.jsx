import './App.css';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './page/homepage.jsx';
import Download from './page/download.jsx';
import Edit from './page/edit.jsx';

function App() {
  return (
    <Routes>
      <Route exact path="/valheim-language" element={<Homepage />} />
      <Route path="/valheim-language/download" element={<Download />} />
      <Route path="/valheim-language/edit" element={<Edit />} />
    </Routes>
  );
}

export default App;