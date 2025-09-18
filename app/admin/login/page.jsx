"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 9) + 1; // 1-9
    const b = Math.floor(Math.random() * 9) + 1; // 1-9
    const ops = ["+", "-"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const question = `${a} ${op} ${b} = ?`;
    const answer = String(op === "+" ? a + b : a - b);
    setCaptchaQuestion(question);
    setCaptchaAnswer(answer);
    setCaptchaInput("");
  };

  // initialize captcha once
  if (!captchaQuestion) {
    generateCaptcha();
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setErrors({ submit: "Email dan password wajib diisi" });
      return;
    }

    // captcha validation
    if (!captchaInput.trim()) {
      setErrors({ captcha: "Captcha wajib diisi" });
      return;
    }
    if (captchaInput.trim() !== String(captchaAnswer)) {
      setErrors({ captcha: "Jawaban captcha salah" });
      generateCaptcha();
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrors({}); // Clear previous errors

    try {
      // Call the authentication API
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Set session with admin data
        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminData", JSON.stringify(data.admin));
        console.log("Login successful, localStorage set"); // Debug log
        
        // Show success message
        message.success("Login berhasil! Mengalihkan ke dashboard...");
        
        // Small delay to show the success message
        setTimeout(() => {
          router.push("/admin");
        }, 1000);
      } else {
        setErrors({ submit: data.error || "Username atau password salah" });
        setIsSubmitting(false); // Reset loading state on error
        generateCaptcha();
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ submit: "Terjadi kesalahan pada server" });
      setIsSubmitting(false); // Reset loading state on error
      generateCaptcha();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Admin Login
          </h1>
          <p className="text-gray-600">
            Masuk ke panel administrasi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black transition duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Masukkan email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-black transition duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan password"
              />
              <button
                type="button"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.03-2.82 3.05-5.14 5.64-6.51" />
                    <path d="M1 1l22 22" />
                    <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
                    <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.45 11.45 0 0 1-2.23 3.51" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Captcha (moved below password) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="captcha"
                className="block text-sm font-medium text-gray-700"
              >
                Captcha:
              </label>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-sm font-semibold select-none">
                  {captchaQuestion}
                </span>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  title="Refresh captcha"
                  aria-label="Refresh captcha"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0114.13-3.36L23 10" />
                    <path d="M20.49 15a9 9 0 01-14.13 3.36L1 14" />
                  </svg>
                </button>
              </div>
            </div>
            <input
              type="text"
              id="captcha"
              name="captcha"
              value={captchaInput}
              onChange={(e) => {
                setCaptchaInput(e.target.value);
                if (errors.captcha) setErrors((prev) => ({ ...prev, captcha: "" }));
              }}
              className={`w-full px-3 py-2 border rounded-lg text-black transition duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.captcha ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Masukkan hasilnya (contoh: 7)"
            />
            {errors.captcha && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                <p className="text-sm text-red-600">{errors.captcha}</p>
              </div>
            )}
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center ${
              isSubmitting 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Kembali ke Beranda
          </a>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Default Admin Users (email / password):</strong>
          </p>
          <div className="mt-2 text-xs text-yellow-700">
            <p>• Super Admin: admin@diskominfo.bogorkab.go.id / admin123</p>
            <p>• Operator: operator@diskominfo.bogorkab.go.id / operator123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
