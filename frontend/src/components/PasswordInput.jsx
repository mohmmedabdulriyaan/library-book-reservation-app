// Password box with a show / hide eye button
import { useState } from "react";

export default function PasswordInput({ value, onChange, name = "password", placeholder = "Password", autoComplete }) {
  const [show, setShow] = useState(false);

  return (
    <div className="input-icon">
      <i className="bi bi-lock"></i>
      <input
        type={show ? "text" : "password"}
        className="form-control"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        className="toggle-eye"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        <i className={`bi ${show ? "bi-eye-slash" : "bi-eye"}`}></i>
      </button>
    </div>
  );
}
