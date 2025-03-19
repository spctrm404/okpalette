import "./App.css";
import { Colour } from "./Colour/Colour";

function App() {
  const a = new Colour({ srgb: [1, 0, 0] });
  console.log(a);
  const b = new Colour({ oklch: [0.5, 0.14, 240] });
  console.log(b);
  return (
    <>
      <div
        style={{
          width: "100px",
          height: "100px",
          background: `${a.toString("srgb")}`,
        }}
      ></div>
      <div
        style={{
          width: "100px",
          height: "100px",
          background: `${b.toString("srgb")}`,
        }}
      ></div>
    </>
  );
}

export default App;
