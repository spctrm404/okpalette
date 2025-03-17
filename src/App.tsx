import "./App.css";
import { Colour } from "./color/Colour";

function App() {
  const a = new Colour({ srgb: [1, 0, 0] });
  console.log(a);
  const b = new Colour({ lch: [0.5, 0.14, 240] });
  console.log(b);
  return (
    <>
      <div
        style={{
          width: "100px",
          height: "100px",
          background: `${a.getRgbString("srgb")}`,
        }}
      ></div>
      <div
        style={{
          width: "100px",
          height: "100px",
          background: `${b.getRgbString("srgb")}`,
        }}
      ></div>
    </>
  );
}

export default App;
