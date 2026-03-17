import { useState } from "react";
import "./App.css";
import { AuthForm } from "../features/auth/ui/RegisterForm/RegisterForm";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <AuthForm />
    </>
  );
}

export default App;
