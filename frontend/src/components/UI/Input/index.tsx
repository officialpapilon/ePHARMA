import React from "react";

interface InputProps {
  label?: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  className = "",
  error = "",
}) => {
  return (
    <div className={`mb-5 ${className}`} style={{ maxWidth: 480 }}>
      {label && (
        <label
          htmlFor={name}
          className="block text-base font-semibold text-gray-700 mb-2"
          style={{ letterSpacing: 0.2 }}
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-4 py-3 border ${
          error ? "border-red-500" : "border-gray-300"
        } rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-[#1976d2] transition-all duration-200 text-lg ${
          disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
        }`}
        style={{ fontSize: 17, fontWeight: 500, letterSpacing: 0.1 }}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className="text-red-500 text-sm mt-2 font-medium">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;