import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChatPage } from './features/chat/ChatPage';
import { GeneratePage } from './features/generate/GeneratePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/generate" element={<GeneratePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
