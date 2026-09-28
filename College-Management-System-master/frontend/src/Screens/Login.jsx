import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { setUserToken } from "../redux/actions";
import { useDispatch } from "react-redux";
import CustomButton from "../components/CustomButton";
import axiosWrapper from "../utils/AxiosWrapper";
import Input from "../components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Lock, Mail } from "lucide-react";
import "./login.css";

const USER_TYPES = { STUDENT: "Student", FACULTY: "Faculty", ADMIN: "Admin" };

const LoginForm = ({ selected, onSubmit, formData, setFormData }) => (
  <form className="w-full" onSubmit={onSubmit}>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2" htmlFor="email">
          {selected === USER_TYPES.STUDENT
            ? "Student email (same as registered)"
            : `${selected} email`}
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="email" id="email" required className="pl-9"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder={
              selected === USER_TYPES.STUDENT
                ? "Same Gmail/email registered by admin"
                : "name@college.edu"
            }
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="password" id="password" required className="pl-9"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
          />
        </div>
      </div>
    </div>
    <div className="flex items-center justify-between mt-5">
      <Link className="text-sm font-semibold" to="/forget-password">
        Forgot Password?
      </Link>
    </div>
    <CustomButton type="submit" className="w-full mt-6">Sign in</CustomButton>
  </form>
);

const UserTypeSelector = ({ selected, onSelect }) => (
  <div className="flex flex-wrap justify-center gap-2">
    {Object.values(USER_TYPES).map((type) => (
      <button
        key={type}
        onClick={() => onSelect(type)}
        className={[
          "px-4 py-2 text-sm font-semibold rounded-xl transition border shadow-sm",
          selected === type
            ? "bg-brand-600 text-white border-brand-600"
            : "bg-white/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 border-slate-200/70",
        ].join(" ")}
      >
        {type}
      </button>
    ))}
  </div>
);

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get("type");
  const canvasRef = useRef(null);
  const starsRef = useRef(null);
  const ptsRef = useRef(null);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [selected, setSelected] = useState(USER_TYPES.STUDENT);

  const handleUserTypeSelect = (type) => {
    setSelected(type);
    setSearchParams({ type: type.toLowerCase() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };
      const response = await axiosWrapper.post(
        `/${selected.toLowerCase()}/login`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      const { token } = response.data.data;
      localStorage.setItem("userToken", token);
      localStorage.setItem("userType", selected);
      dispatch(setUserToken(token));
      navigate(`/${selected.toLowerCase()}`);
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  useEffect(() => {
    const userToken = localStorage.getItem("userToken");
    if (userToken) navigate(`/${localStorage.getItem("userType").toLowerCase()}`);
  }, [navigate]);

  useEffect(() => {
    if (type) setSelected(type.charAt(0).toUpperCase() + type.slice(1));
  }, [type]);

  // Background effects
  useEffect(() => {
    // Twinkling stars
    const starsEl = starsRef.current;
    if (starsEl) {
      for (let i = 0; i < 90; i++) {
        const s = document.createElement("div");
        const size = Math.random() * 2 + 1;
        s.style.cssText = `
          position:absolute;width:${size}px;height:${size}px;border-radius:50%;
          left:${Math.random() * 100}%;top:${Math.random() * 100}%;
          background:rgba(255,255,255,${Math.random() * 0.5 + 0.2});
          animation:twinkle ${Math.random() * 4 + 2}s ease-in-out ${Math.random() * 6}s infinite
        `;
        starsEl.appendChild(s);
      }
    }

    // Rising particles
    const ptsEl = ptsRef.current;
    if (ptsEl) {
      for (let i = 0; i < 25; i++) {
        const p = document.createElement("div");
        const size = Math.random() * 3 + 1.5;
        p.style.cssText = `
          position:absolute;width:${size}px;height:${size}px;border-radius:50%;
          left:${Math.random() * 100}%;bottom:0;
          background:rgba(${Math.random() > 0.5 ? "167,139,250" : "99,102,241"},${Math.random() * 0.5 + 0.4});
          animation:ptRise ${Math.random() * 8 + 5}s linear ${Math.random() * 12}s infinite
        `;
        ptsEl.appendChild(p);
      }
    }

    // Constellation canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const nodes = Array.from({ length: 30 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach((n) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(167,139,250,.5)";
        ctx.fill();
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(124,58,237,${(1 - d / 130) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="login-scene">
      <canvas ref={canvasRef} className="login-canvas" />

      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />
      <div className="login-blob login-blob-3" />
      <div className="login-blob login-blob-4" />

      <div className="login-ring login-ring-1" />
      <div className="login-ring login-ring-2" />
      <div className="login-ring login-ring-3" />

      <div ref={starsRef} className="login-stars" />
      <div ref={ptsRef} className="login-particles" />

      <div className="login-bg-brand">CampusSphere</div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="login-card-wrap px-4"
      >
        <Card hover={false} className="login-card">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-lg text-white">Welcome back</CardTitle>
            <CardDescription className="mt-1 text-slate-400">
              Sign in to your {selected.toLowerCase()} workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="mb-5">
              <UserTypeSelector selected={selected} onSelect={handleUserTypeSelect} />
            </div>
            <LoginForm
              selected={selected}
              onSubmit={handleSubmit}
              formData={formData}
              setFormData={setFormData}
            />
          </CardContent>
        </Card>
        <p className="login-footer">CampusSphere • Secure · Private · Fast</p>
      </motion.div>

      <Toaster position="bottom-center" />
    </div>
  );
};

export default Login;