export default function Loader({ full = false, text = "Loading..." }) {
  const spinner = (
    <div className="text-center text-secondary py-4">
      <div className="spinner-border text-primary" role="status" style={{ width: "2rem", height: "2rem" }}></div>
      <div className="small mt-2">{text}</div>
    </div>
  );
  return full ? <div className="full-loader">{spinner}</div> : spinner;
}
